import React, { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import type { AudioShortcut, SellerProfile, ShortcutsData, TextShortcut } from '../../types';
import { applyTemplate } from '../../utils/formatters';
import { makeStyles, radius, spacing } from '../theme';
import { ItemCard } from './ItemCard';

interface Props {
  shortcuts: ShortcutsData;
  seller: SellerProfile;
  onInsert: (text: string) => void;
  /** Compartilhamento do Android; fallbackText é inserido se falhar. */
  onShare: (urls: string[], fallbackText: string) => void;
}

const audioLink = (a: AudioShortcut) => `[Áudio${a.duration ? ` ${a.duration}` : ''}] ${a.title}: ${a.audioUrl}`;

type ShortcutFilter = 'text' | 'audio';

/**
 * Atalhos — Mensagens criadas pelo próprio usuário para envio rápido (Texto e Áudio).
 */
export function ShortcutsTab({ shortcuts, seller, onInsert, onShare }: Props) {
  const styles = useStyles();
  const [filter, setFilter] = useState<ShortcutFilter>('text');

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        <Pressable
          style={[styles.filterBtn, filter === 'text' && styles.filterBtnActive]}
          onPress={() => setFilter('text')}>
          <Text style={[styles.filterLabel, filter === 'text' && styles.filterLabelActive]}>
            Textos ({shortcuts.texts.length})
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
          ListEmptyComponent={<Text style={styles.empty}>Crie atalhos de texto no app KEYCON (aba Atalhos).</Text>}
          renderItem={({ item }: { item: TextShortcut }) => (
            <ItemCard
              testID={`shortcut-text-${item.id}`}
              title={item.title}
              subtitle={applyTemplate(item.text, seller)}
              icon="respostas"
              onPress={() => onInsert(applyTemplate(item.text, seller))}
            />
          )}
        />
      ) : (
        <FlatList
          data={shortcuts.audios}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="always"
          ListEmptyComponent={<Text style={styles.empty}>Cadastre áudios no app KEYCON (aba Atalhos).</Text>}
          ListHeaderComponent={
            shortcuts.audios.length > 0 ? (
              <Text style={styles.hint}>Toque: enviar o áudio • Segure: enviar o link</Text>
            ) : null
          }
          renderItem={({ item }: { item: AudioShortcut }) => (
            <ItemCard
              testID={`shortcut-audio-${item.id}`}
              title={item.title}
              subtitle={item.transcript ? `"${item.transcript}"` : undefined}
              meta={item.duration || undefined}
              icon="audio"
              onPress={() => onShare([item.audioUrl], audioLink(item))}
              onLongPress={() => onInsert(audioLink(item))}
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
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  filterBtn: {
    flex: 1,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  filterBtnActive: {
    backgroundColor: colors.primarySoft,
  },
  filterLabel: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  filterLabelActive: {
    color: colors.primaryText,
    fontWeight: '600',
  },
  list: { padding: spacing.sm },
  hint: { color: colors.textMuted, fontSize: 12, marginBottom: 6, textAlign: 'center' },
  empty: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: spacing.xl, paddingHorizontal: spacing.lg },
}));
