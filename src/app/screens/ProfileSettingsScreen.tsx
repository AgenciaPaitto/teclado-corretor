/**
 * Conta — perfil e configurações, cada assunto no seu submenu.
 */
import React, { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, Text, TextInput, View } from 'react-native';
import { Repo } from '../../storage/storage';
import type { SegmentId, SellerProfile, ThemePreference } from '../../types';
import { getSegment } from '../../segments/segments';
import { makeStyles, onCoralText, radius, spacing, touchTarget, typography, useColors } from '../../keyboard/theme';
import { Icon } from '../../keyboard/components/Icon';
import { AI_CONFIG } from '../../services/aiService';
import { AuthError, currentEmail, pushProfile } from '../../services/auth';
import { SegmentPicker } from '../components/SegmentPicker';
import { Button, Card, CardText, CardTitle, MenuGroup, MenuRow, Page, ScreenTitle, StatusChip, SubHeader } from '../components/ui';

export type AccountSection = 'root' | 'data' | 'segment' | 'theme' | 'status' | 'about';

interface Props {
  onLogout: () => void;
  onThemeChange?: (theme: ThemePreference) => void;
  onProfileChange?: (seller: SellerProfile) => void;
  /** Abre direto num submenu (ex.: "Completar seu perfil" no Início). */
  initialSection?: AccountSection;
}

const THEME_OPTIONS: Array<{ key: ThemePreference; label: string; desc: string }> = [
  { key: 'light', label: 'Claro', desc: 'Fundo claro e suave' },
  { key: 'dark', label: 'Escuro', desc: 'Confortável para uso contínuo' },
  { key: 'system', label: 'Padrão do sistema', desc: 'Segue o celular' },
];

export function ProfileSettingsScreen({ onLogout, onThemeChange, onProfileChange, initialSection = 'root' }: Props) {
  const [section, setSection] = useState<AccountSection>(initialSection);
  const [seller, setSeller] = useState<SellerProfile>(() => Repo.getSeller());
  const [theme, setTheme] = useState<ThemePreference>(() => Repo.getTheme());
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    currentEmail().then(setEmail).catch(() => {});
  }, []);

  const back = () => setSection('root');

  /** Grava no aparelho (teclado) e na conta do Supabase. */
  const saveProfile = async (updated: SellerProfile, successMessage: string) => {
    setSeller(updated);
    onProfileChange?.(updated);
    try {
      await pushProfile(updated);
      Alert.alert('Salvo', successMessage);
    } catch (e) {
      Alert.alert(
        'Salvo só neste aparelho',
        `O teclado já usa os novos dados, mas não foi possível salvar na nuvem: ${
          e instanceof AuthError ? e.message : String(e)
        }`,
      );
    }
    setSection('root');
  };

  if (section === 'data') {
    return (
      <DataSection
        seller={seller}
        onBack={back}
        onSave={s => saveProfile(s, 'Seus dados foram salvos na conta e no teclado.')}
      />
    );
  }

  if (section === 'segment') {
    return (
      <SegmentSection
        current={seller.segment}
        onBack={back}
        onSave={segment =>
          saveProfile(
            { ...seller, segment },
            `Agora o app está no ramo ${getSegment(segment).label}. O que você cadastrou continua igual.`,
          )
        }
      />
    );
  }

  if (section === 'theme') {
    return (
      <ThemeSection
        theme={theme}
        onBack={back}
        onSelect={t => {
          setTheme(t);
          Repo.setTheme(t);
          onThemeChange?.(t);
        }}
      />
    );
  }

  if (section === 'status') return <StatusSection email={email} onBack={back} />;
  if (section === 'about') return <AboutSection onBack={back} />;

  return (
    <Page>
      <ScreenTitle title="Conta" />

      <ProfileCard seller={seller} email={email} />

      <MenuGroup>
        <MenuRow testID="account-data" icon="clientes" title="Seus dados" subtitle="Nome, negócio e WhatsApp" onPress={() => setSection('data')} />
        <MenuRow
          testID="account-segment"
          icon={getSegment(seller.segment).icon}
          title="Ramo do negócio"
          value={getSegment(seller.segment).label}
          onPress={() => setSection('segment')}
        />
        <MenuRow
          icon="configuracoes"
          title="Aparência"
          value={THEME_OPTIONS.find(o => o.key === theme)?.label}
          onPress={() => setSection('theme')}
        />
      </MenuGroup>

      <MenuGroup>
        <MenuRow icon="dados" title="Status da conta" subtitle="Conexão e sincronização" onPress={() => setSection('status')} />
        <MenuRow icon="info" title="Sobre e licenças" onPress={() => setSection('about')} />
      </MenuGroup>

      <Button label="Sair da conta" variant="danger" icon="sair" onPress={onLogout} />
    </Page>
  );
}

