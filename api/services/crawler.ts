import axios from 'axios';
import * as cheerio from 'cheerio';
import db from '../database.js';

export interface CrawledMatchResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  matchDate: string;
  stage: string;
  status: 'finished' | 'live' | 'upcoming';
  source: string;
}

export interface SourceCrawlResult {
  source: string;
  url: string;
  success: boolean;
  matchCount: number;
  error?: string;
  matches: CrawledMatchResult[];
}

export interface VerifiedMatchResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  stage: string;
  matchDate: string;
  sources: string[];
  verificationLevel: 'single' | 'multi';
}

export interface CrawlResult {
  success: boolean;
  updatedCount: number;
  message: string;
  updatedMatches: Array<{
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    stage: string;
    sources: string[];
    verificationLevel: string;
  }>;
  sourceResults: SourceCrawlResult[];
  totalCrawled: number;
  verifiedCount: number;
  timestamp: string;
}

const DATA_SOURCES = [
  {
    name: '新浪体育',
    url: 'https://sports.sina.com.cn/g/worldcup/',
    type: 'sina' as const,
  },
  {
    name: '虎扑足球',
    url: 'https://m.hupu.com/soccer/worldcup',
    type: 'hupu' as const,
  },
  {
    name: 'FIFA官网',
    url: 'https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/matches',
    type: 'fifa' as const,
  },
  {
    name: 'Sports Mole',
    url: 'https://www.sportsmole.co.uk/world-cup/results.html',
    type: 'sportsmole' as const,
  },
  {
    name: 'ESPN',
    url: 'https://www.espn.com/soccer/scoreboard/_/league/fifa.world',
    type: 'espn' as const,
  },
];

const TEAM_NAME_MAP: Record<string, string> = {
  'Mexico': '墨西哥', 'South Africa': '南非', 'South Korea': '韩国', 'Korea Republic': '韩国',
  'Korea': '韩国',
  'Czech Republic': '捷克', 'Canada': '加拿大', 'Bosnia': '波黑', 'Bosnia and Herzegovina': '波黑',
  'Qatar': '卡塔尔', 'Switzerland': '瑞士', 'Brazil': '巴西', 'Morocco': '摩洛哥',
  'Haiti': '海地', 'Scotland': '苏格兰', 'USA': '美国', 'United States': '美国',
  'United States of America': '美国',
  'Paraguay': '巴拉圭', 'Australia': '澳大利亚', 'Turkey': '土耳其', 'Germany': '德国',
  'Curaçao': '库拉索', 'Curacao': '库拉索', 'Ivory Coast': '科特迪瓦', "Côte d'Ivoire": '科特迪瓦',
  "Cote d'Ivoire": '科特迪瓦',
  'Ecuador': '厄瓜多尔', 'Netherlands': '荷兰', 'Japan': '日本', 'Sweden': '瑞典',
  'Tunisia': '突尼斯', 'Belgium': '比利时', 'Egypt': '埃及', 'Iran': '伊朗',
  'New Zealand': '新西兰', 'Spain': '西班牙', 'Cape Verde': '佛得角', 'Saudi Arabia': '沙特',
  'Saudi Arabia (KSA)': '沙特', 'Uruguay': '乌拉圭', 'France': '法国', 'Senegal': '塞内加尔',
  'Iraq': '伊拉克', 'Norway': '挪威', 'Argentina': '阿根廷', 'Algeria': '阿尔及利亚',
  'Austria': '奥地利', 'Jordan': '约旦', 'Portugal': '葡萄牙', 'DR Congo': '民主刚果',
  'DR Congo (Congo DR)': '民主刚果', 'Congo DR': '民主刚果', 'Uzbekistan': '乌兹别克斯坦',
  'Colombia': '哥伦比亚', 'England': '英格兰', 'Croatia': '克罗地亚', 'Ghana': '加纳',
  'Panama': '巴拿马', 'Costa Rica': '哥斯达黎加', 'Denmark': '丹麦', 'Poland': '波兰',
  'Serbia': '塞尔维亚', 'Cameroon': '喀麦隆', 'Nigeria': '尼日利亚', 'Peru': '秘鲁',
  'Chile': '智利', 'Wales': '威尔士',
  // 新浪体育中文别名
  '刚果(金)': '民主刚果', '乌兹别克': '乌兹别克斯坦',
};

const zhTeamNames = new Set(Object.values(TEAM_NAME_MAP));

