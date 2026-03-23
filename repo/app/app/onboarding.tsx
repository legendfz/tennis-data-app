import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlayerAvatar } from '../lib/player-avatar';
import { TennisBallIcon, EmptyMatchesIllustration } from '../lib/illustrations';
import { theme, radii } from '../lib/theme';
import { LANGUAGE_OPTIONS, SupportedLanguage } from '../lib/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ONBOARDING_KEY = '@tennishq_onboarding_completed';

const TOP_PLAYERS = [
  { id: 1, name: 'Jannik Sinner', ranking: 1, country: '🇮🇹' },
  { id: 2, name: 'Novak Djokovic', ranking: 2, country: '🇷🇸' },
  { id: 3, name: 'Carlos Alcaraz', ranking: 3, country: '🇪🇸' },
  { id: 4, name: 'Alexander Zverev', ranking: 4, country: '🇩🇪' },
  { id: 5, name: 'Daniil Medvedev', ranking: 5, country: '🇷🇺' },
  { id: 6, name: 'Andrey Rublev', ranking: 6, country: '🇷🇺' },
  { id: 7, name: 'Hubert Hurkacz', ranking: 7, country: '🇵🇱' },
  { id: 8, name: 'Casper Ruud', ranking: 8, country: '🇳🇴' },
  { id: 9, name: 'Alex de Minaur', ranking: 9, country: '🇦🇺' },
  { id: 10, name: 'Grigor Dimitrov', ranking: 10, country: '🇧🇬' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('auto');

  const goToStep = (step: number) => {
    setCurrentStep(step);
    scrollRef.current?.scrollTo({ x: step * SCREEN_WIDTH, animated: true });
  };

  const togglePlayer = (id: number) => {
    setSelectedPlayers((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : prev.length < 5
          ? [...prev, id]
          : prev
    );
  };

  const handleComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    // Save selected players as favorites
    if (selectedPlayers.length > 0) {
      await AsyncStorage.setItem('@tennishq_favorites', JSON.stringify(selectedPlayers));
    }
    // Save language preference
    if (selectedLanguage !== 'auto') {
      await AsyncStorage.setItem('@tennishq_language', selectedLanguage);
    }
    router.replace('/(tabs)');
  };

  const steps = [
    // Step 1: Follow Players
    <View key="players" style={styles.step}>
      <View style={styles.iconWrap}>
        <TennisBallIcon size={60} />
      </View>
      <Text style={styles.stepTitle}>Follow Your Players</Text>
      <Text style={styles.stepSubtitle}>Select 3-5 players to follow their matches</Text>
      <ScrollView style={styles.playerList} showsVerticalScrollIndicator={false}>
        {TOP_PLAYERS.map((p) => {
          const isSelected = selectedPlayers.includes(p.id);
          return (
            <TouchableOpacity
              key={p.id}
              style={[styles.playerRow, isSelected && styles.playerRowSelected]}
              onPress={() => togglePlayer(p.id)}
              activeOpacity={0.7}
            >
              <PlayerAvatar name={p.name} size={44} ranking={p.ranking} />
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{p.name}</Text>
                <Text style={styles.playerMeta}>#{p.ranking} {p.country}</Text>
              </View>
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <Text style={styles.selectionCount}>{selectedPlayers.length}/5 selected</Text>
    </View>,

    // Step 2: Language
    <View key="language" style={styles.step}>
      <View style={styles.iconWrap}>
        <Text style={styles.bigEmoji}>🌍</Text>
      </View>
      <Text style={styles.stepTitle}>Choose Language</Text>
      <Text style={styles.stepSubtitle}>Select your preferred language</Text>
      <View style={styles.langGrid}>
        {LANGUAGE_OPTIONS.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.langOption,
              selectedLanguage === lang.code && styles.langOptionSelected,
            ]}
            onPress={() => setSelectedLanguage(lang.code)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.langText,
              selectedLanguage === lang.code && styles.langTextSelected,
            ]}>
              {lang.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>,

    // Step 3: Ready
    <View key="ready" style={styles.step}>
      <View style={styles.iconWrap}>
        <EmptyMatchesIllustration size={120} />
      </View>
      <Text style={styles.stepTitle}>Ready to Go!</Text>
      <Text style={styles.stepSubtitle}>
        Your TennisHQ is set up. Follow live scores, explore player stats, and never miss a match.
      </Text>
      <View style={styles.readySummary}>
        {selectedPlayers.length > 0 && (
          <Text style={styles.readyItem}>
            ✅ Following {selectedPlayers.length} players
          </Text>
        )}
        <Text style={styles.readyItem}>
          ✅ Language: {LANGUAGE_OPTIONS.find((l) => l.code === selectedLanguage)?.label || 'Auto'}
        </Text>
      </View>
    </View>,
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.scroll}
      >
        {steps.map((step, i) => (
          <View key={i} style={{ width: SCREEN_WIDTH }}>
            {step}
          </View>
        ))}
      </ScrollView>

      {/* Bottom: dots + button */}
      <View style={styles.bottom}>
        <View style={styles.dots}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, currentStep === i && styles.dotActive]}
            />
          ))}
        </View>
        {currentStep < steps.length - 1 ? (
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleComplete}
              activeOpacity={0.7}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={() => goToStep(currentStep + 1)}
              activeOpacity={0.7}
            >
              <Text style={styles.nextText}>Next</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.startBtn}
            onPress={handleComplete}
            activeOpacity={0.7}
          >
            <Text style={styles.startText}>Get Started 🎾</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export { ONBOARDING_KEY };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  scroll: { flex: 1 },
  step: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  iconWrap: { marginBottom: 24 },
  bigEmoji: { fontSize: 60 },
  stepTitle: {
    fontSize: 26,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  // Player list
  playerList: {
    width: '100%',
    maxHeight: 380,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: theme.glass,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    gap: 12,
  },
  playerRowSelected: {
    backgroundColor: 'rgba(22,163,74,0.1)',
    borderColor: theme.accent,
  },
  playerInfo: { flex: 1 },
  playerName: {
    fontSize: 15,
    fontWeight: theme.fontWeight.semibold,
    color: theme.text,
  },
  playerMeta: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: theme.fontWeight.bold,
  },
  selectionCount: {
    color: theme.textSecondary,
    fontSize: 13,
    marginTop: 12,
  },

  // Language grid
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  langOption: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: theme.glass,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    minWidth: 90,
    alignItems: 'center',
  },
  langOptionSelected: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  langText: {
    fontSize: 16,
    fontWeight: theme.fontWeight.semibold,
    color: theme.text,
  },
  langTextSelected: {
    color: '#fff',
  },

  // Ready
  readySummary: {
    marginTop: 20,
    gap: 8,
  },
  readyItem: {
    fontSize: 14,
    color: theme.text,
  },

  // Bottom
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 16,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.border,
  },
  dotActive: {
    backgroundColor: theme.accent,
    width: 24,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: theme.glass,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    fontWeight: theme.fontWeight.semibold,
    color: theme.textSecondary,
  },
  nextBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: theme.accent,
    alignItems: 'center',
  },
  nextText: {
    fontSize: 16,
    fontWeight: theme.fontWeight.bold,
    color: '#fff',
  },
  startBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: theme.accent,
    alignItems: 'center',
  },
  startText: {
    fontSize: 16,
    fontWeight: theme.fontWeight.bold,
    color: '#fff',
  },
});
