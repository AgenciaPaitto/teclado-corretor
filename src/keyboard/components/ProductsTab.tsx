import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import type { SegmentProfile } from '../../segments/segments';
import type { MediaItem, Product, ProductFolder } from '../../types';
import { attributeLines, formatPrice, formatProductMessage } from '../../utils/formatters';
import { makeStyles, radius, spacing, touchTarget, useColors } from '../theme';
import { Icon } from './Icon';
import { ItemCard } from './ItemCard';

interface Props {
  folders: ProductFolder[];
  /** Ramo do usuário: preço, características e nomes da ficha. */
  segment: SegmentProfile;
  onInsert: (text: string) => void;
  /** Foto direto na conversa (cai no link se o app não aceitar). */
  onSendImage: (url: string, title: string) => void;
  /** Compartilhamento do Android; fallbackText é inserido se falhar. */
  onShare: (urls: string[], fallbackText: string) => void;
}

const photoLink = (m: MediaItem) => `[Foto] ${m.title}: ${m.url}`;
const videoLink = (m: MediaItem) => `[Vídeo] ${m.title}${m.duration ? ` (${m.duration})` : ''}: ${m.url}`;

type ProductDetailView = 'details' | 'photos' | 'videos';

/**
 * Aba de Produtos — Pastas com informações sobre cada produto (Fotos, vídeos e detalhes).
 * Mídias hospedadas em Cloud Object Storage sem ocupar armazenamento do dispositivo.
 */
