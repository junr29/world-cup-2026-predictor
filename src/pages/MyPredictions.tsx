// 预测准确率排名页面
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, TrendingUp, Award, Medal, Zap, Calendar, RefreshCw, Database, Clock, AlertCircle, CheckCircle, XCircle, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { getPredictionRankings, getHalfFullTimeRankings, getCrawlHistory, triggerCrawl, getTopSourceNextDayPredictions, getTopHalfFullTimeSourceNextDayPredictions, getScoreDistribution, type CrawlHistoryItem, type PredictionRankingsByStage, type TopSourceNextDayPrediction, type TopHalfFullTimeSourceNextDayPrediction } from '../api';
import type { PredictionRankingItem, PredictionRankings } from '../api';
import type { ScoreDistributionItem } from '../types';

export default function PredictionRankings() {
  const navigate = useNavigate();
  const [rankings, setRankings] = useState<PredictionRankingsByStage | null>(null);
  const [halfFullTimeRankings, setHalfFullTimeRankings] = useState<PredictionRankingsByStage | null>(null);
  const [topSourcePredictions, setTopSourcePredictions] = useState<TopSourceNextDayPrediction | null>(null);
  const [topHalfFullTimeSourcePredictions, setTopHalfFullTimeSourcePredictions] = useState<TopHalfFullTimeSourceNextDayPrediction | null>(null);
  const [scoreDistribution, setScoreDistribution] = useState<ScoreDistributionItem[]>([]);
  const [activeTab, setActiveTab] = useState<'score' | 'halfFullTime'>('score');
  const [loading, setLoading] = useState(true);
  const [crawlHistory, setCrawlHistory] = useState<CrawlHistoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'score-knockout': false,
    'halfFullTime-knockout': false,
  });

  useEffect(() => {
    loadData();
    
    const hash = window.location.hash;
    if (hash === '#half-full-time') {
      setActiveTab('halfFullTime');
    } else {
      setActiveTab('score');
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rankingsData, halfFullTimeData, historyData, topSourceData, topHalfFullTimeSourceData, scoreDistData] = await Promise.all([
        getPredictionRankings(),
        getHalfFullTimeRankings(),
        getCrawlHistory().catch(() => []),
        getTopSourceNextDayPredictions().catch(() => null),
        getTopHalfFullTimeSourceNextDayPredictions().catch(() => null),
        getScoreDistribution().catch(() => [])
      ]);
      setRankings(rankingsData);
      setHalfFullTimeRankings(halfFullTimeData);
      setCrawlHistory(historyData);
      setTopSourcePredictions(topSourceData);
      setTopHalfFullTimeSourcePredictions(topHalfFullTimeSourceData);
      setScoreDistribution(scoreDistData);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await triggerCrawl();
      await loadData();
    } catch (error) {
      console.error('刷新失败:', error);
    }
    setRefreshing(false);
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-300" />;
    if (index === 2) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">{index + 1}</span>;
  };

  const formatHFT = (hft: string) => {
    return hft === '主-主' ? '胜胜' :
           hft === '主-平' ? '胜平' :
           hft === '主-客' ? '胜负' :
           hft === '平-主' ? '平胜' :
           hft === '平-平' ? '平平' :
           hft === '平-客' ? '平负' :
           hft === '客-主' ? '负胜' :
           hft === '客-平' ? '负平' : '负负';
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  // 根据比分占比判断是否需要提示"从未出现"
  // 返回该比分在本届世界杯的占比（0表示从未出现）
  const getScoreOccurrence = (homeScore: number, awayScore: number): { percentage: number; neverOccurred: boolean } => {
    if (!scoreDistribution || scoreDistribution.length === 0) {
      return { percentage: 0, neverOccurred: false }; // 数据未加载完成时不提示
    }
    const target = `${homeScore}:${awayScore}`;
    const found = scoreDistribution.find(item => item.score === target);
    if (!found) {
      return { percentage: 0, neverOccurred: true };
    }
    return { percentage: found.percentage, neverOccurred: found.percentage <= 0 };
  };

    const renderRankingList = (data: PredictionRankings, title: string, icon: React.ReactNode, sectionKey: string) => {
    const isExpanded = expandedSections[sectionKey] || false;
    const displayRankings = isExpanded ? data.rankings : data.rankings.slice(0, 5);
    const hasMore = data.rankings.length > 5;
    const isHalfFullTime = sectionKey.startsWith('halfFullTime');

    const toggleExpand = () => {
      setExpandedSections(prev => ({
        ...prev,
        [sectionKey]: !prev[sectionKey]
      }));
    };

    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <span className="text-xs text-gray-500 ml-2">
            已赛 {data.totalFinished} 场 / 预测来源 {data.rankings.length} 个
          </span>
        </div>
        {data.rankings.length > 0 ? (
          <div className="rounded-xl bg-[#1a472a]/30 border border-[#d4af37]/20 overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-[#d4af37]/10 border-b border-[#d4af37]/20 text-xs font-medium text-gray-400">
              <div className="col-span-1">排名</div>
              <div className="col-span-4">预测来源</div>
              <div className="col-span-3 text-center">测准/已赛</div>
              <div className="col-span-2 text-center">命中情况</div>
              <div className="col-span-2 text-center">准确率</div>
            </div>
            <div className="divide-y divide-[#d4af37]/10">
              {displayRankings.map((item: PredictionRankingItem, index: number) => (
                <div
                  key={item.source}
                  onClick={() => navigate(`/predictor/${encodeURIComponent(item.source)}${isHalfFullTime ? '?view=halfFullTime' : ''}`)}
                  className={`grid grid-cols-12 gap-2 px-5 py-4 items-center transition-colors cursor-pointer ${
                    index < 3 ? 'bg-[#d4af37]/5 hover:bg-[#d4af37]/10' : 'hover:bg-[#1a472a]/30'
                  }`}
                >
                  <div className="col-span-1 flex items-center">
                    {getRankBadge(index)}
                  </div>
                  <div className="col-span-4">
                    <div className="text-sm font-medium text-white hover:text-[#d4af37]">{item.source}</div>
                    <div className="text-xs text-gray-500 mt-0.5">点击查看详情 →</div>
                  </div>
                  <div className="col-span-3 text-center">
                    <span className="text-xl font-bold text-green-400">{item.correct}</span>
                    <span className="text-gray-500 mx-2">/</span>
                    <span className="text-xl font-bold text-white">{item.finished}</span>
                    <span className="text-xs text-gray-500 ml-1">场</span>
                  </div>
                  <div className="col-span-2 text-center">
                    {item.finished > 0 ? (
                      <div className="flex items-center justify-center gap-1.5 text-xs">
                        <span className="text-green-400">{item.firstCorrect}</span>
                        <span className="text-gray-600">首</span>
                        <span className="text-gray-500">+</span>
                        <span className="text-blue-400">{item.secondCorrect}</span>
                        <span className="text-gray-600">次</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">待比赛开始</span>
                    )}
                  </div>
                  <div className="col-span-2 text-center">
                    {item.finished > 0 ? (
                      <>
                        <div className="text-xl font-bold text-[#d4af37]">
                          {Math.round(item.accuracy)}%
                        </div>
                        <div className="w-full h-1.5 bg-gray-700/50 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#d4af37] to-[#b8941f] rounded-full transition-all"
                            style={{ width: `${Math.min(item.accuracy, 100)}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-gray-500">待评</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {hasMore && (
              <button
                onClick={toggleExpand}
                className="w-full px-5 py-3 flex items-center justify-center gap-2 text-sm text-[#d4af37] hover:bg-[#d4af37]/10 transition-colors border-t border-[#d4af37]/10"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    <span>收起剩余 {data.rankings.length - 5} 个预测源</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span>展开剩余 {data.rankings.length - 5} 个预测源</span>
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-xl bg-[#1a472a]/30 border border-[#d4af37]/20 p-8 text-center text-gray-500 text-sm">
            暂无数据
          </div>
        )}
      </div>
    );
  };

  const latestCrawl = crawlHistory.length > 0 ? crawlHistory[0] : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0d1f0d] flex items-center justify-center">
        <div className="animate-pulse text-[#d4af37]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0d1f0d]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-[#d4af37]" />
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">预测准确率排行</h1>
              {latestCrawl && (
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>最后更新：{formatTime(latestCrawl.timestamp)}</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] hover:bg-[#d4af37]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">{refreshing ? '更新中...' : '立即更新'}</span>
          </button>
        </div>

        {/* 数据来源说明 */}
        {latestCrawl && (
          <div className="mb-6 rounded-lg bg-[#1a472a]/20 border border-[#d4af37]/20 p-4">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-[#d4af37] mb-2">数据来源</div>
                <div className="text-xs text-gray-400 mb-3">
                  比赛结果从以下 {latestCrawl.sourceResults.length} 个数据源自动抓取，多源交叉验证后更新。每天北京时间 08:00 自动更新。
                </div>
                <div className="flex flex-wrap gap-2">
                  {latestCrawl.sourceResults.map((src) => (
                    <div
                      key={src.source}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${
                        src.success
                          ? 'bg-green-900/30 border border-green-500/30 text-green-400'
                          : 'bg-red-900/30 border border-red-500/30 text-red-400'
                      }`}
                    >
                      {src.success ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      <span>{src.source}</span>
                      <span className="opacity-60">({src.matchCount}场)</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  本次抓取：{latestCrawl.totalCrawled} 条记录，验证通过 {latestCrawl.verifiedCount} 场，更新 {latestCrawl.updatedCount} 场
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 玩法选项卡 */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab('score')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'score'
                ? 'bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#d4af37]'
                : 'bg-[#1a472a]/20 border border-gray-700/30 text-gray-400 hover:text-white'
            }`}
          >
            比分预测排行
          </button>
          <button
            onClick={() => setActiveTab('halfFullTime')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'halfFullTime'
                ? 'bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#d4af37]'
                : 'bg-[#1a472a]/20 border border-gray-700/30 text-gray-400 hover:text-white'
            }`}
          >
            半全场预测排行
          </button>
        </div>

        {/* 统计起始日期 */}
        {rankings && (
          <div className="mb-6 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-[#d4af37]" />
              <span className="text-sm text-[#d4af37]">
                统计起始日期：{rankings.knockout.startDate}（北京时间）
              </span>
            </div>
            <div className="text-xs text-gray-400">
              仅统计淘汰赛阶段（自7月2日起）的预测准确率，数据基于真实预测源。小组赛阶段因缺乏历史预测数据，不纳入统计。
            </div>
          </div>
        )}

        {/* 计分规则说明 */}
        <div className="mb-6 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/30 p-4">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-[#d4af37] mb-1">计分规则</div>
              <div className="text-xs text-gray-400 leading-relaxed">
                {activeTab === 'score' ? (
                  <>
                    每个预测来源提供首选和次选两个比分方案。<span className="text-[#d4af37]">首选或次选任意一个与实际比分完全一致，即视为预测正确</span>。
                    准确率 = 正确场数 / 已结束场数 × 100%。排名按准确率从高到低排列，准确率相同则首选命中数多者优先。
                  </>
                ) : (
                  <>
                    每个预测来源提供首选和次选两个半全场方案。<span className="text-[#d4af37]">首选或次选任意一个与实际半全场结果完全一致，即视为预测正确</span>。
                    准确率 = 正确场数 / 已结束场数 × 100%。排名按准确率从高到低排列，准确率相同则首选命中数多者优先。
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 第一名预测来源对下一日比赛的预测 */}
        {activeTab === 'score' && topSourcePredictions && topSourcePredictions.predictions.length > 0 && (
          <div className="mb-8 rounded-xl bg-gradient-to-r from-[#1a472a]/50 to-[#0d3d1d]/50 border border-[#d4af37]/30 overflow-hidden">
            <div className="px-5 py-4 bg-[#d4af37]/10 border-b border-[#d4af37]/20">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-[#d4af37]" />
                <div>
                  <div className="text-lg font-bold text-white flex items-center gap-2">
                    冠军预测员 · <span className="text-[#d4af37]">{topSourcePredictions.topSource}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {topSourcePredictions.nextMatchDate} 比赛日预测
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5">
              <div className="grid gap-4">
                {topSourcePredictions.predictions.map((pred) => (
                  <div key={pred.matchId} className="rounded-lg bg-[#1a472a]/30 border border-[#d4af37]/10 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{pred.stage}</span>
                        <span className="text-sm font-medium text-white">{pred.homeTeam}</span>
                        <span className="text-[#d4af37] font-bold">VS</span>
                        <span className="text-sm font-medium text-white">{pred.awayTeam}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(pred.matchDate).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="flex gap-4">
                      {(() => {
                        const firstOccur = getScoreOccurrence(pred.homeScore, pred.awayScore);
                        const secondOccur = getScoreOccurrence(pred.secondHomeScore, pred.secondAwayScore);
                        return (
                          <>
                            <div className="flex-1 bg-[#d4af37]/10 rounded-lg p-3 text-center">
                              <div className="text-[10px] text-[#d4af37] mb-1">首选</div>
                              <div className="text-xl font-bold text-white">{pred.homeScore}:{pred.awayScore}</div>
                              <div className="text-[10px] text-gray-400 mt-1">{pred.result}</div>
                              {firstOccur.neverOccurred ? (
                                <div className="mt-2 flex items-center justify-center gap-1 px-2 py-1 rounded bg-red-900/40 border border-red-500/40 text-[10px] text-red-300">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>该比分本届从未出现</span>
                                </div>
                              ) : firstOccur.percentage > 0 ? (
                                <div className="mt-2 text-[10px] text-gray-500">本届出现占比 {firstOccur.percentage.toFixed(1)}%</div>
                              ) : null}
                            </div>
                            <div className="flex-1 bg-gray-800/30 rounded-lg p-3 text-center">
                              <div className="text-[10px] text-gray-400 mb-1">次选</div>
                              <div className="text-xl font-bold text-gray-300">{pred.secondHomeScore}:{pred.secondAwayScore}</div>
                              <div className="text-[10px] text-gray-500 mt-1">{pred.secondResult}</div>
                              {secondOccur.neverOccurred ? (
                                <div className="mt-2 flex items-center justify-center gap-1 px-2 py-1 rounded bg-red-900/40 border border-red-500/40 text-[10px] text-red-300">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>该比分本届从未出现</span>
                                </div>
                              ) : secondOccur.percentage > 0 ? (
                                <div className="mt-2 text-[10px] text-gray-500">本届出现占比 {secondOccur.percentage.toFixed(1)}%</div>
                              ) : null}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 半全场冠军预测员 */}
        {activeTab === 'halfFullTime' && topHalfFullTimeSourcePredictions && topHalfFullTimeSourcePredictions.predictions.length > 0 && (
          <div className="mb-8 rounded-xl bg-gradient-to-r from-purple-900/30 to-[#1a472a]/50 border border-purple-500/30 overflow-hidden">
            <div className="px-5 py-4 bg-purple-500/10 border-b border-purple-500/20">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-lg font-bold text-white flex items-center gap-2">
                    半全场冠军预测员 · <span className="text-purple-400">{topHalfFullTimeSourcePredictions.topSource}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {topHalfFullTimeSourcePredictions.nextMatchDate} 比赛日预测
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5">
              <div className="grid gap-4">
                {topHalfFullTimeSourcePredictions.predictions.map((pred) => (
                  <div key={pred.matchId} className="rounded-lg bg-[#1a472a]/30 border border-purple-500/10 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{pred.stage}</span>
                        <span className="text-sm font-medium text-white">{pred.homeTeam}</span>
                        <span className="text-purple-400 font-bold">VS</span>
                        <span className="text-sm font-medium text-white">{pred.awayTeam}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(pred.matchDate).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1 bg-purple-500/10 rounded-lg p-3 text-center border border-purple-500/20">
                        <div className="text-[10px] text-purple-400 mb-1">首选半全场</div>
                        <div className="text-xl font-bold text-white">{formatHFT(pred.halfFullTime)}</div>
                        <div className="text-[10px] text-gray-400 mt-1">{pred.halfFullTime}</div>
                      </div>
                      <div className="flex-1 bg-gray-800/30 rounded-lg p-3 text-center border border-gray-600/20">
                        <div className="text-[10px] text-gray-400 mb-1">次选半全场</div>
                        <div className="text-xl font-bold text-gray-300">{formatHFT(pred.secondHalfFullTime)}</div>
                        <div className="text-[10px] text-gray-500 mt-1">{pred.secondHalfFullTime || '-'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 淘汰赛排名 */}
        {activeTab === 'score' && rankings && renderRankingList(rankings.knockout, '淘汰赛', <TrendingUp className="w-5 h-5 text-blue-400" />, 'score-knockout')}
        {activeTab === 'halfFullTime' && halfFullTimeRankings && renderRankingList(halfFullTimeRankings.knockout, '淘汰赛', <TrendingUp className="w-5 h-5 text-blue-400" />, 'halfFullTime-knockout')}
      </div>
    </div>
  );
}
