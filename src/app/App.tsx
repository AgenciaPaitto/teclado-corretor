/**
 * App.tsx — App KEYCON (container do teclado)
 * -------------------------------------------------------------
 * Conta do usuário, Início (teclado, primeiros passos, tutorial),
 * catálogo, atalhos e Conta. Cada aba abre na sua tela principal;
 * os detalhes ficam em submenus dentro dela.
 */
import React, { useEffect, useState } from 'react';
import {
  AppState,
  Pressable,
  SafeAreaView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { pullProfile, restoreSession, signOut, startAuthSync } from '../services/auth';
import { supabase } from '../services/supabase';
import { getSegment } from '../segments/segments';
import { Repo } from '../storage/storage';
import type { SellerProfile, ThemePreference } from '../types';
import { Icon } from '../keyboard/components/Icon';
import type { IconName } from '../keyboard/components/Icon';
import { KeyconLogo } from '../keyboard/components/KeyconLogo';
import { makeStyles, radius, spacing, ThemeProvider, useColors } from '../keyboard/theme';
import { AuthScreen } from './screens/AuthScreen';
import { HomeScreen } from './screens/HomeScreen';
import type { AppTarget } from './screens/HomeScreen';
import { ProductsManagerScreen } from './screens/ProductsManagerScreen';
import { ProfileSettingsScreen } from './screens/ProfileSettingsScreen';
import type { AccountSection } from './screens/ProfileSettingsScreen';
import { AgendaScreen } from './screens/AgendaScreen';
import { ClientsScreen } from './screens/ClientsScreen';
import { TutorialScreen } from './screens/TutorialScreen';

type AppTab = 'home' | 'products' | 'clients' | 'agenda' | 'profile';

const NAV_ITEMS: Array<{ key: AppTab; label: string; icon: IconName }> = [
  { key: 'home', label: 'Início', icon: 'casa' },
  // O nome muda com o ramo ("Imóveis", "Cardápio"...)
  { key: 'products', label: 'Produtos', icon: 'arquivos' },
  // Mesmos dados do CRM e da Agenda do teclado
  { key: 'clients', label: 'Clientes', icon: 'clientes' },
  { key: 'agenda', label: 'Agenda', icon: 'calendario' },
  // Configurações = engrenagem (manual de marca)
  { key: 'profile', label: 'Conta', icon: 'configuracoes' },
];

export default function App() {
  const [theme, setTheme] = useState<ThemePreference>(() => Repo.getTheme());
  return (
    <ThemeProvider preference={theme}>
      <AppShell onThemeChange={setTheme} />
    </ThemeProvider>
  );
}

function AppShell({ onThemeChange }: { onThemeChange: (theme: ThemePreference) => void }) {
  const colors = useColors();
  const styles = useStyles();
  const barStyle = colors.scheme === 'dark' ? 'light-content' : 'dark-content';
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Repo.isLoggedIn());
  const [currentTab, setCurrentTab] = useState<AppTab>('home');
  /** Muda a cada toque no menu: a aba volta para a tela principal dela. */
  const [tabVisit, setTabVisit] = useState(0);
  const [accountSection, setAccountSection] = useState<AccountSection>('root');
  /** Ficha do cliente → "Agendar": a Agenda abre o cadastro com ele. */
  const [scheduleClientId, setScheduleClientId] = useState<string | null>(null);
  // Tutorial abre sozinho no primeiro acesso da conta
  const [showTutorial, setShowTutorial] = useState(() => Repo.isLoggedIn() && !Repo.isTutorialSeen());
  // Perfil (nome no avatar, ramo nos menus); as telas releem o ramo ao abrir
  const [seller, setSeller] = useState<SellerProfile>(() => Repo.getSeller());
  const segment = getSegment(seller.segment);

  useEffect(() => {
    const stopSync = startAuthSync();
    // Confere a sessão do Supabase (desfaz logins antigos de demonstração)
    restoreSession().then(ok => {
      setIsAuthenticated(ok);
      if (ok) pullProfile().then(p => p && setSeller(p)).catch(() => {});
    });

    // Renova o token só com o app em primeiro plano (recomendação do Supabase p/ RN)
    supabase.auth.startAutoRefresh();
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
    return () => {
      stopSync();
      appState.remove();
    };
  }, []);

  // Se não estiver logado, exibe tela de Autenticação / Criação de Conta
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle={barStyle} backgroundColor={colors.bg} />
        <AuthScreen
          onSuccess={() => {
            setSeller(Repo.getSeller());
            setCurrentTab('home');
            setShowTutorial(!Repo.isTutorialSeen());
            setIsAuthenticated(true);
          }}
        />
      </SafeAreaView>
    );
  }

  const openTab = (tab: AppTab, section: AccountSection = 'root') => {
    setAccountSection(section);
    setScheduleClientId(null);
    setCurrentTab(tab);
    setTabVisit(v => v + 1);
  };

  const navigateFromHome = (target: AppTarget) => {
    if (target === 'catalog') openTab('products');
    else openTab('profile', 'data');
  };

  if (showTutorial) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle={barStyle} backgroundColor={colors.bg} />
        <TutorialScreen
          segment={segment}
          onClose={() => {
            Repo.setTutorialSeen();
            setShowTutorial(false);
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle={barStyle} backgroundColor={colors.surface} />

      {/* Cabeçalho: logotipo KEYCON + atalho para a conta */}
      <View style={styles.topHeader}>
        <KeyconLogo size={28} />
        <Pressable
          style={styles.avatar}
          accessibilityLabel="Abrir conta"
          onPress={() => openTab('profile')}>
          <Text style={styles.avatarText}>{initials(seller.name)}</Text>
        </Pressable>
      </View>

      {/* Área da Tela Ativa */}
      <View style={styles.screenBody}>
        {currentTab === 'home' && (
          <HomeScreen key={tabVisit} onNavigate={navigateFromHome} onOpenTutorial={() => setShowTutorial(true)} />
        )}
        {/* key: trocar de ramo recarrega a tela com os novos campos */}
        {currentTab === 'products' && <ProductsManagerScreen key={`${seller.segment}-${tabVisit}`} />}
        {currentTab === 'clients' && (
          <ClientsScreen
            key={`${seller.segment}-${tabVisit}`}
            onSchedule={lead => {
              openTab('agenda');
              setScheduleClientId(lead.id);
            }}
          />
        )}
        {currentTab === 'agenda' && <AgendaScreen key={`${tabVisit}-${scheduleClientId ?? ''}`} presetClientId={scheduleClientId} />}
        {currentTab === 'profile' && (
          <ProfileSettingsScreen
            key={tabVisit}
            initialSection={accountSection}
            onProfileChange={setSeller}
            onThemeChange={onThemeChange}
            onLogout={() => {
              signOut().catch(() => {});
              setIsAuthenticated(false);
            }}
          />
        )}
      </View>

      {/* Menu Inferior de Navegação do App Container */}
      <View style={styles.navBar}>
        {NAV_ITEMS.map(item => {
          const active = currentTab === item.key;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={styles.navBtn}
              onPress={() => openTab(item.key)}>
              <Icon name={item.icon} size={22} color={active ? colors.primary : colors.textMuted} />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                {item.key === 'products' ? segment.terms.catalog : item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

/** Iniciais do usuário para o avatar do cabeçalho (ex.: "Ana Souza" → "AS"). */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'K';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

const useStyles = makeStyles(colors => ({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  screenBody: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 6,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  navBtn: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  navLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  navLabelActive: {
    color: colors.primaryText,
    fontWeight: '600',
  },
}));
