import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Repo } from '../../storage/storage';
import type { MediaItem, Product, ProductFolder } from '../../types';
import { formatBRL, formatPrice, normalizeUrl, parseBRL } from '../../utils/formatters';
import { makeStyles, radius, spacing, touchTarget, typography, useColors } from '../../keyboard/theme';
import { Icon, IconTile } from '../../keyboard/components/Icon';

/** Formulário de pasta: id null = criando uma pasta nova. */
interface FolderForm {
  id: string | null;
  name: string;
  neighborhood: string;
}

/** Formulário de imóvel: id null = criando um imóvel novo. */
interface ProductForm {
  id: string | null;
  title: string;
  price: string;
  dealType: 'venda' | 'locacao';
  bedrooms: string;
  area: string;
  desc: string;
  datasheetUrl: string;
}

interface MediaForm {
  type: MediaItem['type'];
  title: string;
  url: string;
  duration: string;
}

const EMPTY_PRODUCT_FORM: ProductForm = {
  id: null,
  title: '',
  price: '',
  dealType: 'venda',
  bedrooms: '',
  area: '',
  desc: '',
  datasheetUrl: '',
};

function productToForm(p: Product): ProductForm {
  return {
    id: p.id,
    title: p.title,
    price: formatBRL(p.price).replace('R$ ', ''),
    dealType: p.dealType ?? 'venda',
    bedrooms: p.bedrooms ? String(p.bedrooms) : '',
    area: p.areaM2 ? String(p.areaM2) : '',
    desc: p.shortDescription,
    datasheetUrl: p.datasheetUrl,
  };
}

function confirmDelete(title: string, message: string, onConfirm: () => void) {
  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Excluir', style: 'destructive', onPress: onConfirm },
  ]);
}