function normalizeTeamName(name: string): string {
  if (!name) return '';
  let trimmed = name.trim().replace(/队$/, '').replace(/国家?队$/, '').trim();
  
  if (TEAM_NAME_MAP[trimmed]) return TEAM_NAME_MAP[trimmed];
  
  if (zhTeamNames.has(trimmed)) return trimmed;
  
  for (const [en, zh] of Object.entries(TEAM_NAME_MAP)) {
    if (trimmed.toLowerCase() === en.toLowerCase()) return zh;
  }
  
  return trimmed;
}

const isChineseSource = (name: string): boolean => {
  const chineseSources = ['新浪体育', '虎扑足球'];
  return chineseSources.includes(name);
};

function parseSinaMatches($: cheerio.CheerioAPI, sourceName: string): CrawledMatchResult[] {
  const matches: CrawledMatchResult[] = [];
  const foundScores = new Set<string>();

  $('.match-card').each((_, card) => {
    const $card = $(card);
    const statusText = $card.find('.match-status').text().trim();
    if (!statusText.includes('已结束') && !statusText.includes('完场') && !statusText.includes('结束')) return;

    const teams = $card.find('.match-team');
    if (teams.length < 2) return;

    const homeTeamName = normalizeTeamName(teams.eq(0).find('.match-team-name').text());
    const awayTeamName = normalizeTeamName(teams.eq(1).find('.match-team-name').text());
    const homeScore = parseInt(teams.eq(0).find('.match-team-score').text().trim());
    const awayScore = parseInt(teams.eq(1).find('.match-team-score').text().trim());

    if (homeTeamName && awayTeamName && !isNaN(homeScore) && !isNaN(awayScore) &&
        homeScore >= 0 && awayScore >= 0 && homeScore <= 20 && awayScore <= 20) {
      const key = `${homeTeamName}vs${awayTeamName}`;
      if (!foundScores.has(key)) {
        foundScores.add(key);
        matches.push({
          homeTeam: homeTeamName,
          awayTeam: awayTeamName,
          homeScore,
          awayScore,
          matchDate: new Date().toISOString(),
          stage: '',
          status: 'finished',
          source: sourceName
        });
      }
    }
  });

  return matches;
}

function parseGenericMatches($: cheerio.CheerioAPI, sourceName: string): CrawledMatchResult[] {
  const matches: CrawledMatchResult[] = [];
  const foundScores = new Set<string>();

  const allText = $('body').text();
  const teamNames = Array.from(zhTeamNames);
  const enTeamNames = Object.keys(TEAM_NAME_MAP);

  for (const team of teamNames) {
    const escapedTeam = team.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const teamPattern = teamNames.join('|');
    const patterns = [
      new RegExp(`${escapedTeam}[^0-9]{0,30}(\\d+)\\s*[-:：]\\s*(\\d+)[^0-9]{0,30}(${teamPattern})`, 'g'),
      new RegExp(`(${teamPattern})[^0-9]{0,30}(\\d+)\\s*[-:：]\\s*(\\d+)[^0-9]{0,30}${escapedTeam}`, 'g')
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(allText)) !== null) {
        const team1 = normalizeTeamName(match[1]);
        const s1 = parseInt(match[2]);
        const s2 = parseInt(match[3]);
        const team2 = normalizeTeamName(match[4] || team);

        if (team1 && team2 && team1 !== team2 &&
            !isNaN(s1) && !isNaN(s2) &&
            s1 >= 0 && s2 >= 0 && s1 <= 20 && s2 <= 20) {
          const key = [team1, team2].sort().join('vs');
          if (!foundScores.has(key) && teamNames.includes(team1) && teamNames.includes(team2)) {
            foundScores.add(key);
            matches.push({
              homeTeam: team1,
              awayTeam: team2,
              homeScore: s1,
              awayScore: s2,
              matchDate: new Date().toISOString(),
              stage: '',
              status: 'finished',
              source: sourceName
            });
          }
        }
      }
    }
  }

  for (const team of enTeamNames) {
    const escapedTeam = team.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const enPattern = enTeamNames.join('|');
    const patterns = [
      new RegExp(`\\b${escapedTeam}\\b[^0-9]{0,30}(\\d+)\\s*[-:：]\\s*(\\d+)[^0-9]{0,30}\\b(${enPattern})\\b`, 'gi'),
      new RegExp(`\\b(${enPattern})\\b[^0-9]{0,30}(\\d+)\\s*[-:：]\\s*(\\d+)[^0-9]{0,30}\\b${escapedTeam}\\b`, 'gi')
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(allText)) !== null) {
        const team1 = normalizeTeamName(match[1]);
        const s1 = parseInt(match[2]);
        const s2 = parseInt(match[3]);
        const team2 = normalizeTeamName(match[4] || team);

        if (team1 && team2 && team1 !== team2 &&
            !isNaN(s1) && !isNaN(s2) &&
            s1 >= 0 && s2 >= 0 && s1 <= 20 && s2 <= 20) {
          const key = [team1, team2].sort().join('vs');
          if (!foundScores.has(key)) {
            foundScores.add(key);
            matches.push({
              homeTeam: team1,
              awayTeam: team2,
              homeScore: s1,
              awayScore: s2,
              matchDate: new Date().toISOString(),
              stage: '',
              status: 'finished',
              source: sourceName
            });
          }
        }
      }
    }
  }

  return matches;
}

