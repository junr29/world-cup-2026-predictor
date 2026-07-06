import express from 'express';
import db from '../database.js';

const router = express.Router();

// 获取对比分析
router.get('/compare/:matchId', (req, res) => {
  try {
    const comparison = db.comparePredictions(req.params.matchId);

    if (!comparison) {
      return res.status(404).json({ error: '暂无分析数据' });
    }

    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: '获取对比分析失败' });
  }
});

// 获取趋势数据
router.get('/trends', (req, res) => {
  try {
    const trends = db.getPredictionTrends();
    res.json({ trends });
  } catch (error) {
    res.status(500).json({ error: '获取趋势数据失败' });
  }
});

// 获取统计数据概览
router.get('/overview', (req, res) => {
  try {
    const matches = db.getMatches();
    const userStats = db.getUserPredictionStats();

    const upcoming = matches.filter(m => m.status === 'upcoming').length;
    const live = matches.filter(m => m.status === 'live').length;
    const finished = matches.filter(m => m.status === 'finished').length;

    // 按阶段类型统计比赛
    const groupMatches = matches.filter(m => m.stageType === 'group');
    const knockoutMatches = matches.filter(m => m.stageType === 'knockout');

    res.json({
      matchStats: {
        total: matches.length,
        upcoming,
        live,
        finished,
        groupTotal: groupMatches.length,
        knockoutTotal: knockoutMatches.length
      },
      userStats
    });
  } catch (error) {
    res.status(500).json({ error: '获取概览数据失败' });
  }
});

// 按阶段类型统计准确率
router.get('/stats/stage-type', (req, res) => {
  try {
    const stats = db.getStatsByStageType();
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: '获取阶段类型统计失败' });
  }
});

// 按具体阶段统计准确率
router.get('/stats/stage', (req, res) => {
  try {
    const stats = db.getStatsByStage();
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: '获取阶段统计失败' });
  }
});

// 按日期统计准确率
router.get('/stats/date', (req, res) => {
  try {
    const stats = db.getStatsByDate();
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: '获取日期统计失败' });
  }
});

// 获取预测来源准确率排名
router.get('/rankings', (req, res) => {
  try {
    const stageType = req.query.stageType as string | undefined;
    if (stageType === 'group' || stageType === 'knockout' || stageType === 'all') {
      const data = db.getPredictionSourceRankings(stageType);
      return res.json(data);
    }
    // 默认返回三个分段
    const all = db.getPredictionSourceRankings('all');
    const group = db.getPredictionSourceRankings('group');
    const knockout = db.getPredictionSourceRankings('knockout');
    res.json({ all, group, knockout });
  } catch (error) {
    res.status(500).json({ error: '获取预测排名失败' });
  }
});

// 单场比赛预测准确率排名（错误率从高到低）
router.get('/stats/match-accuracy', (req, res) => {
  try {
    const stats = db.getMatchPredictionAccuracy('errorRate');
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: '获取单场比赛预测准确率失败' });
  }
});

// 获取半全场预测准确率排名
router.get('/rankings/half-full-time', (req, res) => {
  try {
    const stageType = req.query.stageType as string | undefined;
    if (stageType === 'group' || stageType === 'knockout' || stageType === 'all') {
      const data = db.getHalfFullTimeRankings(stageType);
      return res.json(data);
    }
    // 默认返回三个分段
    const all = db.getHalfFullTimeRankings('all');
    const group = db.getHalfFullTimeRankings('group');
    const knockout = db.getHalfFullTimeRankings('knockout');
    res.json({ all, group, knockout });
  } catch (error) {
    res.status(500).json({ error: '获取半全场预测排名失败' });
  }
});

// 获取第一名预测来源对下一日比赛的预测
router.get('/rankings/top-source-next-day', (req, res) => {
  try {
    const data = db.getTopSourceNextDayPredictions();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: '获取第一名预测失败' });
  }
});

// 获取半全场第一名预测来源对下一日比赛的预测
router.get('/rankings/top-halfFullTime-source-next-day', (req, res) => {
  try {
    const data = db.getTopHalfFullTimeSourceNextDayPredictions();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: '获取半全场第一名预测失败' });
  }
});

// 获取球队六维统计数据（wPPG/控球率/射正率/转化率/扑救率/末15分钟进球率）
router.get('/team-stats', (req, res) => {
  try {
    const data = db.getTeamAdvancedStats();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: '获取球队六维统计失败' });
  }
});

// 获取单支球队详情（六维数据+对阵信息含加时点球）
router.get('/team-stats/:teamName', (req, res) => {
  try {
    const teamName = decodeURIComponent(req.params.teamName);
    const data = db.getTeamDetail(teamName);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: '获取球队详情失败' });
  }
});

// 获取本届世界杯比分结果占比统计
router.get('/score-distribution', (req, res) => {
  try {
    const data = db.getScoreDistribution();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: '获取比分占比统计失败' });
  }
});

// 手动触发重新抓取 ESPN 真实比赛统计
router.post('/refresh-stats', async (req, res) => {
  try {
    const result = await db.refreshMatchDetailStats();
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: '刷新统计失败' });
  }
});

export default router;