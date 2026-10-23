import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { IconTile } from '../../keyboard/components/Icon';
import type { IconName } from '../../keyboard/components/Icon';
import { makeStyles, spacing, typography } from '../../keyboard/theme';
import type { SegmentProfile } from '../../segments/segments';
import { Button } from '../components/ui';

interface Slide {
  icon: IconName;
  title: string;
  text: string;
}

/** Um assunto por tela, com no máximo duas frases. */
function slidesFor(segment: SegmentProfile): Slide[] {
  const { catalog, item, items } = segment.terms;
  return [
    {
      icon: 'teclado',
      title: 'Bem-vindo ao KEYCON',
      text: 'Seu catálogo de vendas dentro do teclado, em qualquer conversa.',
    },
    {
      icon: 'configuracoes',
      title: 'Ative o teclado',
      text: 'Ligue o KEYCON nas configurações do celular. Leva menos de um minuto.',
    },
    {
      icon: 'novaPasta',
      title: `Cadastre seus ${items}`,
      text: `Crie pastas e adicione cada ${item} com preço, fotos e vídeos.`,
    },
    {
      icon: 'atalhos',
      title: 'Crie atalhos',
      text: 'Salve os textos e áudios que você manda sempre e envie com um toque.',
    },
    {
      icon: 'arquivos',
      title: 'Venda pelo teclado',
      text: `Na conversa, toque em ${catalog} no teclado e envie a ficha ou as fotos.`,
    },
    {
      icon: 'clientes',
      title: 'Clientes e agenda',
      text: 'Acompanhe o funil e marque reuniões no app ou no teclado, que abre em tela grande.',
    },
    {
      icon: 'ia',
      title: 'Respostas com IA',
      text: 'Copie a mensagem do cliente e toque em IA: o KEYCON sugere a resposta.',
    },
    {
      icon: 'respostas',
      title: 'Para o dia a dia',
      text: 'Corretor, sugestões de palavras e maiúscula automática, sem trocar de teclado.',
    },
  ];
}

interface Props {
  segment: SegmentProfile;
  onClose: () => void;
}

export function TutorialScreen({ segment, onClose }: Props) {
  const styles = useStyles();
  const slides = slidesFor(segment);
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const last = index === slides.length - 1;

  return (
    <View style={styles.root} testID="tutorial">
      <View style={styles.top}>
        <Text style={styles.counter}>
          {index + 1} de {slides.length}
        </Text>
        {!last && (
          <Pressable accessibilityRole="button" hitSlop={12} onPress={onClose}>
            <Text style={styles.skip}>Pular</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.body}>
        <IconTile name={slide.icon} size={96} />
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.text}>{slide.text}</Text>
      </View>

      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.actions}>
        {index > 0 && (
          <View style={styles.flex}>
            <Button label="Voltar" variant="secondary" onPress={() => setIndex(i => i - 1)} />
          </View>
        )}
        <View style={styles.flex}>
          <Button
            testID="tutorial-next"
            label={last ? 'Começar' : 'Próximo'}
            onPress={() => (last ? onClose() : setIndex(i => i + 1))}
          />
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles(colors => ({
  root: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 },
  counter: { ...typography.caption, color: colors.textMuted },
  skip: { fontSize: 15, fontWeight: '600', color: colors.primaryText },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, paddingHorizontal: spacing.sm },
  title: { ...typography.h2, color: colors.text, textAlign: 'center' },
  text: { ...typography.body, fontSize: 16, lineHeight: 24, color: colors.textSecondary, textAlign: 'center', maxWidth: 320 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: spacing.xl },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt },
  dotActive: { width: 20, backgroundColor: colors.primary },
  actions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
}));
