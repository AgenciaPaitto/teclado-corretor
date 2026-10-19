import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import type { BrokerProfile, QuickReply } from '../../types';
import { applyTemplate } from '../../utils/formatters';
import { spacing } from '../theme';
import { ItemCard } from './ItemCard';

interface Props {
  replies: QuickReply[];
  broker: BrokerProfile;
  onInsert: (text: string) => void;
}

/**
 * Respostas Rápidas minimalistas — sem emojis, bordas ou cores chamativas.
 */
export function QuickRepliesTab({ replies, broker, onInsert }: Props) {
  return (
    <FlatList
      data={replies}
      keyExtractor={r => r.id}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="always"
      renderItem={({ item }) => {
        const text = applyTemplate(item.body, broker);
        return (
          <ItemCard
            testID={`quick-${item.id}`}
            title={item.title}
            subtitle={text}
            onPress={() => onInsert(text)}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({ list: { padding: spacing.sm } });
