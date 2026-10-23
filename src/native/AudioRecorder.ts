/**
 * Gravador de áudio do app (atalhos de áudio). No Android usa o módulo nativo
 * KeyconAudioRecorder (M4A/AAC); a permissão do microfone é pedida na hora.
 */
import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import type { LocalMedia } from '../services/mediaUpload';

interface RecorderNative {
  start(): Promise<boolean>;
  stop(): Promise<{ uri: string; name: string; mimeType: string; size: number; durationMs: number }>;
  cancel(): Promise<boolean>;
}

const Native: RecorderNative | undefined = NativeModules.KeyconAudioRecorder;

export class RecorderError extends Error {}

/** Gravar está disponível neste aparelho. */
export const canRecord = Platform.OS === 'android' && !!Native;

async function ensureMicPermission(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
    title: 'Gravar áudio',
    message: 'O KEYCON usa o microfone só para gravar os seus atalhos de áudio.',
    buttonPositive: 'Permitir',
    buttonNegative: 'Agora não',
  });
  if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
    throw new RecorderError(
      granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
        ? 'O microfone está bloqueado para o KEYCON. Libere em Configurações › Apps › KEYCON › Permissões.'
        : 'Sem permissão para usar o microfone.',
    );
  }
}

export async function startRecording(): Promise<void> {
  if (!Native) throw new RecorderError('Gravação disponível só no aplicativo Android por enquanto.');
  await ensureMicPermission();
  try {
    await Native.start();
  } catch (e) {
    throw new RecorderError(e instanceof Error ? e.message : 'Não foi possível usar o microfone.');
  }
}

export async function stopRecording(): Promise<LocalMedia> {
  if (!Native) throw new RecorderError('Nenhuma gravação em andamento.');
  try {
    const r = await Native.stop();
    return { uri: r.uri, name: r.name, mimeType: r.mimeType, size: r.size, durationMs: r.durationMs };
  } catch (e) {
    throw new RecorderError(e instanceof Error ? e.message : 'Não foi possível terminar a gravação.');
  }
}

export async function cancelRecording(): Promise<void> {
  await Native?.cancel().catch(() => {});
}
