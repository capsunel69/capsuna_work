import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  Badge, Card, CardHeader, CardTitle, CardSubtle, EmptyState,
  Field, Label, Row, Select, Spinner,
} from '../ui/primitives';
import { IconBot, IconClock } from '../ui/icons';
import {
  PiovraAPI,
  type AgentInstance,
  type AgentRun,
  type RunStatus,
  type ScheduledJob,
} from '../../services/piovra';
import RunDetail from './RunDetail';

/**
 * Reports tab — a digest-style feed of agent runs that came from a scheduled
 * job. Surfaces the agent's `output` as the headline, with job + instance
 * metadata as sub-context, ordered newest first.
 *
 * This view intentionally hides chat/interactive runs and the full step
 * trail. Click any card to open the detailed `RunDetail` drawer for the
 * engineering view.
 */

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--s-3);
  padding: var(--s-3) var(--s-5);
  border-bottom: 1px solid var(--border-1);
  background: var(--bg-1);
`;

const Feed = styled.div`
  display: flex;
  flex-direction: column;
`;

const ReportCard = styled.button`
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--border-1);
  padding: var(--s-4) var(--s-5);
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &:hover { background: var(--bg-3); }
  &:last-child { border-bottom: 0; }
`;

const HeaderLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
`;

const JobName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: var(--text-1);
`;

const SubtleLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  color: var(--text-3);
  font-family: var(--font-mono);

  svg { width: 12px; height: 12px; }
`;

/**
 * Output preview — preserves whitespace and basic newlines so markdown-ish
 * agent output reads naturally. Truncated with line-clamp.
 */
const OutputPreview = styled.div`
  color: var(--text-2);
  font-size: 13px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-wrap: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ErrorLine = styled.div`
  color: var(--danger);
  font-size: 12.5px;
  font-family: var(--font-mono);
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const statusTone = (s: RunStatus): 'neutral' | 'accent' | 'success' | 'warning' | 'danger' => {
  switch (s) {
    case 'queued':    return 'neutral';
    case 'running':   return 'accent';
    case 'succeeded': return 'success';
    case 'failed':    return 'danger';
    case 'cancelled': return 'warning';
  }
};

const fmtWhen = (iso: string): string => {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const ReportsList: React.FC = () => {
  const [runs, setRuns] = useState<AgentRun[] | null>(null);
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [instances, setInstances] = useState<AgentInstance[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<RunStatus | 'all'>('all');

  useEffect(() => {
    let cancelled = false;
    setErr(null);

    Promise.all([
      PiovraAPI.listRuns(),
      PiovraAPI.listJobs(),
      PiovraAPI.listInstances(),
    ])
      .then(([r, j, i]) => {
        if (cancelled) return;
        setRuns(r);
        setJobs(j);
        setInstances(i);
      })
      .catch((e) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      });

    return () => { cancelled = true; };
  }, []);

  const jobById = useMemo(() => {
    const m = new Map<string, ScheduledJob>();
    jobs.forEach((j) => m.set(j.id, j));
    return m;
  }, [jobs]);

  const instanceById = useMemo(() => {
    const m = new Map<string, AgentInstance>();
    instances.forEach((i) => m.set(i.id, i));
    return m;
  }, [instances]);

  const reports = useMemo(() => {
    if (!runs) return null;
    return runs
      .filter((r) => r.jobId !== null)
      .filter((r) => (jobFilter === 'all' ? true : r.jobId === jobFilter))
      .filter((r) => (statusFilter === 'all' ? true : r.status === statusFilter));
  }, [runs, jobFilter, statusFilter]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <IconBot />
          Agent reports
        </CardTitle>
        <CardSubtle>
          {reports ? `${reports.length} report${reports.length === 1 ? '' : 's'}` : err ? 'unavailable' : 'loading…'}
        </CardSubtle>
      </CardHeader>

      {err ? (
        <EmptyState>
          <div>Piovra is unreachable.</div>
          <div style={{ marginTop: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>{err}</div>
        </EmptyState>
      ) : !reports ? (
        <EmptyState>
          <Spinner />
          <div style={{ marginTop: 8 }}>Loading reports…</div>
        </EmptyState>
      ) : (
        <>
          <Toolbar>
            <Field style={{ minWidth: 200 }}>
              <Label>Schedule</Label>
              <Select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)}>
                <option value="all">All schedules</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.name}</option>
                ))}
              </Select>
            </Field>
            <Field style={{ minWidth: 160 }}>
              <Label>Status</Label>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as RunStatus | 'all')}>
                <option value="all">All statuses</option>
                <option value="succeeded">Succeeded</option>
                <option value="failed">Failed</option>
                <option value="running">Running</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </Field>
          </Toolbar>

          {reports.length === 0 ? (
            <EmptyState>
              No scheduled runs yet. Create a schedule and let it fire — reports will land here.
            </EmptyState>
          ) : (
            <Feed>
              {reports.map((r) => {
                const job = r.jobId ? jobById.get(r.jobId) : null;
                const inst = instanceById.get(r.instanceId);
                const preview = r.output?.trim() || (r.error ? '' : '(no output)');
                return (
                  <ReportCard key={r.id} onClick={() => setOpenId(r.id)}>
                    <HeaderLine>
                      <JobName>{job?.name ?? 'Scheduled run'}</JobName>
                      <Badge $variant={statusTone(r.status)}>{r.status}</Badge>
                      <Row $gap={2} style={{ marginLeft: 'auto', alignItems: 'center' }}>
                        <SubtleLine>
                          <IconClock />
                          {fmtWhen(r.startedAt)}
                        </SubtleLine>
                      </Row>
                    </HeaderLine>

                    <SubtleLine>
                      {inst ? <span>{inst.name}</span> : null}
                      {job?.cron ? <span>· {job.cron}{job.tz ? ` (${job.tz})` : ''}</span> : null}
                      {(r.tokensIn ?? 0) + (r.tokensOut ?? 0) > 0 ? (
                        <span>· {(r.tokensIn ?? 0) + (r.tokensOut ?? 0)} tokens</span>
                      ) : null}
                    </SubtleLine>

                    {r.error ? (
                      <ErrorLine>{r.error}</ErrorLine>
                    ) : preview ? (
                      <OutputPreview>{preview}</OutputPreview>
                    ) : null}
                  </ReportCard>
                );
              })}
            </Feed>
          )}
        </>
      )}

      <RunDetail runId={openId} onClose={() => setOpenId(null)} />
    </Card>
  );
};

export default ReportsList;
