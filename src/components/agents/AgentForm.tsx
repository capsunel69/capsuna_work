import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  Button, Field, FieldGroup, Input, Label, Select, Stack, Textarea, Badge,
  Spinner,
} from '../ui/primitives';
import { IconTrash } from '../ui/icons';
import {
  PiovraAPI,
  type AgentDefinition,
  type DefinitionCreate,
  type SkillDescriptor,
} from '../../services/piovra';

const MODEL_OPTIONS = [
  'openai:gpt-4o-mini',
  'openai:gpt-4o',
  'openai:gpt-4.1-mini',
  'anthropic:claude-3-5-haiku-latest',
  'anthropic:claude-sonnet-4-5',
];

const SkillList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 240px;
  overflow-y: auto;
  padding: 4px;
  border: 1px solid var(--border-2);
  border-radius: var(--r-sm);
  background: var(--bg-1);
`;

const SkillRow = styled.label<{ $checked: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: var(--s-2);
  padding: 6px 8px;
  border-radius: var(--r-sm);
  cursor: pointer;
  font-size: 12.5px;
  background: ${(p) => (p.$checked ? 'var(--accent-soft)' : 'transparent')};

  &:hover { background: ${(p) => (p.$checked ? 'var(--accent-soft)' : 'var(--bg-3)')}; }

  input { margin-top: 4px; accent-color: var(--accent); }

  .meta { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .id { font-family: var(--font-mono); color: var(--text-1); }
  .desc { color: var(--text-3); font-size: 11.5px; }
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: var(--s-3);
  align-items: center;
  margin-top: var(--s-4);
`;

const ErrorNote = styled.div`
  background: var(--danger-soft);
  color: var(--danger);
  border-radius: var(--r-sm);
  padding: 8px 10px;
  font-size: 12px;
`;

interface AgentFormProps {
  existing?: AgentDefinition | null;
  onSaved: (def: AgentDefinition) => void;
  onDeleted?: () => void;
  onCancel: () => void;
}

const AgentForm: React.FC<AgentFormProps> = ({ existing, onSaved, onDeleted, onCancel }) => {
  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [model, setModel] = useState(existing?.model ?? MODEL_OPTIONS[0]);
  const [systemPrompt, setSystemPrompt] = useState(existing?.systemPrompt ?? '');
  const [temperature, setTemperature] = useState<string>(
    existing?.temperature != null ? String(existing.temperature) : '0.2',
  );
  const [maxTokens, setMaxTokens] = useState<string>(
    existing?.maxTokens != null ? String(existing.maxTokens) : '1024',
  );
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(
    new Set(existing?.skills ?? []),
  );
  const [allSkills, setAllSkills] = useState<SkillDescriptor[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    PiovraAPI.listSkills()
      .then((s) => { if (!cancelled) setAllSkills(s); })
      .catch((e) => { if (!cancelled) setErr(e instanceof Error ? e.message : String(e)); });
    return () => { cancelled = true; };
  }, []);

  const groupedSkills = useMemo(() => {
    if (!allSkills) return [];
    const builtin = allSkills.filter((s) => s.source === 'builtin');
    const mcp = allSkills.filter((s) => s.source === 'mcp');
    return [
      { label: 'Built-in', items: builtin },
      { label: 'MCP', items: mcp },
    ].filter((g) => g.items.length > 0);
  }, [allSkills]);

  const toggleSkill = (id: string): void => {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      const body: DefinitionCreate = {
        name: name.trim(),
        description: description.trim() || null,
        model,
        systemPrompt,
        skills: Array.from(selectedSkills),
        temperature: temperature === '' ? null : Number(temperature),
        maxTokens: maxTokens === '' ? null : Number(maxTokens),
      };
      const saved = existing
        ? await PiovraAPI.updateDefinition(existing.id, body)
        : await PiovraAPI.createDefinition(body);
      onSaved(saved);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!existing) return;
    if (!window.confirm(`Delete agent "${existing.name}"? This cascades to instances + runs.`)) return;
    setSaving(true);
    try {
      await PiovraAPI.deleteDefinition(existing.id);
      onDeleted?.();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack $gap={4}>
        {err && <ErrorNote>{err}</ErrorNote>}

        <Field>
          <Label>Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="default-assistant"
          />
        </Field>

        <Field>
          <Label>Description</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short summary shown in the list"
          />
        </Field>

        <FieldGroup $cols={3}>
          <Field>
            <Label>Model</Label>
            <Select value={model} onChange={(e) => setModel(e.target.value)}>
              {MODEL_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
          </Field>
          <Field>
            <Label>Temperature</Label>
            <Input
              type="number"
              step="0.05"
              min="0"
              max="2"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
            />
          </Field>
          <Field>
            <Label>Max tokens</Label>
            <Input
              type="number"
              min="16"
              max="32000"
              value={maxTokens}
              onChange={(e) => setMaxTokens(e.target.value)}
            />
          </Field>
        </FieldGroup>

        <Field>
          <Label>System prompt</Label>
          <Textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={10}
            required
            placeholder="You are Piovra, a helpful orchestration agent…"
          />
        </Field>

        <Field>
          <Label>Allowed skills ({selectedSkills.size})</Label>
          {!allSkills ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)' }}>
              <Spinner $size={14} /> Loading skill registry…
            </div>
          ) : (
            <SkillList>
              {groupedSkills.map((group) => (
                <React.Fragment key={group.label}>
                  <div style={{
                    fontSize: 10.5,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--text-4)',
                    padding: '6px 8px 2px',
                  }}>
                    {group.label}
                  </div>
                  {group.items.map((s) => {
                    const checked = selectedSkills.has(s.id);
                    return (
                      <SkillRow key={s.id} $checked={checked}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSkill(s.id)}
                        />
                        <span className="meta">
                          <span className="id">
                            {s.id}
                            {s.requiresConfirmation && (
                              <Badge $variant="warning" style={{ marginLeft: 6 }}>confirm</Badge>
                            )}
                          </span>
                          <span className="desc">{s.description}</span>
                        </span>
                      </SkillRow>
                    );
                  })}
                </React.Fragment>
              ))}
            </SkillList>
          )}
        </Field>

        <Footer>
          {existing ? (
            <Button type="button" $variant="danger" onClick={handleDelete} disabled={saving}>
              <IconTrash />
              Delete
            </Button>
          ) : <span />}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="button" $variant="ghost" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" $variant="primary" disabled={saving || !name.trim() || !systemPrompt.trim()}>
              {saving ? 'Saving…' : existing ? 'Save changes' : 'Create agent'}
            </Button>
          </div>
        </Footer>
      </Stack>
    </form>
  );
};

export default AgentForm;
