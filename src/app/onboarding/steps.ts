/**
 * "Primeiros passos" do Início: o que falta para o usuário tirar proveito do
 * app. Cada passo é marcado sozinho quando o app consegue ver que foi feito
 * (ex.: já existe uma pasta); os demais o usuário conclui pelo próprio passo.
 */
import type { IconName } from '../../keyboard/components/Icon';
import type { SegmentProfile } from '../../segments/segments';
import { Repo } from '../../storage/storage';

/** Para onde o botão do passo leva. */
export type StepTarget = 'install' | 'account-data' | 'catalog' | 'shortcuts' | 'test';

export interface OnboardingStep {
  id: string;
  icon: IconName;
  title: string;
  description: string;
  actionLabel: string;
  target: StepTarget;
  done: boolean;
}

/** Passos que só o usuário sabe se fez (não dá para detectar). */
export const MANUAL_STEPS = { keyboard: 'keyboard', test: 'test' } as const;

/**
 * `keyboardEnabled`: null quando o sistema não informa (iPhone, web) — aí o
 * passo é concluído pelo botão "Já ativei" na tela de instalação.
 */
export function buildSteps(segment: SegmentProfile, keyboardEnabled: boolean | null): OnboardingStep[] {
  const seller = Repo.getSeller();
  const folders = Repo.getFolders();
  const products = folders.flatMap(f => f.products);
  const shortcuts = Repo.getShortcuts();
  const manual = Repo.getStepsDone();
  const { item } = segment.terms;

  return [
    {
      id: 'keyboard',
      icon: 'teclado',
      title: 'Ativar o teclado',
      description: 'Ligue o KEYCON nas configurações do celular.',
      actionLabel: 'Ativar',
      target: 'install',
      done: keyboardEnabled === true || manual.includes(MANUAL_STEPS.keyboard),
    },
    {
      id: 'profile',
      icon: 'clientes',
      title: 'Completar seu perfil',
      description: 'Nome, negócio e WhatsApp entram nas suas mensagens.',
      actionLabel: 'Completar',
      target: 'account-data',
      done: !!seller.name.trim() && !!seller.phone.trim() && !!seller.business.trim(),
    },
    {
      id: 'folder',
      icon: 'novaPasta',
      title: 'Criar a primeira pasta',
      description: `As pastas organizam seus ${segment.terms.items}.`,
      actionLabel: 'Criar',
      target: 'catalog',
      done: folders.length > 0,
    },
    {
      id: 'item',
      icon: 'arquivos',
      title: `Cadastrar o primeiro ${item}`,
      description: 'Com preço e descrição, pronto para enviar.',
      actionLabel: 'Cadastrar',
      target: 'catalog',
      done: products.length > 0,
    },
    {
      id: 'photo',
      icon: 'foto',
      title: 'Adicionar uma foto',
      description: `O teclado envia a foto do ${item} direto na conversa.`,
      actionLabel: 'Adicionar',
      target: 'catalog',
      done: products.some(p => p.photos.length > 0),
    },
    {
      id: 'shortcut',
      icon: 'atalhos',
      title: 'Criar um atalho',
      description: 'Textos e áudios que você manda sempre, a um toque.',
      actionLabel: 'Criar',
      target: 'shortcuts',
      done: shortcuts.texts.length + shortcuts.audios.length > 0,
    },
    {
      id: 'test',
      icon: 'respostas',
      title: 'Testar o teclado',
      description: 'Digite com o KEYCON e veja as sugestões de palavras.',
      actionLabel: 'Testar',
      target: 'test',
      done: manual.includes(MANUAL_STEPS.test),
    },
  ];
}