async function crawlSource(source: typeof DATA_SOURCES[0]): Promise<SourceCrawlResult> {
  try {
    const chinese = isChineseSource(source.name);
    const response = await axios.get(source.url, {
      timeout: 15000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': chinese ? 'zh-CN,zh;q=0.9,en-US,en;q=0.8' : 'en-US,en;q=0.9',
        'Referer': chinese ? 'https://www.baidu.com/' : 'https://www.google.com/',
      }
    });

    const $ = cheerio.load(response.data);
    let matches: CrawledMatchResult[];

    switch (source.type) {
      case 'sina':
        matches = parseSinaMatches($, source.name);
        if (matches.length === 0) {
          matches = parseGenericMatches($, source.name);
        }
        break;
      default:
        matches = parseGenericMatches($, source.name);
        break;
    }

    return {
      source: source.name,
      url: source.url,
      success: true,
      matchCount: matches.length,
      matches
    };
  } catch (error) {
    return {
      source: source.name,
      url: source.url,
      success: false,
      matchCount: 0,
      error: error instanceof Error ? error.message : '未知错误',
      matches: []
    };
  }
}

function findMatchInDb(homeTeam: string, awayTeam: string): ReturnType<typeof db.getMatches>[number] | null {
  const matches = db.getMatches();
  return matches.find(m =>
    (m.homeTeam === homeTeam && m.awayTeam === awayTeam) ||
    (m.homeTeam === awayTeam && m.awayTeam === homeTeam)
  ) || null;
}

function verifyAndDeduplicate(results: SourceCrawlResult[]): VerifiedMatchResult[] {
  const matchKeyMap = new Map<string, {
    homeTeam: string;
    awayTeam: string;
    scoreMap: Map<string, string[]>;
    stage: string;
    matchDate: string;
  }>();

  for (const sourceResult of results) {
    if (!sourceResult.success) continue;

    for (const match of sourceResult.matches) {
      const dbMatch = findMatchInDb(match.homeTeam, match.awayTeam);
      if (!dbMatch) continue;
      if (dbMatch.status === 'finished') continue;

      const key = [dbMatch.homeTeam, dbMatch.awayTeam].sort().join(' vs ');
      const scoreKey = `${match.homeScore}-${match.awayScore}`;

      if (!matchKeyMap.has(key)) {
        matchKeyMap.set(key, {
          homeTeam: dbMatch.homeTeam,
          awayTeam: dbMatch.awayTeam,
          scoreMap: new Map(),
          stage: dbMatch.stage,
          matchDate: dbMatch.matchDate
        });
      }

      const entry = matchKeyMap.get(key)!;
      if (!entry.scoreMap.has(scoreKey)) {
        entry.scoreMap.set(scoreKey, []);
      }
      entry.scoreMap.get(scoreKey)!.push(sourceResult.source);
    }
  }

  const verified: VerifiedMatchResult[] = [];

  for (const [, entry] of matchKeyMap) {
    let bestScore = '';
    let bestSources: string[] = [];
    let maxSources = 0;

    for (const [score, sources] of entry.scoreMap) {
      if (sources.length > maxSources) {
        maxSources = sources.length;
        bestScore = score;
        bestSources = sources;
      }
    }

    if (bestScore && bestSources.length >= 1) {
      const [homeScore, awayScore] = bestScore.split('-').map(Number);
      verified.push({
        homeTeam: entry.homeTeam,
        awayTeam: entry.awayTeam,
        homeScore,
        awayScore,
        stage: entry.stage,
        matchDate: entry.matchDate,
        sources: bestSources,
        verificationLevel: bestSources.length >= 2 ? 'multi' : 'single'
      });
    }
  }

  return verified;
}

interface CrawlHistoryItem {
  timestamp: string;
  success: boolean;
  updatedCount: number;
  sourceResults: SourceCrawlResult[];
  verifiedCount: number;
  totalCrawled: number;
  message: string;
}

const crawlHistory: CrawlHistoryItem[] = [];

export function getCrawlHistory(): CrawlHistoryItem[] {
  return [...crawlHistory].reverse().slice(0, 20);
}

