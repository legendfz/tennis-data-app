import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../lib/theme';
import api from '../../lib/api';

interface PredictionTournament {
  id: number;
  name: string;
  status: 'open' | 'in_progress' | 'completed';
  surface: string;
  emoji: string;
  startDate: string;
  endDate: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open: { label: 'Open for Predictions', color: theme.accent },
  in_progress: { label: 'In Progress', color: theme.gold },
  completed: { label: 'Completed', color: theme.textSecondary },
};

export default function PredictionsScreen() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<PredictionTournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const res = await api.get('/api/fantasy/predictions/tournaments');
      setTournaments(res.data.data);
    } catch {
      console.error('Failed to load prediction tournaments');
    } finally {
      setLoading(false);
    }
  };

  const handlePress = (t: PredictionTournament) => {
    if (t.status === 'completed') {
      router.push(`/fantasy/predict-result/${t.id}` as any);
    } else {
      router.push(`/fantasy/predict/${t.id}` as any);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.subtitle}>
          Predict the QF → Champion bracket for Grand Slams and earn points!
        </Text>

        {tournaments.map((t) => {
          const statusCfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.open;
          return (
            <TouchableOpacity
              key={t.id}
              style={styles.card}
              activeOpacity={theme.activeOpacity}
              onPress={() => handlePress(t)}
            >
              <View style={styles.cardRow}>
                <Text style={styles.emoji}>{t.emoji}</Text>
                <View style={styles.cardInfo}>
                  <Text style={styles.tournamentName}>{t.name}</Text>
                  <Text style={styles.meta}>
                    {t.surface} · {t.startDate} → {t.endDate}
                  </Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + '20' }]}>
                <Text style={[styles.statusText, { color: statusCfg.color }]}>
                  {statusCfg.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  center: {
    flex: 1,
    backgroundColor: theme.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    padding: theme.spacing.padding,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: theme.fontSize.secondary,
    color: theme.textSecondary,
    marginBottom: 16,
  },
  card: {
    backgroundColor: theme.glass,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  emoji: {
    fontSize: 32,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  tournamentName: {
    fontSize: 16,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
    marginBottom: 3,
  },
  meta: {
    fontSize: theme.fontSize.secondary,
    color: theme.textSecondary,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: theme.fontWeight.semibold,
  },
});
