import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { KeyboardBridge } from '../../native/KeyboardBridge';
import { coralGlass, makeStyles, onCoralText, radius, spacing, touchTarget } from '../theme';
import { CoralSheen } from './Glass';
import { KeyconMark } from './KeyconLogo';

/**
 * Mostrado nas áreas de vendas (Produtos, Atalhos, IA, Mais) quando o
 * app não está logado. O teclado de letras (ABC) continua funcionando.
 */
export function LoginRequiredPanel() {
  const styles = useStyles();
  return (
    <View style={styles.container} testID="login-required">
      <KeyconMark size={36} />
      <Text style={styles.title}>Entre no app para usar o teclado</Text>
      <Text style={styles.desc}>
        Seus produtos e atalhos aparecem aqui depois do login no app KEYCON. Enquanto isso, o
        botão ABC continua disponível para digitar.
      </Text>
      <Pressable
        testID="login-open-app"
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
        onPress={() => KeyboardBridge.openApp()}>
        <CoralSheen radius={radius.md} />
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
  title: { color: colors.text, fontSize: 17, fontWeight: '600', textAlign: 'center' },
  desc: { color: colors.textMuted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  btn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    minHeight: touchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    ...coralGlass(colors, { pill: false }),
  },
  pressed: { opacity: 0.85 },
  btnText: { color: colors.onPrimary, fontSize: 15, fontWeight: '600', ...onCoralText },
}));