export function ProductsManagerScreen() {
  const colors = useColors();
  const styles = useStyles();
  const [folders, setFolders] = useState<ProductFolder[]>(() => Repo.getFolders());
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const [folderForm, setFolderForm] = useState<FolderForm | null>(null);
  const [productForm, setProductForm] = useState<ProductForm | null>(null);
  const [mediaForm, setMediaForm] = useState<MediaForm | null>(null);

  const refreshFolders = () => {
    setFolders(Repo.getFolders());
  };

  const folder = folders.find(f => f.id === selectedFolderId);
  const product = folder?.products.find(p => p.id === selectedProductId);

  const openFolder = (id: string | null) => {
    setSelectedFolderId(id);
    setFolderForm(null);
    setProductForm(null);
  };

  const openProduct = (id: string | null) => {
    setSelectedProductId(id);
    setProductForm(null);
    setMediaForm(null);
  };

  // ---------------------------------------------------------------------
  // Pastas
  // ---------------------------------------------------------------------

  const handleSaveFolder = () => {
    if (!folderForm) return;
    const name = folderForm.name.trim();
    if (!name) {
      Alert.alert('Atenção', 'Informe o nome da pasta.');
      return;
    }
    const neighborhood = folderForm.neighborhood.trim() || undefined;

    if (folderForm.id) {
      Repo.updateFolder(folderForm.id, { name, neighborhood });
    } else {
      Repo.addFolder({ id: `folder-${Date.now()}`, name, neighborhood, products: [] });
    }
    refreshFolders();
    setFolderForm(null);
    Alert.alert('Sucesso', folderForm.id ? 'Pasta atualizada!' : 'Pasta criada e sincronizada com o teclado!');
  };

  const handleDeleteFolder = (f: ProductFolder) => {
    const count = f.products.length;
    confirmDelete(
      'Excluir pasta',
      count > 0
        ? `A pasta "${f.name}" e os ${count} imóveis dentro dela serão excluídos. Deseja continuar?`
        : `Deseja excluir a pasta "${f.name}"?`,
      () => {
        Repo.deleteFolder(f.id);
        refreshFolders();
        openFolder(null);
      },
    );
  };

  // ---------------------------------------------------------------------
  // Imóveis
  // ---------------------------------------------------------------------

  const handleSaveProduct = () => {
    if (!selectedFolderId || !productForm) return;
    if (!productForm.title.trim()) {
      Alert.alert('Atenção', 'Informe o título do imóvel.');
      return;
    }

    const priceNum = parseBRL(productForm.price);
    if (priceNum === null) {
      Alert.alert('Atenção', 'Informe um valor válido. Ex: 850.000 ou 850.000,00');
      return;
    }

    let datasheetUrl = '';
    if (productForm.datasheetUrl.trim()) {
      const url = normalizeUrl(productForm.datasheetUrl);
      if (!url) {
        Alert.alert('Atenção', 'O link da ficha não parece válido. Ex: https://seusite.com.br/imovel/123');
        return;
      }
      datasheetUrl = url;
    }

    const existing = productForm.id ? folder?.products.find(p => p.id === productForm.id) : undefined;
    const saved: Product = {
      id: existing?.id ?? `prod-${Date.now()}`,
      title: productForm.title.trim(),
      price: priceNum,
      dealType: productForm.dealType,
      bedrooms: parseInt(productForm.bedrooms, 10) || undefined,
      areaM2: parseInt(productForm.area, 10) || undefined,
      shortDescription: productForm.desc.trim() || 'Excelente oportunidade.',
      datasheetUrl,
      photos: existing?.photos ?? [],
      videos: existing?.videos ?? [],
    };

    if (existing) {
      Repo.updateProduct(selectedFolderId, saved);
    } else {
      Repo.addProduct(selectedFolderId, saved);
    }
    refreshFolders();
    setProductForm(null);
    Alert.alert('Sucesso', existing ? 'Imóvel atualizado!' : 'Produto adicionado e sincronizado com o teclado!');
  };

  const handleDeleteProduct = (p: Product) => {
    if (!selectedFolderId) return;
    const folderId = selectedFolderId;
    confirmDelete('Excluir imóvel', `Deseja excluir "${p.title}" com suas fotos e vídeos?`, () => {
      Repo.deleteProduct(folderId, p.id);
      refreshFolders();
      openProduct(null);
    });
  };

  // ---------------------------------------------------------------------
  // Fotos e vídeos (links)
  // ---------------------------------------------------------------------

  const handleSaveMedia = () => {
    if (!selectedFolderId || !selectedProductId || !mediaForm) return;
    const url = normalizeUrl(mediaForm.url);
    if (!url) {
      Alert.alert('Atenção', 'Cole um link válido. Ex: https://drive.google.com/...');
      return;
    }

    const isImage = mediaForm.type === 'image';
    const media: MediaItem = {
      id: `${isImage ? 'photo' : 'video'}-${Date.now()}`,
      type: mediaForm.type,
      title: mediaForm.title.trim() || (isImage ? 'Foto do imóvel' : 'Vídeo do imóvel'),
      url,
      duration: isImage ? undefined : mediaForm.duration.trim() || undefined,
    };

    Repo.addMedia(selectedFolderId, selectedProductId, media);
    refreshFolders();
    setMediaForm(null);
  };

  const handleDeleteMedia = (m: MediaItem) => {
    if (!selectedFolderId || !selectedProductId) return;
    const folderId = selectedFolderId;
    const productId = selectedProductId;
    confirmDelete(m.type === 'image' ? 'Excluir foto' : 'Excluir vídeo', `Deseja remover "${m.title}"?`, () => {
      Repo.deleteMedia(folderId, productId, m.id);
      refreshFolders();
    });
  };

  // ---------------------------------------------------------------------
  // Formulários reaproveitados (criar e editar)
  // ---------------------------------------------------------------------

  const renderFolderForm = (form: FolderForm) => (
    <View style={styles.newFolderBox}>
      <Text style={styles.sectionTitle}>{form.id ? 'Editar Pasta' : 'Criar Nova Pasta / Condomínio'}</Text>
      <Text style={styles.label}>Nome da Pasta</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Condomínio Bosque dos Ipês"
        placeholderTextColor={colors.textMuted}
        value={form.name}
        onChangeText={name => setFolderForm({ ...form, name })}
      />
      <Text style={styles.label}>Bairro / Região</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Jardim Europa"
        placeholderTextColor={colors.textMuted}
        value={form.neighborhood}
        onChangeText={neighborhood => setFolderForm({ ...form, neighborhood })}
      />
      <View style={styles.formBtnsRow}>
        <Pressable style={styles.cancelBtn} onPress={() => setFolderForm(null)}>
          <Text style={styles.cancelBtnText}>Cancelar</Text>
        </Pressable>
        <Pressable style={styles.saveBtn} onPress={handleSaveFolder}>
          <Text style={styles.saveBtnText}>{form.id ? 'Salvar Pasta' : 'Criar Pasta'}</Text>
        </Pressable>
      </View>
    </View>
  );

  // Na tela de detalhes o formulário já está dentro de um ScrollView
  const renderProductForm = (form: ProductForm, folderName: string, insideScroll = false) => {
    const Container = insideScroll ? View : ScrollView;
    return (
      <Container
        style={insideScroll ? styles.card : styles.formContainer}
        {...(insideScroll ? {} : { keyboardShouldPersistTaps: 'handled' as const })}>
        <Text style={styles.sectionTitle}>
          {form.id ? 'Editar Imóvel' : `Novo Produto em ${folderName}`}
        </Text>
        <Text style={styles.label}>Título do Imóvel</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Apartamento 3 dormitórios com varanda"
          placeholderTextColor={colors.textMuted}
          value={form.title}
          onChangeText={title => setProductForm({ ...form, title })}
        />

        <Text style={styles.label}>Negócio</Text>
        <View style={styles.segmentRow}>
          {(
            [
              { key: 'venda', label: 'Venda' },
              { key: 'locacao', label: 'Locação' },
            ] as const
          ).map(opt => (
            <Pressable
              key={opt.key}
              style={[styles.segmentBtn, form.dealType === opt.key && styles.segmentBtnActive]}
              onPress={() => setProductForm({ ...form, dealType: opt.key })}>
              <Text style={[styles.segmentText, form.dealType === opt.key && styles.segmentTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>{form.dealType === 'locacao' ? 'Aluguel mensal (R$)' : 'Valor (R$)'}</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 850.000,00"
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
          value={form.price}
          onChangeText={price => setProductForm({ ...form, price })}
        />

        <Text style={styles.label}>Dormitórios</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 3"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={form.bedrooms}
          onChangeText={bedrooms => setProductForm({ ...form, bedrooms })}
        />

        <Text style={styles.label}>Área Privativa (m²)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 115"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={form.area}
          onChangeText={area => setProductForm({ ...form, area })}
        />

        <Text style={styles.label}>Descrição Rápida</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Resumo dos diferenciais do imóvel"
          placeholderTextColor={colors.textMuted}
          multiline
          value={form.desc}
          onChangeText={desc => setProductForm({ ...form, desc })}
        />

        <Text style={styles.label}>Link da ficha completa (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: https://seusite.com.br/imovel/123"
          placeholderTextColor={colors.textMuted}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          value={form.datasheetUrl}
          onChangeText={datasheetUrl => setProductForm({ ...form, datasheetUrl })}
        />
        <Text style={styles.hint}>Vai no final da mensagem "Inserir Ficha Completa" do teclado.</Text>

        <View style={styles.formBtnsRow}>
          <Pressable style={styles.cancelBtn} onPress={() => setProductForm(null)}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </Pressable>
          <Pressable style={styles.saveBtn} onPress={handleSaveProduct}>
            <Text style={styles.saveBtnText}>Salvar Imóvel</Text>
          </Pressable>
        </View>
      </Container>
    );
  };

  const renderMediaSection = (type: MediaItem['type'], items: MediaItem[]) => {
    const isImage = type === 'image';
    const form = mediaForm?.type === type ? mediaForm : null;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.sectionTitle}>
            {isImage ? 'Fotos' : 'Vídeos'} ({items.length})
          </Text>
          <Pressable
            style={styles.smallAddBtn}
            onPress={() => setMediaForm({ type, title: '', url: '', duration: '' })}>
            <Icon name="adicionar" size={16} color={colors.text} />
            <Text style={styles.smallAddBtnText}>Adicionar link</Text>
          </Pressable>
        </View>

        {form && (
          <View style={styles.uploadBox}>
            <Text style={styles.label}>{isImage ? 'Título / Cômodo da Foto' : 'Título do Vídeo'}</Text>
            <TextInput
              style={styles.input}
              placeholder={isImage ? 'Ex: Fachada, Suíte Master, Piscina' : 'Ex: Tour completo'}
              placeholderTextColor={colors.textMuted}
              value={form.title}
              onChangeText={title => setMediaForm({ ...form, title })}
            />
            <Text style={styles.label}>Link</Text>
            <TextInput
              style={styles.input}
              placeholder={isImage ? 'Cole o link direto da foto (.jpg, .png)' : 'Cole o link do vídeo (.mp4) ou do YouTube'}
              placeholderTextColor={colors.textMuted}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              value={form.url}
              onChangeText={url => setMediaForm({ ...form, url })}
            />
            {!isImage && (
              <>
                <Text style={styles.label}>Duração (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 1:45"
                  placeholderTextColor={colors.textMuted}
                  value={form.duration}
                  onChangeText={duration => setMediaForm({ ...form, duration })}
                />
              </>
            )}
            <View style={styles.formBtnsRow}>
              <Pressable style={styles.cancelBtn} onPress={() => setMediaForm(null)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={handleSaveMedia}>
                <Text style={styles.saveBtnText}>Salvar Link</Text>
              </Pressable>
            </View>
          </View>
        )}

        {items.length === 0 ? (
          <Text style={styles.emptyText}>
            {isImage ? 'Nenhuma foto cadastrada ainda.' : 'Nenhum vídeo cadastrado ainda.'}
          </Text>
        ) : (
          items.map(m => (
            <View key={m.id} style={styles.mediaItemRow}>
              <View style={styles.mediaInfo}>
                <Text style={styles.mediaTitle}>
                  {m.title}
                  {m.duration ? ` (${m.duration})` : ''}
                </Text>
                <Text style={styles.mediaUrl} numberOfLines={1}>{m.url}</Text>
              </View>
              <Pressable hitSlop={8} onPress={() => handleDeleteMedia(m)}>
                <Text style={styles.deleteText}>Excluir</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>
    );
  };

  // 1. Visão de Detalhes do Produto & Fotos
  if (folder && product) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Pressable style={styles.backBtn} onPress={() => openProduct(null)}>
          <Icon name="voltar" size={18} color={colors.textMuted} />
          <Text style={styles.backBtnText}>Voltar aos produtos de {folder.name}</Text>
        </Pressable>

        {productForm ? (
          renderProductForm(productForm, folder.name, true)
        ) : (
          <View style={styles.card}>
            <Text style={styles.badge}>Produto / Imóvel</Text>
            <Text style={styles.title}>{product.title}</Text>
            <Text style={styles.price}>{formatPrice(product)}</Text>
            <Text style={styles.desc}>{product.shortDescription}</Text>
            <Text style={styles.mediaUrl} numberOfLines={1}>
              {product.datasheetUrl ? `Ficha: ${product.datasheetUrl}` : 'Sem link da ficha'}
            </Text>
            <View style={styles.formBtnsRow}>
              <Pressable style={styles.cancelBtn} onPress={() => setProductForm(productToForm(product))}>
                <Text style={styles.cancelBtnText}>Editar</Text>
              </Pressable>
              <Pressable style={styles.dangerBtn} onPress={() => handleDeleteProduct(product)}>
                <Text style={styles.dangerBtnText}>Excluir</Text>
              </Pressable>
            </View>
          </View>
        )}

        <Text style={styles.cloudInfo}>
          Cole o link direto do arquivo (que abre só a foto ou o vídeo, ex.: terminado em .jpg ou .mp4). No WhatsApp
          o teclado envia a própria foto na conversa; vídeos vão pelo compartilhamento. Links de página (YouTube,
          pasta do Drive) são enviados como link.
        </Text>

        {renderMediaSection('image', product.photos)}
        {renderMediaSection('video', product.videos)}
      </ScrollView>
    );
  }

  // 2. Visão de Produtos dentro de uma Pasta
  if (folder) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <Pressable style={styles.headerBack} hitSlop={8} onPress={() => openFolder(null)}>
            <Icon name="voltar" size={18} color={colors.textMuted} />
            <Text style={styles.backBtnText}>Pastas</Text>
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{folder.name}</Text>
          <Pressable
            style={styles.addBtn}
            onPress={() => {
              setFolderForm(null);
              setProductForm(EMPTY_PRODUCT_FORM);
            }}>
            <Icon name="adicionar" size={18} color={colors.onPrimary} />
            <Text style={styles.addBtnText}>Novo Imóvel</Text>
          </Pressable>
        </View>

        <View style={styles.folderActions}>
          <Pressable
            hitSlop={6}
            onPress={() => {
              setProductForm(null);
              setFolderForm({ id: folder.id, name: folder.name, neighborhood: folder.neighborhood ?? '' });
            }}>
            <Text style={styles.linkText}>Editar pasta</Text>
          </Pressable>
          <Pressable hitSlop={6} onPress={() => handleDeleteFolder(folder)}>
            <Text style={styles.deleteText}>Excluir pasta</Text>
          </Pressable>
        </View>

        {folderForm && renderFolderForm(folderForm)}
        {productForm && renderProductForm(productForm, folder.name)}

        <FlatList
          data={folder.products}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum imóvel nesta pasta ainda.</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={styles.itemCard}
              onPress={() => openProduct(item.id)}>
              <IconTile name="foto" size={40} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemSub}>{formatPrice(item)} • {item.shortDescription}</Text>
              </View>
              <Text style={styles.itemMeta}>{item.photos.length} fotos</Text>
            </Pressable>
          )}
        />
      </View>
    );
  }

  // 3. Visão Principal: Lista de Pastas
  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.badge}>Catálogo de Produtos</Text>
          <Text style={styles.headerTitle}>Pastas de Imóveis</Text>
        </View>
        <Pressable
          style={styles.addBtn}
          onPress={() => setFolderForm({ id: null, name: '', neighborhood: '' })}>
          <Icon name="novaPasta" size={18} color={colors.onPrimary} />
          <Text style={styles.addBtnText}>Nova Pasta</Text>
        </Pressable>
      </View>

      {folderForm && renderFolderForm(folderForm)}

      <FlatList
        data={folders}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma pasta criada ainda.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.itemCard}
            onPress={() => openFolder(item.id)}>
            <IconTile name="pasta" size={40} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <Text style={styles.itemSub}>{item.neighborhood || 'Região'} • {item.products.length} imóveis</Text>
            </View>
            <Icon name="avancar" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      />
    </View>
  );
}

