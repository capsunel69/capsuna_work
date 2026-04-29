import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  Card, CardHeader, CardTitle, CardSubtle, EmptyState, Spinner,
} from '../ui/primitives';
import { IconBot } from '../ui/icons';
import {
  PiovraAPI,
  type UsageByInstanceRow,
  type UsageByModelRow,
  type UsageResponse,
} from '../../services/piovra';

type Window = 7 | 30 | 90 | 365 | 0;
const WINDOW_OPTIONS: { value: Window; label: string }[] = [
  { value: 7,   label: 'Last 7 days' },
  { value: 30,  label: 'Last 30 days' },
  { value: 90,  label: 'Last 90 days' },
  { value: 365, label: 'Last year' },
  { value: 0,   label: 'All time' },
];

/* ── Layout ────────────────────────────────────────────────────────────── */

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-3) var(--s-5);
  border-bottom: 1px solid var(--border-1);

  @media (max-width: 760px) { padding: var(--s-3) var(--s-4); }
`;

const ToolbarLabel = styled.span`
  font-size: 12px;
  color: var(--text-3);
`;

const WindowSelect = styled.select`
  height: 32px;
  background: var(--bg-2);
  border: 1px solid var(--border-2);
  border-radius: var(--r-sm);
  color: var(--text-1);
  font-size: 13px;
  padding: 0 10px;
  &:focus { border-color: var(--accent); outline: none; }
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--s-3);
  padding: var(--s-4) var(--s-5);

  @media (max-width: 760px) { padding: var(--s-3) var(--s-4); }
`;

const StatCard = styled.div`
  background: var(--bg-2);
  border: 1px solid var(--border-1);
  border-radius: var(--r-md);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  .label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-3);
  }
  .value {
    font-family: var(--font-mono);
    font-size: 18px;
    color: var(--text-1);
    font-weight: 600;
  }
  .sub {
    font-size: 11px;
    color: var(--text-4);
  }
`;

const Table = styled.div`
  display: flex;
  flex-direction: column;
`;

const HeaderRow = styled.div<{ $cols: string }>`
  display: grid;
  grid-template-columns: ${(p) => p.$cols};
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

const Row = styled.div<{ $cols: string }>`
  display: grid;
  grid-template-columns: ${(p) => p.$cols};
  gap: var(--s-3);
  padding: 12px var(--s-5);
  align-items: center;
  border-bottom: 1px solid var(--border-1);

  &:last-child { border-bottom: 0; }

  @media (max-width: 760px) {
    grid-template-columns: 1fr auto;
    row-gap: 4px;
    padding: 10px var(--s-4);
  }
`;

const ModelTag = styled.span`
  font-family: var(--font-mono);
  font-size: 12.5px;
  color: var(--text-1);
  word-break: break-all;
`;

const Mono = styled.span`
  font-family: var(--font-mono);
  font-size: 12.5px;
  color: var(--text-2);
  text-align: right;
`;

const Cost = styled.span<{ $unknown?: boolean }>`
  font-family: var(--font-mono);
  font-size: 12.5px;
  font-weight: 600;
  color: ${(p) => (p.$unknown ? 'var(--text-4)' : 'var(--text-1)')};
  text-align: right;
`;

const Section = styled(Card)`
  overflow: hidden;
`;

/* ── Helpers ───────────────────────────────────────────────────────────── */

function fmtNumber(n: number): string {
  if (n < 1_000) return String(n);
  if (n < 1_000_000) return `${(n / 1_000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(n < 10_000_000 ? 2 : 1)}M`;
}

