/**
 * App.tsx — App KEYCON (container do teclado)
 * -------------------------------------------------------------
 * Gerencia a conta do corretor, onboarding e passo a passo de
 * instalação do teclado no Android e iOS, catálogo de produtos,
 * upload e armazenamento de fotos em nuvem, e atalhos rápidos.
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
import { Repo } from '../storage/storage';
import type { ThemePreference } from '../types';
import { Icon } from '../keyboard/components/Icon';
import type { IconName } from '../keyboard/components/Icon';
import { KeyconLogo } from '../keyboard/components/KeyconLogo';
import { makeStyles, radius, spacing, ThemeProvider, useColors } from '../keyboard/theme';
import { AuthScreen } from './screens/AuthScreen';
import { OnboardingGuideScreen } from './screens/OnboardingGuideScreen';
import { ProductsManagerScreen } from './screens/ProductsManagerScreen';
import { ProfileSettingsScreen } from './screens/ProfileSettingsScreen';
import { ShortcutsManagerScreen } from './screens/ShortcutsManagerScreen';

type AppTab = 'onboarding' | 'products' | 'shortcuts' | 'profile';

const NAV_ITEMS: Array<{ key: AppTab; label: string; icon: IconName }> = [
  { key: 'onboarding', label: 'Instalação', icon: 'teclado' },
  { key: 'products', label: 'Produtos', icon: 'arquivos' },
  { key: 'shortcuts', label: 'Atalhos', icon: 'atalhos' },
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
  const [currentTab, setCurrentTab] = useState<AppTab>('onboarding');
  const [brokerName, setBrokerName] = useState(() => Repo.getBroker().name);

  useEffect(() => {
    const stopSync = startAuthSync();
    // Confere a sessão do Supabase (desfaz logins antigos de demonstração)
    restoreSession().then(ok => {
      setIsAuthenticated(ok);
      if (ok) pullProfile().then(p => p && setBrokerName(p.name)).catch(() => {});
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
            setBrokerName(Repo.getBroker().name);
            setIsAuthenticated(true);
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
          onPress={() => setCurrentTab('profile')}>
          <Text style={styles.avatarText}>{initials(brokerName)}</Text>
        </Pressable>
      </View>

      {/* Área da Tela Ativa */}
      <View style={styles.screenBody}>
        {currentTab === 'onboarding' && <OnboardingGuideScreen />}
        {currentTab === 'products' && <ProductsManagerScreen />}
        {currentTab === 'shortcuts' && <ShortcutsManagerScreen />}
        {currentTab === 'profile' && (
          <ProfileSettingsScreen
            onProfileChange={b => setBrokerName(b.name)}
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
              onPress={() => setCurrentTab(item.key)}>
              <Icon name={item.icon} size={22} color={active ? colors.primary : colors.textMuted} />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

/** Iniciais do corretor para o avatar do cabeçalho (ex.: "Ana Souza" → "AS"). */
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
