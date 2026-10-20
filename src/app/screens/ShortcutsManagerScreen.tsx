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
import type { AudioShortcut, ShortcutsData, TextShortcut } from '../../types';
import { normalizeUrl } from '../../utils/formatters';
import { makeStyles, radius, spacing, useColors } from '../../keyboard/theme';

/** Formulários de criação/edição: id null = criando um atalho novo. */
interface TextForm {
  id: string | null;
  title: string;
  text: string;
}

interface AudioForm {
  id: string | null;
  title: string;
  url: string;
  duration: string;
  transcript: string;
}

function confirmDelete(title: string, onConfirm: () => void) {
  Alert.alert('Excluir atalho', `Deseja excluir "${title}"?`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Excluir', style: 'destructive', onPress: onConfirm },
  ]);
}

export function ShortcutsManagerScreen() {
  const colors = useColors();
  const styles = useStyles();
  const [shortcuts, setShortcuts] = useState<ShortcutsData>(() => Repo.getShortcuts());
  const [activeTab, setActiveTab] = useState<'text' | 'audio'>('text');

  const [textForm, setTextForm] = useState<TextForm | null>(null);
  const [audioForm, setAudioForm] = useState<AudioForm | null>(null);

  const refreshShortcuts = () => {
    setShortcuts(Repo.getShortcuts());
  };

  const switchTab = (tab: 'text' | 'audio') => {
    setActiveTab(tab);
    setTextForm(null);
    setAudioForm(null);
  };

  const handleSaveText = () => {
    if (!textForm) return;
    if (!textForm.title.trim() || !textForm.text.trim()) {
      Alert.alert('Atenção', 'Preencha o título e o texto da mensagem.');
      return;
    }

    const shortcut: TextShortcut = {
      id: textForm.id ?? `text-${Date.now()}`,
      title: textForm.title.trim(),
      text: textForm.text.trim(),
    };

    if (textForm.id) {
      Repo.updateTextShortcut(shortcut);
    } else {
      Repo.addTextShortcut(shortcut);
    }
    refreshShortcuts();
    setTextForm(null);
    Alert.alert('Sucesso', textForm.id ? 'Atalho atualizado!' : 'Atalho de texto criado e sincronizado com o teclado!');
  };

  const handleSaveAudio = () => {
    if (!audioForm) return;
    if (!audioForm.title.trim()) {
      Alert.alert('Atenção', 'Preencha o título do áudio.');
      return;
    }
    const audioUrl = normalizeUrl(audioForm.url);
    if (!audioUrl) {
      Alert.alert('Atenção', 'Cole o link do áudio. Ex: https://drive.google.com/...');
      return;
    }

    const shortcut: AudioShortcut = {
      id: audioForm.id ?? `audio-${Date.now()}`,
      title: audioForm.title.trim(),
      duration: audioForm.duration.trim(),
      audioUrl,
      transcript: audioForm.transcript.trim(),
    };

    if (audioForm.id) {
      Repo.updateAudioShortcut(shortcut);
    } else {
      Repo.addAudioShortcut(shortcut);
    }
    refreshShortcuts();
    setAudioForm(null);
    Alert.alert('Sucesso', audioForm.id ? 'Áudio atualizado!' : 'Atalho de áudio adicionado e sincronizado com o teclado!');
  };

  const handleDeleteText = (item: TextShortcut) => {
    confirmDelete(item.title, () => {
      Repo.deleteTextShortcut(item.id);
      refreshShortcuts();
      if (textForm?.id === item.id) setTextForm(null);
    });
  };

  const handleDeleteAudio = (item: AudioShortcut) => {
    confirmDelete(item.title, () => {
      Repo.deleteAudioShortcut(item.id);
      refreshShortcuts();
      if (audioForm?.id === item.id) setAudioForm(null);
    });
  };

  const renderItemActions = (onEdit: () => void, onDelete: () => void) => (
    <View style={styles.itemActions}>
      <Pressable hitSlop={6} onPress={onEdit}>
        <Text style={styles.linkText}>Editar</Text>
      </Pressable>
      <Pressable hitSlop={6} onPress={onDelete}>
        <Text style={styles.deleteText}>Excluir</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.badge}>Respostas Rápidas</Text>
          <Text style={styles.headerTitle}>Atalhos do Teclado</Text>
        </View>
        <Pressable
          style={styles.addBtn}
          onPress={() => {
            if (activeTab === 'text') setTextForm({ id: null, title: '', text: '' });
            else setAudioForm({ id: null, title: '', url: '', duration: '', transcript: '' });
          }}>
          <Text style={styles.addBtnText}>
            {activeTab === 'text' ? '+ Novo Texto' : '+ Novo Áudio'}
          </Text>
        </Pressable>
      </View>

      {/* Alternador de Tipo */}
      <View style={styles.tabToggle}>
        <Pressable
          style={[styles.toggleBtn, activeTab === 'text' && styles.toggleBtnActive]}
          onPress={() => switchTab('text')}>
          <Text style={[styles.toggleText, activeTab === 'text' && styles.toggleTextActive]}>
            Textos ({shortcuts.texts.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggleBtn, activeTab === 'audio' && styles.toggleBtnActive]}
          onPress={() => switchTab('audio')}>
          <Text style={[styles.toggleText, activeTab === 'audio' && styles.toggleTextActive]}>
            Áudios Rápidos ({shortcuts.audios.length})
          </Text>
        </Pressable>
      </View>

      {/* Formulário de Texto (criar / editar) */}
      {textForm && (
        <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>{textForm.id ? 'Editar Atalho de Texto' : 'Novo Atalho de Texto'}</Text>
          <Text style={styles.label}>Título do Atalho</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Confirmação de Visita, Chave Pix"
            placeholderTextColor={colors.textMuted}
            value={textForm.title}
            onChangeText={title => setTextForm({ ...textForm, title })}
          />

          <Text style={styles.label}>Conteúdo da Mensagem</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Escreva a mensagem que será colada no WhatsApp."
            placeholderTextColor={colors.textMuted}
            multiline
            value={textForm.text}
            onChangeText={text => setTextForm({ ...textForm, text })}
          />
          <Text style={styles.hint}>
            Variáveis: {'{{corretor}}'}, {'{{imobiliaria}}'}, {'{{creci}}'} e {'{{telefone}}'} são trocadas pelos dados do
            seu perfil.
          </Text>

          <View style={styles.formBtnsRow}>
            <Pressable style={styles.cancelBtn} onPress={() => setTextForm(null)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={handleSaveText}>
              <Text style={styles.saveBtnText}>Salvar Atalho</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* Formulário de Áudio (criar / editar) */}
      {audioForm && (
        <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>{audioForm.id ? 'Editar Áudio' : 'Novo Áudio Pré-gravado'}</Text>
          <Text style={styles.label}>Título do Áudio</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Apresentação Inicial, Proposta Aceita"
            placeholderTextColor={colors.textMuted}
            value={audioForm.title}
            onChangeText={title => setAudioForm({ ...audioForm, title })}
          />

          <Text style={styles.label}>Link do Áudio</Text>
          <TextInput
            style={styles.input}
            placeholder="Cole o link direto do arquivo (.mp3, .ogg, .m4a)"
            placeholderTextColor={colors.textMuted}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            value={audioForm.url}
            onChangeText={url => setAudioForm({ ...audioForm, url })}
          />

          <Text style={styles.label}>Duração (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 0:45"
            placeholderTextColor={colors.textMuted}
            value={audioForm.duration}
            onChangeText={duration => setAudioForm({ ...audioForm, duration })}
          />

          <Text style={styles.label}>Transcrição do Áudio (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Texto do áudio para conferência rápida antes de enviar"
            placeholderTextColor={colors.textMuted}
            multiline
            value={audioForm.transcript}
            onChangeText={transcript => setAudioForm({ ...audioForm, transcript })}
          />

          <View style={styles.formBtnsRow}>
            <Pressable style={styles.cancelBtn} onPress={() => setAudioForm(null)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={handleSaveAudio}>
              <Text style={styles.saveBtnText}>Salvar Áudio</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* Lista de Atalhos */}
      {activeTab === 'text' ? (
        <FlatList
          data={shortcuts.texts}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum atalho de texto ainda.</Text>}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemSub} numberOfLines={2}>{item.text}</Text>
              {renderItemActions(
                () => setTextForm({ id: item.id, title: item.title, text: item.text }),
                () => handleDeleteText(item),
              )}
            </View>
          )}
        />
      ) : (
        <FlatList
          data={shortcuts.audios}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum áudio cadastrado ainda.</Text>}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.audioRow}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.duration ? <Text style={styles.durationBadge}>{item.duration}</Text> : null}
              </View>
              {item.transcript ? <Text style={styles.transcriptText}>"{item.transcript}"</Text> : null}
              <Text style={styles.urlText} numberOfLines={1}>{item.audioUrl}</Text>
              {renderItemActions(
                () =>
                  setAudioForm({
                    id: item.id,
                    title: item.title,
                    url: item.audioUrl,
                    duration: item.duration,
                    transcript: item.transcript,
                  }),
                () => handleDeleteAudio(item),
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const useStyles = makeStyles(colors => ({
  container: { flex: 1, backgroundColor: colors.bg },
  headerBar: {
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceAlt,
  },
  badge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.info,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  addBtnText: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  tabToggle: {
    flexDirection: 'row',
    gap: 8,
    padding: spacing.md,
    paddingBottom: 0,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: colors.surfaceAlt,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },
  toggleTextActive: {
    color: colors.text,
    fontWeight: '700',
  },
  list: { padding: spacing.md, gap: 8 },
  itemCard: {
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radius.md,
  },
  itemTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  itemSub: { fontSize: 12, color: colors.textMuted, marginTop: 4, lineHeight: 16 },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 8,
  },
  linkText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  deleteText: { color: colors.danger, fontSize: 12, fontWeight: '600' },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 12,
  },
  audioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.violet,
    backgroundColor: colors.violetBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  transcriptText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  urlText: { fontSize: 10, color: colors.textMuted, marginTop: 4 },
  formContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    margin: spacing.md,
    borderRadius: radius.lg,
    gap: 8,
    maxHeight: 350,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 4,
  },
  hint: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 14,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: radius.md,
    padding: 10,
    fontSize: 12,
  },
  textArea: {
    minHeight: 70,
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
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  saveBtnText: { color: colors.onPrimary, fontSize: 12, fontWeight: '600' },
}));