function fmtUsd(n: number | null): string {
  if (n == null) return '—';
  if (n === 0) return '$0';
  if (n < 0.01) return `$${n.toFixed(4)}`;
  if (n < 1) return `$${n.toFixed(3)}`;
  if (n < 100) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(0)}`;
}

function relTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const ms = Date.now() - d.getTime();
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  const days = Math.round(h / 24);
  return `${days}d ago`;
}

/* ── Component ─────────────────────────────────────────────────────────── */

interface UsagePanelProps { /* future filters */ }

const COLS_MODEL = '2.2fr 80px 110px 110px 110px 110px';
const COLS_INSTANCE = '1.6fr 1.6fr 1.4fr 70px 100px 100px 100px';

const UsagePanel: React.FC<UsagePanelProps> = () => {
  const [windowDays, setWindowDays] = useState<Window>(30);
  const [byModel, setByModel] = useState<UsageResponse<UsageByModelRow> | null>(null);
  const [byInstance, setByInstance] = useState<UsageResponse<UsageByInstanceRow> | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    const sinceDays = windowDays === 0 ? undefined : windowDays;
    Promise.all([
      PiovraAPI.getUsageByModel(sinceDays),
      PiovraAPI.getUsageByInstance(sinceDays),
    ])
      .then(([m, i]) => {
        if (cancelled) return;
        setByModel(m);
        setByInstance(i);
      })
      .catch((e) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [windowDays]);

  const totals = byModel?.totals;

  return (
    <Wrap>
      <Section>
        <CardHeader>
          <CardTitle>
            <IconBot />
            Usage & cost
          </CardTitle>
          <CardSubtle>Tokens and approximate USD spent across your agents.</CardSubtle>
        </CardHeader>

        <Toolbar>
          <ToolbarLabel>Window</ToolbarLabel>
          <WindowSelect
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value) as Window)}
          >
            {WINDOW_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </WindowSelect>
        </Toolbar>

        {err && (
          <div style={{ color: 'var(--danger)', padding: 'var(--s-3) var(--s-5)' }}>{err}</div>
        )}

        <StatGrid>
          <StatCard>
            <span className="label">Runs</span>
            <span className="value">{totals ? fmtNumber(totals.runs) : '—'}</span>
          </StatCard>
          <StatCard>
            <span className="label">Tokens in</span>
            <span className="value">{totals ? fmtNumber(totals.tokensIn) : '—'}</span>
          </StatCard>
          <StatCard>
            <span className="label">Tokens out</span>
            <span className="value">{totals ? fmtNumber(totals.tokensOut) : '—'}</span>
          </StatCard>
          <StatCard>
            <span className="label">Estimated cost</span>
            <span className="value">{totals ? fmtUsd(totals.costUsd) : '—'}</span>
            {totals && totals.unknownPricingRows > 0 && (
              <span className="sub">
                {totals.unknownPricingRows} model{totals.unknownPricingRows === 1 ? '' : 's'} without pricing
              </span>
            )}
          </StatCard>
        </StatGrid>
      </Section>

      <Section>
        <CardHeader>
          <CardTitle>By model</CardTitle>
          <CardSubtle>Aggregated across all instances.</CardSubtle>
        </CardHeader>
        <Table>
          <HeaderRow $cols={COLS_MODEL}>
            <span>Model</span>
            <span style={{ textAlign: 'right' }}>Runs</span>
            <span style={{ textAlign: 'right' }}>Tokens in</span>
            <span style={{ textAlign: 'right' }}>Tokens out</span>
            <span style={{ textAlign: 'right' }}>Cost</span>
            <span style={{ textAlign: 'right' }}>Last run</span>
          </HeaderRow>
          {loading && !byModel ? (
            <div style={{ padding: 'var(--s-5)', display: 'flex', justifyContent: 'center' }}>
              <Spinner />
            </div>
          ) : byModel && byModel.rows.length > 0 ? (
            byModel.rows.map((r) => (
              <Row key={r.model} $cols={COLS_MODEL}>
                <ModelTag>{r.model}</ModelTag>
                <Mono>{fmtNumber(r.runs)}</Mono>
                <Mono>{fmtNumber(r.tokensIn)}</Mono>
                <Mono>{fmtNumber(r.tokensOut)}</Mono>
                <Cost $unknown={!r.hasPricing} title={r.hasPricing ? undefined : 'No pricing configured for this model'}>
                  {r.hasPricing ? fmtUsd(r.costUsd) : '—'}
                </Cost>
                <Mono style={{ color: 'var(--text-3)' }}>{relTime(r.lastRunAt)}</Mono>
              </Row>
            ))
          ) : (
            <EmptyState>
              <IconBot />
              <div>No agent runs in this window.</div>
            </EmptyState>
          )}
        </Table>
      </Section>

      <Section>
        <CardHeader>
          <CardTitle>By instance</CardTitle>
          <CardSubtle>Per-agent breakdown so you can see who/what spends what.</CardSubtle>
        </CardHeader>
        <Table>
          <HeaderRow $cols={COLS_INSTANCE}>
            <span>Instance</span>
            <span>Definition</span>
            <span>Model</span>
            <span style={{ textAlign: 'right' }}>Runs</span>
            <span style={{ textAlign: 'right' }}>Tokens in</span>
            <span style={{ textAlign: 'right' }}>Tokens out</span>
            <span style={{ textAlign: 'right' }}>Cost</span>
          </HeaderRow>
          {loading && !byInstance ? (
            <div style={{ padding: 'var(--s-5)', display: 'flex', justifyContent: 'center' }}>
              <Spinner />
            </div>
          ) : byInstance && byInstance.rows.length > 0 ? (
            byInstance.rows.map((r) => (
              <Row key={r.instanceId + r.model} $cols={COLS_INSTANCE}>
                <span style={{ color: 'var(--text-1)' }}>{r.instanceName}</span>
                <span style={{ color: 'var(--text-2)', fontSize: 12.5 }}>{r.definitionName}</span>
                <ModelTag>{r.model}</ModelTag>
                <Mono>{fmtNumber(r.runs)}</Mono>
                <Mono>{fmtNumber(r.tokensIn)}</Mono>
                <Mono>{fmtNumber(r.tokensOut)}</Mono>
                <Cost $unknown={!r.hasPricing}>
                  {r.hasPricing ? fmtUsd(r.costUsd) : '—'}
                </Cost>
              </Row>
            ))
          ) : (
            <EmptyState>
              <IconBot />
              <div>No instance activity in this window.</div>
            </EmptyState>
          )}
        </Table>
      </Section>
    </Wrap>
  );
};

export default UsagePanel;
