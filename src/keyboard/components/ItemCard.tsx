import React, { memo } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { glassBorder, makeStyles, radius, spacing, useColors } from '../theme';
import type { IconName } from './Icon';
import { IconTile } from './Icon';

interface Props {
  testID?: string;
  title: string;
  subtitle?: string;
  meta?: string;
  /** Ícone funcional à esquerda, no tile cinza-claro do manual. */
  icon?: IconName;
  /** Foto do produto em miniatura (substitui o ícone quando presente). */
  imageUri?: string;
  onPress: () => void;
  onLongPress?: () => void;
}

/**
 * Card de lista do KEYCON: superfície branca/grafite, sem bordas, raio de 12.
 */
export const ItemCard = memo(({ testID, title, subtitle, meta, icon, imageUri, onPress, onLongPress }: Props) => {
  const colors = useColors();
  const styles = useStyles();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      android_ripple={{ color: colors.surfaceActive }}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.thumbImage} resizeMode="cover" />
      ) : icon ? (
        <IconTile name={icon} size={36} />
      ) : null}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
    </Pressable>
  );
});

const useStyles = makeStyles(colors => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    ...glassBorder(colors),
    borderRadius: radius.md,
    minHeight: 56,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.surfaceAlt,
  },
  body: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  thumbImage: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
  },
}));
