import React, { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import type { AudioShortcut, BrokerProfile, ShortcutsData, TextShortcut } from '../../types';
import { applyTemplate } from '../../utils/formatters';
import { makeStyles, radius, spacing } from '../theme';
import { ItemCard } from './ItemCard';

interface Props {
  shortcuts: ShortcutsData;
  broker: BrokerProfile;
  onInsert: (text: string) => void;
}

type ShortcutFilter = 'text' | 'audio';

/**
 * Atalhos — Mensagens criadas pelo próprio usuário para envio rápido (Texto e Áudio).
 */
export function ShortcutsTab({ shortcuts, broker, onInsert }: Props) {
  const styles = useStyles();
  const [filter, setFilter] = useState<ShortcutFilter>('text');

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        <Pressable
          style={[styles.filterBtn, filter === 'text' && styles.filterBtnActive]}
          onPress={() => setFilter('text')}>
          <Text style={[styles.filterLabel, filter === 'text' && styles.filterLabelActive]}>
            Mensagens de Texto ({shortcuts.texts.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterBtn, filter === 'audio' && styles.filterBtnActive]}
          onPress={() => setFilter('audio')}>
          <Text style={[styles.filterLabel, filter === 'audio' && styles.filterLabelActive]}>
            Áudios Rápidos ({shortcuts.audios.length})
          </Text>
        </Pressable>
      </View>

      {filter === 'text' ? (
        <FlatList
          data={shortcuts.texts}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="always"
          renderItem={({ item }: { item: TextShortcut }) => (
            <ItemCard
              testID={`shortcut-text-${item.id}`}
              title={item.title}
              subtitle={applyTemplate(item.text, broker)}
              onPress={() => onInsert(applyTemplate(item.text, broker))}
            />
          )}
        />
      ) : (
        <FlatList
          data={shortcuts.audios}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="always"
          renderItem={({ item }: { item: AudioShortcut }) => (
            <ItemCard
              testID={`shortcut-audio-${item.id}`}
              title={item.title}
              subtitle={item.transcript ? `"${item.transcript}"` : undefined}
              meta={item.duration || undefined}
              onPress={() =>
                onInsert(`[Áudio${item.duration ? ` ${item.duration}` : ''}] ${item.title}: ${item.audioUrl}`)
              }
            />
          )}
        />
      )}
    </View>
  );
}

const useStyles = makeStyles(colors => ({
  container: { flex: 1 },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceAlt,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  filterBtnActive: {
    backgroundColor: colors.surfaceAlt,
  },
  filterLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  filterLabelActive: {
    color: colors.text,
    fontWeight: '600',
  },
  list: { padding: spacing.sm },
}));
