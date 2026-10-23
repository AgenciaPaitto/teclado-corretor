/**
 * Início — painel principal do app.
 * Poucos cards na primeira tela (teclado, primeiros passos, atalhos para as
 * outras áreas); o detalhe de cada assunto fica num submenu.
 */
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { IconTile } from '../../keyboard/components/Icon';
import { makeStyles, spacing, useColors } from '../../keyboard/theme';
import { getSegment } from '../../segments/segments';
import { Repo } from '../../storage/storage';
import {
  Button,
  Card,
  CardText,
  CardTitle,
  MenuGroup,
  MenuRow,
  Page,
  ProgressBar,
  ScreenTitle,
  StatusChip,
  SubHeader,
} from '../components/ui';
import { buildSteps } from '../onboarding/steps';
import type { OnboardingStep, StepTarget } from '../onboarding/steps';
import { KeyboardSetupScreen, KeyboardTestScreen, useKeyboardStatus } from './KeyboardSetupScreen';
import { ShortcutsManagerScreen } from './ShortcutsManagerScreen';

type HomeSection = 'root' | 'install' | 'steps' | 'test' | 'shortcuts';

/** Destinos fora do Início (outras abas do app). */
export type AppTarget = Extract<StepTarget, 'account-data' | 'catalog'>;

interface Props {
  onNavigate: (target: AppTarget) => void;
  onOpenTutorial: () => void;
}

export function HomeScreen({ onNavigate, onOpenTutorial }: Props) {
  const styles = useStyles();
  const [section, setSection] = useState<HomeSection>('root');
  const keyboard = useKeyboardStatus();
  const segment = getSegment(Repo.getSegment());
  const back = () => setSection('root');

  const go = (target: StepTarget) => {
    if (target === 'install' || target === 'test' || target === 'shortcuts') setSection(target);
    else onNavigate(target);
  };

  if (section === 'install') return <KeyboardSetupScreen onBack={back} />;
  if (section === 'shortcuts') {
    return (
      <View style={styles.flexOnly}>
        <View style={styles.subHeaderBar}>
          <SubHeader title="Atalhos" onBack={back} />
        </View>
        <ShortcutsManagerScreen />
      </View>
    );
  }
  if (section === 'test') return <KeyboardTestScreen onBack={back} />;

  // Recalculado a cada volta ao Início (os submenus podem ter concluído passos)
  const steps = buildSteps(segment, keyboard.enabled);
  if (section === 'steps') return <StepsScreen steps={steps} onBack={back} onGo={go} />;

  return (
    <HomeRoot
      steps={steps}
      keyboardReady={keyboard.selected === true || steps[0].done}
      keyboardHalfway={keyboard.enabled === true && keyboard.selected === false}
      onSection={setSection}
      onNavigate={onNavigate}
      onOpenTutorial={onOpenTutorial}
    />
  );
}

interface RootProps {
  steps: OnboardingStep[];
  keyboardReady: boolean;
  keyboardHalfway: boolean;
  onSection: (s: HomeSection) => void;
  onNavigate: (target: AppTarget) => void;
  onOpenTutorial: () => void;
}

