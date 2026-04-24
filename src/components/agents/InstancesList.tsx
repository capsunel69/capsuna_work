import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Badge, Button, Card, CardHeader, CardTitle, CardSubtle, EmptyState, Spinner } from '../ui/primitives';
import { IconBot, IconSend } from '../ui/icons';
import { PiovraAPI, type AgentDefinition, type AgentInstance, type AgentStatus } from '../../services/piovra';
import { useChat } from '../../context/ChatContext';

const Table = styled.div`
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: 2fr 2fr 1fr 120px;
  gap: var(--s-3);
  padding: 10px var(--s-5);
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-3);
  border-bottom: 1px solid var(--border-1);
  background: var(--bg-1);

  @media (max-width: 760px) {
    display: none;
  }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 2fr 2fr 1fr 120px;
  gap: var(--s-3);
  padding: 14px var(--s-5);
  border-bottom: 1px solid var(--border-1);
  align-items: center;

  &:last-child { border-bottom: 0; }

  @media (max-width: 760px) {
    grid-template-columns: 1fr auto;
    grid-template-areas:
      "instance action"
      "definition definition"
      "status status";
    row-gap: 10px;
  }
`;

const Name = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  strong { font-size: 13.5px; color: var(--text-1); font-weight: 600; }
  span { font-size: 11.5px; color: var(--text-3); font-family: var(--font-mono); }
`;

const InstanceCell = styled(Name)`
  @media (max-width: 760px) { grid-area: instance; }
`;
const DefinitionCell = styled(Name)`
  @media (max-width: 760px) { grid-area: definition; }
`;
const StatusCell = styled.div`
  @media (max-width: 760px) { grid-area: status; }
`;
const ActionCell = styled.div`
  text-align: right;
  @media (max-width: 760px) { grid-area: action; }
`;

const statusTone = (s: AgentStatus): 'neutral' | 'success' | 'warning' | 'danger' => {
  switch (s) {
    case 'running': return 'success';
    case 'paused': return 'warning';
    case 'error': return 'danger';
    default: return 'neutral';
  }
};

const InstancesList: React.FC = () => {
  const { open: openChat } = useChat();
  const [instances, setInstances] = useState<AgentInstance[] | null>(null);
  const [defs, setDefs] = useState<AgentDefinition[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setErr(null);
    Promise.all([PiovraAPI.listInstances(), PiovraAPI.listDefinitions()])
      .then(([i, d]) => { if (!cancelled) { setInstances(i); setDefs(d); } })
      .catch((e) => { if (!cancelled) setErr(e instanceof Error ? e.message : String(e)); });
    return () => { cancelled = true; };
  }, []);

  const defById = useMemo(() => {
    const map = new Map<string, AgentDefinition>();
    (defs ?? []).forEach((d) => map.set(d.id, d));
    return map;
  }, [defs]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <IconBot />
          Agent instances
        </CardTitle>
        <CardSubtle>
          {instances ? `${instances.length} deployed` : err ? 'unavailable' : 'loading…'}
        </CardSubtle>
      </CardHeader>

      {err ? (
        <EmptyState>
          <div>Piovra is unreachable.</div>
          <div style={{ marginTop: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>{err}</div>
        </EmptyState>
      ) : !instances ? (
        <EmptyState>
          <Spinner />
          <div style={{ marginTop: 8 }}>Loading instances…</div>
        </EmptyState>
      ) : instances.length === 0 ? (
        <EmptyState>No instances yet. Seed a default one via <code>npm run db:seed</code>.</EmptyState>
      ) : (
        <Table>
          <Header>
            <span>Instance</span>
            <span>Definition</span>
            <span>Status</span>
            <span style={{ textAlign: 'right' }}>Action</span>
          </Header>
          {instances.map((i) => {
            const def = defById.get(i.definitionId);
            return (
              <Row key={i.id}>
                <InstanceCell>
                  <strong>{i.name}</strong>
                  <span>{i.id.slice(0, 8)}</span>
                </InstanceCell>
                <DefinitionCell>
                  <strong>{def?.name ?? '—'}</strong>
                  <span>{def?.model ?? i.definitionId.slice(0, 8)}</span>
                </DefinitionCell>
                <StatusCell>
                  <Badge $variant={statusTone(i.status)}>{i.status}</Badge>
                </StatusCell>
                <ActionCell>
                  <Button $variant="primary" $size="sm" onClick={() => openChat(i.id)}>
                    <IconSend />
                    Chat
                  </Button>
                </ActionCell>
              </Row>
            );
          })}
        </Table>
      )}
    </Card>
  );
};

export default InstancesList;
