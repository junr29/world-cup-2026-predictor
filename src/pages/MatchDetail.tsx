// 预测分析页面（比赛详情页）
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, ArrowLeft, Target, TrendingUp, Users, Zap, ChevronDown, ChevronUp, ExternalLink, Clock, BarChart3 } from 'lucide-react';
import { getMatchById, getNetworkPredictions } from '../api';
import type { Match, NetworkPrediction, AIDeepPrediction } from '../types';

const sourceInfo: Record<string, { description: string; method: string; reliability: string; url: string }> = {
  'ESPN预测': {
    description: 'ESPN官方足球分析师团队基于球队近期表现、历史交锋记录和伤病情况做出的专业预测。',
    method: '综合数据分析 + 专家评审团投票',
    reliability: '高',
    url: 'https://www.espn.com/soccer/'
  },
  '体育专家': {
    description: '资深体育媒体人和前职业球员组成的专家团，结合战术分析和比赛直觉给出的预测。',
    method: '战术拆解 + 经验判断 + 球队状态评估',
    reliability: '较高',
    url: 'https://sports.sina.com.cn/'
  },
  'AI预测系统': {
    description: '基于机器学习模型，分析过去5年数万场比赛数据，通过算法计算胜负概率分布。',
    method: '机器学习模型（XGBoost + 神经网络集成）',
    reliability: '中高',
    url: 'https://www.optasports.com/'
  },
  '数据分析平台': {
    description: '专业体育数据平台，基于控球率、射门数、预期进球(xG)等核心指标的量化分析。',
    method: '数据建模 + 预期进球(xG) + 攻防效率评估',
    reliability: '中高',
    url: 'https://www.transfermarkt.com/'
  },
  '社交媒体热度': {
    description: '通过微博、Twitter等社交平台的球迷投票和讨论热度，反映大众对比赛结果的预期。',
    method: '社交平台民意调查 + 关键词情感分析',
    reliability: '中',
    url: 'https://twitter.com/FIFAWorldCup'
  }
};

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [predictions, setPredictions] = useState<NetworkPrediction[]>([]);
  const [aiPrediction, setAIPrediction] = useState<AIDeepPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPred, setExpandedPred] = useState<string | null>(null);
  const [showAllPredictions, setShowAllPredictions] = useState(false); // 默认折叠，只显示3个

  useEffect(() => {
    if (id) loadMatchData();
  }, [id]);

  const loadMatchData = async () => {
    setLoading(true);
    try {
      const data = await getMatchById(id!);
      setMatch(data.match);
      setPredictions(data.predictions);
      setAIPrediction(data.aiPrediction || null);
    } catch (error) {
      console.error('加载比赛详情失败:', error);
    }
    setLoading(false);
  };

  // 计算网络预测统计
  const getPredictionStats = () => {
    if (predictions.length === 0) return null;

    const avgHome = predictions.reduce((s, p) => s + p.homeScore, 0) / predictions.length;
    const avgAway = predictions.reduce((s, p) => s + p.awayScore, 0) / predictions.length;

    const homeWins = predictions.filter(p => p.result === '主胜').length;
    const draws = predictions.filter(p => p.result === '平局').length;
    const awayWins = predictions.filter(p => p.result === '客胜').length;

    const avgConf = predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length;

    return { avgHome, avgAway, homeWins, draws, awayWins, avgConf, total: predictions.length };
  };

  const stats = getPredictionStats();

  // 统计热门比分TOP3
  const topScores = (() => {
    const map = new Map<string, { score: string; result: string; count: number }>();
    predictions.forEach(p => {
      const key = `${p.homeScore}:${p.awayScore}`;
      if (map.has(key)) {
        map.get(key)!.count++;
      } else {
        map.set(key, { score: key, result: p.result, count: 1 });
      }
    });
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  })();

  // 统计热门半全场TOP3
  const topHalfFullTimes = (() => {
    const map = new Map<string, { code: string; label: string; count: number }>();
    predictions.forEach(p => {
      if (!p.halfFullTime) return;
      const label =
        p.halfFullTime === '主-主' ? '胜胜' :
        p.halfFullTime === '主-平' ? '胜平' :
        p.halfFullTime === '主-客' ? '胜负' :
        p.halfFullTime === '平-主' ? '平胜' :
        p.halfFullTime === '平-平' ? '平平' :
        p.halfFullTime === '平-客' ? '平负' :
        p.halfFullTime === '客-主' ? '负胜' :
        p.halfFullTime === '客-平' ? '负平' : '负负';
      if (map.has(p.halfFullTime)) {
        map.get(p.halfFullTime)!.count++;
      } else {
        map.set(p.halfFullTime, { code: p.halfFullTime, label, count: 1 });
      }
    });
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  })();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0d1f0d] flex items-center justify-center">
        <div className="animate-pulse text-[#d4af37]">加载中...</div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0d1f0d] flex items-center justify-center">
        <div className="text-white">比赛不存在</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0d1f0d]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-[#d4af37] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回比赛列表</span>
        </button>

        {/* 比赛信息卡片 */}
        <div className="mb-8 rounded-xl bg-gradient-to-r from-[#1a472a]/60 to-[#1a472a]/40 border border-[#d4af37]/30 p-8">
          <div className="flex items-center justify-between">
            {/* 主队 */}
            <div className="flex-1 text-center">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-[#d4af37]/30 to-[#1a472a]/50 flex items-center justify-center border-2 border-[#d4af37]">
                <span className="text-3xl font-bold text-white">{match.homeTeam.charAt(0)}</span>
              </div>
              <h2 className="text-xl font-bold text-white">{match.homeTeam}</h2>
            </div>

            {/* 比分 */}
            <div className="flex-shrink-0 px-12 text-center">
              {match.status !== 'upcoming' ? (
                <div className="text-5xl font-bold text-white">
                  <span className="inline-block px-4 py-2 bg-[#d4af37]/30 rounded-lg">{match.homeScore}</span>
                  <span className="mx-3 text-[#d4af37]">-</span>
                  <span className="inline-block px-4 py-2 bg-[#d4af37]/30 rounded-lg">{match.awayScore}</span>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-lg text-[#d4af37]">VS</div>
                  <div className="text-sm text-gray-400 mt-2">{new Date(match.matchDate).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</div>
                </div>
              )}
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-sm text-gray-400">{match.stage}</span>
                {match.stageType === 'knockout' && (
                  <span className="px-2 py-0.5 bg-[#d4af37]/30 text-[#d4af37] text-xs rounded-full border border-[#d4af37]/50">
                    淘汰赛
                  </span>
                )}
              </div>
            </div>

            {/* 客队 */}
            <div className="flex-1 text-center">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-[#1a472a]/50 to-[#d4af37]/30 flex items-center justify-center border-2 border-[#d4af37]">
                <span className="text-3xl font-bold text-white">{match.awayTeam.charAt(0)}</span>
              </div>
              <h2 className="text-xl font-bold text-white">{match.awayTeam}</h2>
            </div>
          </div>
        </div>

        {/* 各预测源汇总预测 */}
        {stats && predictions.length > 0 && (
          <div className="mb-6 rounded-xl bg-gradient-to-r from-[#1a472a]/50 to-[#2d5a3f]/50 border border-[#d4af37]/40 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-6 h-6 text-[#d4af37]" />
                <h3 className="text-xl font-bold text-white">各预测源汇总预测</h3>
                <span className="px-2 py-0.5 bg-[#d4af37]/20 text-[#d4af37] text-xs rounded-full">
                  基于 {predictions.length} 个预测源
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">平均置信度</div>
                <div className="text-lg font-bold text-[#d4af37]">{(stats.avgConf * 100).toFixed(0)}%</div>
              </div>
            </div>

            {/* 胜平负概率横向展示 */}
            <div className="flex items-center justify-center gap-4 mb-6">
              {/* 主胜 */}
              <div className={`flex-1 bg-[#1a472a]/40 rounded-lg p-3 text-center border-2 ${
                stats.homeWins >= stats.draws && stats.homeWins >= stats.awayWins
                  ? 'border-green-500/60 bg-green-500/10'
                  : 'border-transparent'
              }`}>
                <div className="text-xs text-gray-400 mb-1">主胜</div>
                <div className="text-2xl font-bold text-white">
                  {((stats.homeWins / stats.total) * 100).toFixed(0)}%
                </div>
                <div className="text-[10px] text-gray-500">{stats.homeWins}票</div>
              </div>

              {/* 平局 */}
              <div className={`flex-1 bg-[#1a472a]/40 rounded-lg p-3 text-center border-2 ${
                stats.draws >= stats.homeWins && stats.draws >= stats.awayWins
                  ? 'border-yellow-500/60 bg-yellow-500/10'
                  : 'border-transparent'
              }`}>
                <div className="text-xs text-gray-400 mb-1">平局</div>
                <div className="text-2xl font-bold text-white">
                  {((stats.draws / stats.total) * 100).toFixed(0)}%
                </div>
                <div className="text-[10px] text-gray-500">{stats.draws}票</div>
              </div>

              {/* 客胜 */}
              <div className={`flex-1 bg-[#1a472a]/40 rounded-lg p-3 text-center border-2 ${
                stats.awayWins >= stats.homeWins && stats.awayWins >= stats.draws
                  ? 'border-red-500/60 bg-red-500/10'
                  : 'border-transparent'
              }`}>
                <div className="text-xs text-gray-400 mb-1">客胜</div>
                <div className="text-2xl font-bold text-white">
                  {((stats.awayWins / stats.total) * 100).toFixed(0)}%
                </div>
                <div className="text-[10px] text-gray-500">{stats.awayWins}票</div>
              </div>
            </div>

            {/* 热门比分 TOP 3 */}
            {topScores.length > 0 && (
              <div className="mb-4">
                <div className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  最可能比分（投票最多）
                </div>
                <div className="space-y-2">
                  {topScores.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className={`w-7 h-7 flex items-center justify-center text-xs font-bold rounded-full ${
                        idx === 0 ? 'bg-[#d4af37]/20 text-[#d4af37]' :
                        idx === 1 ? 'bg-gray-400/20 text-gray-300' :
                        'bg-amber-600/20 text-amber-500'
                      }`}>{idx + 1}</span>
                      <span className="text-white font-medium text-lg w-16">{item.score}</span>
                      <div className="flex-1 h-3 bg-[#1a472a] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            idx === 0 ? 'bg-gradient-to-r from-[#d4af37] to-[#b8962e]' :
                            idx === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                            'bg-gradient-to-r from-amber-500 to-amber-600'
                          }`}
                          style={{ width: `${(item.count / predictions.length) * 100}%` }}
                        />
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-[#d4af37] font-medium">{item.count} 票</div>
                        <div className="text-[10px] text-gray-500">{item.result}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 两列布局 */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* 各预测源详情 */}
          <div className="rounded-xl bg-[#1a472a]/30 border border-[#d4af37]/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-[#d4af37]" />
              <h3 className="text-lg font-semibold text-white">各预测源详情</h3>
              <span className="text-xs text-gray-500">共 {predictions.length} 个</span>
            </div>

            <div className="space-y-2">
              {(showAllPredictions ? predictions : predictions.slice(0, 3)).map((pred) => {
                const info = sourceInfo[pred.source] || { description: '网络预测数据', method: '综合分析', reliability: '中', url: '#' };
                const isExpanded = expandedPred === pred.id;
                return (
                  <div key={pred.id} className="overflow-hidden rounded bg-[#1a472a]/20">
                    <button
                      onClick={() => setExpandedPred(isExpanded ? null : pred.id)}
                      className="w-full flex items-center justify-between p-2 hover:bg-[#1a472a]/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-[#d4af37]" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                        <span className="text-sm text-gray-300">{pred.source}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-[#d4af37]/20 text-[#d4af37] text-[10px] rounded font-bold">首选</span>
                        <span className="text-white font-medium">{pred.homeScore}:{pred.awayScore}</span>
                        <span className="text-xs text-[#d4af37]">{pred.result}</span>
                        {pred.halfFullTime && (
                          <>
                            <span className="w-px h-4 bg-gray-700"></span>
                            <span className="text-[10px] text-green-400">
                              {pred.halfFullTime === '主-主' ? '胜胜' :
                               pred.halfFullTime === '主-平' ? '胜平' :
                               pred.halfFullTime === '主-客' ? '胜负' :
                               pred.halfFullTime === '平-主' ? '平胜' :
                               pred.halfFullTime === '平-平' ? '平平' :
                               pred.halfFullTime === '平-客' ? '平负' :
                               pred.halfFullTime === '客-主' ? '负胜' :
                               pred.halfFullTime === '客-平' ? '负平' : '负负'}
                            </span>
                          </>
                        )}
                        <span className="w-px h-4 bg-gray-700"></span>
                        <span className="px-1.5 py-0.5 bg-gray-600/30 text-gray-400 text-[10px] rounded font-bold">次选</span>
                        <span className="text-gray-300 font-medium">{pred.secondHomeScore}:{pred.secondAwayScore}</span>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-[#d4af37]/10 space-y-2">
                        <p className="text-xs text-gray-400 leading-relaxed">{info.description}</p>

                        {/* 首选 vs 次选 方案对比 */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-[#d4af37]/10 rounded-lg p-2 border border-[#d4af37]/30">
                            <div className="text-[10px] text-[#d4af37] mb-1">
                              <span className="px-1.5 py-0.5 bg-[#d4af37]/20 rounded font-bold">首选</span>
                            </div>
                            <div className="text-lg font-bold text-white mb-1">{pred.homeScore}:{pred.awayScore}</div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-[#d4af37]">{pred.result}</span>
                              <span className="text-gray-400">{pred.totalGoals}</span>
                            </div>
                            <div className="mt-1 text-[10px] text-gray-400">
                              半全场: <span className="text-white">
                                {pred.halfFullTime === '主-主' ? '胜胜' :
                                 pred.halfFullTime === '主-平' ? '胜平' :
                                 pred.halfFullTime === '主-客' ? '胜负' :
                                 pred.halfFullTime === '平-主' ? '平胜' :
                                 pred.halfFullTime === '平-平' ? '平平' :
                                 pred.halfFullTime === '平-客' ? '平负' :
                                 pred.halfFullTime === '客-主' ? '负胜' :
                                 pred.halfFullTime === '客-平' ? '负平' : '负负'}
                              </span>
                            </div>
                          </div>
                          <div className="bg-gray-700/20 rounded-lg p-2 border border-gray-600/30">
                            <div className="text-[10px] text-gray-400 mb-1">
                              <span className="px-1.5 py-0.5 bg-gray-600/30 rounded font-bold">次选</span>
                            </div>
                            <div className="text-lg font-bold text-gray-200 mb-1">{pred.secondHomeScore}:{pred.secondAwayScore}</div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-gray-400">{pred.secondResult}</span>
                              <span className="text-gray-500">{pred.secondTotalGoals}</span>
                            </div>
                            <div className="mt-1 text-[10px] text-gray-400">
                              胜平负: <span className="text-gray-300">{pred.secondResult}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="flex items-center gap-1 text-gray-500">
                            <BarChart3 className="w-3 h-3" />
                            <span className="text-gray-300">{info.method}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <Target className="w-3 h-3" />
                            <span className="text-[#d4af37]">置信{(pred.confidence * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <TrendingUp className="w-3 h-3" />
                            <span className="text-green-400">{info.reliability}</span>
                          </div>
                        </div>
                        <a
                          href={info.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-xs text-[#d4af37] hover:text-[#e5c048] transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>查看来源原文</span>
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {predictions.length > 3 && (
              <button
                onClick={() => setShowAllPredictions(!showAllPredictions)}
                className="mt-3 w-full py-2 text-sm text-[#d4af37] hover:text-[#e5c048] transition-colors flex items-center justify-center gap-1"
              >
                {showAllPredictions ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    收起
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    展开全部（共{predictions.length}个来源）
                  </>
                )}
              </button>
            )}
          </div>

          {/* AI深度预测 */}
          {aiPrediction && (
            <div className="rounded-xl bg-[#1a472a]/30 border border-[#d4af37]/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">AI深度预测</h3>
                <span className="text-xs text-gray-500">{aiPrediction.modelName}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#1a472a]/40 rounded-lg p-3 text-center border border-purple-500/20">
                  <div className="text-xs text-purple-400 mb-1">首选比分</div>
                  <div className="text-2xl font-bold text-white">
                    {aiPrediction.homeScore}:{aiPrediction.awayScore}
                  </div>
                  <div className="text-xs text-purple-300 mt-1">{aiPrediction.result}</div>
                </div>
                <div className="bg-[#1a472a]/40 rounded-lg p-3 text-center border border-gray-600/30">
                  <div className="text-xs text-gray-400 mb-1">次选比分</div>
                  <div className="text-2xl font-bold text-gray-200">
                    {aiPrediction.secondHomeScore}:{aiPrediction.secondAwayScore}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{aiPrediction.secondResult}</div>
                </div>
              </div>

              <div className="text-xs text-gray-400 mb-3">
                置信度: <span className="text-purple-400 font-medium">{(aiPrediction.confidence * 100).toFixed(0)}%</span>
              </div>

              {/* 比分概率分布 */}
              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-2">比分概率 TOP 5</div>
                <div className="space-y-1.5">
                  {aiPrediction.scoreProbabilities.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-white text-xs font-medium w-12">{item.score}</span>
                      <div className="flex-1 h-1.5 bg-[#1a472a] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
                          style={{ width: `${item.probability}%` }}
                        />
                      </div>
                      <span className="text-xs text-purple-400 w-8 text-right">{item.probability}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 半全场概率分布 */}
              {aiPrediction.halfFullTimeProbabilities && aiPrediction.halfFullTimeProbabilities.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-gray-500 mb-2">半全场概率 TOP 5</div>
                  <div className="space-y-1.5">
                    {aiPrediction.halfFullTimeProbabilities.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-white text-xs font-medium w-12">
                          {item.result === '主-主' ? '胜胜' :
                           item.result === '主-平' ? '胜平' :
                           item.result === '主-客' ? '胜负' :
                           item.result === '平-主' ? '平胜' :
                           item.result === '平-平' ? '平平' :
                           item.result === '平-客' ? '平负' :
                           item.result === '客-主' ? '负胜' :
                           item.result === '客-平' ? '负平' : '负负'}
                        </span>
                        <div className="flex-1 h-1.5 bg-[#1a472a] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
                            style={{ width: `${item.probability}%` }}
                          />
                        </div>
                        <span className="text-xs text-purple-400 w-8 text-right">{item.probability}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-[10px] text-gray-600 pt-2 border-t border-[#d4af37]/10">
                AI模型预测仅供参考
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}