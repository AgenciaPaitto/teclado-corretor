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
import type { AudioShortcut, ShortcutsData, TextShortcut } from '../../types';
import { colors, radius, spacing } from '../../keyboard/theme';

export function ShortcutsManagerScreen() {
  const [shortcuts, setShortcuts] = useState<ShortcutsData>(() => Repo.getShortcuts());
  const [activeTab, setActiveTab] = useState<'text' | 'audio'>('text');

  // Criação de Atalho de Texto
  const [isCreatingText, setIsCreatingText] = useState(false);
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');

  // Criação de Atalho de Áudio
  const [isCreatingAudio, setIsCreatingAudio] = useState(false);
  const [audioTitle, setAudioTitle] = useState('');
  const [audioDuration, setAudioDuration] = useState('0:45');
  const [audioTranscript, setAudioTranscript] = useState('');

  const refreshShortcuts = () => {
    setShortcuts(Repo.getShortcuts());
  };

  const handleCreateText = () => {
    if (!textTitle.trim() || !textContent.trim()) {
      Alert.alert('Atenção', 'Preencha o título e o texto da mensagem.');
      return;
    }

    const shortcut: TextShortcut = {
      id: `text-${Date.now()}`,
      title: textTitle.trim(),
      text: textContent.trim(),
    };

    Repo.addTextShortcut(shortcut);
    refreshShortcuts();
    setIsCreatingText(false);
    setTextTitle('');
    setTextContent('');
    Alert.alert('Sucesso', 'Atalho de texto criado e sincronizado com o teclado!');
  };

  const handleCreateAudio = () => {
    if (!audioTitle.trim() || !audioTranscript.trim()) {
      Alert.alert('Atenção', 'Preencha o título e a transcrição do áudio.');
      return;
    }

    const shortcut: AudioShortcut = {
      id: `audio-${Date.now()}`,
      title: audioTitle.trim(),
      duration: audioDuration.trim() || '0:30',
      audioUrl: `https://cdn.primeimoveis.com.br/audios/${Date.now()}.mp3`,
      transcript: audioTranscript.trim(),
    };

    Repo.addAudioShortcut(shortcut);
    refreshShortcuts();
    setIsCreatingAudio(false);
    setAudioTitle('');
    setAudioDuration('0:45');
    setAudioTranscript('');
    Alert.alert('Sucesso', 'Atalho de áudio adicionado e sincronizado com o teclado!');
  };

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
            if (activeTab === 'text') setIsCreatingText(true);
            else setIsCreatingAudio(true);
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
          onPress={() => setActiveTab('text')}>
          <Text style={[styles.toggleText, activeTab === 'text' && styles.toggleTextActive]}>
            Textos ({shortcuts.texts.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggleBtn, activeTab === 'audio' && styles.toggleBtnActive]}
          onPress={() => setActiveTab('audio')}>
          <Text style={[styles.toggleText, activeTab === 'audio' && styles.toggleTextActive]}>
            Áudios Rápidos ({shortcuts.audios.length})
          </Text>
        </Pressable>
      </View>

      {/* Formulário de Criação de Texto */}
      {isCreatingText && (
        <ScrollView style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Novo Atalho de Texto</Text>
          <Text style={styles.label}>Título do Atalho</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Confirmação de Visita, Chave Pix"
            placeholderTextColor={colors.textMuted}
            value={textTitle}
            onChangeText={setTextTitle}
          />

          <Text style={styles.label}>Conteúdo da Mensagem</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Escreva a mensagem que será colada no WhatsApp. Você pode usar {{corretor}}, {{imobiliaria}}, {{creci}}"
            placeholderTextColor={colors.textMuted}
            multiline
            value={textContent}
            onChangeText={setTextContent}
          />

          <View style={styles.formBtnsRow}>
            <Pressable
              style={styles.cancelBtn}
              onPress={() => setIsCreatingText(false)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={handleCreateText}>
              <Text style={styles.saveBtnText}>Salvar Atalho</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* Formulário de Criação de Áudio */}
      {isCreatingAudio && (
        <ScrollView style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Novo Áudio Pré-gravado</Text>
          <Text style={styles.label}>Título do Áudio</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Apresentação Inicial, Proposta Aceita"
            placeholderTextColor={colors.textMuted}
            value={audioTitle}
            onChangeText={setAudioTitle}
          />

          <Text style={styles.label}>Duração Estimada</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 0:45"
            placeholderTextColor={colors.textMuted}
            value={audioDuration}
            onChangeText={setAudioDuration}
          />

          <Text style={styles.label}>Transcrição do Áudio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Texto do áudio para conferência rápida antes de enviar"
            placeholderTextColor={colors.textMuted}
            multiline
            value={audioTranscript}
            onChangeText={setAudioTranscript}
          />

          <View style={styles.formBtnsRow}>
            <Pressable
              style={styles.cancelBtn}
              onPress={() => setIsCreatingAudio(false)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={handleCreateAudio}>
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
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemSub} numberOfLines={2}>{item.text}</Text>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={shortcuts.audios}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.audioRow}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.durationBadge}>{item.duration}</Text>
              </View>
              <Text style={styles.transcriptText}>"{item.transcript}"</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: '#38bdf8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
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
  audioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#818cf8',
    backgroundColor: 'rgba(99,102,241,0.12)',
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
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  saveBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
});
