import db from './api/database.js';

setTimeout(() => {
  console.log('========== 1/8决赛对阵情况 ==========\n');
  
  const allMatches = db.getMatches();
  
  // 查看1/8决赛
  const r16 = allMatches.filter(m => m.stage === '1/8决赛');
  console.log(`1/8决赛共 ${r16.length} 场：\n`);
  r16.forEach((m, i) => {
    console.log(`${i+1}. ${m.homeTeam} vs ${m.awayTeam}`);
    console.log(`   状态：${m.status}, 比分：${m.homeScore} - ${m.awayScore}`);
    console.log(`   matchId：${m.id}`);
    console.log('');
  });
  
  // 看看哪些球队进入了1/8决赛
  console.log('========== 1/8决赛球队 ==========\n');
  const r16Teams = new Set();
  r16.forEach(m => {
    r16Teams.add(m.homeTeam);
    r16Teams.add(m.awayTeam);
  });
  console.log(`共 ${r16Teams.size} 支球队：`);
  console.log(Array.from(r16Teams).sort().join(', '));
  
  // 看看1/16决赛的结果
  console.log('\n========== 1/16决赛结果 ==========\n');
  const r32 = allMatches.filter(m => m.stage === '1/16决赛' && m.status === 'finished');
  r32.forEach((m, i) => {
    const detail = db.getMatches(); // 拿不到 detail，直接看比分
    console.log(`${i+1}. ${m.homeTeam} ${m.homeScore} - ${m.awayScore} ${m.awayTeam}`);
  });
  
  console.log('\n========== 验证：墨西哥 vs 谁？ ==========\n');
  const mexicoR16 = r16.find(m => m.homeTeam === '墨西哥' || m.awayTeam === '墨西哥');
  if (mexicoR16) {
    console.log(`墨西哥 1/8决赛对手：${mexicoR16.homeTeam === '墨西哥' ? mexicoR16.awayTeam : mexicoR16.homeTeam}`);
  } else {
    console.log('墨西哥没有进入1/8决赛？');
  }
  
  // 看看英格兰的1/8决赛对手
  const englandR16 = r16.find(m => m.homeTeam === '英格兰' || m.awayTeam === '英格兰');
  if (englandR16) {
    console.log(`英格兰 1/8决赛对手：${englandR16.homeTeam === '英格兰' ? englandR16.awayTeam : englandR16.homeTeam}`);
  } else {
    console.log('英格兰没有进入1/8决赛？');
  }
}, 5000);
