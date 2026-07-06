// API 服务

import axios from 'axios';
import type { Match, UserPrediction, NetworkPrediction, PredictionStats, MatchStats, TrendData, ComparisonAnalysis, StageTypeStat, StageStat, DateStat, AIDeepPrediction, TeamAdvancedStats, TeamMatchInfo, ScoreDistributionItem } from '../types';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000
});

// 比赛相关
export const getMatches = async (filters?: { stage?: string; stageType?: string; status?: string; date?: string }): Promise<Match[]> => {
  const response = await api.get('/matches', { params: filters });
  return response.data.matches;
};

export const getMatchById = async (id: string): Promise<{ match: Match; predictions: NetworkPrediction[]; aiPrediction: AIDeepPrediction | null }> => {
  const response = await api.get(`/matches/${id}`);
  return response.data;
};

export const getAIPrediction = async (matchId: string): Promise<AIDeepPrediction> => {
  const response = await api.get(`/matches/${matchId}/ai-prediction`);
  return response.data.aiPrediction;
};

export interface TomorrowMatchPrediction {
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
}

export interface TomorrowDateGroup {
  date: string;
  dateLabel: string;
  isToday: boolean;
  matches: TomorrowMatchPrediction[];
}

export const getTomorrowPredictions = async (): Promise<{
  date: string;
  todayCount: number;
  totalCount: number;
  matches: TomorrowMatchPrediction[];
  dateGroups: TomorrowDateGroup[];
}> => {
  const response = await api.get('/matches/tomorrow/summary');
  return response.data;
};

// 预测相关
export const createUserPrediction = async (data: {
  matchId: string;
  homeScore: number;
  awayScore: number;
  totalGoals: string;
  result: string;
  letResult: string;
  letBall: number;
  halfTime: string;
}): Promise<{ success: boolean; predictionId: string }> => {
  const response = await api.post('/predictions', data);
  return response.data;
};

export const getUserPredictions = async (): Promise<{ predictions: UserPrediction[]; statistics: PredictionStats }> => {
  const response = await api.get('/predictions/my');
  return response.data;
};

export const getNetworkPredictions = async (matchId: string): Promise<NetworkPrediction[]> => {
  const response = await api.get(`/predictions/network/${matchId}`);
  return response.data.predictions;
};

// 分析相关
export const comparePredictions = async (matchId: string): Promise<ComparisonAnalysis> => {
  const response = await api.get(`/analysis/compare/${matchId}`);
  return response.data;
};

export const getTrends = async (): Promise<TrendData[]> => {
  const response = await api.get('/analysis/trends');
  return response.data.trends;
};

export const getOverview = async (): Promise<{ matchStats: MatchStats; userStats: PredictionStats }> => {
  const response = await api.get('/analysis/overview');
  return response.data;
};

export const getStatsByStageType = async (): Promise<StageTypeStat[]> => {
  const response = await api.get('/analysis/stats/stage-type');
  return response.data.stats;
};

export const getStatsByStage = async (): Promise<StageStat[]> => {
  const response = await api.get('/analysis/stats/stage');
  return response.data.stats;
};

export const getStatsByDate = async (): Promise<DateStat[]> => {
  const response = await api.get('/analysis/stats/date');
  return response.data.stats;
};

export interface PredictionRankingItem {
  source: string;
  total: number;
  finished: number;
  correct: number;
  firstCorrect: number;
  secondCorrect: number;
  accuracy: number;
  avgConfidence: number;
}

export interface PredictionRankings {
  rankings: PredictionRankingItem[];
  totalFinished: number;
  totalMatches: number;
  startDate: string;
}

export interface PredictionRankingsByStage {
  all: PredictionRankings;
  group: PredictionRankings;
  knockout: PredictionRankings;
}

export const getPredictionRankings = async (): Promise<PredictionRankingsByStage> => {
  const response = await api.get('/analysis/rankings');
  return response.data;
};

export interface MatchPredictionAccuracyItem {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  stage: string;
  stageType: string;
  homeScore: number | null;
  awayScore: number | null;
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  errorRate: number;
  sources: string[];
}

export const getMatchPredictionAccuracy = async (): Promise<MatchPredictionAccuracyItem[]> => {
  const response = await api.get('/analysis/stats/match-accuracy');
  return response.data.stats;
};

export interface TopSourceNextDayPrediction {
  topSource: string;
  nextMatchDate: string;
  predictions: {
    matchId: string;
    homeTeam: string;
    awayTeam: string;
    matchDate: string;
    stage: string;
    homeScore: number;
    awayScore: number;
    result: string;
    secondHomeScore: number;
    secondAwayScore: number;
    secondResult: string;
  }[];
}

export interface TopHalfFullTimeSourceNextDayPrediction {
  topSource: string;
  nextMatchDate: string;
  predictions: {
    matchId: string;
    homeTeam: string;
    awayTeam: string;
    matchDate: string;
    stage: string;
    halfFullTime: string;
    secondHalfFullTime: string;
  }[];
}

export const getTopSourceNextDayPredictions = async (): Promise<TopSourceNextDayPrediction> => {
  const response = await api.get('/analysis/rankings/top-source-next-day');
  return response.data;
};

export const getTopHalfFullTimeSourceNextDayPredictions = async (): Promise<TopHalfFullTimeSourceNextDayPrediction> => {
  const response = await api.get('/analysis/rankings/top-halfFullTime-source-next-day');
  return response.data;
};

export interface TeamStatsDetail {
  stats: TeamAdvancedStats | null;
  matches: TeamMatchInfo[];
}

export const getTeamAdvancedStats = async (): Promise<TeamAdvancedStats[]> => {
  const response = await api.get('/analysis/team-stats');
  return response.data;
};

export const getTeamDetail = async (teamName: string): Promise<TeamStatsDetail> => {
  const response = await api.get(`/analysis/team-stats/${encodeURIComponent(teamName)}`);
  return response.data;
};

export const getScoreDistribution = async (): Promise<ScoreDistributionItem[]> => {
  const response = await api.get('/analysis/score-distribution');
  return response.data;
};

export const refreshTeamDetailStats = async (): Promise<{ success: boolean; ok: number; fail: number; total: number }> => {
  const response = await api.post('/analysis/refresh-stats');
  return response.data;
};

export const getHalfFullTimeRankings = async (): Promise<PredictionRankingsByStage> => {
  const response = await api.get('/analysis/rankings/half-full-time');
  return response.data;
};

export interface SourceCrawlResult {
  source: string;
  url: string;
  success: boolean;
  matchCount: number;
  error?: string;
}

export interface CrawlHistoryItem {
  timestamp: string;
  success: boolean;
  updatedCount: number;
  verifiedCount: number;
  totalCrawled: number;
  message: string;
  sourceResults: SourceCrawlResult[];
}

export const getCrawlHistory = async (): Promise<CrawlHistoryItem[]> => {
  const response = await api.get('/scheduler/crawl-history');
  return response.data.history;
};

export const triggerCrawl = async (): Promise<{ success: boolean; message: string; result: any }> => {
  const response = await api.post('/scheduler/trigger');
  return response.data;
};

export default api;