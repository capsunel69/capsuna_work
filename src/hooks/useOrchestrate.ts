import { useCallback, useRef, useState } from 'react';
import { PiovraAPI, type AgentStep, type ChatHistoryMessage } from '../services/piovra';
import { useAppContext } from '../context/AppContext';

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
  const { refreshTasks, refreshMeetings, refreshReminders } = useAppContext();

  /**
   * Watch each agent step. When the agent calls a `capsuna.*` mutation skill
   * (anything except `.list`) and gets a successful tool_result back, refresh
   * the matching resource so the rest of the UI shows the change live.
   */
  const reactToStep = useCallback(
    (step: AgentStep): void => {
      if (step.kind !== 'tool_result') return;
      const skill = step.skill ?? '';
      if (!skill.startsWith('capsuna.')) return;
      if (skill.endsWith('.list')) return;
      if (skill.startsWith('capsuna.tasks.')) void refreshTasks();
      else if (skill.startsWith('capsuna.meetings.')) void refreshMeetings();
      else if (skill.startsWith('capsuna.reminders.')) void refreshReminders();
    },
    [refreshTasks, refreshMeetings, refreshReminders],
  );

  const updateTurn = (id: string, patch: Partial<ChatTurn>): void => {
    setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const appendStep = (id: string, step: AgentStep): void => {
    setTurns((prev) =>
      prev.map((t) => (t.id === id ? { ...t, steps: [...t.steps, step] } : t)),
    );
  };

  const turnsRef = useRef<ChatTurn[]>(turns);
  turnsRef.current = turns;

  const send = useCallback(
    async (input: string): Promise<void> => {
      const trimmed = input.trim();
      if (!trimmed) return;

      const history = buildHistory(turnsRef.current);

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
          history,
          signal: controller.signal,
          onStep: (step) => {
            appendStep(turnId, step);
            reactToStep(step);
          },
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
    [instanceId, reactToStep],
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

/**
 * Flatten completed turns into a chat history the orchestrator can replay.
 * Each prior turn contributes the user input plus, if the assistant produced
 * a final message, that final assistant text. Tool calls/results are
 * intentionally omitted — the agent re-derives ids each turn via
 * capsuna.*.list, which is cheap and avoids tool-message format drift.
 *
 * Capped to the last N messages so prompt cost stays bounded.
 */
function buildHistory(turns: ChatTurn[]): ChatHistoryMessage[] {
  const MAX_MESSAGES = 30;
  const out: ChatHistoryMessage[] = [];
  for (const t of turns) {
    if (t.status !== 'idle') continue;
    if (t.input?.trim()) out.push({ role: 'user', content: t.input });
    const assistantText =
      (t.output && t.output.trim()) ||
      lastAssistantText(t.steps) ||
      '';
    if (assistantText) out.push({ role: 'assistant', content: assistantText });
  }
  return out.slice(-MAX_MESSAGES);
}

function lastAssistantText(steps: AgentStep[]): string {
  for (let i = steps.length - 1; i >= 0; i--) {
    const s = steps[i];
    if (s.kind === 'message' && s.role === 'assistant' && s.content?.trim()) {
      return s.content;
    }
  }
  return '';
}
