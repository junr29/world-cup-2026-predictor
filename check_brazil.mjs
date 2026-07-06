import db from './api/database.js';

// 获取所有比赛
const allMatches = db.getMatches();

// 找巴西vs挪威
const match = allMatches.find(m => 
  (m.homeTeam === '巴西' && m.awayTeam === '挪威') || 
  (m.homeTeam === '挪威' && m.awayTeam === '巴西')
);

if (match) {
  console.log('=== 巴西vs挪威 比赛信息 ===');
  console.log(`ID: ${match.id}`);
  console.log(`阶段: ${match.stage}`);
  console.log(`状态: ${match.status}`);
  console.log(`比分: ${match.homeScore} - ${match.awayScore}`);
  console.log(`日期: ${match.matchDate}`);
} else {
  console.log('未找到比赛');
}

// 检查是否有详细统计
console.log('\n=== 检查matchDetailStats ===');
const stats = db.getMatchDetailStats(match.id);
if (stats) {
  console.log('有详细统计数据');
  console.log(`主队常规时间进球: ${stats.home.regularTimeGoals}`);
  console.log(`客队常规时间进球: ${stats.away.regularTimeGoals}`);
} else {
  console.log('没有详细统计数据');
}

// 检查错误率排行中的比分
console.log('\n=== 错误率排行中的巴西vs挪威 ===');
const accuracy = db.getMatchPredictionAccuracy();
const item = accuracy.find(m => m.matchId === match.id);
if (item) {
  console.log(`比分: ${item.homeScore} - ${item.awayScore}`);
  console.log(`正确: ${item.correctPredictions}/${item.totalPredictions}`);
  console.log(`错误率: ${item.errorRate}%`);
}
