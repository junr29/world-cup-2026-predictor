import express from 'express';
import scheduler from '../services/scheduler.js';
import { crawlMatchResults, getCrawlHistory } from '../services/crawler.js';

const router = express.Router();

router.get('/status', (req, res) => {
  try {
    const status = scheduler.getStatus();
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取定时任务状态失败' });
  }
});

router.post('/start', (req, res) => {
  try {
    const result = scheduler.startScheduler();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: '启动定时任务失败' });
  }
});

router.post('/stop', (req, res) => {
  try {
    const result = scheduler.stopScheduler();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: '停止定时任务失败' });
  }
});

router.post('/trigger', async (req, res) => {
  try {
    await scheduler.triggerNow();
    const status = scheduler.getStatus();
    res.json({
      success: true,
      message: '手动触发完成',
      result: status.lastResult
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '手动触发失败' });
  }
});

router.post('/crawl', async (req, res) => {
  try {
    const result = await crawlMatchResults();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: '抓取失败' });
  }
});

router.get('/crawl-history', (req, res) => {
  try {
    const history = getCrawlHistory();
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取抓取历史失败' });
  }
});

export default router;
