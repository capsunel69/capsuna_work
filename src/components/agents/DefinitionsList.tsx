import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  Badge, Button, Card, CardHeader, CardTitle, CardSubtle, EmptyState, Spinner,
  Stack, Row,
} from '../ui/primitives';
import { IconBot, IconPlus, IconEdit } from '../ui/icons';
import { PiovraAPI, type AgentDefinition } from '../../services/piovra';
import Drawer from './Drawer';
import AgentForm from './AgentForm';

const Table = styled.div`
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: 2fr 1.2fr 2fr 70px;
  gap: var(--s-3);
  padding: 10px var(--s-5);
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-3);
  border-bottom: 1px solid var(--border-1);
  background: var(--bg-1);
`;

const RowItem = styled.button`
  display: grid;
  grid-template-columns: 2fr 1.2fr 2fr 70px;
  gap: var(--s-3);
  padding: 12px var(--s-5);
  border-bottom: 1px solid var(--border-1);
  background: transparent;
  text-align: left;
  transition: background 0.15s;
  width: 100%;
  cursor: pointer;
  color: var(--text-1);

  &:hover { background: var(--bg-3); }
  &:last-child { border-bottom: 0; }
`;

const Name = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  strong { font-size: 13px; font-weight: 500; color: var(--text-1); }
  span { font-size: 11.5px; color: var(--text-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;

const Model = styled.span`
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--text-2);
  align-self: center;
`;

const Skills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-self: center;
`;

const Version = styled.span`
  align-self: center;
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--text-3);
  text-align: right;
`;

const Pre = styled.pre`
  background: var(--bg-2);
  border: 1px solid var(--border-1);
  border-radius: var(--r-sm);
  padding: var(--s-3) var(--s-4);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-1);
  line-height: 1.55;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
`;

const Field = styled.div`
  font-size: 12px;
  color: var(--text-3);

  label {
    display: block;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 10.5px;
    color: var(--text-4);
    margin-bottom: 4px;
  }

  div { color: var(--text-1); font-size: 13px; }
`;

type Mode = { kind: 'view'; def: AgentDefinition } | { kind: 'edit'; def: AgentDefinition } | { kind: 'create' } | null;

const DefinitionsList: React.FC = () => {
  const [defs, setDefs] = useState<AgentDefinition[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const d = await PiovraAPI.listDefinitions();
      setDefs(d);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const close = (): void => setMode(null);

  const handleSaved = async (): Promise<void> => {
    await load();
    close();
  };

  const handleDeleted = async (): Promise<void> => {
    await load();
    close();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <IconBot />
          Agent definitions
        </CardTitle>
        <Row $gap={3}>
          <CardSubtle>
            {defs ? `${defs.length} total` : err ? 'unavailable' : 'loading…'}
          </CardSubtle>
          <Button $variant="primary" $size="sm" onClick={() => setMode({ kind: 'create' })}>
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
      ) : !defs ? (
        <EmptyState>
          <Spinner />
          <div style={{ marginTop: 8 }}>Loading definitions…</div>
        </EmptyState>
      ) : defs.length === 0 ? (
        <EmptyState>No agent definitions yet. Click "New" to create one.</EmptyState>
      ) : (
        <Table>
          <Header>
            <span>Name</span>
            <span>Model</span>
            <span>Skills</span>
            <span style={{ textAlign: 'right' }}>Version</span>
          </Header>
          {defs.map((d) => (
            <RowItem key={d.id} onClick={() => setMode({ kind: 'view', def: d })}>
              <Name>
                <strong>{d.name}</strong>
                <span>{d.description ?? '—'}</span>
              </Name>
              <Model>{d.model}</Model>
              <Skills>
                {d.skills.length === 0 ? <Badge>none</Badge> : d.skills.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </Skills>
              <Version>v{d.version}</Version>
            </RowItem>
          ))}
        </Table>
      )}

      <Drawer
        open={mode?.kind === 'view'}
        onClose={close}
        title={
          <>
            <IconBot /> {mode?.kind === 'view' ? mode.def.name : ''}
          </>
        }
      >
        {mode?.kind === 'view' && (
          <Stack $gap={4}>
            <Row $gap={3} $wrap>
              <Field>
                <label>Model</label>
                <div>{mode.def.model}</div>
              </Field>
              <Field>
                <label>Temperature</label>
                <div>{mode.def.temperature ?? 'default'}</div>
              </Field>
              <Field>
                <label>Max tokens</label>
                <div>{mode.def.maxTokens ?? 'default'}</div>
              </Field>
              <Field>
                <label>Version</label>
                <div>v{mode.def.version}</div>
              </Field>
            </Row>

            <Field>
              <label>Description</label>
              <div>{mode.def.description ?? '—'}</div>
            </Field>

            <Field>
              <label>Skills</label>
              <Skills style={{ marginTop: 4 }}>
                {mode.def.skills.length === 0 ? <Badge>none</Badge> : mode.def.skills.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </Skills>
            </Field>

            <Field>
              <label>System prompt</label>
              <Pre>{mode.def.systemPrompt}</Pre>
            </Field>

            <Row $gap={2}>
              <Button $variant="primary" onClick={() => setMode({ kind: 'edit', def: mode.def })}>
                <IconEdit />
                Edit
              </Button>
            </Row>
          </Stack>
        )}
      </Drawer>

      <Drawer
        open={mode?.kind === 'edit' || mode?.kind === 'create'}
        onClose={close}
        title={mode?.kind === 'edit' ? `Edit ${mode.def.name}` : 'New agent'}
      >
        {(mode?.kind === 'edit' || mode?.kind === 'create') && (
          <AgentForm
            existing={mode.kind === 'edit' ? mode.def : null}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
            onCancel={close}
          />
        )}
      </Drawer>
    </Card>
  );
};

export default DefinitionsList;
