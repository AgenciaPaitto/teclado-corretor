/**
 * App.tsx — Container App Principal do Corretor de Imóveis
 * -------------------------------------------------------------
 * Gerencia a conta do corretor, onboarding e passo a passo de
 * instalação do teclado no Android e iOS, catálogo de produtos,
 * upload e armazenamento de fotos em nuvem, e atalhos rápidos.
 */
import React, { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Repo } from '../storage/storage';
import { colors, radius } from '../keyboard/theme';
import { AuthScreen } from './screens/AuthScreen';
import { OnboardingGuideScreen } from './screens/OnboardingGuideScreen';
import { ProductsManagerScreen } from './screens/ProductsManagerScreen';
import { ProfileSettingsScreen } from './screens/ProfileSettingsScreen';
import { ShortcutsManagerScreen } from './screens/ShortcutsManagerScreen';

type AppTab = 'onboarding' | 'products' | 'shortcuts' | 'profile';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!Repo.getAuthToken());
  const [currentTab, setCurrentTab] = useState<AppTab>('onboarding');

  // Se não estiver logado, exibe tela de Autenticação / Criação de Conta
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
        <AuthScreen onSuccess={() => setIsAuthenticated(true)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.appTitle}>Corretor Keyboard</Text>
          <Text style={styles.appSubTitle}>Painel de Controle do Aplicativo</Text>
        </View>
        <Pressable
          style={styles.headerBadge}
          onPress={() => setCurrentTab('profile')}>
          <Text style={styles.headerBadgeText}>
            {Repo.getBroker().name.split(' ')[0]}
          </Text>
        </Pressable>
      </View>

      {/* Área da Tela Ativa */}
      <View style={styles.screenBody}>
        {currentTab === 'onboarding' && <OnboardingGuideScreen />}
        {currentTab === 'products' && <ProductsManagerScreen />}
        {currentTab === 'shortcuts' && <ShortcutsManagerScreen />}
        {currentTab === 'profile' && (
          <ProfileSettingsScreen
            onLogout={() => {
              Repo.clearAuth();
              setIsAuthenticated(false);
            }}
          />
        )}
      </View>

      {/* Menu Inferior de Navegação do App Container */}
      <View style={styles.navBar}>
        <Pressable
          style={[styles.navBtn, currentTab === 'onboarding' && styles.navBtnActive]}
          onPress={() => setCurrentTab('onboarding')}>
          <Text style={[styles.navLabel, currentTab === 'onboarding' && styles.navLabelActive]}>
            Instalação
          </Text>
        </Pressable>

        <Pressable
          style={[styles.navBtn, currentTab === 'products' && styles.navBtnActive]}
          onPress={() => setCurrentTab('products')}>
          <Text style={[styles.navLabel, currentTab === 'products' && styles.navLabelActive]}>
            Produtos & Fotos
          </Text>
        </Pressable>

        <Pressable
          style={[styles.navBtn, currentTab === 'shortcuts' && styles.navBtnActive]}
          onPress={() => setCurrentTab('shortcuts')}>
          <Text style={[styles.navLabel, currentTab === 'shortcuts' && styles.navLabelActive]}>
            Atalhos
          </Text>
        </Pressable>

        <Pressable
          style={[styles.navBtn, currentTab === 'profile' && styles.navBtnActive]}
          onPress={() => setCurrentTab('profile')}>
          <Text style={[styles.navLabel, currentTab === 'profile' && styles.navLabelActive]}>
            Conta
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceAlt,
    backgroundColor: colors.surface,
  },
  appTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  appSubTitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  headerBadge: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  headerBadgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  screenBody: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceAlt,
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 4,
  },
  navBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  navBtnActive: {
    backgroundColor: colors.surfaceAlt,
  },
  navLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  navLabelActive: {
    color: colors.text,
    fontWeight: '700',
  },
});
