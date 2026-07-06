// 比赛中心页面
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Clock, ChevronDown, ChevronUp, Target, Zap, Calendar, Hexagon } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { getMatches, getUserPredictions, getTomorrowPredictions, getTeamAdvancedStats } from '../api';
import type { Match, UserPrediction, TeamAdvancedStats } from '../types';
import type { TomorrowMatchPrediction, TomorrowDateGroup } from '../api';

// 六维指标维度定义
const RADAR_DIMENSIONS = [
  { key: 'wPPG', label: 'wPPG' },
  { key: 'possessionRate', label: '控球率' },
  { key: 'shotOnTargetRate', label: '射正率' },
  { key: 'conversionRate', label: '转化率' },
  { key: 'saveRate', label: '扑救率' },
  { key: 'last15MinGoalRate', label: '末15分钟\n进球占比' }
];

// 自定义雷达图轴标签（支持多行文本）
const renderRadarTick = ({ payload, x, y, cx, cy, fill, fontSize }: any) => {
  const lines = payload.value.split('\n');
  const isTop = y < cy;
  const isLeft = x < cx;
  const textAnchor = Math.abs(x - cx) < 10 ? 'middle' : (isLeft ? 'end' : 'start');
  
  return (
    <text x={x} y={y} textAnchor={textAnchor} fill={fill} fontSize={fontSize}>
      {lines.map((line: string, i: number) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : 12}>
          {line}
        </tspan>
      ))}
    </text>
  );
};

