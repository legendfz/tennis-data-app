import { View, Text, StyleSheet, FlatList } from 'react-native';
import { theme } from '../../lib/theme';

interface LeaderboardEntry {
  rank: number;
  username: string;
  teamName: string;
  points: number;
  isCurrentUser?: boolean;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, username: 'TennisKing', teamName: 'Grand Slam Squad', points: 342 },
  { rank: 2, username: 'AceHunter', teamName: 'Serve & Volley', points: 318 },
  { rank: 3, username: 'ClayMaster', teamName: 'Red Dirt Army', points: 295 },
  { rank: 4, username: 'NetRusher', teamName: 'Volley Kings', points: 278 },
  { rank: 5, username: 'BaselineB', teamName: 'Baseline Beasts', points: 264 },
  { rank: 6, username: 'TopSpinT', teamName: 'Spin Doctors', points: 251 },
  { rank: 7, username: 'DropShot', teamName: 'Touch Masters', points: 239 },
  { rank: 8, username: 'You', teamName: 'My Dream Team', points: 225, isCurrentUser: true },
  { rank: 9, username: 'BackhandW', teamName: 'Two-Handers', points: 212 },
  { rank: 10, username: 'ServeBot', teamName: 'Big Servers', points: 198 },
  { rank: 11, username: 'CourtKing', teamName: 'Court Conquerors', points: 185 },
  { rank: 12, username: 'RallyPro', teamName: 'Rally Masters', points: 172 },
  { rank: 13, username: 'MatchPt', teamName: 'Match Pointers', points: 158 },
  { rank: 14, username: 'GrassLover', teamName: 'Grass Gods', points: 142 },
  { rank: 15, username: 'Deuce40', teamName: 'Deuce Squad', points: 128 },
];

export default function LeaderboardScreen() {
  const renderItem = ({ item }: { item: LeaderboardEntry }) => {
    const isTop3 = item.rank <= 3;
    const medals = ['🥇', '🥈', '🥉'];

    return (
      <View
        style={[
          styles.row,
          item.isCurrentUser && styles.currentUserRow,
        ]}
      >
        <View style={styles.rankWrap}>
          {isTop3 ? (
            <Text style={styles.medal}>{medals[item.rank - 1]}</Text>
          ) : (
            <Text style={styles.rankText}>{item.rank}</Text>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text
            style={[
              styles.username,
              item.isCurrentUser && styles.currentUserText,
            ]}
          >
            {item.username}
            {item.isCurrentUser ? ' (You)' : ''}
          </Text>
          <Text style={styles.teamName}>{item.teamName}</Text>
        </View>
        <View style={styles.pointsWrap}>
          <Text
            style={[
              styles.points,
              item.isCurrentUser && { color: theme.accent },
            ]}
          >
            {item.points}
          </Text>
          <Text style={styles.ptsLabel}>pts</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={MOCK_LEADERBOARD}
        keyExtractor={(item) => item.rank.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerRank}>Rank</Text>
            <Text style={styles.headerUser}>Player</Text>
            <Text style={styles.headerPoints}>Points</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  list: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerRank: {
    width: 50,
    fontSize: 11,
    fontWeight: theme.fontWeight.semibold,
    color: theme.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerUser: {
    flex: 1,
    fontSize: 11,
    fontWeight: theme.fontWeight.semibold,
    color: theme.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerPoints: {
    width: 60,
    fontSize: 11,
    fontWeight: theme.fontWeight.semibold,
    color: theme.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currentUserRow: {
    backgroundColor: theme.accent + '15',
    borderLeftWidth: 3,
    borderLeftColor: theme.accent,
  },
  rankWrap: {
    width: 50,
    alignItems: 'flex-start',
  },
  rankText: {
    fontSize: 15,
    fontWeight: theme.fontWeight.bold,
    color: theme.textSecondary,
  },
  medal: {
    fontSize: 18,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: theme.fontWeight.semibold,
    color: theme.text,
  },
  currentUserText: {
    color: theme.accent,
  },
  teamName: {
    fontSize: theme.fontSize.secondary,
    color: theme.textSecondary,
    marginTop: 2,
  },
  pointsWrap: {
    width: 60,
    alignItems: 'flex-end',
  },
  points: {
    fontSize: 16,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
  },
  ptsLabel: {
    fontSize: 10,
    color: theme.textSecondary,
  },
  separator: {
    height: 0.5,
    backgroundColor: theme.border,
  },
});
