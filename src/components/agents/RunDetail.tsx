import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Badge, Spinner, Stack } from '../ui/primitives';
import { IconClock } from '../ui/icons';
import { PiovraAPI, type AgentRun, type RunStatus, type ScheduledJob } from '../../services/piovra';
import StepCard from './StepCard';
import Drawer from './Drawer';

const Meta = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--s-3);
  font-size: 12px;
  color: var(--text-3);

  label {
    display: block;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-4);
    margin-bottom: 4px;
  }
  div { color: var(--text-1); font-family: var(--font-mono); font-size: 12px; }
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--s-2);

  h4 {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-3);
    margin: 0;
  }
`;

const Pre = styled.pre`
  background: var(--bg-2);
  border: 1px solid var(--border-1);
  border-radius: var(--r-sm);
  padding: var(--s-3) var(--s-4);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-1);
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
`;

const MarkdownOutput = styled.div`
  background: var(--bg-2);
  border: 1px solid var(--border-1);
  border-radius: var(--r-sm);
  padding: var(--s-3) var(--s-4);
  font-size: 13px;
  color: var(--text-1);
  line-height: 1.6;

  p {
    margin: 0 0 10px;
  }
  p:last-child {
    margin-bottom: 0;
  }
  h1, h2, h3, h4 {
    margin: 12px 0 8px;
    color: var(--text-1);
    line-height: 1.3;
  }
  h1 { font-size: 16px; }
  h2 { font-size: 15px; }
  h3, h4 { font-size: 14px; }
  ul, ol {
    margin: 0 0 10px 18px;
    padding: 0;
  }
  li {
    margin-bottom: 5px;
  }
  code {
    background: var(--bg-1);
    border: 1px solid var(--border-1);
    border-radius: 6px;
    padding: 1px 5px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-1);
  }
  pre {
    margin: 8px 0 10px;
    background: var(--bg-1);
    border: 1px solid var(--border-1);
    border-radius: 8px;
    padding: 10px 12px;
    overflow-x: auto;
    font-family: var(--font-mono);
    font-size: 12px;
  }
  a {
    color: var(--accent);
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
`;

const StepStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
`;

const TraceLink = styled.a`
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--accent);
  &:hover { text-decoration: underline; }
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

interface RunDetailProps {
  runId: string | null;
  onClose: () => void;
}

const JobChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--accent-soft);
  color: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 11.5px;
  font-weight: 500;
  width: fit-content;

  svg { width: 12px; height: 12px; }
`;

const RunDetail: React.FC<RunDetailProps> = ({ runId, onClose }) => {
  const [run, setRun] = useState<AgentRun | null>(null);
  const [job, setJob] = useState<ScheduledJob | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) { setRun(null); setJob(null); return; }
    let cancelled = false;
    setRun(null);
    setJob(null);
    setErr(null);
    PiovraAPI.getRun(runId)
      .then((r) => { if (!cancelled) setRun(r); })
      .catch((e) => { if (!cancelled) setErr(e instanceof Error ? e.message : String(e)); });
    return () => { cancelled = true; };
  }, [runId]);

  useEffect(() => {
    if (!run?.jobId) { setJob(null); return; }
    let cancelled = false;
    PiovraAPI.getJob(run.jobId)
      .then((j) => { if (!cancelled) setJob(j); })
      .catch(() => { if (!cancelled) setJob(null); });
    return () => { cancelled = true; };
  }, [run?.jobId]);

  return (
    <Drawer
      open={!!runId}
      onClose={onClose}
      title={
        <>
          Run {runId?.slice(0, 8)}
          {run ? <Badge $variant={statusTone(run.status)} style={{ marginLeft: 8 }}>{run.status}</Badge> : null}
        </>
      }
    >
      {err ? (
        <div style={{ color: 'var(--danger)', fontSize: 12 }}>{err}</div>
      ) : !run ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)' }}>
          <Spinner /> Loading run…
        </div>
      ) : (
        <Stack $gap={4}>
          {run.jobId ? (
            <JobChip title="This run was triggered by a scheduled job">
              <IconClock />
              {job ? `Scheduled · ${job.name}` : 'Scheduled run'}
            </JobChip>
          ) : null}

          <Meta>
            <div>
              <label>Started</label>
              <div>{new Date(run.startedAt).toLocaleString()}</div>
            </div>
            <div>
              <label>Ended</label>
              <div>{run.endedAt ? new Date(run.endedAt).toLocaleString() : '—'}</div>
            </div>
            <div>
              <label>Tokens in</label>
              <div>{run.tokensIn ?? '—'}</div>
            </div>
            <div>
              <label>Tokens out</label>
              <div>{run.tokensOut ?? '—'}</div>
            </div>
            <div>
              <label>Cost (USD)</label>
              <div>{run.costUsd ?? '—'}</div>
            </div>
            <div>
              <label>Instance</label>
              <div>{run.instanceId.slice(0, 8)}</div>
            </div>
          </Meta>

          {run.langfuseTraceId ? (
            <Section>
              <h4>Langfuse trace</h4>
              <TraceLink
                href={`https://cloud.langfuse.com/trace/${run.langfuseTraceId}`}
                target="_blank"
                rel="noreferrer"
              >
                {run.langfuseTraceId}
              </TraceLink>
            </Section>
          ) : null}

          <Section>
            <h4>Input</h4>
            <Pre>{run.input}</Pre>
          </Section>

          <Section>
            <h4>Steps</h4>
            {run.steps.length === 0 ? (
              <div style={{ color: 'var(--text-3)', fontSize: 12 }}>No steps recorded.</div>
            ) : (
              <StepStack>
                {run.steps.map((step, i) => <StepCard key={i} step={step} />)}
              </StepStack>
            )}
          </Section>

          {run.output ? (
            <Section>
              <h4>Output</h4>
              <MarkdownOutput>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{run.output}</ReactMarkdown>
              </MarkdownOutput>
            </Section>
          ) : null}

          {run.error ? (
            <Section>
              <h4>Error</h4>
              <Pre style={{ color: 'var(--danger)' }}>{run.error}</Pre>
            </Section>
          ) : null}
        </Stack>
      )}
    </Drawer>
  );
};

export default RunDetail;