// 构造单个对阵的雷达图数据
function buildRadarData(home: TeamAdvancedStats | undefined, away: TeamAdvancedStats | undefined) {
  return RADAR_DIMENSIONS.map(d => ({
    dimension: d.label,
    home: home ? Math.round(home[d.key as keyof TeamAdvancedStats] as number * 10) / 10 : 0,
    away: away ? Math.round(away[d.key as keyof TeamAdvancedStats] as number * 10) / 10 : 0
  }));
}

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [userPredictions, setUserPredictions] = useState<UserPrediction[]>([]);
  const [tomorrowData, setTomorrowData] = useState<{
    date: string;
    todayCount: number;
    totalCount: number;
    matches: TomorrowMatchPrediction[];
    dateGroups: TomorrowDateGroup[];
  } | null>(null);
  const [teamStats, setTeamStats] = useState<TeamAdvancedStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ stage: '', stageType: '', status: '', date: '' });
  const [showFinished, setShowFinished] = useState(false);

  useEffect(() => {
    loadData();
    setShowFinished(false);
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [matchData, predData, tomorrowData, statsData] = await Promise.all([
        getMatches(filter),
        getUserPredictions(),
        getTomorrowPredictions(),
        getTeamAdvancedStats()
      ]);
      setMatches(matchData);
      setUserPredictions(predData.predictions);
      setTomorrowData(tomorrowData);
      setTeamStats(statsData);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
    setLoading(false);
  };

  const getPredictionByMatchId = (matchId: string) => {
    return userPredictions.find(p => p.matchId === matchId);
  };

  const getTeamStats = (teamName: string) => {
    return teamStats.find(t => t.teamName === teamName);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full animate-pulse">直播中</span>;
      case 'finished':
        return <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded-full">已结束</span>;
      default:
        return <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">即将开始</span>;
    }
  };

  const getStageBadge = (stage: string, stageType: string) => {
    if (stageType === 'knockout') {
      return <span className="px-2 py-1 bg-[#d4af37]/30 text-[#d4af37] text-xs rounded-full border border-[#d4af37]/50">{stage}</span>;
    }
    return <span className="px-2 py-1 bg-[#1a472a] text-gray-300 text-xs rounded-full border border-[#d4af37]/20">{stage}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0d1f0d]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-6 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-[#d4af37]" />
          <h1 className="text-3xl font-bold text-white tracking-tight">2026世界杯比赛中心</h1>
        </div>

        {/* 即将开始的比赛 */}
        {tomorrowData && tomorrowData.dateGroups && tomorrowData.dateGroups.length > 0 && (
          <div className="mb-8 rounded-xl bg-gradient-to-r from-[#1a472a]/60 to-[#2d5a3f]/60 border border-[#d4af37]/40 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#d4af37]" />
                <h2 className="text-lg font-bold text-white">即将开始的比赛</h2>
                <span className="px-2 py-0.5 bg-[#d4af37]/20 text-[#d4af37] text-xs rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {tomorrowData.todayCount > 0 ? `今日 ${tomorrowData.todayCount} 场` : tomorrowData.date}
                </span>
              </div>
              <span className="text-xs text-gray-400">共 {tomorrowData.totalCount} 场比赛</span>
            </div>

            <div className="space-y-6">
              {tomorrowData.dateGroups.map((group) => (
                <div key={group.date}>
                  {/* 日期分组标题 */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#d4af37]/30" />
                    <span className={`text-sm font-medium ${group.isToday ? 'text-[#d4af37]' : 'text-gray-400'}`}>
                      {group.dateLabel}
                      {group.isToday && <span className="ml-2 text-xs bg-[#d4af37]/20 px-2 py-0.5 rounded-full">今日</span>}
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#d4af37]/30" />
                  </div>

                  {/* 该日期的比赛列表 */}
                  <div className="grid grid-cols-1 gap-4">
                    {group.matches.map((item) => {
                      const homeStats = getTeamStats(item.match.homeTeam);
                      const awayStats = getTeamStats(item.match.awayTeam);
                      const radarData = buildRadarData(homeStats, awayStats);
                      const hasStats = homeStats || awayStats;

                      return (
                        <Link
                          key={item.match.id}
                          to={`/match/${item.match.id}`}
                          className="block bg-[#1a1a1a]/60 rounded-lg p-4 border border-[#d4af37]/20 hover:border-[#d4af37]/50 hover:bg-[#1a472a]/30 transition-all group"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(item.match.matchDate).toLocaleDateString('zh-CN', {
                                timeZone: 'Asia/Shanghai',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-[#d4af37]/20 text-[#d4af37] rounded-full">
                              {item.match.stage}
                            </span>
                          </div>

                          {/* 三栏布局：主队名 | 雷达图叠加 | 客队名 */}
                          <div className="flex items-center gap-3">
                            {/* 主队 */}
                            <div className="flex-1 text-center min-w-0">
                              <div className="text-lg font-bold text-white truncate">{item.match.homeTeam}</div>
                              {homeStats && (
                                <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#d4af37]/10">
                                  <span className="w-2 h-2 rounded-full bg-[#d4af37]" />
                                  <span className="text-xs text-[#d4af37]">wPPG {homeStats.wPPG.toFixed(0)}</span>
                                </div>
                              )}
                            </div>

                            {/* 雷达图叠加（放大） */}
                            <div className="flex-shrink-0 w-64 h-56 relative">
                              {hasStats ? (
                                <>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <Hexagon className="absolute w-28 h-28 text-[#d4af37]/10" />
                                  </div>
                                  <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="80%">
                                      <PolarGrid stroke="#1a472a" strokeOpacity={0.6} />
                                      <PolarAngleAxis
                                        dataKey="dimension"
                                        tick={(props: any) => renderRadarTick({ ...props, fill: '#d4af37', fontSize: 10 })}
                                      />
                                      <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 9 }} />
                                      <Radar name={item.match.homeTeam} dataKey="home" stroke="#d4af37" fill="#d4af37" fillOpacity={0.4} strokeWidth={2} />
                                      <Radar name={item.match.awayTeam} dataKey="away" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.35} strokeWidth={2} />
                                      <Tooltip
                                        contentStyle={{ backgroundColor: '#1a472a', border: '1px solid #d4af37', borderRadius: '8px', fontSize: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                      />
                                    </RadarChart>
                                  </ResponsiveContainer>
                                </>
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
                                  暂无统计
                                </div>
                              )}
                            </div>

                            {/* 客队 */}
                            <div className="flex-1 text-center min-w-0">
                              <div className="text-lg font-bold text-white truncate">{item.match.awayTeam}</div>
                              {awayStats && (
                                <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10">
                                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                                  <span className="text-xs text-blue-300">wPPG {awayStats.wPPG.toFixed(0)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 图例 */}
                          {hasStats && (
                            <div className="mt-2 flex items-center justify-center gap-6 text-xs">
                              <span className="flex items-center gap-1.5 text-[#d4af37]">
                                <span className="w-3 h-3 rounded-full bg-[#d4af37]" />
                                {item.match.homeTeam}
                              </span>
                              <span className="flex items-center gap-1.5 text-blue-300">
                                <span className="w-3 h-3 rounded-full bg-blue-400" />
                                {item.match.awayTeam}
                              </span>
                            </div>
                          )}

                          <div className="mt-3 pt-3 border-t border-[#d4af37]/10 text-center">
                            <span className="text-xs text-[#d4af37] group-hover:text-[#e5c048] transition-colors">
                              查看预测详情 →
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 筛选器 */}
        <div className="mb-6 flex gap-4 flex-wrap">
          {/* 阶段类型筛选 */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter({ ...filter, stageType: '', stage: '' })}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${filter.stageType === '' ? 'bg-[#d4af37] text-white' : 'bg-[#1a472a]/80 text-gray-400 hover:bg-[#1a472a]'}`}
            >
              全部
            </button>
            <button
              onClick={() => setFilter({ ...filter, stageType: 'group', stage: '' })}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${filter.stageType === 'group' ? 'bg-[#d4af37] text-white' : 'bg-[#1a472a]/80 text-gray-400 hover:bg-[#1a472a]'}`}
            >
              小组赛
            </button>
            <button
              onClick={() => setFilter({ ...filter, stageType: 'knockout', stage: '' })}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${filter.stageType === 'knockout' ? 'bg-[#d4af37] text-white' : 'bg-[#1a472a]/80 text-gray-400 hover:bg-[#1a472a]'}`}
            >
              淘汰赛
            </button>
          </div>

          {/* 具体阶段筛选 */}
          <select
            value={filter.stage}
            onChange={(e) => setFilter({ ...filter, stage: e.target.value })}
            className="px-4 py-2 bg-[#1a472a]/80 border border-[#d4af37]/30 rounded-lg text-white focus:border-[#d4af37] focus:outline-none"
          >
            <option value="">全部阶段</option>
            {filter.stageType !== 'knockout' && (
              <>
                <option value="小组赛A组">A组</option>
                <option value="小组赛B组">B组</option>
                <option value="小组赛C组">C组</option>
                <option value="小组赛D组">D组</option>
                <option value="小组赛E组">E组</option>
                <option value="小组赛F组">F组</option>
                <option value="小组赛G组">G组</option>
                <option value="小组赛H组">H组</option>
                <option value="小组赛I组">I组</option>
                <option value="小组赛J组">J组</option>
                <option value="小组赛K组">K组</option>
                <option value="小组赛L组">L组</option>
              </>
            )}
            {filter.stageType !== 'group' && (
              <>
                <option value="1/16决赛">1/16决赛</option>
                <option value="1/8决赛">1/8决赛</option>
                <option value="1/4决赛">1/4决赛</option>
                <option value="半决赛">半决赛</option>
                <option value="季军赛">季军赛</option>
                <option value="决赛">决赛</option>
              </>
            )}
          </select>

          {/* 状态筛选 */}
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="px-4 py-2 bg-[#1a472a]/80 border border-[#d4af37]/30 rounded-lg text-white focus:border-[#d4af37] focus:outline-none"
          >
            <option value="">全部状态</option>
            <option value="upcoming">即将开始</option>
            <option value="live">直播中</option>
            <option value="finished">已结束</option>
          </select>

          {/* 日期筛选 */}
          <input
            type="date"
            value={filter.date}
            onChange={(e) => setFilter({ ...filter, date: e.target.value })}
            className="px-4 py-2 bg-[#1a472a]/80 border border-[#d4af37]/30 rounded-lg text-white focus:border-[#d4af37] focus:outline-none"
          />
          {filter.date && (
            <button
              onClick={() => setFilter({ ...filter, date: '' })}
              className="px-3 py-2 bg-[#1a472a]/80 border border-[#d4af37]/30 rounded-lg text-gray-400 hover:text-white hover:border-[#d4af37] transition-all text-sm"
            >
              清除日期
            </button>
          )}
        </div>

        {/* 比赛列表 */}
        {loading ? (
          <div className="grid gap-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-[#1a472a]/20 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {filter.stageType === 'knockout' && filter.status === '' ? (
              <>
                {/* 未结束的比赛 */}
                <div className="grid gap-4">
                  {matches.filter(m => m.status !== 'finished').map((match) => (
                    <MatchCard key={match.id} match={match} prediction={getPredictionByMatchId(match.id)} />
                  ))}
                </div>
                {/* 已结束的比赛折叠区 */}
                {matches.filter(m => m.status === 'finished').length > 0 && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowFinished(!showFinished)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-[#1a472a]/30 rounded-lg border border-[#d4af37]/20 hover:border-[#d4af37]/40 transition-all"
                    >
                      <span className="text-sm text-gray-400">
                        已结束比赛 ({matches.filter(m => m.status === 'finished').length}场)
                      </span>
                      {showFinished ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    {showFinished && (
                      <div className="grid gap-4 mt-4">
                        {matches.filter(m => m.status === 'finished').map((match) => (
                          <MatchCard key={match.id} match={match} prediction={getPredictionByMatchId(match.id)} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="grid gap-4">
                {matches.map((match) => (
                  <MatchCard key={match.id} match={match} prediction={getPredictionByMatchId(match.id)} />
                ))}
              </div>
            )}
          </>
        )}

        {/* 无数据 */}
        {!loading && matches.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400">暂无比赛数据</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCard({ match, prediction }: { match: Match; prediction?: UserPrediction }) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full animate-pulse">直播中</span>;
      case 'finished':
        return <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded-full">已结束</span>;
      default:
        return <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">即将开始</span>;
    }
  };

  const getStageBadge = (stage: string, stageType: string) => {
    if (stageType === 'knockout') {
      return <span className="px-2 py-1 bg-[#d4af37]/30 text-[#d4af37] text-xs rounded-full border border-[#d4af37]/50">{stage}</span>;
    }
    return <span className="px-2 py-1 bg-[#1a472a] text-gray-300 text-xs rounded-full border border-[#d4af37]/20">{stage}</span>;
  };

  return (
    <Link
      to={`/match/${match.id}`}
      className="block group"
    >
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#1a472a]/60 to-[#1a472a]/40 border border-[#d4af37]/20 p-6 transition-all duration-300 group-hover:border-[#d4af37]/60 group-hover:shadow-lg group-hover:shadow-[#d4af37]/10 group-hover:-translate-y-1">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {getStatusBadge(match.status)}
          {getStageBadge(match.stage, match.stageType)}
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex-1 text-center">
            <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-br from-[#d4af37]/30 to-[#1a472a]/50 flex items-center justify-center border-2 border-[#d4af37]/40 group-hover:border-[#d4af37] transition-all">
              <span className="text-2xl font-bold text-white">{match.homeTeam.charAt(0)}</span>
            </div>
            <h3 className="text-lg font-semibold text-white">{match.homeTeam}</h3>
          </div>

          <div className="flex-shrink-0 px-8 text-center">
            {match.status === 'finished' || match.status === 'live' ? (
              <div className="text-4xl font-bold text-white tracking-wider">
                <span className="inline-block px-3 py-1 bg-[#d4af37]/20 rounded">{match.homeScore}</span>
                <span className="mx-2 text-[#d4af37]">-</span>
                <span className="inline-block px-3 py-1 bg-[#d4af37]/20 rounded">{match.awayScore}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Clock className="w-5 h-5 text-[#d4af37]" />
                <div className="text-sm text-white">{formatDate(match.matchDate)}</div>
              </div>
            )}
            <div className="mt-2 flex gap-2 text-xs text-gray-400">
              <span>主{match.homeOdds.toFixed(2)}</span>
              <span>平{match.drawOdds.toFixed(2)}</span>
              <span>客{match.awayOdds.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex-1 text-center">
            <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-br from-[#1a472a]/50 to-[#d4af37]/30 flex items-center justify-center border-2 border-[#d4af37]/40 group-hover:border-[#d4af37] transition-all">
              <span className="text-2xl font-bold text-white">{match.awayTeam.charAt(0)}</span>
            </div>
            <h3 className="text-lg font-semibold text-white">{match.awayTeam}</h3>
          </div>
        </div>

        {match.status === 'upcoming' && (
          <div className="mt-4 text-center text-sm text-[#d4af37]/80 group-hover:text-[#d4af37]">
            点击查看预测分析 →
          </div>
        )}

        {prediction && (
          <div className="mt-4 pt-4 border-t border-[#d4af37]/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#d4af37]" />
                <span className="text-xs text-gray-400">我的预测</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-white">
                  {prediction.homeScore}:{prediction.awayScore}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  prediction.isCorrect === true ? 'bg-green-900/50 text-green-400' :
                  prediction.isCorrect === false ? 'bg-red-900/50 text-red-400' :
                  'bg-[#d4af37]/20 text-[#d4af37]'
                }`}>
                  {prediction.isCorrect === true ? '✓ 命中' :
                   prediction.isCorrect === false ? '✗ 未中' :
                   '待开赛'}
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 flex-wrap">
              <span>{prediction.result}</span>
              <span>·</span>
              <span>{prediction.totalGoals}</span>
              {prediction.letResult && (
                <>
                  <span>·</span>
                  <span>{prediction.letResult}</span>
                </>
              )}
              <span>·</span>
              <span>
                {prediction.halfTime === '主-主' ? '胜胜' :
                 prediction.halfTime === '主-平' ? '胜平' :
                 prediction.halfTime === '主-客' ? '胜负' :
                 prediction.halfTime === '平-主' ? '平胜' :
                 prediction.halfTime === '平-平' ? '平平' :
                 prediction.halfTime === '平-客' ? '平负' :
                 prediction.halfTime === '客-主' ? '负胜' :
                 prediction.halfTime === '客-平' ? '负平' : '负负'}
              </span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
