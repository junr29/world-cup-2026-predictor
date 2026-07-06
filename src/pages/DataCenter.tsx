// 数据中心页面
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { BarChart3, PieChart as PieIcon, TrendingUp, Activity, Trophy, Target, Clock, Radio, Users, ChevronRight, Award, RefreshCw } from 'lucide-react';
import { getOverview, getTrends, getStatsByStageType, getStatsByDate, getMatches, getTeamAdvancedStats, getScoreDistribution, refreshTeamDetailStats, getMatchPredictionAccuracy } from '../api';
import type { MatchStats, PredictionStats, TrendData, StageTypeStat, DateStat, Match, TeamAdvancedStats, ScoreDistributionItem } from '../types';
import type { MatchPredictionAccuracyItem } from '../api';

export default function DataCenter() {
  const [matchStats, setMatchStats] = useState<MatchStats>({ total: 0, upcoming: 0, live: 0, finished: 0, groupTotal: 0, knockoutTotal: 0 });
  const [userStats, setUserStats] = useState<PredictionStats>({ total: 0, correct: 0, accuracy: 0 });
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [stageStats, setStageStats] = useState<StageTypeStat[]>([]);
  const [dateStats, setDateStats] = useState<DateStat[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [teamStats, setTeamStats] = useState<TeamAdvancedStats[]>([]);
  const [scoreDistribution, setScoreDistribution] = useState<ScoreDistributionItem[]>([]);
  const [matchAccuracyList, setMatchAccuracyList] = useState<MatchPredictionAccuracyItem[]>([]);
  const [showAllMatchAccuracy, setShowAllMatchAccuracy] = useState(false);
  const [showAllTeamStats, setShowAllTeamStats] = useState(false);
  const [showAllScoreDist, setShowAllScoreDist] = useState(false);
  const [statsTab, setStatsTab] = useState<'alive' | 'all'>('alive');
  const [loading, setLoading] = useState(true);
  const [refreshingStats, setRefreshingStats] = useState(false);
  const [statsRefreshMsg, setStatsRefreshMsg] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const overview = await getOverview();
      setMatchStats(overview.matchStats);
      setUserStats(overview.userStats);

      const trendsData = await getTrends();
      setTrends(trendsData);

      const stageData = await getStatsByStageType();
      setStageStats(stageData);

      const dateData = await getStatsByDate();
      setDateStats(dateData);

      const matchesData = await getMatches();
      setAllMatches(matchesData);

      const [teamStatsData, scoreDistData, matchAccuracyData] = await Promise.all([
        getTeamAdvancedStats(),
        getScoreDistribution(),
        getMatchPredictionAccuracy()
      ]);
      setTeamStats(teamStatsData);
      setScoreDistribution(scoreDistData);
      setMatchAccuracyList(matchAccuracyData);
    } catch (error) {
      console.error('加载数据中心失败:', error);
    }
    setLoading(false);
  };

  const handleRefreshStats = async () => {
    if (refreshingStats) return;
    setRefreshingStats(true);
    setStatsRefreshMsg('');
    try {
      const result = await refreshTeamDetailStats();
      setStatsRefreshMsg(`抓取完成：成功 ${result.ok}/${result.total} 场，失败 ${result.fail} 场`);
      // 重新加载统计数据
      const [teamStatsData, scoreDistData] = await Promise.all([
        getTeamAdvancedStats(),
        getScoreDistribution()
      ]);
      setTeamStats(teamStatsData);
      setScoreDistribution(scoreDistData);
    } catch (err) {
      setStatsRefreshMsg('刷新失败：' + (err instanceof Error ? err.message : '未知错误'));
    }
    setRefreshingStats(false);
  };

  const formatBeijingTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 比赛状态饼图数据
  const pieData = [
    { name: '待开赛', value: matchStats.upcoming, color: '#22c55e' },
    { name: '进行中', value: matchStats.live, color: '#ef4444' },
    { name: '已结束', value: matchStats.finished, color: '#6b7280' }
  ];

  // 趋势数据（取前8场比赛），四舍五入到整数
  const chartData = trends.slice(0, 8).map((t) => ({
    name: `${t.homeTeam.slice(0, 2)}vs${t.awayTeam.slice(0, 2)}`,
    homeWin: Math.round(t.predictionTrend.homeWinRate),
    draw: Math.round(t.predictionTrend.drawRate),
    awayWin: Math.round(t.predictionTrend.awayWinRate)
  }));

  // 待开赛和进行中比赛
  const upcomingMatches = allMatches.filter(m => m.status === 'upcoming').slice(0, 6);
  const liveMatches = allMatches.filter(m => m.status === 'live');

  // 球队六维雷达图数据（用于排行Top展示）
  const radarDimensions = ['wPPG', '控球率', '射正率', '转化率', '扑救率', '末15分钟进球占比'];
  const statsKeyMap: Record<string, keyof TeamAdvancedStats> = {
    'wPPG': 'wPPG',
    '对方半场控球': 'possessionRate',
    '控球率': 'possessionRate',
    '射正率': 'shotOnTargetRate',
    '转化率': 'conversionRate',
    '扑救率': 'saveRate',
    '末15分钟进球占比': 'last15MinGoalRate'
  };
  const buildTeamRadarData = (team: TeamAdvancedStats) => {
    return radarDimensions.map(d => ({
      dimension: d,
      value: Math.round((team[statsKeyMap[d]] as number) * 10) / 10
    }));
  };

  // 排行渲染辅助
  const renderRankBadge = (idx: number) => (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
      idx === 0 ? 'bg-[#d4af37]/20 text-[#d4af37]' :
      idx === 1 ? 'bg-gray-400/20 text-gray-300' :
      idx === 2 ? 'bg-amber-600/20 text-amber-500' :
      'bg-gray-700/30 text-gray-400'
    }`}>
      {idx + 1}
    </span>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0d1f0d]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-[#d4af37]" />
          <h1 className="text-3xl font-bold text-white tracking-tight">数据中心</h1>
        </div>

        {loading ? (
          <div className="animate-pulse grid gap-6">
            <div className="h-64 bg-[#1a472a]/20 rounded-xl" />
            <div className="h-64 bg-[#1a472a]/20 rounded-xl" />
          </div>
        ) : (
          <>
            {/* 统计概览 */}
            <div className="mb-8 grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="rounded-xl bg-[#1a472a]/40 border border-[#d4af37]/20 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-[#d4af37]" />
                  <span className="text-sm text-gray-400">总比赛数</span>
                </div>
                <div className="text-3xl font-bold text-white">{matchStats.total}</div>
              </div>
              <div className="rounded-xl bg-[#1a472a]/40 border border-[#d4af37]/20 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-gray-400">待开赛</span>
                </div>
                <div className="text-3xl font-bold text-green-400">{matchStats.upcoming}</div>
              </div>
              <div className="rounded-xl bg-[#1a472a]/40 border border-[#d4af37]/20 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Radio className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-gray-400">进行中</span>
                </div>
                <div className="text-3xl font-bold text-red-400">{matchStats.live}</div>
              </div>
              <div className="rounded-xl bg-[#1a472a]/40 border border-[#d4af37]/20 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-[#d4af37]" />
                  <span className="text-sm text-gray-400">淘汰赛场次</span>
                </div>
                <div className="text-3xl font-bold text-[#d4af37]">{matchStats.knockoutTotal}</div>
              </div>
              <div className="rounded-xl bg-[#1a472a]/40 border border-[#d4af37]/20 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-400">小组赛场次</span>
                </div>
                <div className="text-3xl font-bold text-gray-400">{matchStats.groupTotal}</div>
              </div>
            </div>

            {/* 球队wPPG排行 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#d4af37]" />
                  <h3 className="text-lg font-semibold text-white">球队六维统计排行</h3>
                  <span className="text-xs text-gray-500 ml-2">（按wPPG排序，点击查看详情；数据源：ESPN真实统计）</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRefreshStats}
                    disabled={refreshingStats}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/25 transition-colors disabled:opacity-50"
                    title="从 ESPN 重新抓取每场比赛的真实统计数据"
                  >
                    <RefreshCw className={`w-3 h-3 ${refreshingStats ? 'animate-spin' : ''}`} />
                    <span>{refreshingStats ? '抓取中...' : '刷新ESPN统计'}</span>
                  </button>
                  <div className="flex items-center gap-1 bg-[#1a472a]/50 rounded-lg p-1">
                    <button
                      onClick={() => setStatsTab('alive')}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        statsTab === 'alive' ? 'bg-[#d4af37]/20 text-[#d4af37]' : 'text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      存活球队
                    </button>
                    <button
                      onClick={() => setStatsTab('all')}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        statsTab === 'all' ? 'bg-[#d4af37]/20 text-[#d4af37]' : 'text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      全部球队
                    </button>
                  </div>
                </div>
              </div>
              {statsRefreshMsg && (
                <div className="mb-3 px-3 py-1.5 text-xs rounded-md bg-[#1a472a]/40 border border-[#d4af37]/20 text-gray-300">
                  {statsRefreshMsg}
                </div>
              )}

              {(() => {
                const filteredTeams = statsTab === 'alive'
                  ? teamStats.filter(t => !t.isEliminated)
                  : teamStats;
                if (filteredTeams.length === 0) {
                  return <div className="text-center py-8 text-gray-400">暂无数据</div>;
                }
                // 已按wPPG降序排列
                const sortedTeams = [...filteredTeams].sort((a, b) => b.wPPG - a.wPPG);
                const displayTeams = showAllTeamStats ? sortedTeams : sortedTeams.slice(0, 5);

                return (
                  <div className="rounded-xl bg-[#1a472a]/30 border border-[#d4af37]/20 overflow-hidden">
                    <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-[#d4af37]/10 border-b border-[#d4af37]/20 text-xs font-medium text-gray-400">
                      <div className="col-span-1">排名</div>
                      <div className="col-span-3">球队</div>
                      <div className="col-span-1 text-center">场次</div>
                      <div className="col-span-2 text-center">wPPG(原始)</div>
                      <div className="col-span-3 text-center">wPPG(归一化)</div>
                      <div className="col-span-2 text-right">详情</div>
                    </div>
                    <div className="divide-y divide-[#d4af37]/10">
                      {displayTeams.map((team, idx) => (
                        <Link
                          key={team.teamName}
                          to={`/team/${encodeURIComponent(team.teamName)}`}
                          className={`grid grid-cols-12 gap-2 px-5 py-3 items-center transition-colors hover:bg-[#1a472a]/30 ${
                            idx < 3 ? (idx === 0 ? 'bg-[#d4af37]/5' : idx === 1 ? 'bg-gray-400/5' : 'bg-amber-600/5') : ''
                          }`}
                        >
                          <div className="col-span-1 flex items-center">{renderRankBadge(idx)}</div>
                          <div className="col-span-3">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-sm font-medium ${idx < 3 ? 'text-white' : 'text-gray-300'}`}>{team.teamName}</span>
                              {team.isEliminated && <span className="text-xs px-1 py-0.5 rounded bg-red-500/20 text-red-400">淘汰</span>}
                            </div>
                          </div>
                          <div className="col-span-1 text-center text-xs text-gray-300">{team.totalMatches}</div>
                          <div className="col-span-2 text-center text-xs text-gray-400">
                            {team.wPPGRaw.toFixed(2)}
                          </div>
                          <div className="col-span-3 px-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-[#1a472a] rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8941f]"
                                  style={{ width: `${Math.min(team.wPPG, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium w-10 text-right text-[#d4af37]">
                                {team.wPPG.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <div className="col-span-2 text-right">
                            <span className="text-xs text-[#d4af37] flex items-center justify-end gap-1">
                              查看 <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                    {sortedTeams.length > 5 && (
                      <button
                        onClick={() => setShowAllTeamStats(!showAllTeamStats)}
                        className="w-full text-center text-sm text-[#d4af37] hover:text-[#b8962e] transition-colors py-3 border-t border-[#d4af37]/10"
                      >
                        {showAllTeamStats ? `收起 ↑ 共 ${sortedTeams.length} 支球队` : `展开全部 ${sortedTeams.length} 支球队 ↓`}
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* 比分结果占比 */}
            <div className="mb-6 rounded-xl bg-[#1a472a]/30 border border-[#d4af37]/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-[#d4af37]" />
                <h3 className="text-lg font-semibold text-white">本届比分结果占比</h3>
                <span className="text-xs text-gray-500 ml-2">（已结束比赛，按出现次数排序）</span>
              </div>
              {scoreDistribution.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {(showAllScoreDist ? scoreDistribution : scoreDistribution.slice(0, 5)).map((item, idx) => {
                      const maxPct = scoreDistribution[0].percentage;
                      const barWidth = (item.percentage / maxPct) * 100;
                      return (
                        <div key={item.score} className="flex items-center gap-3">
                          <div className="w-16 flex-shrink-0">
                            <span className="text-sm font-bold text-white font-mono">{item.score}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-gray-500">{item.count} 次</span>
                              <span className="text-xs text-[#d4af37]">{item.percentage.toFixed(1)}%</span>
                            </div>
                            <div className="h-2.5 bg-[#1a472a] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  idx === 0 ? 'bg-gradient-to-r from-[#d4af37] to-[#b8941f]' :
                                  idx === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-300' :
                                  idx === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-500' :
                                  'bg-gradient-to-r from-[#1a472a] to-[#2d5a3f]'
                                }`}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {scoreDistribution.length > 5 && (
                    <button
                      onClick={() => setShowAllScoreDist(!showAllScoreDist)}
                      className="w-full text-center text-sm text-[#d4af37] hover:text-[#b8962e] transition-colors pt-3 mt-2 border-t border-[#d4af37]/10"
                    >
                      {showAllScoreDist ? `收起 ↑ 共 ${scoreDistribution.length} 种比分` : `展开全部 ${scoreDistribution.length} 种比分 ↓`}
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-400">暂无比分数据</div>
              )}
            </div>

            {/* 进行中比赛 */}
            {liveMatches.length > 0 && (
              <div className="mb-6 rounded-xl bg-red-900/20 border border-red-500/30 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Radio className="w-5 h-5 text-red-500 animate-pulse" />
                  <h3 className="text-lg font-semibold text-white">进行中比赛</h3>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {liveMatches.map((m) => (
                    <div key={m.id} className="rounded-lg bg-red-900/20 border border-red-500/20 p-3">
                      <div className="text-xs text-gray-400 mb-1">{m.stage}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{m.homeTeam}</span>
                        <span className="text-lg font-bold text-red-400">{m.homeScore} - {m.awayScore}</span>
                        <span className="text-sm font-medium text-white">{m.awayTeam}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 待开赛比赛 */}
            {upcomingMatches.length > 0 && (
              <div className="mb-6 rounded-xl bg-[#1a472a]/30 border border-[#d4af37]/20 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-green-500" />
                  <h3 className="text-lg font-semibold text-white">待开赛比赛</h3>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {upcomingMatches.map((m) => (
                    <div key={m.id} className="rounded-lg bg-[#1a472a]/40 border border-[#d4af37]/10 p-3">
                      <div className="text-xs text-gray-400 mb-1">{m.stage} · {formatBeijingTime(m.matchDate)}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{m.homeTeam}</span>
                        <span className="text-xs text-gray-500">vs</span>
                        <span className="text-sm font-medium text-white">{m.awayTeam}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 图表区域 */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* 比赛状态分布 */}
              <div className="rounded-xl bg-[#1a472a]/30 border border-[#d4af37]/20 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <PieIcon className="w-5 h-5 text-[#d4af37]" />
                  <h3 className="text-lg font-semibold text-white">比赛状态分布</h3>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a472a', border: '1px solid #d4af37', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-2">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-gray-400">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 预测趋势 */}
              <div className="rounded-xl bg-[#1a472a]/30 border border-[#d4af37]/20 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-[#d4af37]" />
                  <h3 className="text-lg font-semibold text-white">网络预测趋势</h3>
                </div>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a472a" />
                      <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#9ca3af' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a472a', border: '1px solid #d4af37', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="homeWin" name="主胜率" fill="#d4af37" />
                      <Bar dataKey="draw" name="平局率" fill="#9ca3af" />
                      <Bar dataKey="awayWin" name="客胜率" fill="#6b7280" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    暂无趋势数据
                  </div>
                )}
              </div>
            </div>

            {/* 分阶段准确率对比 */}
            <div className="mt-6 rounded-xl bg-[#1a472a]/30 border border-[#d4af37]/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-[#d4af37]" />
                <h3 className="text-lg font-semibold text-white">分阶段预测准确率对比</h3>
                <span className="text-xs text-gray-500 ml-2">（基于网络预测来源）</span>
              </div>
              {stageStats.length > 0 ? (
                <div className="space-y-4">
                  {stageStats.map((s) => (
                    <div key={s.stageType} className="flex items-center gap-4">
                      <div className="w-20 flex-shrink-0">
                        <span className={`text-sm font-medium ${s.stageType === 'knockout' ? 'text-[#d4af37]' : 'text-gray-400'}`}>
                          {s.stageTypeLabel}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-500">
                            正确 {s.correct} / 已结束 {s.finished} / 总计 {s.total}
                          </span>
                          <span className="text-xs text-[#d4af37]">{Math.round(s.accuracy)}%</span>
                        </div>
                        <div className="h-3 bg-[#1a472a] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${s.stageType === 'knockout'
                              ? 'bg-gradient-to-r from-[#d4af37] to-[#b8962e]'
                              : 'bg-gradient-to-r from-gray-500 to-gray-400'
                              }`}
                            style={{ width: `${s.accuracy}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  暂无预测数据
                </div>
              )}
            </div>

            {/* 单场比赛预测错误率排行 */}
            <div className="mt-6 rounded-xl bg-[#1a472a]/30 border border-[#d4af37]/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-semibold text-white">单场比赛预测错误率排行</h3>
                <span className="text-xs text-gray-500 ml-2">（错误率最高的比赛，由低到高）</span>
              </div>
              {matchAccuracyList.length > 0 ? (
                <div className="space-y-3">
                  {(showAllMatchAccuracy ? matchAccuracyList : matchAccuracyList.slice(0, 5)).map((m, i) => (
                    <div key={m.matchId} className="flex items-center gap-4">
                      <div className="w-8 flex-shrink-0 text-center">
                        <span className={`text-sm font-bold ${i < 3 ? 'text-red-400' : 'text-gray-400'}`}>
                          {i + 1}
                        </span>
                      </div>
                      <div className="w-36 flex-shrink-0">
                        <div className="text-sm font-medium text-white">
                          <Link to={`/match/${m.matchId}`} className="hover:text-[#d4af37] transition-colors">
                            {m.homeTeam.slice(0, 4)} vs {m.awayTeam.slice(0, 4)}
                          </Link>
                        </div>
                        <div className="text-xs text-gray-500">{m.stage}</div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-500">
                            正确 {m.correctPredictions}/{m.totalPredictions} · {m.homeScore !== null ? `${m.homeScore}-${m.awayScore}` : '未开赛'}
                          </span>
                          <span className="text-xs text-red-400 font-medium">{Math.round(m.errorRate)}%</span>
                        </div>
                        <div className="h-2.5 bg-[#1a472a] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-500"
                            style={{ width: `${m.errorRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {matchAccuracyList.length > 5 && (
                    <button
                      onClick={() => setShowAllMatchAccuracy(!showAllMatchAccuracy)}
                      className="w-full text-center text-sm text-[#d4af37] hover:text-[#b8962e] transition-colors py-2"
                    >
                      {showAllMatchAccuracy ? '收起 ↑' : `展开全部 ${matchAccuracyList.length} 场 ↓`}
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  暂无预测数据
                </div>
              )}
            </div>

            {/* 单日准确率统计 */}
            <div className="mt-6 rounded-xl bg-[#1a472a]/30 border border-[#d4af37]/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-[#d4af37]" />
                <h3 className="text-lg font-semibold text-white">单日预测准确率</h3>
                <span className="text-xs text-gray-500 ml-2">（基于网络预测来源，统计自7月2日起）</span>
              </div>
              {dateStats.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {dateStats.map((d) => (
                    <div key={d.date} className="flex items-center gap-4">
                      <div className="w-24 flex-shrink-0">
                        <span className="text-sm font-medium text-gray-300">
                          {d.date.slice(5)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-500">
                            比赛{d.matchCount}场 · 预测{d.total}次 · 正确{d.correct}/{d.finished}
                          </span>
                          <span className="text-xs text-[#d4af37]">{Math.round(d.accuracy)}%</span>
                        </div>
                        <div className="h-2.5 bg-[#1a472a] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#d4af37] to-[#b8962e] rounded-full transition-all duration-500"
                            style={{ width: `${d.accuracy}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  暂无预测数据
                </div>
              )}
            </div>

            {/* 网络预测总体准确率 */}
            <div className="mt-6 rounded-xl bg-[#1a472a]/30 border border-[#d4af37]/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-white">网络预测总体准确率</h3>
                <span className="text-xs text-gray-500 ml-2">（首选或次选命中均算正确）</span>
              </div>
              <div className="flex items-center gap-8">
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-400">准确率</span>
                    <span className="text-sm text-[#d4af37]">{Math.round(userStats.accuracy)}%</span>
                  </div>
                  <div className="h-4 bg-[#1a472a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#d4af37] to-[#b8962e] rounded-full transition-all duration-500"
                      style={{ width: `${userStats.accuracy}%` }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400">总预测</div>
                  <div className="text-2xl font-bold text-white">{userStats.total}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400">正确数</div>
                  <div className="text-2xl font-bold text-[#d4af37]">{userStats.correct}</div>
                </div>
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  );
}
