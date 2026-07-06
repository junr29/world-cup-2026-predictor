// 球队详情页：六维数据 + 本届世界杯对阵比分（含加时/点球）
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Target, Shield, Activity, Clock, AlertCircle } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { getTeamDetail } from '../api';
import type { TeamAdvancedStats, TeamMatchInfo } from '../types';

// 六维指标定义（label 用于雷达轴显示）
const RADAR_DIMENSIONS: { key: keyof TeamAdvancedStats; label: string }[] = [
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

// 六维指标中文名 + 单位
const STAT_ROWS: { key: keyof TeamAdvancedStats; label: string; unit: string; desc: string }[] = [
  { key: 'wPPG', label: 'wPPG', unit: '%', desc: '世界排名加权后场均积分(min-max归一化)' },
  { key: 'possessionRate', label: '控球率', unit: '%', desc: '球队控球时间占比（来源：ESPN真实统计）' },
  { key: 'shotOnTargetRate', label: '射正率', unit: '%', desc: '射正门框占总射门的比例' },
  { key: 'conversionRate', label: '转化率', unit: '%', desc: '进球占射正门框次数的比例' },
  { key: 'saveRate', label: '门将扑救率', unit: '%', desc: '扑救成功占总扑救次数的比例' },
  { key: 'last15MinGoalRate', label: '末15分钟进球占比', unit: '%', desc: '最后15分钟进球占单场进球的比率' }
];

export default function TeamDetail() {
  const { teamName } = useParams<{ teamName: string }>();
  const navigate = useNavigate();
  const [stats, setStats] = useState<TeamAdvancedStats | null>(null);
  const [matches, setMatches] = useState<TeamMatchInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!teamName) return;
    const name = decodeURIComponent(teamName);
    setLoading(true);
    setNotFound(false);
    getTeamDetail(name)
      .then((data) => {
        setStats(data.stats);
        setMatches(data.matches);
        if (!data.stats && data.matches.length === 0) {
          setNotFound(true);
        }
      })
      .catch((err) => {
        console.error('加载球队详情失败:', err);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [teamName]);

  // 构造雷达图数据
  const radarData = stats
    ? RADAR_DIMENSIONS.map(d => ({
        dimension: d.label,
        value: Math.round((stats[d.key] as number) * 10) / 10
      }))
    : [];

  // 计算单场比赛结果标签
  const getResultLabel = (m: TeamMatchInfo): { text: string; color: string } => {
    if (m.status !== 'finished') {
      return { text: '待开赛', color: 'text-gray-500' };
    }
    const myScore = m.homeScore; // 占位，下面按 isHome 取
    const myReg = m.isHome ? m.homeScore : m.awayScore;
    const oppReg = m.isHome ? m.awayScore : m.homeScore;
    const regDiff = myReg - oppReg;

    // 加时/点球只对淘汰赛平局有意义
    const hasET = m.extraTimeHome !== null && m.extraTimeAway !== null;
    const hasPen = m.penaltyHome !== null && m.penaltyAway !== null;

    if (regDiff !== 0) {
      return regDiff > 0
        ? { text: '胜', color: 'text-green-400' }
        : { text: '负', color: 'text-red-400' };
    }
    // 常规时间平局
    if (hasET) {
      const myET = m.isHome ? (m.extraTimeHome as number) : (m.extraTimeAway as number);
      const oppET = m.isHome ? (m.extraTimeAway as number) : (m.extraTimeHome as number);
      const etDiff = myET - oppET;
      if (etDiff !== 0) {
        return etDiff > 0
          ? { text: '胜(加时)', color: 'text-green-400' }
          : { text: '负(加时)', color: 'text-red-400' };
      }
      if (hasPen) {
        const myPen = m.isHome ? (m.penaltyHome as number) : (m.penaltyAway as number);
        const oppPen = m.isHome ? (m.penaltyAway as number) : (m.penaltyHome as number);
        return myPen > oppPen
          ? { text: '胜(点球)', color: 'text-green-400' }
          : { text: '负(点球)', color: 'text-red-400' };
      }
    }
    // 小组赛平局
    return { text: '平', color: 'text-gray-300' };
  };

  const formatMatchDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0d1f0d] flex items-center justify-center">
        <div className="animate-pulse text-[#d4af37]">加载中...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0d1f0d] flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-[#d4af37]" />
        <div className="text-gray-300">未找到球队：{teamName ? decodeURIComponent(teamName) : ''}</div>
        <Link to="/analysis" className="text-[#d4af37] hover:underline">返回数据中心</Link>
      </div>
    );
  }

  const teamDisplay = teamName ? decodeURIComponent(teamName) : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0d1f0d]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* 顶部导航 */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-[#d4af37] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">返回</span>
        </button>

        {/* 球队头部信息 */}
        <div className="mb-8 rounded-xl bg-gradient-to-r from-[#1a472a]/60 to-[#2d5a3f]/60 border border-[#d4af37]/40 p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-[#d4af37]" />
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">{teamDisplay}</h1>
                <div className="flex items-center gap-3 mt-1 text-xs">
                  <span className="text-gray-400">本届参赛 {matches.length} 场</span>
                  {stats && (
                    <span className={`px-2 py-0.5 rounded-full border ${
                      stats.isEliminated
                        ? 'bg-red-900/30 border-red-500/40 text-red-300'
                        : 'bg-green-900/30 border-green-500/40 text-green-300'
                    }`}>
                      {stats.isEliminated ? '已淘汰' : '存活中'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {stats && (
              <div className="text-right">
                <div className="text-xs text-gray-500">wPPG（归一化）</div>
                <div className="text-3xl font-bold text-[#d4af37]">{stats.wPPG.toFixed(1)}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">原始值 {stats.wPPGRaw.toFixed(3)}</div>
              </div>
            )}
          </div>
        </div>

        {/* 六维雷达图 + 指标说明 */}
        {stats && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 雷达图 */}
            <div className="rounded-xl bg-[#1a472a]/20 border border-[#d4af37]/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-[#d4af37]" />
                <h2 className="text-sm font-bold text-white">六维数据雷达图</h2>
              </div>
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                    <PolarGrid stroke="#1a472a" strokeOpacity={0.6} />
                    <PolarAngleAxis
                      dataKey="dimension"
                      tick={(props: any) => renderRadarTick({ ...props, fill: '#d4af37', fontSize: 10 })}
                    />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 8 }} />
                    <Radar name={teamDisplay} dataKey="value" stroke="#d4af37" fill="#d4af37" fillOpacity={0.45} strokeWidth={2} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a472a', border: '1px solid #d4af37', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(v: number) => [`${v.toFixed(1)}%`, teamDisplay]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 指标列表 */}
            <div className="rounded-xl bg-[#1a472a]/20 border border-[#d4af37]/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-[#d4af37]" />
                <h2 className="text-sm font-bold text-white">六维指标详情</h2>
              </div>
              <div className="space-y-2.5">
                {STAT_ROWS.map(row => {
                  const value = stats[row.key] as number;
                  return (
                    <div key={row.key} className="flex items-center justify-between gap-3 py-2 border-b border-[#d4af37]/10 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white">{row.label}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5 truncate">{row.desc}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-24 h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#d4af37] to-[#b8941f] rounded-full"
                            style={{ width: `${Math.min(value, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-[#d4af37] w-16 text-right">{value.toFixed(1)}{row.unit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 对阵记录 */}
        <div className="rounded-xl bg-[#1a472a]/20 border border-[#d4af37]/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-[#d4af37]" />
            <h2 className="text-sm font-bold text-white">本届世界杯对阵记录</h2>
            <span className="text-xs text-gray-500 ml-2">共 {matches.length} 场</span>
          </div>

          {matches.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">暂无对阵记录</div>
          ) : (
            <div className="space-y-3">
              {matches.map((m) => {
                const result = getResultLabel(m);
                const isFinished = m.status === 'finished';
                const hasET = isFinished && m.extraTimeHome !== null && m.extraTimeAway !== null;
                const hasPen = isFinished && m.penaltyHome !== null && m.penaltyAway !== null;
                return (
                  <div key={m.matchId} className="rounded-lg bg-[#1a1a1a]/60 border border-[#d4af37]/10 p-3 hover:border-[#d4af37]/30 transition-colors">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-400">{formatMatchDate(m.matchDate)}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          m.stageType === 'knockout'
                            ? 'bg-[#d4af37]/20 text-[#d4af37]'
                            : 'bg-[#1a472a] text-gray-300'
                        }`}>{m.stage}</span>
                      </div>
                      <span className={`text-sm font-bold ${result.color}`}>{result.text}</span>
                    </div>

                    {/* 比分展示 */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/match/${m.matchId}`}
                        className="flex items-center gap-2 rounded bg-[#1a472a]/40 px-3 py-2 hover:bg-[#1a472a]/70 transition-colors"
                      >
                        <span className={`text-sm ${m.isHome ? 'font-bold text-[#d4af37]' : 'text-gray-300'}`}>
                          {m.homeTeam}
                        </span>
                        {/* 常规时间比分 / 待开赛 */}
                        {isFinished ? (
                          <span className="px-2 py-0.5 bg-gray-800/80 rounded text-white text-sm font-mono">
                            {m.homeScore} : {m.awayScore}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-800/40 rounded text-gray-500 text-xs">
                            待开赛
                          </span>
                        )}
                        <span className={`text-sm ${!m.isHome ? 'font-bold text-[#d4af37]' : 'text-gray-300'}`}>
                          {m.awayTeam}
                        </span>
                      </Link>

                      {/* 加时赛比分 */}
                      {hasET && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded bg-orange-900/30 border border-orange-500/30">
                          <span className="text-[10px] text-orange-300">加时</span>
                          <span className="text-orange-200 text-sm font-mono">
                            {m.extraTimeHome} : {m.extraTimeAway}
                          </span>
                        </div>
                      )}

                      {/* 点球大战比分 */}
                      {hasPen && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-900/30 border border-red-500/30">
                          <span className="text-[10px] text-red-300">点球</span>
                          <span className="text-red-200 text-sm font-mono">
                            {m.penaltyHome} : {m.penaltyAway}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 单场六维数据 */}
                    {m.stats && (
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-1.5 text-[10px]">
                        <div className="px-1.5 py-0.5 rounded bg-gray-800/40">
                          <span className="text-gray-500">控球率</span>
                          <span className="ml-1 text-gray-200">{m.stats.possessionRate.toFixed(1)}%</span>
                        </div>
                        <div className="px-1.5 py-0.5 rounded bg-gray-800/40">
                          <span className="text-gray-500">射正率</span>
                          <span className="ml-1 text-gray-200">{m.stats.shotOnTargetRate.toFixed(1)}%</span>
                        </div>
                        <div className="px-1.5 py-0.5 rounded bg-gray-800/40">
                          <span className="text-gray-500">转化率</span>
                          <span className="ml-1 text-gray-200">{m.stats.conversionRate.toFixed(1)}%</span>
                        </div>
                        <div className="px-1.5 py-0.5 rounded bg-gray-800/40">
                          <span className="text-gray-500">扑救率</span>
                          <span className="ml-1 text-gray-200">{m.stats.saveRate.toFixed(1)}%</span>
                        </div>
                        <div className="px-1.5 py-0.5 rounded bg-gray-800/40">
                          <span className="text-gray-500">末15min进球占比</span>
                          <span className="ml-1 text-gray-200">{m.stats.last15MinGoalRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
