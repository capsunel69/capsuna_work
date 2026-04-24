import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Badge, Card, CardHeader, CardTitle, CardSubtle, EmptyState, Spinner } from '../ui/primitives';
import { IconBot } from '../ui/icons';
import { PiovraAPI, type AgentRun, type RunStatus } from '../../services/piovra';
import RunDetail from './RunDetail';

const Table = styled.div`
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: 110px 2.4fr 100px 100px 140px;
  gap: var(--s-3);
  padding: 10px var(--s-5);
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-3);
  border-bottom: 1px solid var(--border-1);
  background: var(--bg-1);

  @media (max-width: 760px) { display: none; }
`;

const RowItem = styled.button`
  display: grid;
  grid-template-columns: 110px 2.4fr 100px 100px 140px;
  gap: var(--s-3);
  padding: 14px var(--s-5);
  border-bottom: 1px solid var(--border-1);
  align-items: center;
  background: transparent;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: var(--bg-3); }
  &:last-child { border-bottom: 0; }

  @media (max-width: 760px) {
    grid-template-columns: auto 1fr auto;
    grid-template-areas:
      "status input  when"
      "run    tokens tokens";
    row-gap: 6px;

    .cell-status { grid-area: status; }
    .cell-input  { grid-area: input; }
    .cell-tokens { grid-area: tokens; text-align: right; }
    .cell-run    { grid-area: run; }
    .cell-when   { grid-area: when; text-align: right; }
  }
`;

const RunId = styled.span`
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--text-2);
`;

const Input = styled.span`
  font-size: 13px;
  color: var(--text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Tokens = styled.span`
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--text-3);
`;

const Time = styled.span`
  font-size: 11.5px;
  color: var(--text-3);
  font-family: var(--font-mono);
`;

const statusTone = (s: RunStatus): 'neutral' | 'accent' | 'success' | 'warning' | 'danger' => {
  switch (s) {
    case 'queued': return 'neutral';
    case 'running': return 'accent';
    case 'succeeded': return 'success';
    case 'failed': return 'danger';
    case 'cancelled': return 'warning';
  }
};

const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString();
};

const RunsList: React.FC = () => {
  const [runs, setRuns] = useState<AgentRun[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setErr(null);
    PiovraAPI.listRuns()
      .then((r) => { if (!cancelled) setRuns(r); })
      .catch((e) => { if (!cancelled) setErr(e instanceof Error ? e.message : String(e)); });
    return () => { cancelled = true; };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <IconBot />
          Recent runs
        </CardTitle>
        <CardSubtle>
          {runs ? `${runs.length} total` : err ? 'unavailable' : 'loading…'}
        </CardSubtle>
      </CardHeader>

      {err ? (
        <EmptyState>
          <div>Piovra is unreachable.</div>
          <div style={{ marginTop: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>{err}</div>
        </EmptyState>
      ) : !runs ? (
        <EmptyState>
          <Spinner />
          <div style={{ marginTop: 8 }}>Loading runs…</div>
        </EmptyState>
      ) : runs.length === 0 ? (
        <EmptyState>No runs yet — send a chat message to create one.</EmptyState>
      ) : (
        <Table>
          <Header>
            <span>Status</span>
            <span>Input</span>
            <span>Tokens</span>
            <span>Run</span>
            <span style={{ textAlign: 'right' }}>When</span>
          </Header>
          {runs.map((r) => (
            <RowItem key={r.id} onClick={() => setOpenId(r.id)}>
              <div className="cell-status">
                <Badge $variant={statusTone(r.status)}>{r.status}</Badge>
              </div>
              <Input className="cell-input">{r.input}</Input>
              <Tokens className="cell-tokens">
                {(r.tokensIn ?? 0) + (r.tokensOut ?? 0) || '—'}
              </Tokens>
              <RunId className="cell-run">{r.id.slice(0, 8)}</RunId>
              <Time className="cell-when" style={{ textAlign: 'right' }}>{fmtDate(r.startedAt)}</Time>
            </RowItem>
          ))}
        </Table>
      )}

      <RunDetail runId={openId} onClose={() => setOpenId(null)} />
    </Card>
  );
};

export default RunsList;