const useStyles = makeStyles(colors => ({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  headerBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerBack: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  headerTitle: {
    flexShrink: 1,
    ...typography.h2,
    color: colors.text,
  },
  badge: {
    ...typography.overline,
    color: colors.primaryText,
    marginBottom: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    minHeight: touchTarget,
    borderRadius: radius.md,
  },
  addBtnText: {
    color: colors.onPrimary,
    ...typography.button,
  },
  folderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  linkText: { color: colors.primaryText, fontSize: 14, fontWeight: '600' },
  deleteText: { color: colors.danger, fontSize: 14, fontWeight: '600' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: spacing.md, minHeight: 32 },
  backBtnText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  title: { ...typography.h2, color: colors.text },
  price: { fontSize: 17, fontWeight: '700', color: colors.successText },
  desc: { ...typography.body, color: colors.textSecondary },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.title,
    color: colors.text,
    marginBottom: 4,
  },
  smallAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    minHeight: 36,
    borderRadius: radius.sm,
  },
  smallAddBtnText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  cloudInfo: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    marginBottom: spacing.lg,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 17,
  },
  uploadBox: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.md,
    marginVertical: spacing.sm,
    gap: 6,
  },
  mediaItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.sm,
    marginTop: 6,
  },
  mediaInfo: { flex: 1, marginRight: spacing.sm },
  mediaTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  mediaUrl: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  list: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm },
  itemCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  itemSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  itemMeta: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  newFolderBox: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.xl,
    gap: spacing.sm,
  },
  formContainer: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.xl,
    gap: spacing.sm,
    maxHeight: 420,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: 4,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    minHeight: touchTarget,
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  segmentBtn: {
    flex: 1,
    minHeight: touchTarget,
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: colors.primarySoft,
  },
  segmentText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  segmentTextActive: { color: colors.primaryText },
  formBtnsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    minHeight: touchTarget,
    justifyContent: 'center',
    borderRadius: radius.md,
    alignItems: 'center',
  },
  cancelBtnText: { color: colors.text, ...typography.button },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    minHeight: touchTarget,
    justifyContent: 'center',
    borderRadius: radius.md,
    alignItems: 'center',
  },
  saveBtnText: { color: colors.onPrimary, ...typography.button },
  dangerBtn: {
    flex: 1,
    backgroundColor: colors.dangerBg,
    minHeight: touchTarget,
    justifyContent: 'center',
    borderRadius: radius.md,
    alignItems: 'center',
  },
  dangerBtnText: { color: colors.danger, ...typography.button },
}));
