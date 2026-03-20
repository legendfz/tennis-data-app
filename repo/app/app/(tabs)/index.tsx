import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../lib/api';
import { PlayerAvatar } from '../../lib/player-avatar';
import { Flag } from '../../lib/flags';
import { getFavorites } from '../../lib/favorites';
import { useLanguage, TranslationKey } from '../../lib/i18n';
import { SkeletonList } from '../../lib/skeleton';
import { TournamentLogo } from '../../lib/tournament-logo';
import { theme, radii, breakpoints } from '../../lib/theme';
import { TennisBallIcon } from '../../lib/illustrations';
import { EmptyMatchesIllustration } from '../../lib/illustrations';
import type { Player, MatchWithPlayers, NextRoundInfo } from '../../../shared/types';

// ─── Court Background ────────────────────────────────────────────────
function CourtBackground() {
  return (
    <View style={courtStyles.wrap} pointerEvents="none" accessibilityElementsHidden>
      {/* Green tint */}
      <View style={courtStyles.tint} />
      {/* Outer boundary */}
      <View style={courtStyles.boundaryH_top} />
      <View style={courtStyles.boundaryH_bot} />
      <View style={courtStyles.boundaryV_left} />
      <View style={courtStyles.boundaryV_right} />
      {/* Net / center horizontal */}
      <View style={courtStyles.net} />
      {/* Service lines */}
      <View style={courtStyles.serviceLine_top} />
      <View style={courtStyles.serviceLine_bot} />
      {/* Center service line */}
      <View style={courtStyles.centerService} />
    </View>
  );
}
const CL = 'rgba(255,255,255,0.35)';
const courtStyles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.025, overflow: 'hidden' },
  tint: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0a3d1a' },
  boundaryH_top: { position: 'absolute', top: '5%', left: '8%', right: '8%', height: 1, backgroundColor: CL },
  boundaryH_bot: { position: 'absolute', bottom: '5%', left: '8%', right: '8%', height: 1, backgroundColor: CL },
  boundaryV_left: { position: 'absolute', top: '5%', left: '8%', bottom: '5%', width: 1, backgroundColor: CL },
  boundaryV_right: { position: 'absolute', top: '5%', right: '8%', bottom: '5%', width: 1, backgroundColor: CL },
  net: { position: 'absolute', top: '50%', left: '8%', right: '8%', height: 1.5, backgroundColor: CL },
  serviceLine_top: { position: 'absolute', top: '25%', left: '25%', right: '25%', height: 1, backgroundColor: CL },
  serviceLine_bot: { position: 'absolute', bottom: '25%', left: '25%', right: '25%', height: 1, backgroundColor: CL },
  centerService: { position: 'absolute', top: '25%', left: '50%', bottom: '25%', width: 1, backgroundColor: CL },
});

/** Returns a label like "ATP 500" / "WTA 1000", or null if points should be hidden */
function getTournamentPointsLabel(tournament: any): string | null {
  if (!tournament?.points) return null;
  const points = tournament.points;
  const category: string = tournament.category || '';
  if (points >= 1000 && !category.includes('WTA')) return null;
  return `${category} ${points}`;
}

function LiveDot() {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.2, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);
  return <Animated.View style={[styles.liveDot, { opacity }]} accessibilityLabel="Live" />;
}

function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getDatePills(t: (key: TranslationKey) => string): { label: string; date: string }[] {
  const pills: { label: string; date: string }[] = [];
  const today = new Date();
  for (let i = -3; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    let label: string;
    if (i === -1) label = t('yesterday');
    else if (i === 0) label = t('today');
    else if (i === 1) label = t('tomorrow');
    else {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      label = `${days[d.getDay()]} ${d.getDate()}`;
    }
    pills.push({ label, date: dateStr });
  }
  return pills;
}

const TOUR_FILTERS = ['ALL', 'ATP', 'WTA'] as const;
type TourFilter = typeof TOUR_FILTERS[number];

