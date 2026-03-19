import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../../lib/theme';
import { SCORING_RULES, SCORING_DESCRIPTIONS, formatValue, BUDGET_TOTAL } from '../../lib/fantasy';

export default function RulesScreen() {
  const rules = Object.entries(SCORING_RULES).map(([key, value]) => ({
    key,
    label: SCORING_DESCRIPTIONS[key] || key,
    points: value,
  }));

  const budgetTiers = [
    { range: '#1 – #5', value: '$15M' },
    { range: '#6 – #10', value: '$12M' },
    { range: '#11 – #20', value: '$10M' },
    { range: '#21 – #50', value: '$7M' },
    { range: '#51 – #100', value: '$5M' },
  ];

  const faqs = [
    {
      q: 'How many players can I pick?',
      a: 'You must select exactly 5 players for your fantasy team.',
    },
    {
      q: 'Can I change my team?',
      a: 'Yes! You can edit your team at any time before the tournament starts.',
    },
    {
      q: 'How are points calculated?',
      a: 'Points are awarded based on your players\' match results, aces, break points, and tournament performance.',
    },
    {
      q: 'What happens if a player withdraws?',
      a: 'If a player withdraws, they will receive 0 points for remaining matches. You can swap them out if the edit window is still open.',
    },
    {
      q: 'What is the budget?',
      a: `You have a total budget of ${formatValue(BUDGET_TOTAL)} to spend on your 5 players. Player values are determined by their current ranking.`,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Scoring Rules */}
      <Text style={styles.sectionTitle}>Scoring Rules</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, { flex: 1 }]}>Action</Text>
          <Text style={[styles.headerCell, { width: 80, textAlign: 'right' }]}>Points</Text>
        </View>
        {rules.map((rule) => (
          <View key={rule.key} style={styles.tableRow}>
            <Text style={[styles.cell, { flex: 1 }]}>{rule.label}</Text>
            <Text
              style={[
                styles.cell,
                styles.pointsCell,
                { color: rule.points >= 0 ? theme.accent : theme.red },
              ]}
            >
              {rule.points > 0 ? '+' : ''}
              {rule.points}
            </Text>
          </View>
        ))}
      </View>

      {/* Budget System */}
      <Text style={styles.sectionTitle}>Budget System</Text>
      <View style={styles.card}>
        <Text style={styles.cardText}>
          Total budget: <Text style={styles.highlight}>{formatValue(BUDGET_TOTAL)}</Text>
        </Text>
        <Text style={styles.cardSubtext}>
          Player values are determined by their current ATP/WTA ranking.
        </Text>
      </View>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, { flex: 1 }]}>Ranking</Text>
          <Text style={[styles.headerCell, { width: 80, textAlign: 'right' }]}>Value</Text>
        </View>
        {budgetTiers.map((tier) => (
          <View key={tier.range} style={styles.tableRow}>
            <Text style={[styles.cell, { flex: 1 }]}>{tier.range}</Text>
            <Text style={[styles.cell, styles.valueCell]}>{tier.value}</Text>
          </View>
        ))}
      </View>

      {/* FAQ */}
      <Text style={styles.sectionTitle}>FAQ</Text>
      {faqs.map((faq, i) => (
        <View key={i} style={styles.faqItem}>
          <Text style={styles.faqQuestion}>{faq.q}</Text>
          <Text style={styles.faqAnswer}>{faq.a}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
    marginTop: 20,
    marginBottom: 12,
  },
  table: {
    backgroundColor: theme.card,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: theme.cardAlt,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerCell: {
    fontSize: 11,
    fontWeight: theme.fontWeight.semibold,
    color: theme.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
  },
  cell: {
    fontSize: 14,
    color: theme.text,
  },
  pointsCell: {
    width: 80,
    textAlign: 'right',
    fontWeight: theme.fontWeight.bold,
  },
  valueCell: {
    width: 80,
    textAlign: 'right',
    fontWeight: theme.fontWeight.bold,
    color: theme.gold,
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardText: {
    fontSize: 15,
    color: theme.text,
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  highlight: {
    color: theme.accent,
    fontWeight: theme.fontWeight.bold,
  },
  faqItem: {
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: theme.fontWeight.semibold,
    color: theme.text,
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 19,
  },
});
