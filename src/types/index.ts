// 类型定义

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  matchDate: string;
  stage: string;
  stageType: 'group' | 'knockout';
  status: 'upcoming' | 'live' | 'finished';
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  // 加时赛比分（淘汰赛平局时使用）
  extraTimeHome?: number | null;
  extraTimeAway?: number | null;
  // 点球大战比分（加时仍平局时使用）
  penaltyHome?: number | null;
  penaltyAway?: number | null;
}

export interface UserPrediction {
  id: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  totalGoals: string;
  result: string;
  letResult: string;
  letBall: number;
  halfTime: string;
  isCorrect: boolean | null;
  createdAt: string;
  homeTeam?: string;
  awayTeam?: string;
  matchDate?: string;
  stage?: string;
  stageType?: 'group' | 'knockout';
}

export interface NetworkPrediction {
  id: string;
  matchId: string;
  source: string;
  sourceUrl: string;
  homeScore: number;
  awayScore: number;
  confidence: number;
  totalGoals: string;
  result: string;
  halfTime: string;
  halfFullTime: string;
  secondHomeScore: number;
  secondAwayScore: number;
  secondResult: string;
  secondTotalGoals: string;
  secondHalfFullTime: string;
  scrapedAt: string;
}

export interface PredictionStats {
  total: number;
  correct: number;
  accuracy: number;
}

export interface MatchStats {
  total: number;
  upcoming: number;
  live: number;
  finished: number;
  groupTotal: number;
  knockoutTotal: number;
}

export interface StageTypeStat {
  stageType: string;
  stageTypeLabel: string;
  total: number;
  finished: number;
  correct: number;
  accuracy: number;
}

export interface StageStat {
  stage: string;
  total: number;
  finished: number;
  correct: number;
  accuracy: number;
}

export interface DateStat {
  date: string;
  matchCount: number;
  total: number;
  finished: number;
  correct: number;
  accuracy: number;
}

export interface TrendData {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  predictionTrend: {
    homeWinRate: number;
    drawRate: number;
    awayWinRate: number;
    avgHomeScore: number;
    avgAwayScore: number;
  };
}

export interface AIDeepPrediction {
  id: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  confidence: number;
  totalGoals: string;
  result: string;
  letResult: string;
  letBall: number;
  halfTime: string;
  halfFullTime: string;
  secondHomeScore: number;
  secondAwayScore: number;
  secondTotalGoals: string;
  secondResult: string;
  secondHalfFullTime: string;
  secondReasoning?: string;
  modelName: string;
  modelVersion: string;
  analysisFactors: {
    recentForm: number;
    headToHead: number;
    homeAdvantage: number;
    injuryImpact: number;
    tacticalMatchup: number;
    fatigueFactor: number;
  };
  scoreProbabilities: Array<{
    score: string;
    probability: number;
  }>;
  halfFullTimeProbabilities: Array<{
    result: string;
    probability: number;
  }>;
  reasoning?: string;
  generatedAt: string;
}

export interface ComparisonAnalysis {
  userPrediction: UserPrediction;
  networkPredictions: NetworkPrediction[];
  analysis: {
    scoreSimilarity: number;
    resultAgreement: number;
    suggestedPrediction: {
      homeScore: number;
      awayScore: number;
      result: string;
      confidence: number;
    };
  };
}

// 球队六维统计聚合
export interface TeamAdvancedStats {
  teamName: string;
  totalMatches: number;
  // wPPG原始值（加权后场均积分，未归一化）
  wPPGRaw: number;
  // 六维指标，均归一化为0-100百分比
  wPPG: number;                       // 加权场均积分归一化值
  possessionRate: number;             // 控球率（百分比，来源：ESPN）
  shotOnTargetRate: number;            // 射正率（百分比）
  conversionRate: number;             // 转化率（百分比）
  saveRate: number;                    // 门将扑救率（百分比）
  last15MinGoalRate: number;          // 最后15分钟进球占比（百分比）
  isEliminated: boolean;
}

// 球队详情中的对阵信息（含加时点球）
export interface TeamMatchInfo {
  matchId: string;
  opponent: string;
  isHome: boolean;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  extraTimeHome: number | null;
  extraTimeAway: number | null;
  penaltyHome: number | null;
  penaltyAway: number | null;
  matchDate: string;
  stage: string;
  stageType: string;
  status: string;
  stats: {
    possessionRate: number;
    shotOnTargetRate: number;
    conversionRate: number;
    saveRate: number;
    last15MinGoalRate: number;
  } | null;
}

// 比分结果占比统计
export interface ScoreDistributionItem {
  score: string;
  count: number;
  percentage: number;
}