function HomeRoot({ steps, keyboardReady, keyboardHalfway, onSection, onNavigate, onOpenTutorial }: RootProps) {
  const styles = useStyles();
  const seller = Repo.getSeller();
  const segment = getSegment(seller.segment);
  const folders = Repo.getFolders();
  const itemCount = folders.reduce((n, f) => n + f.products.length, 0);
  const shortcuts = Repo.getShortcuts();
  const shortcutCount = shortcuts.texts.length + shortcuts.audios.length;

  const doneCount = steps.filter(s => s.done).length;
  const nextStep = steps.find(s => !s.done);
  const firstName = seller.name.trim().split(/\s+/)[0];

  return (
    <Page>
      <ScreenTitle
        overline={seller.business || segment.label}
        title={firstName ? `Olá, ${firstName}` : 'Olá!'}
      />

      {/* Teclado: o essencial para tudo funcionar */}
      <Card>
        <View style={styles.cardHead}>
          <IconTile name="teclado" size={44} />
          <View style={styles.flex}>
            <CardTitle>Teclado KEYCON</CardTitle>
            <StatusChip
              done={keyboardReady}
              label={keyboardReady ? 'Ativo' : keyboardHalfway ? 'Falta selecionar' : 'Não ativado'}
            />
          </View>
        </View>
        {keyboardReady ? (
          <Button label="Testar o teclado" variant="secondary" onPress={() => onSection('test')} />
        ) : (
          <Button testID="home-activate" label="Ativar o teclado" onPress={() => onSection('install')} />
        )}
      </Card>

      {/* Primeiros passos: some quando tudo estiver feito */}
      {nextStep && (
        <Card>
          <View style={styles.rowBetween}>
            <CardTitle>Primeiros passos</CardTitle>
            <Text style={styles.count}>
              {doneCount} de {steps.length}
            </Text>
          </View>
          <ProgressBar value={doneCount / steps.length} />
          <CardText>Próximo: {nextStep.title.toLowerCase()}.</CardText>
          <Button testID="home-steps" label="Continuar" onPress={() => onSection('steps')} />
        </Card>
      )}

      <MenuGroup>
        <MenuRow
          icon="arquivos"
          title={segment.terms.catalog}
          subtitle={`${folders.length} ${folders.length === 1 ? 'pasta' : 'pastas'}`}
          value={`${itemCount}`}
          onPress={() => onNavigate('catalog')}
        />
        <MenuRow
          icon="atalhos"
          title="Atalhos"
          subtitle="Textos e áudios prontos"
          value={`${shortcutCount}`}
          onPress={() => onSection('shortcuts')}
        />
        <MenuRow icon="teclado" title="Instalação do teclado" subtitle="Android e iPhone" onPress={() => onSection('install')} />
        <MenuRow testID="home-tutorial" icon="info" title="Tutorial do app" subtitle="Tudo o que dá para fazer" onPress={onOpenTutorial} />
      </MenuGroup>
    </Page>
  );
}

interface StepsProps {
  steps: OnboardingStep[];
  onBack: () => void;
  onGo: (target: StepTarget) => void;
}

/** Submenu: lista dos primeiros passos, um card por passo. */
function StepsScreen({ steps, onBack, onGo }: StepsProps) {
  const colors = useColors();
  const styles = useStyles();
  const doneCount = steps.filter(s => s.done).length;
  return (
    <Page>
      <SubHeader title="Primeiros passos" onBack={onBack} />
      <Card>
        <View style={styles.rowBetween}>
          <CardText>
            {doneCount === steps.length ? 'Tudo pronto!' : `${doneCount} de ${steps.length} concluídos`}
          </CardText>
        </View>
        <ProgressBar value={doneCount / steps.length} />
      </Card>
      {steps.map(step => (
        <Card key={step.id}>
          <View style={styles.cardHead}>
            <IconTile name={step.icon} size={40} color={step.done ? colors.successText : undefined} />
            <View style={styles.flex}>
              <Text style={[styles.stepTitle, step.done && styles.stepTitleDone]}>{step.title}</Text>
              <Text style={styles.stepText}>{step.description}</Text>
            </View>
          </View>
          {step.done ? (
            <StatusChip done label="Concluído" />
          ) : (
            <Button testID={`step-${step.id}`} label={step.actionLabel} variant="secondary" onPress={() => onGo(step.target)} />
          )}
        </Card>
      ))}
    </Page>
  );
}

const useStyles = makeStyles(colors => ({
  flex: { flex: 1, gap: spacing.xs },
  flexOnly: { flex: 1 },
  subHeaderBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  count: { fontSize: 13, fontWeight: '600', color: colors.primaryText },
  stepTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  stepTitleDone: { color: colors.textMuted },
  stepText: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
}));
