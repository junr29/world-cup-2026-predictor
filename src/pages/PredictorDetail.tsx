// 预测员详情页面 - 显示该预测员对每场比赛的预测结果
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, ArrowLeft, CheckCircle, XCircle, Clock, Calendar, Target, TrendingUp, Medal, Award, AlertCircle } from 'lucide-react';
import api from '../api';

interface PredictorMatch {
  id: string;
  matchId: string;
  source: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  stage: string;
  status: 'upcoming' | 'live' | 'finished';
  homeScore: number;
  awayScore: number;
  result: string;
  secondHomeScore: number;
  secondAwayScore: number;
  secondResult: string;
  totalGoals: string;
  confidence: number;
  halfFullTime?: string;
  secondHalfFullTime?: string;
  actualHomeScore: number | null;
  actualAwayScore: number | null;
  isCorrect: boolean | null;
  hitType: 'first' | 'second' | 'both' | 'none' | null;
  actualHalfFullTime: string | null;
  hftIsCorrect: boolean | null;
  hftHitType: 'first' | 'second' | 'both' | 'none' | null;
  scrapedAt: string;
}

export default function PredictorDetail() {
  const { sourceName } = useParams<{ sourceName: string }>();
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState<PredictorMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'score' | 'halfFullTime'>('score');

  const decodedSourceName = decodeURIComponent(sourceName || '');

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const view = params.get('view');
    if (view === 'halfFullTime') {
      setActiveTab('halfFullTime');
    } else {
      setActiveTab('score');
    }
    loadPredictions();
  }, [decodedSourceName]);

  const loadPredictions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/predictions/source/${encodeURIComponent(decodedSourceName)}`);
      setPredictions(response.data.predictions || []);
    } catch (err) {
      console.error('加载预测记录失败:', err);
      setError('加载失败，请稍后重试');
    }
    setLoading(false);
  };

  // 计算统计数据 - 根据当前视图
  const currentStats = activeTab === 'score'
    ? {
        total: predictions.length,
        finished: predictions.filter(p => p.status === 'finished').length,
        correct: predictions.filter(p => p.isCorrect === true).length,
        firstCorrect: predictions.filter(p => p.hitType === 'first' || p.hitType === 'both').length,
        secondCorrect: predictions.filter(p => p.hitType === 'second' || p.hitType === 'both').length,
        accuracy: predictions.filter(p => p.status === 'finished').length > 0
          ? (predictions.filter(p => p.isCorrect === true).length / predictions.filter(p => p.status === 'finished').length) * 100
          : 0,
        avgConfidence: predictions.length > 0
          ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
          : 0
      }
    : {
        total: predictions.filter(p => p.halfFullTime).length,
        finished: predictions.filter(p => p.status === 'finished' && p.halfFullTime).length,
        correct: predictions.filter(p => p.hftIsCorrect === true).length,
        firstCorrect: predictions.filter(p => p.hftHitType === 'first' || p.hftHitType === 'both').length,
        secondCorrect: predictions.filter(p => p.hftHitType === 'second' || p.hftHitType === 'both').length,
        accuracy: predictions.filter(p => p.status === 'finished' && p.halfFullTime).length > 0
          ? (predictions.filter(p => p.hftIsCorrect === true).length / predictions.filter(p => p.status === 'finished' && p.halfFullTime).length) * 100
          : 0,
        avgConfidence: predictions.length > 0
          ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
          : 0
      };

  const stats = currentStats;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getResultColor = (result: string) => {
    if (result === '主胜') return 'text-green-400';
    if (result === '平局') return 'text-yellow-400';
    if (result === '客胜') return 'text-red-400';
    return 'text-gray-400';
  };

  const getAccuracyBadge = () => {
    if (stats.accuracy >= 70) return { icon: <Trophy className="w-4 h-4" />, color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
    if (stats.accuracy >= 50) return { icon: <Medal className="w-4 h-4" />, color: 'text-green-400', bg: 'bg-green-400/10' };
    if (stats.accuracy >= 30) return { icon: <Award className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-400/10' };
    return { icon: <Target className="w-4 h-4" />, color: 'text-gray-400', bg: 'bg-gray-400/10' };
  };

  const badge = getAccuracyBadge();

  const formatHFT = (hft?: string) => {
    if (!hft) return '-';
    return hft === '主-主' ? '胜胜' :
           hft === '主-平' ? '胜平' :
           hft === '主-客' ? '胜负' :
           hft === '平-主' ? '平胜' :
           hft === '平-平' ? '平平' :
           hft === '平-客' ? '平负' :
           hft === '客-主' ? '负胜' :
           hft === '客-平' ? '负平' : '负负';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f1922] to-[#1a472a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37] mx-auto mb-4"></div>
          <p className="text-gray-400">加载预测记录...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f1922] to-[#1a472a] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/predictions')}
            className="px-4 py-2 bg-[#d4af37]/20 border border-[#d4af37]/40 rounded-lg text-[#d4af37] hover:bg-[#d4af37]/30 transition"
          >
            返回排行榜
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1922] to-[#1a472a] p-4 md:p-6">
      {/* 头部 */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/predictions')}
          className="flex items-center gap-2 text-gray-400 hover:text-[#d4af37] transition mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回排行榜</span>
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{decodedSourceName}</h1>
            <p className="text-sm text-gray-500">预测记录详情</p>
          </div>

          <div className={`px-4 py-2 rounded-lg ${badge.bg} ${badge.color} flex items-center gap-2`}>
            {badge.icon}
            <span className="text-lg font-bold">{Math.round(stats.accuracy)}%</span>
          </div>
        </div>
      </div>

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
          比分预测
        </button>
        <button
          onClick={() => setActiveTab('halfFullTime')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'halfFullTime'
              ? 'bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#d4af37]'
              : 'bg-[#1a472a]/20 border border-gray-700/30 text-gray-400 hover:text-white'
          }`}
        >
          半全场预测
        </button>
      </div>

      {/* 信心值说明 */}
      {activeTab === 'score' && (<div className="mb-6 rounded-xl bg-[#1a472a]/30 border border-[#d4af37]/20 p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-[#d4af37] font-bold text-sm">?</span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-white mb-2">信心值说明</h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-3">
              <span className="text-green-400 font-medium">信心值</span> 表示预测员对其首选预测结果的信心程度。
              数值越高（如 70%-90%），表示预测员对该结果越有把握；数值较低（如 50%-70%），表示结果存在较大不确定性。
              此数值来源于各预测源提供的原始数据，仅供参考。
            </p>

            <div className="p-3 bg-[#d4af37]/5 rounded-lg border border-[#d4af37]/20 mb-3">
              <div className="text-xs text-[#d4af37] font-medium mb-2">常见疑问：为什么信心度不足50%还能成为预测结果？</div>
              <p className="text-xs text-gray-400 leading-relaxed">
                足球比赛有三种可能结果（胜/平/负），每种结果本身的概率就低于50%。
                例如：预测主胜信心45%，平局30%，客胜25%——虽然主胜信心不到50%，
                但它仍然是三种结果中概率最高的，因此成为首选预测。
                <span className="text-white font-medium">信心度反映的是"相对优势"，而非"绝对把握"。</span>
                信心度越低，说明比赛越胶着、越难以预测。
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-green-400"></span>
                <span className="text-xs text-gray-500">≥70% 高信心</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                <span className="text-xs text-gray-500">50%-70% 中等信心</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-400"></span>
                <span className="text-xs text-gray-500">&lt;50% 低信心</span>
              </div>
            </div>
          </div>
        </div>
      </div>)}

      {/* 半全场说明 */}
      {activeTab === 'halfFullTime' && (
        <div className="mb-6 rounded-xl bg-[#1a472a]/30 border border-purple-500/20 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-purple-400 font-bold text-sm">?</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white mb-2">半全场玩法说明</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">
                半全场玩法需要同时猜对<span className="text-purple-400 font-medium">上半场结果</span>和<span className="text-purple-400 font-medium">全场结果</span>。
                例如"胜胜"表示主队上半场领先且全场获胜，"平负"表示上半场平局但客队最终获胜。
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  <span className="text-gray-500">胜胜/胜平/胜负</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                  <span className="text-gray-500">平胜/平平/平负</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400"></span>
                  <span className="text-gray-500">负胜/负平/负负</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl bg-[#1a472a]/30 border border-[#d4af37]/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-[#d4af37]" />
            <span className="text-xs text-gray-400">总预测</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-gray-500">场比赛</div>
        </div>

        <div className="rounded-xl bg-[#1a472a]/30 border border-[#d4af37]/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">已完赛</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.finished}</div>
          <div className="text-xs text-gray-500">场比赛</div>
        </div>

        <div className="rounded-xl bg-[#1a472a]/30 border border-[#d4af37]/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">命中</span>
          </div>
          <div className="text-xl font-bold text-green-400">{stats.correct}</div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <span className="text-green-400">{stats.firstCorrect}首</span>
            <span className="text-gray-600">+</span>
            <span className="text-blue-400">{stats.secondCorrect}次</span>
          </div>
        </div>

        <div className="rounded-xl bg-[#1a472a]/30 border border-[#d4af37]/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400">平均信心</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">{Math.round(stats.avgConfidence)}%</div>
          <div className="text-xs text-gray-500">置信度</div>
        </div>
      </div>

      {/* 比分预测记录列表 */}
      {activeTab === 'score' && (
        predictions.length === 0 ? (
          <div className="rounded-xl bg-[#1a472a]/30 border border-[#d4af37]/20 p-12 text-center">
            <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">该预测员暂无预测记录</p>
          </div>
        ) : (
          <div className="rounded-xl bg-[#1a472a]/30 border border-[#d4af37]/20 overflow-hidden">
            {/* 表头 */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-[#d4af37]/10 border-b border-[#d4af37]/20 text-xs font-medium text-gray-400">
              <div className="col-span-3">比赛</div>
              <div className="col-span-2 text-center">赛况</div>
              <div className="col-span-2 text-center">预测比分</div>
              <div className="col-span-2 text-center">备选比分</div>
              <div className="col-span-2 text-center">赛果</div>
              <div className="col-span-1 text-center">命中</div>
            </div>

            {/* 记录列表 */}
            <div className="divide-y divide-[#d4af37]/10">
              {predictions.map((pred) => (
                <div
                  key={pred.id}
                  className={`grid grid-cols-12 gap-2 px-4 py-4 items-center ${
                    pred.status === 'finished'
                      ? pred.isCorrect
                        ? 'bg-green-400/5'
                        : 'bg-red-400/5'
                      : 'hover:bg-[#1a472a]/20'
                  }`}
                >
                  {/* 比赛 */}
                  <div className="col-span-3">
                    <div className="text-sm font-medium text-white">
                      {pred.homeTeam} vs {pred.awayTeam}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(pred.matchDate)}</span>
                      <span className="text-gray-600">•</span>
                      <span>{pred.stage}</span>
                    </div>
                  </div>

                  {/* 赛况 */}
                  <div className="col-span-2 text-center">
                    {pred.status === 'finished' ? (
                      <div className="text-lg font-bold text-white">
                        <span className={pred.actualHomeScore > pred.actualAwayScore ? 'text-green-400' : pred.actualHomeScore < pred.actualAwayScore ? 'text-red-400' : 'text-yellow-400'}>
                          {pred.actualHomeScore}
                        </span>
                        <span className="text-gray-500 mx-1">-</span>
                        <span className={pred.actualHomeScore < pred.actualAwayScore ? 'text-green-400' : pred.actualHomeScore > pred.actualAwayScore ? 'text-red-400' : 'text-yellow-400'}>
                          {pred.actualAwayScore}
                        </span>
                      </div>
                    ) : pred.status === 'live' ? (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">进行中</span>
                    ) : (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">未开始</span>
                    )}
                  </div>

                  {/* 预测比分 */}
                  <div className={`col-span-2 text-center ${
                    pred.status === 'finished' && (pred.hitType === 'first' || pred.hitType === 'both')
                      ? 'bg-green-500/10 rounded-lg py-2 -mx-2'
                      : ''
                  }`}>
                    <div className={`text-lg font-bold ${
                      pred.status === 'finished' && (pred.hitType === 'first' || pred.hitType === 'both')
                        ? 'text-green-400'
                        : pred.status === 'finished' && pred.hitType === 'none'
                          ? 'text-red-400/60'
                          : getResultColor(pred.result)
                    }`}>
                      <span>{pred.homeScore}</span>
                      <span className="text-gray-500 mx-1">-</span>
                      <span>{pred.awayScore}</span>
                    </div>
                    <div className={`text-xs mt-1 flex items-center justify-center gap-1 ${
                      pred.status === 'finished' && (pred.hitType === 'first' || pred.hitType === 'both')
                        ? 'text-green-400'
                        : pred.status === 'finished' && pred.hitType === 'none'
                          ? 'text-red-400/60'
                          : getResultColor(pred.result)
                    }`}>
                      <span>{pred.result}</span>
                      {pred.status === 'finished' && (pred.hitType === 'first' || pred.hitType === 'both') && (
                        <span className="flex items-center gap-0.5">
                          <CheckCircle className="w-3 h-3" />
                          <span>命中</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 备选比分 */}
                  <div className={`col-span-2 text-center ${
                    pred.status === 'finished' && (pred.hitType === 'second' || pred.hitType === 'both')
                      ? 'bg-green-500/10 rounded-lg py-2 -mx-2'
                      : ''
                  }`}>
                    <div className={`text-lg font-bold ${
                      pred.status === 'finished' && (pred.hitType === 'second' || pred.hitType === 'both')
                        ? 'text-green-400'
                        : pred.status === 'finished' && pred.hitType === 'none'
                          ? 'text-red-400/60'
                          : 'text-gray-400'
                    }`}>
                      <span>{pred.secondHomeScore}</span>
                      <span className="text-gray-500 mx-1">-</span>
                      <span>{pred.secondAwayScore}</span>
                    </div>
                    <div className={`text-xs mt-1 flex items-center justify-center gap-1 ${
                      pred.status === 'finished' && (pred.hitType === 'second' || pred.hitType === 'both')
                        ? 'text-green-400'
                        : pred.status === 'finished' && pred.hitType === 'none'
                          ? 'text-red-400/60'
                          : 'text-gray-500'
                    }`}>
                      <span>{pred.secondResult}</span>
                      {pred.status === 'finished' && (pred.hitType === 'second' || pred.hitType === 'both') && (
                        <span className="flex items-center gap-0.5">
                          <CheckCircle className="w-3 h-3" />
                          <span>命中</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 赛果预测 */}
                  <div className="col-span-2 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        pred.result === '主胜' ? 'bg-green-500/20 text-green-400' :
                        pred.result === '平局' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {pred.result}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-medium ${
                          pred.confidence >= 0.7 ? 'text-green-400' :
                          pred.confidence >= 0.5 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>信心 {(pred.confidence * 100).toFixed(0)}%</span>
                        <span className="text-xs text-gray-600" title="预测员对该结果的信心程度，越高表示越确定">?</span>
                      </div>
                    </div>
                  </div>

                  {/* 命中 */}
                  <div className="col-span-1 text-center">
                    {pred.status === 'finished' ? (
                      pred.hitType === 'none' ? (
                        <XCircle className="w-5 h-5 text-red-400" />
                      ) : pred.hitType === 'first' ? (
                        <div className="flex flex-col items-center">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <span className="text-xs text-green-400">首</span>
                        </div>
                      ) : pred.hitType === 'second' ? (
                        <div className="flex flex-col items-center">
                          <CheckCircle className="w-5 h-5 text-blue-400" />
                          <span className="text-xs text-blue-400">次</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <CheckCircle className="w-5 h-5 text-yellow-400" />
                          <span className="text-xs text-yellow-400">双</span>
                        </div>
                      )
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* 半全场预测记录列表 */}
      {activeTab === 'halfFullTime' && (
        predictions.filter(p => p.halfFullTime).length === 0 ? (
          <div className="rounded-xl bg-[#1a472a]/30 border border-purple-500/20 p-12 text-center">
            <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">该预测员暂无半全场预测记录</p>
          </div>
        ) : (
          <div className="rounded-xl bg-[#1a472a]/30 border border-purple-500/20 overflow-hidden">
            {/* 表头 */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-purple-500/10 border-b border-purple-500/20 text-xs font-medium text-gray-400">
              <div className="col-span-3">比赛</div>
              <div className="col-span-2 text-center">实际赛果</div>
              <div className="col-span-2 text-center">首选半全场</div>
              <div className="col-span-2 text-center">次选半全场</div>
              <div className="col-span-2 text-center">实际比分</div>
              <div className="col-span-1 text-center">命中</div>
            </div>

            {/* 记录列表 */}
            <div className="divide-y divide-purple-500/10">
              {predictions.filter(p => p.halfFullTime).map((pred) => (
                <div
                  key={pred.id}
                  className={`grid grid-cols-12 gap-2 px-4 py-4 items-center ${
                    pred.status === 'finished'
                      ? pred.hftIsCorrect
                        ? 'bg-green-400/5'
                        : 'bg-red-400/5'
                      : 'hover:bg-[#1a472a]/20'
                  }`}
                >
                  {/* 比赛 */}
                  <div className="col-span-3">
                    <div className="text-sm font-medium text-white">
                      {pred.homeTeam} vs {pred.awayTeam}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(pred.matchDate)}</span>
                      <span className="text-gray-600">•</span>
                      <span>{pred.stage}</span>
                    </div>
                  </div>

                  {/* 实际半全场赛果 */}
                  <div className="col-span-2 text-center">
                    {pred.status === 'finished' ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className={`px-3 py-1 rounded text-sm font-bold ${
                          pred.actualHalfFullTime?.endsWith('主') ? 'bg-green-500/20 text-green-400' :
                          pred.actualHalfFullTime?.endsWith('平') ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {formatHFT(pred.actualHalfFullTime || '')}
                        </span>
                        <span className="text-[10px] text-gray-500">实际结果</span>
                      </div>
                    ) : pred.status === 'live' ? (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">进行中</span>
                    ) : (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">未开始</span>
                    )}
                  </div>

                  {/* 首选半全场 */}
                  <div className={`col-span-2 text-center ${
                    pred.status === 'finished' && (pred.hftHitType === 'first' || pred.hftHitType === 'both')
                      ? 'bg-green-500/10 rounded-lg py-2 -mx-2'
                      : ''
                  }`}>
                    <div className={`text-lg font-bold ${
                      pred.status === 'finished' && (pred.hftHitType === 'first' || pred.hftHitType === 'both')
                        ? 'text-green-400'
                        : pred.status === 'finished' && pred.hftHitType === 'none'
                          ? 'text-red-400/60'
                          : 'text-purple-300'
                    }`}>
                      {formatHFT(pred.halfFullTime)}
                    </div>
                    <div className={`text-xs mt-1 flex items-center justify-center gap-1 ${
                      pred.status === 'finished' && (pred.hftHitType === 'first' || pred.hftHitType === 'both')
                        ? 'text-green-400'
                        : pred.status === 'finished' && pred.hftHitType === 'none'
                          ? 'text-red-400/60'
                          : 'text-purple-400'
                    }`}>
                      <span>首选</span>
                      {pred.status === 'finished' && (pred.hftHitType === 'first' || pred.hftHitType === 'both') && (
                        <span className="flex items-center gap-0.5">
                          <CheckCircle className="w-3 h-3" />
                          <span>命中</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 次选半全场 */}
                  <div className={`col-span-2 text-center ${
                    pred.status === 'finished' && (pred.hftHitType === 'second' || pred.hftHitType === 'both')
                      ? 'bg-green-500/10 rounded-lg py-2 -mx-2'
                      : ''
                  }`}>
                    <div className={`text-lg font-bold ${
                      pred.status === 'finished' && (pred.hftHitType === 'second' || pred.hftHitType === 'both')
                        ? 'text-green-400'
                        : pred.status === 'finished' && pred.hftHitType === 'none'
                          ? 'text-red-400/60'
                          : 'text-gray-400'
                    }`}>
                      {formatHFT(pred.secondHalfFullTime)}
                    </div>
                    <div className={`text-xs mt-1 flex items-center justify-center gap-1 ${
                      pred.status === 'finished' && (pred.hftHitType === 'second' || pred.hftHitType === 'both')
                        ? 'text-green-400'
                        : pred.status === 'finished' && pred.hftHitType === 'none'
                          ? 'text-red-400/60'
                          : 'text-gray-500'
                    }`}>
                      <span>次选</span>
                      {pred.status === 'finished' && (pred.hftHitType === 'second' || pred.hftHitType === 'both') && (
                        <span className="flex items-center gap-0.5">
                          <CheckCircle className="w-3 h-3" />
                          <span>命中</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 实际比分 */}
                  <div className="col-span-2 text-center">
                    {pred.status === 'finished' ? (
                      <div className="text-base font-bold text-white">
                        <span className={pred.actualHomeScore > pred.actualAwayScore ? 'text-green-400' : pred.actualHomeScore < pred.actualAwayScore ? 'text-red-400' : 'text-yellow-400'}>
                          {pred.actualHomeScore}
                        </span>
                        <span className="text-gray-500 mx-1">-</span>
                        <span className={pred.actualHomeScore < pred.actualAwayScore ? 'text-green-400' : pred.actualHomeScore > pred.actualAwayScore ? 'text-red-400' : 'text-yellow-400'}>
                          {pred.actualAwayScore}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">待比赛</span>
                    )}
                  </div>

                  {/* 命中 */}
                  <div className="col-span-1 text-center">
                    {pred.status === 'finished' ? (
                      pred.hftHitType === 'none' ? (
                        <XCircle className="w-5 h-5 text-red-400" />
                      ) : pred.hftHitType === 'first' ? (
                        <div className="flex flex-col items-center">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <span className="text-xs text-green-400">首</span>
                        </div>
                      ) : pred.hftHitType === 'second' ? (
                        <div className="flex flex-col items-center">
                          <CheckCircle className="w-5 h-5 text-blue-400" />
                          <span className="text-xs text-blue-400">次</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <CheckCircle className="w-5 h-5 text-yellow-400" />
                          <span className="text-xs text-yellow-400">双</span>
                        </div>
                      )
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}