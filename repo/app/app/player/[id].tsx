import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import api from '../../lib/api';
import { getAvatarUrl } from '../../lib/avatars';
import type { PlayerDetail, MatchWithPlayers } from '../../../shared/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const AVATAR_SIZE = Math.round(SCREEN_WIDTH * 0.4);
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 160;

// ─── Ranking History Line Chart (react-native-svg) ───────────────────
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function RankingChart({ history }: { history: { month: string; ranking: number }[] }) {
  if (!history || history.length < 2) return null;

  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 24;
  const paddingBottom = 28;
  const plotW = CHART_WIDTH - paddingLeft - paddingRight;
  const plotH = CHART_HEIGHT - paddingTop - paddingBottom;

  const rankings = history.map((h) => h.ranking);
  const minRank = Math.min(...rankings);
  const maxRank = Math.max(...rankings);
  const range = Math.max(maxRank - minRank, 1);

  // ranking 1 at top → lower ranking = higher y position (inverted)
  const getX = (i: number) => paddingLeft + (i / (history.length - 1)) * plotW;
  const getY = (ranking: number) =>
    paddingTop + ((ranking - minRank) / range) * plotH;

  const points = history.map((h, i) => ({ x: getX(i), y: getY(h.ranking) }));
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  const lastIdx = history.length - 1;

  // Y-axis grid: ~4 ticks
  const tickCount = Math.min(4, range + 1);
  const yTicks: number[] = [];
  for (let i = 0; i < tickCount; i++) {
    yTicks.push(Math.round(minRank + (range * i) / (tickCount - 1)));
  }

  return (
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Ranking History</Text>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* Horizontal grid lines */}
        {yTicks.map((rank) => (
          <Line
            key={`grid-${rank}`}
            x1={paddingLeft}
            y1={getY(rank)}
            x2={CHART_WIDTH - paddingRight}
            y2={getY(rank)}
            stroke="#2a2a4e"
            strokeWidth={1}
          />
        ))}
        {/* Vertical grid lines */}
        {history.map((_, i) => (
          <Line
            key={`vgrid-${i}`}
            x1={getX(i)}
            y1={paddingTop}
            x2={getX(i)}
            y2={paddingTop + plotH}
            stroke="#2a2a4e"
            strokeWidth={1}
          />
        ))}
        {/* Y-axis labels */}
        {yTicks.map((rank) => (
          <SvgText
            key={`ylabel-${rank}`}
            x={paddingLeft - 6}
            y={getY(rank) + 4}
            fill="#a0a0b0"
            fontSize={10}
            textAnchor="end"
          >
            #{rank}
          </SvgText>
        ))}
        {/* X-axis month labels */}
        {history.map((h, i) => {
          const monthIdx = parseInt(h.month.slice(5), 10) - 1;
          const label = MONTH_NAMES[monthIdx] ?? h.month.slice(5);
          return (
            <SvgText
              key={`xlabel-${i}`}
              x={getX(i)}
              y={CHART_HEIGHT - 4}
              fill="#6b7280"
              fontSize={9}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}
        {/* Line */}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke="#16a34a"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Data points */}
        {points.map((p, i) => {
          const isLast = i === lastIdx;
          return (
            <Circle
              key={`dot-${i}`}
              cx={p.x}
              cy={p.y}
              r={isLast ? 6 : 4}
              fill={isLast ? '#16a34a' : '#0f0f23'}
              stroke="#16a34a"
              strokeWidth={2}
            />
          );
        })}
        {/* Current month ranking label */}
        {(() => {
          const lp = points[lastIdx];
          const rank = history[lastIdx].ranking;
          return (
            <SvgText
              x={lp.x}
              y={lp.y - 12}
              fill="#16a34a"
              fontSize={11}
              fontWeight="bold"
              textAnchor="middle"
            >
              #{rank}
            </SvgText>
          );
        })()}
      </Svg>
    </View>
  );
}

// ─── Record / Win-Loss Stats ─────────────────────────────────────────
function RecordSection({ player }: { player: PlayerDetail }) {
  const record = player.record;
  if (!record) return null;

  const surfaces = [
    { label: 'Hard', emoji: '🔵', data: record.bySurface.hard },
    { label: 'Clay', emoji: '🟤', data: record.bySurface.clay },
    { label: 'Grass', emoji: '🟢', data: record.bySurface.grass },
  ];

  return (
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Win / Loss Record</Text>

      {/* Season vs Career row */}
      <View style={styles.recordTopRow}>
        <View style={styles.recordBox}>
          <Text style={styles.recordWL}>
            {record.season.wins}-{record.season.losses}
          </Text>
          <Text style={styles.recordLabel}>Season</Text>
          <View style={styles.winBar}>
            <View
              style={[
                styles.winBarFill,
                {
                  width: `${(record.season.wins / (record.season.wins + record.season.losses)) * 100}%`,
                },
              ]}
            />
          </View>
        </View>
        <View style={styles.recordBox}>
          <Text style={styles.recordWL}>
            {record.career.wins}-{record.career.losses}
          </Text>
          <Text style={styles.recordLabel}>Career</Text>
          <View style={styles.winBar}>
            <View
              style={[
                styles.winBarFill,
                {
                  width: `${(record.career.wins / (record.career.wins + record.career.losses)) * 100}%`,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* By surface */}
      <Text style={styles.subSectionTitle}>By Surface</Text>
      {surfaces.map((s) => (
        <View key={s.label} style={styles.surfaceRow}>
          <Text style={styles.surfaceLabel}>
            {s.emoji} {s.label}
          </Text>
          <Text style={styles.surfaceWL}>
            {s.data.wins}-{s.data.losses}
          </Text>
          <Text style={styles.surfacePct}>
            {((s.data.wins / (s.data.wins + s.data.losses)) * 100).toFixed(0)}%
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Bio Section ─────────────────────────────────────────────────────
function BioSection({ player }: { player: PlayerDetail }) {
  if (!player.birthplace && !player.coach && !player.recentForm) return null;

  return (
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Bio</Text>
      {player.birthplace && <InfoRow label="Birthplace" value={player.birthplace} />}
      {player.coach && <InfoRow label="Coach" value={player.coach} />}
      {player.recentForm && (
        <View style={styles.recentFormContainer}>
          <Text style={styles.recentFormLabel}>Recent Form</Text>
          <Text style={styles.recentFormText}>{player.recentForm}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────
export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: player, isLoading, error } = useQuery<PlayerDetail>({
    queryKey: ['player', id],
    queryFn: async () => {
      const res = await api.get(`/api/players/${id}`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (error || !player) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load player</Text>
      </View>
    );
  }

  const avatarUrl = player.photoUrl || getAvatarUrl(player.name, AVATAR_SIZE * 2);

  return (
    <>
      <Stack.Screen options={{ title: player.name }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <Text style={styles.playerName}>
            {player.name} {player.countryFlag}
          </Text>
          <Text style={styles.rankingBig}>#{player.ranking}</Text>
        </View>

        {/* Career Highlights */}
        <View style={styles.highlightsRow}>
          <View style={styles.highlightBox}>
            <Text style={styles.highlightNumber}>{player.grandSlams}</Text>
            <Text style={styles.highlightLabel}>Grand Slams</Text>
          </View>
          <View style={styles.highlightBox}>
            <Text style={styles.highlightNumber}>{player.titles}</Text>
            <Text style={styles.highlightLabel}>Titles</Text>
          </View>
          <View style={styles.highlightBox}>
            <Text style={styles.highlightNumber}>{player.prizeMoney}</Text>
            <Text style={styles.highlightLabel}>Prize Money</Text>
          </View>
        </View>

        {/* Compare Button */}
        <TouchableOpacity
          style={styles.compareButton}
          onPress={() => router.push('/h2h' as any)}
        >
          <Text style={styles.compareButtonText}>⚔️ Compare with...</Text>
        </TouchableOpacity>

        {/* Bio */}
        <BioSection player={player} />

        {/* Ranking History Chart */}
        {player.rankingHistory && player.rankingHistory.length > 0 && (
          <RankingChart history={player.rankingHistory} />
        )}

        {/* Win/Loss Record */}
        <RecordSection player={player} />

        {/* Player Info */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Player Info</Text>
          <InfoRow label="Nationality" value={`${player.countryFlag} ${player.country}`} />
          <InfoRow label="Height" value={`${player.height} cm`} />
          <InfoRow label="Weight" value={`${player.weight} kg`} />
          <InfoRow label="Plays" value={player.plays} />
          <InfoRow label="Backhand" value={player.backhand} />
          <InfoRow label="Turned Pro" value={String(player.turnedPro)} />
          <InfoRow label="Career High" value={`#${player.careerHigh}`} />
        </View>

        {/* Stats */}
        {player.stats && (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Season Stats</Text>
            <InfoRow label="Win-Loss" value={player.stats.winLoss} />
            <InfoRow label="Titles This Year" value={String(player.stats.titlesThisYear)} />
            <InfoRow label="Best Result" value={player.stats.bestResult} />
          </View>
        )}

        {/* Recent Matches */}
        {player.recentMatches && player.recentMatches.length > 0 && (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Recent Matches</Text>
            {player.recentMatches.map((match: MatchWithPlayers) => (
              <View key={match.id} style={styles.matchItem}>
                <View style={styles.matchHeader}>
                  <Text style={styles.matchTournament}>
                    {match.tournament?.name || 'Tournament'}
                  </Text>
                  <Text style={styles.matchRound}>{match.round}</Text>
                </View>
                <View style={styles.matchPlayers}>
                  <Text
                    style={[
                      styles.matchPlayerName,
                      match.winnerId === match.player1Id && styles.matchWinner,
                    ]}
                  >
                    {match.player1?.name || `Player ${match.player1Id}`}
                  </Text>
                  <Text style={styles.matchVs}>vs</Text>
                  <Text
                    style={[
                      styles.matchPlayerName,
                      match.winnerId === match.player2Id && styles.matchWinner,
                    ]}
                  >
                    {match.player2?.name || `Player ${match.player2Id}`}
                  </Text>
                </View>
                <Text style={styles.matchScore}>{match.score}</Text>
                <Text style={styles.matchDate}>{match.date}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  content: {
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
  },
  avatarSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: '#16a34a',
    marginBottom: 16,
  },
  playerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  rankingBig: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  compareButton: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  compareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
  },
  highlightsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  highlightBox: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  highlightNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 4,
  },
  highlightLabel: {
    fontSize: 11,
    color: '#a0a0b0',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a0a0b0',
    marginTop: 12,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  infoLabel: {
    fontSize: 14,
    color: '#a0a0b0',
  },
  infoValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 12,
  },

  // ── Chart styles (line chart uses SVG, minimal RN styles needed) ──

  // ── Record styles ──
  recordTopRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  recordBox: {
    flex: 1,
    backgroundColor: '#0f0f23',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  recordWL: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  recordLabel: {
    fontSize: 11,
    color: '#a0a0b0',
    marginBottom: 6,
  },
  winBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#ef4444',
    borderRadius: 3,
    overflow: 'hidden',
  },
  winBarFill: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 3,
  },
  surfaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  surfaceLabel: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
  },
  surfaceWL: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    marginRight: 12,
  },
  surfacePct: {
    fontSize: 13,
    color: '#16a34a',
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },

  // ── Bio styles ──
  recentFormContainer: {
    paddingVertical: 8,
  },
  recentFormLabel: {
    fontSize: 14,
    color: '#a0a0b0',
    marginBottom: 4,
  },
  recentFormText: {
    fontSize: 13,
    color: '#d0d0e0',
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // ── Match styles ──
  matchItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  matchTournament: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
    textTransform: 'uppercase',
    flex: 1,
  },
  matchRound: {
    fontSize: 12,
    color: '#a0a0b0',
  },
  matchPlayers: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchPlayerName: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
  },
  matchWinner: {
    color: '#16a34a',
    fontWeight: 'bold',
  },
  matchVs: {
    color: '#a0a0b0',
    fontSize: 12,
    marginHorizontal: 8,
  },
  matchScore: {
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  matchDate: {
    textAlign: 'center',
    color: '#a0a0b0',
    fontSize: 11,
    marginTop: 4,
  },
});
