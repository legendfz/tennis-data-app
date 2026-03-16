/**
 * Manual integration test — verifies the TennisHQ data abstraction layer
 * can connect to TennisApi1 and return real data.
 *
 * Run: npx tsx src/test.ts
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Load .env from repo root (4 levels up: src/ → api/ → packages/ → root)
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../../.env') });
import { createTennisClient } from './tennis/index.js';

const tennis = createTennisClient();

function section(title: string) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('─'.repeat(60));
}

async function testLiveMatches() {
  section('Live Matches');
  try {
    const events = await tennis.events.getLiveMatches();
    console.log(`✓ Live matches: ${events.length} returned`);
    if (events.length > 0) {
      const e = events[0];
      console.log(`  First: [${e.id}] ${e.homeTeam?.name} vs ${e.awayTeam?.name} — status: ${e.status?.type}`);
    } else {
      console.log('  (no live matches right now — expected outside tournament days)');
    }
  } catch (err) {
    console.error('✗ getLiveMatches failed:', (err as Error).message);
  }
}

async function testEventsByDate() {
  section("Today's Events");
  const now = new Date();
  const params = { day: now.getUTCDate(), month: now.getUTCMonth() + 1, year: now.getUTCFullYear() };
  try {
    const events = await tennis.events.getEventsByDate(params);
    console.log(`✓ Events for ${params.year}-${params.month}-${params.day}: ${events.length} returned`);
    if (events.length > 0) {
      const e = events[0];
      console.log(`  First: [${e.id}] ${e.homeTeam?.name} vs ${e.awayTeam?.name}`);
    }
  } catch (err) {
    console.error('✗ getEventsByDate failed:', (err as Error).message);
  }
}

async function testAtpRankings() {
  section('ATP Rankings (top 10)');
  try {
    const page = await tennis.rankings.getAtpRankings();
    console.log(`✓ ATP rankings: ${page.rankings.length} entries`);
    page.rankings.slice(0, 5).forEach(r => {
      console.log(`  #${r.ranking}  ${r.team?.name ?? 'Unknown'} — ${r.points} pts`);
    });
  } catch (err) {
    console.error('✗ getAtpRankings failed:', (err as Error).message);
  }
}

async function testWtaRankings() {
  section('WTA Rankings (top 5)');
  try {
    const page = await tennis.rankings.getWtaRankings();
    console.log(`✓ WTA rankings: ${page.rankings.length} entries`);
    page.rankings.slice(0, 5).forEach(r => {
      console.log(`  #${r.ranking}  ${r.team?.name ?? 'Unknown'} — ${r.points} pts`);
    });
  } catch (err) {
    console.error('✗ getWtaRankings failed:', (err as Error).message);
  }
}

async function testSearch() {
  section('Search: "Djokovic"');
  try {
    const results = await tennis.players.searchPlayersAndTournaments('Djokovic');
    console.log(`✓ Players: ${results.players.length}  Tournaments: ${results.tournaments.length}`);
    results.players.slice(0, 3).forEach(p => {
      console.log(`  Player: ${p.name} (${p.country?.name ?? '?'})`);
    });
  } catch (err) {
    console.error('✗ search failed:', (err as Error).message);
  }
}

async function testPlayerDetails() {
  // Novak Djokovic — player id 13736 in TennisApi1
  section('Player Details: Djokovic (id=13736)');
  try {
    const player = await tennis.players.getPlayerDetails(13736);
    console.log(`✓ ${player.name} | ranking: ${player.ranking ?? 'n/a'} | country: ${player.country?.name ?? 'n/a'}`);
  } catch (err) {
    console.error('✗ getPlayerDetails failed:', (err as Error).message);
  }
}

async function testCacheHit() {
  section('Cache — second call should be instant');
  const t0 = Date.now();
  await tennis.rankings.getAtpRankings();
  const t1 = Date.now();
  await tennis.rankings.getAtpRankings(); // should be cache hit
  const t2 = Date.now();
  console.log(`  First call: ${t1 - t0}ms  |  Second call (cached): ${t2 - t1}ms`);
  if (t2 - t1 < 5) {
    console.log('✓ Cache hit confirmed (sub-5ms response)');
  } else {
    console.log('⚠ Cache may not be working as expected');
  }
}

(async () => {
  console.log('\n🎾 TennisHQ API Layer — Integration Test');
  console.log('Using RapidAPI key:', process.env.RAPIDAPI_KEY ? '***' + process.env.RAPIDAPI_KEY.slice(-6) : 'NOT SET');

  if (!process.env.RAPIDAPI_KEY) {
    console.error('\nERROR: RAPIDAPI_KEY not found. Make sure .env is present at the workspace root.');
    process.exit(1);
  }

  await testLiveMatches();
  await testEventsByDate();
  await testAtpRankings();
  await testWtaRankings();
  await testSearch();
  await testPlayerDetails();
  await testCacheHit();

  console.log('\n✅ Test run complete.\n');
})();