export async function crawlMatchResults(): Promise<CrawlResult> {
  console.log('[爬虫] ========== 开始抓取最新比赛结果 ==========');
  console.log('[爬虫] 执行时间:', new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
  const startTime = Date.now();

  const sourceResults: SourceCrawlResult[] = [];

  console.log(`[爬虫] 将从 ${DATA_SOURCES.length} 个数据源抓取...`);

  const crawlPromises = DATA_SOURCES.map(source => crawlSource(source));
  const results = await Promise.allSettled(crawlPromises);

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const source = DATA_SOURCES[i];
    if (result.status === 'fulfilled') {
      sourceResults.push(result.value);
      const r = result.value;
      console.log(`[爬虫] ${source.name}: ${r.success ? '成功' : '失败'}，抓到 ${r.matchCount} 场${r.error ? ` (${r.error})` : ''}`);
    } else {
      sourceResults.push({
        source: source.name,
        url: source.url,
        success: false,
        matchCount: 0,
        error: result.reason?.message || '未知错误',
        matches: []
      });
      console.log(`[爬虫] ${source.name}: 异常 - ${result.reason?.message || '未知错误'}`);
    }
  }

  const totalCrawled = sourceResults.filter(r => r.success).reduce((sum, r) => sum + r.matchCount, 0);
  console.log(`[爬虫] 共从 ${sourceResults.filter(r => r.success).length}/${DATA_SOURCES.length} 个来源抓取到 ${totalCrawled} 条比赛记录`);

  const verified = verifyAndDeduplicate(sourceResults);
  console.log(`[爬虫] 交叉验证后，有 ${verified.length} 场比赛结果可更新`);

  const updatedMatches: Array<{
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    stage: string;
    sources: string[];
    verificationLevel: string;
  }> = [];

  const matches = db.getMatches();

  for (const v of verified) {
    const match = matches.find(m =>
      (m.homeTeam === v.homeTeam && m.awayTeam === v.awayTeam) ||
      (m.homeTeam === v.awayTeam && m.awayTeam === v.homeTeam)
    );

    if (match && match.status !== 'finished') {
      const isReversed = match.homeTeam === v.awayTeam;
      const finalHomeScore = isReversed ? v.awayScore : v.homeScore;
      const finalAwayScore = isReversed ? v.homeScore : v.awayScore;

      match.homeScore = finalHomeScore;
      match.awayScore = finalAwayScore;
      match.status = 'finished';

      updatedMatches.push({
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeScore: finalHomeScore,
        awayScore: finalAwayScore,
        stage: match.stage,
        sources: v.sources,
        verificationLevel: v.verificationLevel
      });

      console.log(`[爬虫] ✓ 更新: ${match.homeTeam} ${finalHomeScore}-${finalAwayScore} ${match.awayTeam} (来源: ${v.sources.join(', ')}, ${v.verificationLevel === 'multi' ? '多源验证' : '单源'})`);
    }
  }

  if (updatedMatches.length > 0) {
    db.validateKnockoutData();
    db.saveMatches();
    console.log(`[爬虫] 完成 ${updatedMatches.length} 场比赛结果更新（已持久化）`);
    // 刷新六维统计数据（新增的比赛需要重新爬取ESPN统计
    console.log('[爬虫] 开始刷新六维统计数据...');
    try {
      const statsResult = await db.refreshMatchDetailStats();
      console.log(`[爬虫] 六维统计数据刷新完成：成功 ${statsResult.ok} 场，失败 ${statsResult.fail} 场`);
    } catch (err) {
      console.error('[爬虫] 刷新六维统计数据失败:', err);
    }
  } else {
    console.log('[爬虫] 没有可更新的比赛结果');
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  const historyItem: CrawlHistoryItem = {
    timestamp: new Date().toISOString(),
    success: true,
    updatedCount: updatedMatches.length,
    sourceResults,
    verifiedCount: verified.length,
    totalCrawled,
    message: updatedMatches.length > 0
      ? `成功更新 ${updatedMatches.length} 场比赛结果`
      : '没有新的比赛结果需要更新'
  };
  crawlHistory.push(historyItem);

  console.log(`[爬虫] 抓取完成，耗时 ${duration}s`);
  console.log('[爬虫] ============================================');

  return {
    success: true,
    updatedCount: updatedMatches.length,
    message: updatedMatches.length > 0
      ? `成功更新 ${updatedMatches.length} 场比赛结果`
      : sourceResults.every(r => !r.success)
        ? '所有数据源均抓取失败，未更新比赛结果'
        : '没有新的比赛结果需要更新',
    updatedMatches,
    sourceResults,
    totalCrawled,
    verifiedCount: verified.length,
    timestamp: new Date().toISOString()
  };
}

export default {
  crawlMatchResults,
  getCrawlHistory
};
