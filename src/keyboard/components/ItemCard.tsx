import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

interface Props {
  testID?: string;
  title: string;
  subtitle?: string;
  meta?: string;
  onPress: () => void;
}

/**
 * Card minimalista sem bordas, cantos coloridos ou emojis.
 */
export const ItemCard = memo(({ testID, title, subtitle, meta, onPress }: Props) => (
  <Pressable
    testID={testID}
    onPress={onPress}
    android_ripple={{ color: colors.surfaceActive }}
    style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
    <View style={styles.body}>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text> : null}
    </View>
    {meta ? <Text style={styles.meta}>{meta}</Text> : null}
  </Pressable>
));

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    marginBottom: 6,
  },
  pressed: {
    backgroundColor: colors.surfaceAlt,
  },
  body: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
});
