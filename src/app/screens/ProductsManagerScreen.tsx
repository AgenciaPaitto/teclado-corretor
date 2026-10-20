import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Repo } from '../../storage/storage';
import type { MediaItem, Product, ProductFolder } from '../../types';
import { formatBRL, parseBRL } from '../../utils/formatters';
import { colors, radius, spacing } from '../../keyboard/theme';

export function ProductsManagerScreen() {
  const [folders, setFolders] = useState<ProductFolder[]>(() => Repo.getFolders());
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Modais de Criação
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderNeighborhood, setNewFolderNeighborhood] = useState('');

  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [newProdTitle, setNewProdTitle] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdDealType, setNewProdDealType] = useState<'venda' | 'locacao'>('venda');
  const [newProdBedrooms, setNewProdBedrooms] = useState('3');
  const [newProdArea, setNewProdArea] = useState('120');
  const [newProdDesc, setNewProdDesc] = useState('');

  // Upload de Foto Simulado
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoTitle, setPhotoTitle] = useState('');

  const refreshFolders = () => {
    setFolders(Repo.getFolders());
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      Alert.alert('Atenção', 'Informe o nome da pasta.');
      return;
    }

    const folder: ProductFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      neighborhood: newFolderNeighborhood.trim() || undefined,
      products: [],
    };

    Repo.addFolder(folder);
    refreshFolders();
    setNewFolderName('');
    setNewFolderNeighborhood('');
    setIsCreatingFolder(false);
    Alert.alert('Sucesso', 'Pasta criada e sincronizada com o teclado!');
  };

  const handleCreateProduct = () => {
    if (!selectedFolderId || !newProdTitle.trim()) {
      Alert.alert('Atenção', 'Informe o título do imóvel.');
      return;
    }

    const priceNum = parseBRL(newProdPrice);
    if (priceNum === null) {
      Alert.alert('Atenção', 'Informe um valor válido. Ex: 850.000 ou 850.000,00');
      return;
    }

    const product: Product = {
      id: `prod-${Date.now()}`,
      title: newProdTitle.trim(),
      price: priceNum,
      dealType: newProdDealType,
      bedrooms: parseInt(newProdBedrooms, 10) || undefined,
      areaM2: parseInt(newProdArea, 10) || undefined,
      shortDescription: newProdDesc.trim() || 'Excelente oportunidade.',
      datasheetUrl: `https://cdn.primeimoveis.com.br/imovel/${Date.now()}`,
      photos: [],
      videos: [],
    };

    Repo.addProduct(selectedFolderId, product);
    refreshFolders();
    setIsCreatingProduct(false);
    setNewProdTitle('');
    setNewProdPrice('');
    setNewProdDesc('');
    Alert.alert('Sucesso', 'Produto adicionado e sincronizado com o teclado!');
  };

  const handleUploadPhoto = () => {
    if (!selectedFolderId || !selectedProductId) return;

    const title = photoTitle.trim() || 'Foto do Imóvel';
    const sampleImages = [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80',
    ];
    const picked = sampleImages[Math.floor(Math.random() * sampleImages.length)];

    const photo: MediaItem = {
      id: `photo-${Date.now()}`,
      type: 'image',
      title,
      url: picked,
      thumbnailUrl: picked.replace('w=1200', 'w=180'),
    };

    Repo.addPhotoToProduct(selectedFolderId, selectedProductId, photo);
    refreshFolders();
    setIsUploadingPhoto(false);
    setPhotoTitle('');
    Alert.alert(
      'Upload Concluído',
      'Foto enviada para o Cloud Storage e distribuída via CDN com thumbnail leve para o teclado.',
    );
  };

  const folder = folders.find(f => f.id === selectedFolderId);
  const product = folder?.products.find(p => p.id === selectedProductId);

  // 1. Visão de Detalhes do Produto & Fotos
  if (folder && product) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Pressable style={styles.backBtn} onPress={() => setSelectedProductId(null)}>
          <Text style={styles.backBtnText}>← Voltar aos produtos de {folder.name}</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.badge}>Produto / Imóvel</Text>
          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.price}>{formatBRL(product.price)}</Text>
          <Text style={styles.desc}>{product.shortDescription}</Text>
        </View>

        {/* Gerenciamento de Fotos */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>
              Fotos em Nuvem ({product.photos.length})
            </Text>
            <Pressable
              style={styles.smallAddBtn}
              onPress={() => setIsUploadingPhoto(true)}>
              <Text style={styles.smallAddBtnText}>+ Enviar Foto</Text>
            </Pressable>
          </View>

          <Text style={styles.cloudInfo}>
            ☁️ As fotos ficam armazenadas no Cloud Storage e são servidas em CDN WebP (menos de 10 KB) para não consumir memória nem armazenamento do celular.
          </Text>


          {isUploadingPhoto && (
            <View style={styles.uploadBox}>
              <Text style={styles.label}>Título / Cômodo da Foto</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Fachada, Suíte Master, Piscina"
                placeholderTextColor={colors.textMuted}
                value={photoTitle}
                onChangeText={setPhotoTitle}
              />
              <Pressable style={styles.confirmUploadBtn} onPress={handleUploadPhoto}>
                <Text style={styles.confirmUploadBtnText}>Fazer Upload para Nuvem</Text>
              </Pressable>
            </View>
          )}

          {product.photos.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma foto cadastrada ainda.</Text>
          ) : (
            product.photos.map(ph => (
              <View key={ph.id} style={styles.mediaItemRow}>
                <View style={styles.mediaInfo}>
                  <Text style={styles.mediaTitle}>{ph.title}</Text>
                  <Text style={styles.mediaUrl} numberOfLines={1}>{ph.url}</Text>
                </View>
                <Text style={styles.cloudPill}>Cloud CDN</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    );
  }

  // 2. Visão de Produtos dentro de uma Pasta
  if (folder) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <Pressable onPress={() => setSelectedFolderId(null)}>
            <Text style={styles.backBtnText}>← Todas as Pastas</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{folder.name}</Text>
          <Pressable
            style={styles.addBtn}
            onPress={() => setIsCreatingProduct(true)}>
            <Text style={styles.addBtnText}>+ Novo Imóvel</Text>
          </Pressable>
        </View>

        {isCreatingProduct && (
          <ScrollView style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Novo Produto em {folder.name}</Text>
            <Text style={styles.label}>Título do Imóvel</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Apartamento 3 dormitórios com varanda"
              placeholderTextColor={colors.textMuted}
              value={newProdTitle}
              onChangeText={setNewProdTitle}
            />

            <Text style={styles.label}>Valor (R$)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 850.000,00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={newProdPrice}
              onChangeText={setNewProdPrice}
            />

            <Text style={styles.label}>Dormitórios</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 3"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={newProdBedrooms}
              onChangeText={setNewProdBedrooms}
            />

            <Text style={styles.label}>Área Privativa (m²)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 115"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={newProdArea}
              onChangeText={setNewProdArea}
            />

            <Text style={styles.label}>Descrição Rápida</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Resumo dos diferenciais do imóvel"
              placeholderTextColor={colors.textMuted}
              multiline
              value={newProdDesc}
              onChangeText={setNewProdDesc}
            />

            <View style={styles.formBtnsRow}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setIsCreatingProduct(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={styles.saveBtn}
                onPress={handleCreateProduct}>
                <Text style={styles.saveBtnText}>Salvar Imóvel</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}

        <FlatList
          data={folder.products}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.itemCard}
              onPress={() => setSelectedProductId(item.id)}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemSub}>{formatBRL(item.price)} • {item.shortDescription}</Text>
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
          onPress={() => setIsCreatingFolder(true)}>
          <Text style={styles.addBtnText}>+ Nova Pasta</Text>
        </Pressable>
      </View>

      {isCreatingFolder && (
        <View style={styles.newFolderBox}>
          <Text style={styles.sectionTitle}>Criar Nova Pasta / Condomínio</Text>
          <Text style={styles.label}>Nome da Pasta</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Condomínio Bosque dos Ipês"
            placeholderTextColor={colors.textMuted}
            value={newFolderName}
            onChangeText={setNewFolderName}
          />
          <Text style={styles.label}>Bairro / Região</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Jardim Europa"
            placeholderTextColor={colors.textMuted}
            value={newFolderNeighborhood}
            onChangeText={setNewFolderNeighborhood}
          />
          <View style={styles.formBtnsRow}>
            <Pressable
              style={styles.cancelBtn}
              onPress={() => setIsCreatingFolder(false)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={styles.saveBtn}
              onPress={handleCreateFolder}>
              <Text style={styles.saveBtnText}>Criar Pasta</Text>
            </Pressable>
          </View>
        </View>
      )}

      <FlatList
        data={folders}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.itemCard}
            onPress={() => setSelectedFolderId(item.id)}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <Text style={styles.itemSub}>{item.neighborhood || 'Região'} • {item.products.length} imóveis</Text>
            </View>
            <Text style={styles.arrowIcon}>→</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 40 },
  headerBar: {
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceAlt,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  badge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38bdf8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  backBtn: { marginBottom: spacing.md },
  backBtnText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    gap: 8,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  price: { fontSize: 16, fontWeight: '700', color: '#10b981' },
  desc: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  smallAddBtn: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  smallAddBtnText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  cloudInfo: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
    marginVertical: 4,
  },
  uploadBox: {
    backgroundColor: colors.surfaceAlt,
    padding: 10,
    borderRadius: radius.md,
    marginVertical: 8,
    gap: 6,
  },
  confirmUploadBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    borderRadius: radius.sm,
    alignItems: 'center',
    marginTop: 4,
  },
  confirmUploadBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  mediaItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    padding: 10,
    borderRadius: radius.sm,
    marginTop: 6,
  },
  mediaInfo: { flex: 1, marginRight: 8 },
  mediaTitle: { color: colors.text, fontSize: 12, fontWeight: '600' },
  mediaUrl: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  cloudPill: {
    fontSize: 9,
    color: '#818cf8',
    backgroundColor: 'rgba(99,102,241,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 12,
  },
  list: { padding: spacing.md, gap: 8 },
  itemCard: {
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  itemSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  itemMeta: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  arrowIcon: { fontSize: 14, color: colors.textMuted, fontWeight: '700' },
  newFolderBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    margin: spacing.md,
    borderRadius: radius.lg,
    gap: 8,
  },
  formContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    margin: spacing.md,
    borderRadius: radius.lg,
    gap: 8,
    maxHeight: 400,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 4,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: radius.md,
    padding: 10,
    fontSize: 12,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  formBtnsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  cancelBtnText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  saveBtn: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  saveBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
});
