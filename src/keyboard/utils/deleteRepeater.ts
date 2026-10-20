/**
 * Repetição do ⌫ ao segurar: apaga uma vez, espera `delayMs` e passa a apagar
 * a cada `intervalMs` até `stop()`.
 *
 * Proteções contra o bug de "apagar para sempre":
 * - start() sempre cancela a repetição anterior (nada de timer órfão);
 * - para sozinho quando deleteFn resolve false (campo vazio) ou falha;
 * - para sozinho depois de `maxMs`;
 * - respostas atrasadas de um "segurar" anterior são ignoradas.
 */
export interface DeleteRepeaterOptions {
  delayMs: number;
  intervalMs: number;
  maxMs: number;
}

export function createDeleteRepeater(
  deleteFn: () => Promise<boolean>,
  { delayMs, intervalMs, maxMs }: DeleteRepeaterOptions,
) {
  let holdId = 0;
  let delayTimer: ReturnType<typeof setTimeout> | null = null;
  let repeatTimer: ReturnType<typeof setInterval> | null = null;

  const stop = () => {
    holdId += 1;
    if (delayTimer) clearTimeout(delayTimer);
    if (repeatTimer) clearInterval(repeatTimer);
    delayTimer = null;
    repeatTimer = null;
  };

  const start = () => {
    stop();
    const id = holdId;
    const deleteOnce = () =>
      deleteFn()
        .then(deleted => {
          if (!deleted && holdId === id) stop();
        })
        .catch(() => {
          if (holdId === id) stop();
        });

    deleteOnce();
    delayTimer = setTimeout(() => {
      delayTimer = null;
      const startedAt = Date.now();
      repeatTimer = setInterval(() => {
        if (Date.now() - startedAt > maxMs) {
          stop();
          return;
        }
        deleteOnce();
      }, intervalMs);
    }, delayMs);
  };

  /** Há uma repetição ativa (ou agendada)? Usado nos testes. */
  const isActive = () => delayTimer !== null || repeatTimer !== null;

  return { start, stop, isActive };
}