export default function HomeScreen() {
  const router = useRouter();
  const [tourFilter, setTourFilter] = useState<TourFilter>('ALL');
  const { getPlayerName, t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const datePills = useMemo(() => getDatePills(t), [t]);
  const { width: screenWidth } = useWindowDimensions();
  const isWide = screenWidth >= breakpoints.md;

  const {
    data: matchesData,
    isLoading: matchesLoading,
    refetch: refetchMatches,
  } = useQuery<{ data: MatchWithPlayers[] }>({
    queryKey: ['matches-latest'],
    queryFn: async () => {
      const res = await api.get('/api/matches?limit=50');
      return res.data;
    },
  });

  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  useFocusEffect(
    useCallback(() => {
      getFavorites().then(setFavoriteIds);
    }, [])
  );

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchMatches(), getFavorites().then(setFavoriteIds)]);
    setRefreshing(false);
  }, [refetchMatches]);

  const rawMatches: MatchWithPlayers[] =
    matchesData?.data ??
    (Array.isArray(matchesData) ? (matchesData as MatchWithPlayers[]) : []);

  const allMatches = useMemo(() => {
    if (tourFilter === 'ALL') return rawMatches;
    return rawMatches.filter((m) => {
      const p1Tour = (m.player1 as any)?.tour;
      const p2Tour = (m.player2 as any)?.tour;
      return p1Tour === tourFilter || p2Tour === tourFilter;
    });
  }, [rawMatches, tourFilter]);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const followingMatches = useMemo(
    () =>
      favoriteSet.size === 0
        ? []
        : allMatches.filter(
            (m) => favoriteSet.has(m.player1Id) || favoriteSet.has(m.player2Id)
          ),
    [allMatches, favoriteSet]
  );
  const followingMatchIds = useMemo(
    () => new Set(followingMatches.map((m) => m.id)),
    [followingMatches]
  );

  const liveMatches = useMemo(
    () => allMatches.filter((m) => (m as any).isLive && !followingMatchIds.has(m.id)),
    [allMatches, followingMatchIds]
  );

  const matchesByTournament = useMemo(() => {
    const nonLive = allMatches.filter(
      (m) => !(m as any).isLive && !followingMatchIds.has(m.id)
    );
    const groups: Record<string, { tournament: any; matches: MatchWithPlayers[] }> = {};
    const order: string[] = [];
    nonLive.forEach((m) => {
      const t = m.tournament;
      const key = t?.name || 'Other';
      if (!groups[key]) {
        groups[key] = { tournament: t, matches: [] };
        order.push(key);
      }
      groups[key].matches.push(m);
    });
    return order.map((name) => groups[name]);
  }, [allMatches, followingMatchIds]);

  const renderMatchRow = (match: MatchWithPlayers) => {
    const isLive = (match as any).isLive;
    const p1Won = match.winnerId === match.player1Id;
    const p2Won = match.winnerId === match.player2Id;
    const isFinished = match.winnerId != null;
    const isScheduled = !isFinished && !isLive;
    const p1Name = match.player1 ? getPlayerName(match.player1) : `Player ${match.player1Id}`;
    const p2Name = match.player2 ? getPlayerName(match.player2) : `Player ${match.player2Id}`;

    const a11yLabel = isLive
      ? `${p1Name} vs ${p2Name}, ${match.score || '0-0'}, Live`
      : isFinished
        ? `${p1Name} vs ${p2Name}, ${match.score}, Finished`
        : `${p1Name} vs ${p2Name}, Scheduled`;

    return (
      <View
        key={match.id}
        style={[styles.matchRow, isLive && styles.matchRowLive]}
        accessibilityLabel={a11yLabel}
        accessibilityRole="button"
      >
        <View style={styles.matchInner}>
          {/* Player 1 */}
          <TouchableOpacity
            style={styles.matchPlayer}
            activeOpacity={theme.activeOpacity}
            onPress={() => router.push(`/player/${match.player1Id}`)}
            accessibilityLabel={`View ${p1Name}`}
            accessibilityRole="link"
          >
            <View style={[!p1Won && p2Won && { opacity: 0.35 }]}>
              <PlayerAvatar name={match.player1?.name || 'P1'} photoUrl={match.player1?.photoUrl} size={40} ranking={match.player1?.ranking} />
            </View>
            <Flag country={match.player1?.country || ''} countryFlag={match.player1?.countryFlag} size={12} />
            <Text
              style={[
                styles.playerName,
                p1Won && styles.playerNameWinner,
                !p1Won && p2Won && styles.playerNameLoser,
              ]}
              numberOfLines={1}
            >
              {p1Name}
            </Text>
            {p1Won && <View style={styles.winnerBadge} />}
          </TouchableOpacity>

          {/* Score */}
          <TouchableOpacity
            style={styles.matchScore}
            activeOpacity={theme.activeOpacity}
            onPress={() => router.push(`/match/${match.id}`)}
            accessibilityLabel={`Match details: ${match.score || 'Scheduled'}`}
            accessibilityRole="link"
          >
            {isLive ? (
              <>
                <Text style={styles.scoreLive}>{match.score || '0-0'}</Text>
                <View style={styles.liveStatus}>
                  <LiveDot />
                  <Text style={styles.liveText}>{t('live')}</Text>
                </View>
                {match.round ? <Text style={styles.matchRoundLabel}>{match.round}</Text> : null}
                {match.tournament?.id && (
                  <Text
                    style={styles.drawLink}
                    onPress={(e) => { e.stopPropagation(); router.push(`/tournament/${match.tournament!.id}`); }}
                    accessibilityLabel="View draw"
                  >Draw</Text>
                )}
              </>
            ) : isFinished ? (
              <>
                <Text style={styles.scoreFt}>{match.score}</Text>
                <Text style={styles.statusFt}>{t('ft')}</Text>
                {match.round ? <Text style={styles.matchRoundLabel}>{match.round}</Text> : null}
                {match.tournament?.id && (
                  <Text
                    style={styles.drawLink}
                    onPress={(e) => { e.stopPropagation(); router.push(`/tournament/${match.tournament!.id}`); }}
                    accessibilityLabel="View draw"
                  >Draw</Text>
                )}
              </>
            ) : (
              <>
                <Text style={styles.scoreTime}>{(match as any).scheduledTime || '--:--'}</Text>
                <Text style={styles.statusScheduled}>{t('scheduled')}</Text>
                {match.round ? <Text style={styles.matchRoundLabel}>{match.round}</Text> : null}
              </>
            )}
          </TouchableOpacity>

          {/* Player 2 */}
          <TouchableOpacity
            style={[styles.matchPlayer, styles.matchPlayerRight]}
            activeOpacity={theme.activeOpacity}
            onPress={() => router.push(`/player/${match.player2Id}`)}
            accessibilityLabel={`View ${p2Name}`}
            accessibilityRole="link"
          >
            <Text
              style={[
                styles.playerName,
                p2Won && styles.playerNameWinner,
                !p2Won && p1Won && styles.playerNameLoser,
              ]}
              numberOfLines={1}
            >
              {p2Name}
            </Text>
            {p2Won && <View style={styles.winnerBadge} />}
            <Flag country={match.player2?.country || ''} countryFlag={match.player2?.countryFlag} size={12} />
            <View style={[!p2Won && p1Won && { opacity: 0.35 }]}>
              <PlayerAvatar name={match.player2?.name || 'P2'} photoUrl={match.player2?.photoUrl} size={40} ranking={match.player2?.ranking} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Court info for scheduled matches */}
        {isScheduled && match.court && (
          <Text style={styles.courtInfo}>
            {match.court}
            {(match as any).matchOrder ? ` \u2022 ${(match as any).matchOrder}` : ''}
            {(match as any).afterMatch ? ` \u2022 After ${(match as any).afterMatch}` : ''}
          </Text>
        )}

        {/* Next round opponent info */}
        {(() => {
          const nr = (match as any).nextRound as NextRoundInfo | undefined;
          if (!nr) return null;
          const shortRound = nr.round.replace('Semi-Final', 'SF').replace('Quarter-Final', 'QF').replace('Round of 16', 'R16').replace('Round of 32', 'R32');
          if (isFinished && match.winnerId) {
            const winnerName = match.winnerId === match.player1Id ? p1Name : p2Name;
            const winnerShort = winnerName.split(/[\s·]+/).pop() || winnerName;
            if (nr.status === 'confirmed' && nr.opponent) {
              const oppShort = nr.opponent.name.split(/[\s·]+/).pop() || nr.opponent.name;
              return <Text style={styles.nextRoundText}>{winnerShort} → vs {oppShort} ({shortRound})</Text>;
            } else if (nr.opponent && nr.or) {
              const opp1Short = nr.opponent.name.split(/[\s·]+/).pop() || nr.opponent.name;
              const opp2Short = nr.or.name.split(/[\s·]+/).pop() || nr.or.name;
              return (
                <Text style={styles.nextRoundText}>
                  {winnerShort} → vs {opp1Short} or {opp2Short} ({shortRound})
                  {nr.matchId != null && (
                    <Text style={styles.watchLink} onPress={() => router.push(`/match/${nr.matchId}`)}> Watch →</Text>
                  )}
                </Text>
              );
            }
          } else {
            if (nr.status === 'confirmed' && nr.opponent) {
              const oppShort = nr.opponent.name.split(/[\s·]+/).pop() || nr.opponent.name;
              return <Text style={styles.nextRoundText}>Next: vs {oppShort} ({shortRound})</Text>;
            } else if (nr.opponent && nr.or) {
              const opp1Short = nr.opponent.name.split(/[\s·]+/).pop() || nr.opponent.name;
              const opp2Short = nr.or.name.split(/[\s·]+/).pop() || nr.or.name;
              return (
                <Text style={styles.nextRoundText}>
                  Next: vs {opp1Short} or {opp2Short} ({shortRound})
                  {nr.matchId != null && (
                    <Text style={styles.watchLink} onPress={() => router.push(`/match/${nr.matchId}`)}> Watch →</Text>
                  )}
                </Text>
              );
            }
          }
          return null;
        })()}
      </View>
    );
  };

  /** Wrap match rows in 2-column grid when screen is wide enough */
  const renderMatchList = (matches: MatchWithPlayers[]) => {
    if (!isWide) return matches.map(renderMatchRow);
    const pairs: MatchWithPlayers[][] = [];
    for (let i = 0; i < matches.length; i += 2) {
      pairs.push(matches.slice(i, i + 2));
    }
    return pairs.map((pair, idx) => (
      <View key={idx} style={styles.twoColRow}>
        <View style={styles.twoColItem}>{renderMatchRow(pair[0])}</View>
        {pair[1] ? <View style={styles.twoColItem}>{renderMatchRow(pair[1])}</View> : <View style={styles.twoColItem} />}
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <CourtBackground />
      {/* Subtle background glow orbs */}
      <View style={styles.glowOrb1} pointerEvents="none" />
      <View style={styles.glowOrb2} pointerEvents="none" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
      >
        {/* Title */}
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>{t('matches')}</Text>
          <TennisBallIcon size={16} />
        </View>

        {/* Tour Filter Pills */}
        <View style={styles.tourFilterRow}>
          {TOUR_FILTERS.map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[styles.tourPill, tourFilter === tf && styles.tourPillActive]}
              onPress={() => setTourFilter(tf)}
              activeOpacity={theme.activeOpacity}
              accessibilityLabel={`Filter: ${tf}`}
              accessibilityRole="button"
              accessibilityState={{ selected: tourFilter === tf }}
            >
              <Text style={[styles.tourPillText, tourFilter === tf && styles.tourPillTextActive]}>
                {tf}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Selector Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.datePillsRow}
        >
          {datePills.map((pill) => (
            <TouchableOpacity
              key={pill.date}
              style={[styles.datePill, selectedDate === pill.date && styles.datePillActive]}
              onPress={() => setSelectedDate(pill.date)}
              activeOpacity={theme.activeOpacity}
              accessibilityLabel={pill.label}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedDate === pill.date }}
            >
              <Text style={[styles.datePillText, selectedDate === pill.date && styles.datePillTextActive]}>
                {pill.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {matchesLoading ? (
          <SkeletonList count={5} cardHeight={48} />
        ) : allMatches.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyMatchesIllustration size={140} />
            <Text style={styles.emptySubtitle}>{t('tryDifferentDate')}</Text>
          </View>
        ) : (
          <>
            {/* Following Matches */}
            {followingMatches.length > 0 && (
              <View>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeaderFollowing}>{t('myMatches')}</Text>
                </View>
                {renderMatchList(followingMatches)}
              </View>
            )}

            {/* Live Matches */}
            {liveMatches.length > 0 && (
              <View>
                <Text style={styles.sectionHeaderLive}>{t('live')}</Text>
                {renderMatchList(liveMatches)}
              </View>
            )}

            {/* Matches by Tournament */}
            {matchesByTournament.map((group, idx) => (
              <View key={idx}>
                <TouchableOpacity
                  style={styles.sectionHeaderRow}
                  activeOpacity={group.tournament?.id ? theme.activeOpacity : 1}
                  onPress={() => group.tournament?.id && router.push(`/tournament/${group.tournament.id}`)}
                  accessibilityLabel={`Tournament: ${group.tournament?.name || 'Other'}`}
                  accessibilityRole="link"
                >
                  {group.tournament && (
                    <TournamentLogo tournament={group.tournament} size="sm" />
                  )}
                  <Text style={[styles.sectionHeader, group.tournament?.id && styles.sectionHeaderLink]}>
                    {group.tournament?.name?.toUpperCase() || 'OTHER'}
                    {group.tournament?.surface ? ` \u2022 ${group.tournament.surface}` : ''}
                  </Text>
                  {(() => {
                    const label = getTournamentPointsLabel(group.tournament);
                    return label ? (
                      <View style={styles.pointsPill}>
                        <Text style={styles.pointsPillText}>{label}</Text>
                      </View>
                    ) : null;
                  })()}
                </TouchableOpacity>
                {renderMatchList(group.matches)}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const cursor = Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {};
const webGlass = Platform.OS === 'web'
  ? ({ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any)
  : {};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    position: 'relative' as const,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
    paddingTop: 50,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: theme.spacing.padding,
    paddingBottom: 8,
  },
  pageTitle: {
    fontSize: theme.fontSize.pageTitle,
    fontWeight: theme.fontWeight.black,
    color: theme.text,
  },
  glowOrb1: {
    position: 'absolute',
    top: 0,
    left: '20%',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(26,122,58,0.03)',
  },
  glowOrb2: {
    position: 'absolute',
    bottom: 100,
    right: 0,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(74,154,138,0.02)',
  },

  // Tour Filter
  tourFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    paddingTop: 4,
  },
  tourPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: theme.glass,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    minHeight: 32,
    justifyContent: 'center',
    ...cursor,
  },
  tourPillActive: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  tourPillText: {
    fontSize: 13,
    fontWeight: theme.fontWeight.medium,
    color: theme.textMuted,
  },
  tourPillTextActive: {
    color: theme.text,
    fontWeight: theme.fontWeight.semibold,
  },

  // Date Pills
  datePillsRow: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 6,
    flexDirection: 'row',
  },
  datePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: theme.glass,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    minHeight: 36,
    justifyContent: 'center',
    ...cursor,
  },
  datePillActive: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
    shadowColor: '#1a7a3a',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  datePillText: {
    fontSize: 13,
    fontWeight: theme.fontWeight.medium,
    color: theme.textMuted,
  },
  datePillTextActive: {
    color: theme.text,
    fontWeight: theme.fontWeight.semibold,
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.padding,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 8,
    minHeight: 44,
    ...cursor,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: theme.fontWeight.semibold,
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 1,
    flexShrink: 1,
  },
  sectionHeaderLink: {
    color: theme.linkBlue,
    textDecorationLine: 'underline' as const,
  },
  sectionHeaderFollowing: {
    fontSize: 13,
    fontWeight: theme.fontWeight.semibold,
    color: theme.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeaderLive: {
    fontSize: 13,
    fontWeight: theme.fontWeight.semibold,
    color: theme.red,
    paddingHorizontal: theme.spacing.padding,
    paddingTop: theme.spacing.padding,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Match Row — glass card
  matchRow: {
    marginHorizontal: theme.spacing.padding,
    marginVertical: 4,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: radii.card,
    backgroundColor: theme.glass,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    borderTopColor: theme.glassBorderTop,
    minHeight: 44,
    ...theme.glassCardShadow,
    ...webGlass,
    ...cursor,
  },
  matchRowLive: {
    backgroundColor: 'rgba(229,57,53,0.06)',
    borderLeftWidth: 3,
    borderLeftColor: theme.red,
  },
  matchInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Two-column responsive
  twoColRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 0,
  },
  twoColItem: {
    flex: 1,
  },

  // Player
  matchPlayer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    ...cursor,
  },
  matchPlayerRight: {
    justifyContent: 'flex-end',
  },
  playerName: {
    fontSize: 15,
    fontWeight: theme.fontWeight.medium,
    color: theme.text,
    flexShrink: 1,
  },
  playerNameWinner: {
    color: theme.winnerText,
    fontWeight: theme.fontWeight.bold,
  },
  playerNameLoser: {
    color: theme.loserText,
    fontWeight: theme.fontWeight.regular,
  },
  winnerBadge: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: theme.winnerDot,
  },

  // Score
  matchScore: {
    width: 90,
    alignItems: 'center',
    flexShrink: 0,
    minHeight: 44,
    justifyContent: 'center',
    ...cursor,
  },
  scoreLive: {
    fontSize: 16,
    fontWeight: theme.fontWeight.extrabold,
    color: theme.red,
  },
  scoreFt: {
    fontSize: 17,
    fontWeight: theme.fontWeight.extrabold,
    color: theme.text,
    letterSpacing: 2,
  },
  scoreTime: {
    fontSize: 15,
    fontWeight: theme.fontWeight.semibold,
    color: theme.textSecondary,
  },
  statusFt: {
    fontSize: theme.fontSize.small,
    color: theme.textSecondary,
    fontWeight: theme.fontWeight.regular,
    opacity: 0.5,
    marginTop: 2,
  },
  statusScheduled: {
    fontSize: theme.fontSize.small,
    color: theme.textSecondary,
    fontWeight: theme.fontWeight.regular,
    opacity: 0.5,
    marginTop: 2,
  },
  liveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  liveText: {
    fontSize: 11,
    fontWeight: theme.fontWeight.semibold,
    color: theme.red,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: theme.red,
  },

  // Round label
  matchRoundLabel: {
    fontSize: theme.fontSize.small,
    color: theme.textSecondary,
    fontWeight: theme.fontWeight.regular,
    opacity: 0.5,
    marginTop: 2,
  },

  // Court info
  courtInfo: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 6,
    paddingLeft: 42,
  },

  // Next round info
  nextRoundText: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  watchLink: {
    fontSize: 11,
    color: theme.linkBlue,
  },
  drawLink: {
    fontSize: 11,
    color: theme.linkBlue,
    marginTop: 2,
    ...cursor,
  },

  // Empty
  emptyWrap: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    color: theme.textMuted,
    fontSize: theme.fontSize.sectionTitle,
    fontWeight: theme.fontWeight.medium,
    marginBottom: 6,
  },
  emptySubtitle: {
    color: theme.textTertiary,
    fontSize: 13,
  },

  // Points pill
  pointsPill: {
    backgroundColor: theme.accent,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  pointsPillText: {
    color: theme.text,
    fontSize: 9,
    fontWeight: theme.fontWeight.bold,
  },
});
