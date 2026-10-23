/**
 * No react-native-web, Alert.alert não faz nada. O app usa Alert para avisos
 * ("Informe o nome da pasta") e confirmações ("Excluir produto?"), então na web
 * eles viram as caixas nativas do navegador (alert / confirm).
 */
import { Alert } from 'react-native';
import type { AlertButton } from 'react-native';

Alert.alert = (title: string, message?: string, buttons?: AlertButton[]) => {
  const text = [title, message].filter(Boolean).join('\n\n');

  if (!buttons || buttons.length <= 1) {
    window.alert(text);
    buttons?.[0]?.onPress?.();
    return;
  }

  // Duas ou mais opções: "OK" executa a ação principal, "Cancelar" a de cancelar
  const cancel = buttons.find(b => b.style === 'cancel');
  const action = buttons.find(b => b !== cancel);
  if (window.confirm(text)) action?.onPress?.();
  else cancel?.onPress?.();
};