function ProfileCard({ seller, email }: { seller: SellerProfile; email: string | null }) {
  const styles = useStyles();
  const initials =
    seller.name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((p, i, all) => (i === 0 || i === all.length - 1 ? p[0] : ''))
      .join('')
      .toUpperCase() || 'K';
  return (
    <Card style={styles.profileCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.flex}>
        <Text style={styles.profileName} numberOfLines={1}>
          {seller.name || 'Seu nome'}
        </Text>
        <Text style={styles.profileSub} numberOfLines={1}>
          {email ?? ' '}
        </Text>
      </View>
    </Card>
  );
}

function DataSection({ seller, onBack, onSave }: { seller: SellerProfile; onBack: () => void; onSave: (s: SellerProfile) => void }) {
  const colors = useColors();
  const styles = useStyles();
  const [name, setName] = useState(seller.name);
  const [business, setBusiness] = useState(seller.business);
  const [phone, setPhone] = useState(seller.phone);

  const save = () => {
    if (!name.trim()) {
      Alert.alert('Atenção', 'Preencha seu nome.');
      return;
    }
    onSave({ ...seller, name: name.trim(), business: business.trim(), phone: phone.trim() });
  };

  const field = (label: string, value: string, onChange: (v: string) => void, placeholder: string, phonePad = false) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={phonePad ? 'phone-pad' : 'default'}
      />
    </View>
  );

  return (
    <Page>
      <SubHeader title="Seus dados" onBack={onBack} />
      <Card>
        <CardText>Usados nas mensagens prontas: {'{{nome}}'}, {'{{empresa}}'} e {'{{telefone}}'}.</CardText>
        {field('Nome completo', name, setName, 'Seu nome')}
        {field('Nome do negócio', business, setBusiness, 'Nome da sua empresa ou loja')}
        {field('WhatsApp', phone, setPhone, 'Seu número com DDD', true)}
      </Card>
      <Button testID="data-save" label="Salvar" onPress={save} />
    </Page>
  );
}

function SegmentSection({ current, onBack, onSave }: { current: SegmentId; onBack: () => void; onSave: (s: SegmentId) => void }) {
  const [segment, setSegment] = useState<SegmentId>(current);
  return (
    <Page>
      <SubHeader title="Ramo do negócio" onBack={onBack} />
      <Card>
        <CardText>Muda os nomes, os campos dos itens, o funil de clientes e a IA. Nada do que você cadastrou é apagado.</CardText>
        <SegmentPicker value={segment} onChange={setSegment} />
      </Card>
      <Button label="Salvar" disabled={segment === current} onPress={() => onSave(segment)} />
    </Page>
  );
}

