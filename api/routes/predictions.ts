import express from 'express';
import db from '../database.js';

const router = express.Router();

// 提交用户预测
router.post('/', (req, res) => {
  try {
    const { matchId, homeScore, awayScore, totalGoals, result, letResult, letBall, halfTime } = req.body;

    if (!matchId || homeScore === undefined || awayScore === undefined || !totalGoals || !result || !halfTime) {
      return res.status(400).json({ error: '缺少必要的预测参数' });
    }

    const match = db.getMatchById(matchId);
    if (!match) {
      return res.status(404).json({ error: '比赛不存在' });
    }

    if (match.status === 'finished') {
      return res.status(400).json({ error: '比赛已结束，无法预测' });
    }

    const prediction = db.createUserPrediction({
      matchId,
      homeScore,
      awayScore,
      totalGoals,
      result,
      letResult: letResult || '让胜',
      letBall: letBall !== undefined ? letBall : 1,
      halfTime
    });

    res.json({ success: true, predictionId: prediction.id });
  } catch (error) {
    res.status(500).json({ error: '提交预测失败' });
  }
});

// 获取用户预测记录
router.get('/my', (req, res) => {
  try {
    const predictions = db.getUserPredictions();
    const statistics = db.getUserPredictionStats();

    res.json({ predictions, statistics });
  } catch (error) {
    res.status(500).json({ error: '获取预测记录失败' });
  }
});

// 获取网络预测数据
router.get('/network/:matchId', (req, res) => {
  try {
    const predictions = db.getNetworkPredictions(req.params.matchId);
    res.json({ predictions });
  } catch (error) {
    res.status(500).json({ error: '获取网络预测失败' });
  }
});

// 获取指定预测员的所有预测记录
router.get('/source/:sourceName', (req, res) => {
  try {
    const sourceName = decodeURIComponent(req.params.sourceName);
    const predictions = db.getPredictionsBySource(sourceName);
    res.json({ predictions });
  } catch (error) {
    res.status(500).json({ error: '获取预测员记录失败' });
  }
});

export default router;