import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from './theme';

interface EmptyStateProps {
  message?: string;
  icon?: string;
  subtitle?: string;
  illustration?: React.ReactNode;
}

export function EmptyState({
  message = 'No results found',
  subtitle,
  illustration,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {illustration && <View style={styles.illustrationWrap}>{illustration}</View>}
      <Text style={styles.message}>{message}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 200,
  },
  illustrationWrap: {
    marginBottom: 12,
  },
  message: {
    fontSize: theme.fontSize.sectionTitle,
    fontWeight: theme.fontWeight.medium,
    color: theme.textMuted,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: theme.textTertiary,
    textAlign: 'center',
  },
});