export function ProductsTab({ folders, segment, onInsert, onSendImage, onShare }: Props) {
  const colors = useColors();
  const styles = useStyles();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<ProductDetailView>('details');

  const folder = folders.find(f => f.id === selectedFolderId);
  const product = folder?.products.find(p => p.id === selectedProductId);

  // 1. Nível 1: Lista de Pastas
  if (!folder) {
    return (
      <FlatList
        data={folders}
        keyExtractor={f => f.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="always"
        ListEmptyComponent={
          <Text style={styles.empty}>
            Nada por aqui ainda. Cadastre seus {segment.terms.items} no app KEYCON para enviá-los por este teclado.
          </Text>
        }
        renderItem={({ item }) => (
          <ItemCard
            testID={`folder-${item.id}`}
            title={item.name}
            subtitle={item.description}
            meta={`${item.products.length} itens`}
            icon="pasta"
            onPress={() => setSelectedFolderId(item.id)}
          />
        )}
      />
    );
  }

  // 2. Nível 2: Lista de Produtos dentro da Pasta selecionada
  if (!product) {
    return (
      <View style={styles.flex}>
        <Pressable testID="folder-back" onPress={() => setSelectedFolderId(null)} style={styles.breadcrumb}>
          <Icon name="voltar" size={18} color={colors.textMuted} />
          <Text style={styles.back}>Voltar</Text>
          <Text style={styles.crumbTitle} numberOfLines={1}>{folder.name}</Text>
        </Pressable>
        <FlatList
          data={folder.products}
          keyExtractor={p => p.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="always"
          renderItem={({ item }) => (
            <ItemCard
              testID={`product-${item.id}`}
              title={item.title}
              subtitle={item.shortDescription}
              meta={formatPrice(item, segment)}
              onPress={() => {
                setSelectedProductId(item.id);
                setActiveSubTab('details');
              }}
            />
          )}
        />
      </View>
    );
  }

  // 3. Nível 3: Detalhes, Fotos e Vídeos do Produto
  return (
    <View style={styles.flex}>
      <Pressable testID="product-back" onPress={() => setSelectedProductId(null)} style={styles.breadcrumb}>
        <Icon name="voltar" size={18} color={colors.textMuted} />
        <Text style={styles.back}>Voltar</Text>
        <Text style={styles.crumbTitle} numberOfLines={1}>{product.title}</Text>
      </Pressable>

      {/* Sub-abas do Produto: Detalhes, Fotos, Vídeos */}
      <View style={styles.subTabBar}>
        <Pressable
          style={[styles.subTab, activeSubTab === 'details' && styles.subTabActive]}
          onPress={() => setActiveSubTab('details')}>
          <Text style={[styles.subTabLabel, activeSubTab === 'details' && styles.subTabLabelActive]}>
            Detalhes
          </Text>
        </Pressable>
        <Pressable
          style={[styles.subTab, activeSubTab === 'photos' && styles.subTabActive]}
          onPress={() => setActiveSubTab('photos')}>
          <Text style={[styles.subTabLabel, activeSubTab === 'photos' && styles.subTabLabelActive]}>
            Fotos ({product.photos.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.subTab, activeSubTab === 'videos' && styles.subTabActive]}
          onPress={() => setActiveSubTab('videos')}>
          <Text style={[styles.subTabLabel, activeSubTab === 'videos' && styles.subTabLabelActive]}>
            Vídeos ({product.videos.length})
          </Text>
        </Pressable>
      </View>

      <View style={styles.productBody}>
        {activeSubTab === 'details' && (
          <ScrollView contentContainerStyle={styles.detailsContainer} keyboardShouldPersistTaps="always">
            <Text style={styles.productPrice}>{formatPrice(product, segment)}</Text>
            {attributeLines(product, segment).map(line => (
              <Text key={line} style={styles.productAttr}>
                {line}
              </Text>
            ))}
            <Text style={styles.productDesc}>{product.shortDescription}</Text>
            <Pressable
              style={styles.actionBtn}
              onPress={() => onInsert(formatProductMessage(product, folder, segment))}>
              <Text style={styles.actionBtnText}>Inserir ficha do {segment.terms.item}</Text>
            </Pressable>
          </ScrollView>
        )}

        {activeSubTab === 'photos' && (
          <FlatList
            data={product.photos}
            keyExtractor={photo => photo.id}
            contentContainerStyle={styles.mediaList}
            keyboardShouldPersistTaps="always"
            ListEmptyComponent={<Text style={styles.empty}>Nenhuma foto cadastrada.</Text>}
            ListHeaderComponent={
              product.photos.length > 1 ? (
                <Pressable
                  style={styles.actionBtn}
                  onPress={() =>
                    onShare(
                      product.photos.map(p => p.url),
                      product.photos.map(photoLink).join('\n'),
                    )
                  }>
                  <Text style={styles.actionBtnText}>Enviar todas as fotos ({product.photos.length})</Text>
                </Pressable>
              ) : null
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.mediaCard}
                onPress={() => onSendImage(item.url, item.title)}
                onLongPress={() => onInsert(photoLink(item))}>
                <Icon name="foto" size={20} />
                <View style={styles.flex}>
                  <Text style={styles.mediaTitle}>{item.title}</Text>
                  <Text style={styles.mediaMeta}>Toque: enviar a foto • Segure: enviar o link</Text>
                </View>
              </Pressable>
            )}
          />
        )}

        {activeSubTab === 'videos' && (
          <FlatList
            data={product.videos}
            keyExtractor={video => video.id}
            contentContainerStyle={styles.mediaList}
            keyboardShouldPersistTaps="always"
            ListEmptyComponent={<Text style={styles.empty}>Nenhum vídeo cadastrado.</Text>}
            renderItem={({ item }) => (
              <Pressable
                style={styles.mediaCard}
                onPress={() => onShare([item.url], videoLink(item))}
                onLongPress={() => onInsert(videoLink(item))}>
                <Icon name="video" size={20} />
                <View style={styles.flex}>
                  <Text style={styles.mediaTitle}>{item.title}</Text>
                  <Text style={styles.mediaMeta}>
                    {item.duration ? `${item.duration} • ` : ''}Toque: enviar o vídeo • Segure: enviar o link
                  </Text>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles(colors => ({
  flex: { flex: 1 },
  list: { padding: spacing.sm },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl, fontSize: 13 },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: touchTarget,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.bg,
  },
  back: { color: colors.textMuted, fontWeight: '600', fontSize: 13, marginRight: spacing.sm },
  crumbTitle: { color: colors.text, fontWeight: '600', fontSize: 15, flex: 1 },
  subTabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    gap: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  subTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    borderRadius: radius.sm,
  },
  subTabActive: {
    backgroundColor: colors.primarySoft,
  },
  subTabLabel: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  subTabLabelActive: {
    color: colors.primaryText,
    fontWeight: '600',
  },
  productBody: {
    flex: 1,
    padding: spacing.sm,
  },
  detailsContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  productPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  productAttr: {
    fontSize: 13,
    color: colors.text,
  },
  productDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  actionBtn: {
    backgroundColor: colors.primary,
    minHeight: touchTarget,
    justifyContent: 'center',
    borderRadius: radius.sm,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 6,
  },
  actionBtnText: {
    color: colors.onPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  mediaList: {
    gap: 6,
  },
  mediaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  mediaTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  mediaMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
}));
