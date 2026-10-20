import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { KeyboardBridge } from '../../native/KeyboardBridge';
import { makeStyles, radius, spacing } from '../theme';

/**
 * Mostrado nas áreas do corretor (Produtos, Atalhos, Copilot, Mais) quando o
 * app não está logado. O teclado de letras (ABC) continua funcionando.
 */
export function LoginRequiredPanel() {
  const styles = useStyles();
  return (
    <View style={styles.container} testID="login-required">
      <Text style={styles.title}>Entre no app para usar o teclado</Text>
      <Text style={styles.desc}>
        Seus produtos e atalhos aparecem aqui depois do login no app Corretor Keyboard. Enquanto isso, o
        botão ABC continua disponível para digitar.
      </Text>
      <Pressable
        testID="login-open-app"
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
        onPress={() => KeyboardBridge.openApp()}>
        <Text style={styles.btnText}>Abrir o app e entrar</Text>
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles(colors => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { color: colors.text, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  desc: { color: colors.textMuted, fontSize: 12, lineHeight: 17, textAlign: 'center' },
  btn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.md,
  },
  pressed: { opacity: 0.8 },
  btnText: { color: colors.onPrimary, fontSize: 13, fontWeight: '600' },
}));
