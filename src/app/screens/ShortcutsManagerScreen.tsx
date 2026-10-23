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
import { makeStyles, radius, spacing, touchTarget, typography, useColors } from '../../keyboard/theme';
import { Icon, IconTile } from '../../keyboard/components/Icon';
import { EmptyState } from '../components/ui';

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
          <Text style={styles.badge}>Respostas rápidas</Text>
          <Text style={styles.headerTitle}>Atalhos do Teclado</Text>
        </View>
        <Pressable
          style={styles.addBtn}
          onPress={() => {
            if (activeTab === 'text') setTextForm({ id: null, title: '', text: '' });
            else setAudioForm({ id: null, title: '', url: '', duration: '', transcript: '' });
          }}>
          <Icon name="adicionar" size={18} color={colors.onPrimary} />
          <Text style={styles.addBtnText}>
            {activeTab === 'text' ? 'Novo texto' : 'Novo áudio'}
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
            placeholder="Ex: Formas de pagamento, Chave Pix"
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
            Variáveis: {'{{nome}}'}, {'{{empresa}}'} e {'{{telefone}}'} são trocadas pelos dados do
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
          ListEmptyComponent={
            textForm ? null : (
              <EmptyState
                icon="respostas"
                title="Nenhum atalho de texto"
                text="Salve as mensagens que você manda sempre e envie pelo teclado com um toque."
                actionLabel="Criar atalho de texto"
                onAction={() => setTextForm({ id: null, title: '', text: '' })}
              />
            )
          }
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.itemHead}>
                <IconTile name="respostas" size={36} />
                <Text style={styles.itemTitle}>{item.title}</Text>
              </View>
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
          ListEmptyComponent={
            audioForm ? null : (
              <EmptyState
                icon="audio"
                title="Nenhum áudio"
                text="Cadastre o link de um áudio para enviar na conversa sem gravar de novo."
                actionLabel="Adicionar áudio"
                onAction={() => setAudioForm({ id: null, title: '', url: '', duration: '', transcript: '' })}
              />
            )
          }
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.itemHead}>
                <IconTile name="audio" size={36} />
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    ...typography.overline,
    color: colors.primaryText,
    marginBottom: 2,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
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
  tabToggle: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  toggleBtn: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: colors.primarySoft,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
  },
  toggleTextActive: {
    color: colors.primaryText,
    fontWeight: '600',
  },
  list: { padding: spacing.lg, gap: spacing.sm },
  itemCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  itemTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  itemSub: { fontSize: 14, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 20 },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xl,
    marginTop: spacing.md,
  },
  linkText: { color: colors.primaryText, fontSize: 14, fontWeight: '600' },
  deleteText: { color: colors.danger, fontSize: 14, fontWeight: '600' },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  durationBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.violet,
    backgroundColor: colors.violetBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  transcriptText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  urlText: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  formContainer: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.xl,
    gap: spacing.sm,
    maxHeight: 380,
  },
  sectionTitle: {
    ...typography.title,
    color: colors.text,
    marginBottom: 4,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 17,
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
}));