function ThemeSection({ theme, onBack, onSelect }: { theme: ThemePreference; onBack: () => void; onSelect: (t: ThemePreference) => void }) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <Page>
      <SubHeader title="Aparência" onBack={onBack} />
      <Card>
        <CardText>Vale para o app e para o teclado.</CardText>
        {THEME_OPTIONS.map(opt => {
          const selected = theme === opt.key;
          return (
            <Pressable
              key={opt.key}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[styles.option, selected && styles.optionActive]}
              onPress={() => onSelect(opt.key)}>
              <View style={styles.flex}>
                <Text style={[styles.optionLabel, selected && styles.optionLabelActive]}>{opt.label}</Text>
                <Text style={styles.optionDesc}>{opt.desc}</Text>
              </View>
              {selected && <Icon name="check" size={20} color={colors.primaryText} />}
            </Pressable>
          );
        })}
      </Card>
    </Page>
  );
}

function StatusSection({ email, onBack }: { email: string | null; onBack: () => void }) {
  const rows: Array<{ done: boolean; title: string; text: string }> = [
    { done: !!email, title: 'Conta', text: email ? `Conectada: ${email}` : 'Verificando conexão...' },
    { done: true, title: 'Teclado', text: 'Login e dados compartilhados com o teclado neste aparelho.' },
    { done: false, title: 'Itens e atalhos', text: 'Salvos neste aparelho. Sincronização com a nuvem em breve.' },
    { done: false, title: 'Fotos e vídeos', text: 'Enviados como links externos por enquanto.' },
    {
      done: !AI_CONFIG.useMock,
      title: 'IA',
      text: AI_CONFIG.useMock ? 'Modo demonstração (servidor não configurado).' : 'Conectada ao servidor.',
    },
  ];
  return (
    <Page>
      <SubHeader title="Status da conta" onBack={onBack} />
      {rows.map(r => (
        <Card key={r.title}>
          <CardTitle>{r.title}</CardTitle>
          <StatusChip done={r.done} label={r.done ? 'Pronto' : 'Pendente'} />
          <CardText>{r.text}</CardText>
        </Card>
      ))}
    </Page>
  );
}

function AboutSection({ onBack }: { onBack: () => void }) {
  return (
    <Page>
      <SubHeader title="Sobre e licenças" onBack={onBack} />
      <Card>
        <CardTitle>KEYCON</CardTitle>
        <CardText>Teclado inteligente. Vendas organizadas.</CardText>
      </Card>
      <Card>
        <CardTitle>Dicionário do teclado</CardTitle>
        <CardText>
          Lista de palavras do português baseada em FrequencyWords, de Hermit Dave (legendas do OpenSubtitles),
          licença Creative Commons BY-SA 4.0.
        </CardText>
        <Button
          label="Ver licença"
          variant="secondary"
          onPress={() => Linking.openURL('https://creativecommons.org/licenses/by-sa/4.0/').catch(() => {})}
        />
      </Card>
      <Card>
        <CardTitle>Frases do corretor</CardTitle>
        <CardText>
          Palavras que costumam vir em sequência, tiradas das frases em português do Tatoeba (tatoeba.org),
          licença Creative Commons BY 2.0 FR.
        </CardText>
        <Button
          label="Ver licença"
          variant="secondary"
          onPress={() => Linking.openURL('https://creativecommons.org/licenses/by/2.0/fr/').catch(() => {})}
        />
      </Card>
      <Card>
        <CardTitle>Fonte</CardTitle>
        <CardText>Inter, de Rasmus Andersson, licença SIL Open Font License 1.1.</CardText>
      </Card>
    </Page>
  );
}

const useStyles = makeStyles(colors => ({
  flex: { flex: 1 },
  profileCard: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.onPrimary, fontSize: 18, fontWeight: '700', ...onCoralText },
  profileName: { ...typography.title, color: colors.text },
  profileSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  field: { gap: spacing.xs },
  label: { ...typography.label, color: colors.textSecondary },
  input: {
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: touchTarget + 4,
    fontSize: 15,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  optionActive: { backgroundColor: colors.primarySoft },
  optionLabel: { fontSize: 15, fontWeight: '500', color: colors.textSecondary },
  optionLabelActive: { color: colors.text, fontWeight: '600' },
  optionDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
}));
