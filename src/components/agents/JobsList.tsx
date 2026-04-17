import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  Badge, Button, Card, CardHeader, CardTitle, CardSubtle, EmptyState, Spinner, Row,
} from '../ui/primitives';
import { IconClock, IconPlus, IconPlay } from '../ui/icons';
import {
  PiovraAPI,
  type AgentInstance,
  type ScheduledJob,
} from '../../services/piovra';
import Drawer from './Drawer';
import JobForm from './JobForm';

const Table = styled.div`
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: 2fr 1.4fr 1fr 1.2fr 1.2fr 100px;
  gap: var(--s-3);
  padding: 10px var(--s-5);
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-3);
  border-bottom: 1px solid var(--border-1);
  background: var(--bg-1);
`;

const RowItem = styled.div`
  display: grid;
  grid-template-columns: 2fr 1.4fr 1fr 1.2fr 1.2fr 100px;
  gap: var(--s-3);
  padding: 12px var(--s-5);
  border-bottom: 1px solid var(--border-1);
  align-items: center;

  &:last-child { border-bottom: 0; }
`;

const Clickable = styled.button`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  background: transparent;
  border: 0;
  text-align: left;
  cursor: pointer;
  color: var(--text-1);
  padding: 0;

  strong { font-size: 13px; font-weight: 500; color: var(--text-1); }
  span { font-size: 11.5px; color: var(--text-3); font-family: var(--font-mono); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  &:hover strong { color: var(--accent); }
`;

const Cron = styled.span`
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-2);
`;

const Meta = styled.span`
  font-size: 11.5px;
  color: var(--text-3);
  font-family: var(--font-mono);
`;

type Mode =
  | { kind: 'edit'; job: ScheduledJob }
  | { kind: 'create' }
  | null;

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const JobsList: React.FC = () => {
  const [jobs, setJobs] = useState<ScheduledJob[] | null>(null);
  const [instances, setInstances] = useState<AgentInstance[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [runningId, setRunningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const [j, i] = await Promise.all([PiovraAPI.listJobs(), PiovraAPI.listInstances()]);
      setJobs(j);
      setInstances(i);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const instanceById = useMemo(() => {
    const m = new Map<string, AgentInstance>();
    instances.forEach((i) => m.set(i.id, i));
    return m;
  }, [instances]);

  const close = (): void => setMode(null);

  const handleSaved = async (): Promise<void> => {
    await load();
    close();
  };

  const handleDeleted = async (): Promise<void> => {
    await load();
    close();
  };

  const runNow = async (id: string): Promise<void> => {
    setRunningId(id);
    try {
      await PiovraAPI.runJobNow(id);
      setTimeout(() => { void load(); }, 500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setRunningId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <IconClock />
          Scheduled jobs
        </CardTitle>
        <Row $gap={3}>
          <CardSubtle>
            {jobs ? `${jobs.length} total` : err ? 'unavailable' : 'loading…'}
          </CardSubtle>
          <Button
            $variant="primary"
            $size="sm"
            onClick={() => setMode({ kind: 'create' })}
            disabled={instances.length === 0}
          >
            <IconPlus />
            New
          </Button>
        </Row>
      </CardHeader>

      {err ? (
        <EmptyState>
          <div>Piovra is unreachable.</div>
          <div style={{ marginTop: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>{err}</div>
        </EmptyState>
      ) : !jobs ? (
        <EmptyState>
          <Spinner />
          <div style={{ marginTop: 8 }}>Loading schedules…</div>
        </EmptyState>
      ) : jobs.length === 0 ? (
        <EmptyState>
          No schedules yet. Click "New" to add a recurring job.
        </EmptyState>
      ) : (
        <Table>
          <Header>
            <span>Name</span>
            <span>Instance</span>
            <span>Cron</span>
            <span>Next run</span>
            <span>Last run</span>
            <span style={{ textAlign: 'right' }}>Action</span>
          </Header>
          {jobs.map((j) => {
            const inst = instanceById.get(j.instanceId);
            return (
              <RowItem key={j.id}>
                <Clickable onClick={() => setMode({ kind: 'edit', job: j })}>
                  <strong>{j.name}</strong>
                  <span>{j.payload.input.slice(0, 48)}{j.payload.input.length > 48 ? '…' : ''}</span>
                </Clickable>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <span style={{ fontSize: 13 }}>{inst?.name ?? '—'}</span>
                  {j.enabled ? (
                    <Badge $variant="success">enabled</Badge>
                  ) : (
                    <Badge>paused</Badge>
                  )}
                </div>
                <Cron>{j.cron}</Cron>
                <Meta>{formatDate(j.nextRunAt)}</Meta>
                <Meta>{formatDate(j.lastRunAt)}</Meta>
                <div style={{ textAlign: 'right' }}>
                  <Button
                    $variant="secondary"
                    $size="sm"
                    onClick={() => void runNow(j.id)}
                    disabled={runningId === j.id}
                  >
                    <IconPlay />
                    {runningId === j.id ? '…' : 'Run'}
                  </Button>
                </div>
              </RowItem>
            );
          })}
        </Table>
      )}

      <Drawer
        open={mode?.kind === 'edit' || mode?.kind === 'create'}
        onClose={close}
        title={mode?.kind === 'edit' ? `Edit ${mode.job.name}` : 'New schedule'}
      >
        {(mode?.kind === 'edit' || mode?.kind === 'create') && (
          <JobForm
            existing={mode.kind === 'edit' ? mode.job : null}
            instances={instances}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
            onCancel={close}
          />
        )}
      </Drawer>
    </Card>
  );
};

export default JobsList;
