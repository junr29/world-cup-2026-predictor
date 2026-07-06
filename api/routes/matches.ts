import express from 'express';
import db from '../database.js';

const router = express.Router();

// 获取比赛列表
router.get('/', (req, res) => {
  try {
    const filters = {
      stage: req.query.stage as string,
      stageType: req.query.stageType as string,
      status: req.query.status as string,
      date: req.query.date as string
    };

    const matches = db.getMatches(filters);
    res.json({ matches });
  } catch (error) {
    res.status(500).json({ error: '获取比赛列表失败' });
  }
});

// 获取单场比赛详情
router.get('/:id', (req, res) => {
  try {
    const match = db.getMatchById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: '比赛不存在' });
    }

    const predictions = db.getNetworkPredictions(req.params.id);
    const aiPrediction = db.getAIDeepPrediction(req.params.id);
    res.json({ match, predictions, aiPrediction });
  } catch (error) {
    res.status(500).json({ error: '获取比赛详情失败' });
  }
});

// 获取单场比赛的AI深度预测
router.get('/:id/ai-prediction', (req, res) => {
  try {
    const aiPrediction = db.getAIDeepPrediction(req.params.id);
    if (!aiPrediction) {
      return res.status(404).json({ error: 'AI预测数据不存在' });
    }
    res.json({ aiPrediction });
  } catch (error) {
    res.status(500).json({ error: '获取AI预测失败' });
  }
});

// 获取即将开始的比赛预测汇总（所有未开始比赛，按日期分组）
router.get('/tomorrow/summary', (req, res) => {
  try {
    const allMatches = db.getMatches();

    // 获取所有未开始的比赛，按比赛时间升序排列
    const upcomingMatches = allMatches
      .filter(m => m.status === 'upcoming')
      .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());

    // 按日期分组
    const dateGroups = new Map<string, typeof upcomingMatches>();
    for (const match of upcomingMatches) {
      const d = new Date(match.matchDate);
      const dateKey = d.toLocaleDateString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      if (!dateGroups.has(dateKey)) {
        dateGroups.set(dateKey, []);
      }
      dateGroups.get(dateKey)!.push(match);
    }

    // 构造按日期分组的返回数据
    const dateGroupsArray: Array<{
      date: string;
      dateLabel: string;
      isToday: boolean;
      matches: Array<{
        match: {
          id: string;
          homeTeam: string;
          awayTeam: string;
          matchDate: string;
          stage: string;
          stageType: string;
        };
        aiPrediction: {
          homeScore: number;
          awayScore: number;
          result: string;
          secondHomeScore: number;
          secondAwayScore: number;
          secondResult: string;
          confidence: number;
        } | null;
      }>;
    }> = [];

    const now = new Date();
    const todayKey = now.toLocaleDateString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    let todayCount = 0;
    let totalCount = 0;

    for (const [dateKey, matches] of dateGroups) {
      const d = new Date(matches[0].matchDate);
      const isToday = dateKey === todayKey;
      const dateLabel = d.toLocaleDateString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });

      const matchItems = matches.map(match => {
        const aiPrediction = db.getAIDeepPrediction(match.id);
        return {
          match: {
            id: match.id,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            matchDate: match.matchDate,
            stage: match.stage,
            stageType: match.stageType
          },
          aiPrediction: aiPrediction ? {
            homeScore: aiPrediction.homeScore,
            awayScore: aiPrediction.awayScore,
            result: aiPrediction.result,
            secondHomeScore: aiPrediction.secondHomeScore,
            secondAwayScore: aiPrediction.secondAwayScore,
            secondResult: aiPrediction.secondResult,
            confidence: aiPrediction.confidence
          } : null
        };
      });

      dateGroupsArray.push({
        date: dateKey,
        dateLabel,
        isToday,
        matches: matchItems
      });

      totalCount += matches.length;
      if (isToday) {
        todayCount = matches.length;
      }
    }

    // 顶部显示的日期：如果有今日比赛显示今日，否则显示最近的一天
    let displayDate = '';
    let displayDateLabel = '';
    if (dateGroupsArray.length > 0) {
      const todayGroup = dateGroupsArray.find(g => g.isToday);
      if (todayGroup) {
        displayDate = todayGroup.date;
        displayDateLabel = todayGroup.dateLabel;
      } else {
        displayDate = dateGroupsArray[0].date;
        displayDateLabel = dateGroupsArray[0].dateLabel;
      }
    }

    // 兼容旧格式，同时返回新的分组数据
    const flatMatches = dateGroupsArray.flatMap(g => g.matches);

    res.json({
      date: displayDateLabel,
      todayCount,
      totalCount,
      matches: flatMatches,
      dateGroups: dateGroupsArray
    });
  } catch (error) {
    res.status(500).json({ error: '获取即将开始比赛汇总失败' });
  }
});

export default router;