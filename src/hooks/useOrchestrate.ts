import { useCallback, useRef, useState } from 'react';
import { PiovraAPI, type AgentStep } from '../services/piovra';

export type ChatStatus = 'idle' | 'streaming' | 'error';

export interface ChatTurn {
  id: string;
  input: string;
  steps: AgentStep[];
  output: string | null;
  error: string | null;
  status: ChatStatus;
  runId: string | null;
  tokensIn: number | null;
  tokensOut: number | null;
  startedAt: string;
}

interface UseOrchestrateResult {
  turns: ChatTurn[];
  status: ChatStatus;
  send: (input: string) => Promise<void>;
  abort: () => void;
  reset: () => void;
}

export function useOrchestrate(instanceId?: string): UseOrchestrateResult {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [status, setStatus] = useState<ChatStatus>('idle');
  const abortRef = useRef<AbortController | null>(null);

  const updateTurn = (id: string, patch: Partial<ChatTurn>): void => {
    setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const appendStep = (id: string, step: AgentStep): void => {
    setTurns((prev) =>
      prev.map((t) => (t.id === id ? { ...t, steps: [...t.steps, step] } : t)),
    );
  };

  const send = useCallback(
    async (input: string): Promise<void> => {
      const trimmed = input.trim();
      if (!trimmed) return;

      const turnId = crypto.randomUUID();
      const newTurn: ChatTurn = {
        id: turnId,
        input: trimmed,
        steps: [],
        output: null,
        error: null,
        status: 'streaming',
        runId: null,
        tokensIn: null,
        tokensOut: null,
        startedAt: new Date().toISOString(),
      };
      setTurns((prev) => [...prev, newTurn]);
      setStatus('streaming');

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await PiovraAPI.orchestrate({
          input: trimmed,
          instanceId,
          signal: controller.signal,
          onStep: (step) => appendStep(turnId, step),
          onCompleted: ({ runId, output, tokensIn, tokensOut }) => {
            updateTurn(turnId, {
              status: 'idle',
              runId,
              output,
              tokensIn,
              tokensOut,
            });
          },
          onError: (message) => {
            updateTurn(turnId, { status: 'error', error: message });
          },
        });
        setStatus('idle');
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        updateTurn(turnId, { status: 'error', error: message });
        setStatus('error');
      } finally {
        abortRef.current = null;
      }
    },
    [instanceId],
  );

  const abort = useCallback((): void => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus('idle');
    setTurns((prev) =>
      prev.map((t) =>
        t.status === 'streaming' ? { ...t, status: 'error', error: 'aborted' } : t,
      ),
    );
  }, []);

  const reset = useCallback((): void => {
    abortRef.current?.abort();
    abortRef.current = null;
    setTurns([]);
    setStatus('idle');
  }, []);

  return { turns, status, send, abort, reset };
}
