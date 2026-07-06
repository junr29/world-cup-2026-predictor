import cron from 'node-cron';
import { crawlMatchResults, type CrawlResult } from './crawler.js';
import db from '../database.js';

interface TaskStatus {
  lastRun: string | null;
  lastResult: CrawlResult | null;
  nextRun: string | null;
  totalRuns: number;
  isRunning: boolean;
  schedule: string;
  timezone: string;
}

const status: TaskStatus = {
  lastRun: null,
  lastResult: null,
  nextRun: null,
  totalRuns: 0,
  isRunning: false,
  schedule: '0 * * * *',
  timezone: 'Asia/Shanghai'
};

let task: ReturnType<typeof cron.schedule> | null = null;

function calculateNextRun(): string | null {
  const now = new Date();
  const beijingOffset = 8 * 60;
  const localOffset = now.getTimezoneOffset() * -1;
  const diffMinutes = beijingOffset - localOffset;
  
  const beijingNow = new Date(now.getTime() + diffMinutes * 60000);
  const next = new Date(beijingNow);
  
  next.setHours(next.getHours() + 1, 0, 0, 0);
  
  const utcTime = next.getTime() - diffMinutes * 60000;
  return new Date(utcTime).toISOString();
}

function updateNextRun() {
  status.nextRun = calculateNextRun();
}

async function runTask() {
  if (status.isRunning) {
    console.log('[定时任务] 任务正在执行中，跳过本次触发');
    return;
  }

  status.isRunning = true;
  console.log('[定时任务] ========== 开始执行整点赛果更新和预测排行计算 ==========');
  console.log('[定时任务] 执行时间:', new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));

  try {
    const result = await crawlMatchResults();

    status.lastRun = new Date().toISOString();
    status.lastResult = result;
    status.totalRuns++;

    console.log(`[定时任务] 赛果更新完成：${result.message}`);

    if (result.updatedCount > 0) {
      console.log('[定时任务] 开始更新预测排行数据...');
      const updatedPredCount = db.recalculateUserPredictions();
      console.log(`[定时任务] 已重新计算 ${updatedPredCount} 条预测结果的正确性`);
    }

    console.log('[定时任务] ============================================');
  } catch (error) {
    console.error('[定时任务] 执行失败:', error instanceof Error ? error.message : '未知错误');
  } finally {
    status.isRunning = false;
    updateNextRun();
  }
}

export function startScheduler() {
  if (task) {
    console.log('[定时任务] 调度器已在运行中');
    return { success: true, message: '调度器已在运行中', status: getStatus() };
  }

  task = cron.schedule(status.schedule, runTask, {
    timezone: status.timezone,
    scheduled: true
  } as any);

  updateNextRun();

  console.log('[定时任务] 调度器已启动');
  console.log('[定时任务] 执行计划：北京时间每小时整点自动更新');
  console.log('[定时任务] 下次执行时间:', status.nextRun ? new Date(status.nextRun).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '未知');

  return {
    success: true,
    message: '定时任务调度器已启动，北京时间每小时整点自动抓取比赛结果并更新预测准确率',
    status: getStatus()
  };
}

export function stopScheduler() {
  if (task) {
    task.stop();
    task = null;
    status.nextRun = null;
    console.log('[定时任务] 调度器已停止');
    return { success: true, message: '定时任务调度器已停止' };
  }
  return { success: true, message: '调度器未在运行' };
}

export function triggerNow() {
  console.log('[定时任务] 手动触发执行');
  return runTask();
}

export function getStatus(): TaskStatus {
  return { ...status };
}

export default {
  startScheduler,
  stopScheduler,
  triggerNow,
  getStatus
};
