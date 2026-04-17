import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  PageContainer, PageHeader, PageTitle, PageSubtitle,
  ChipGroup, Chip,
} from '../components/ui/primitives';
import { IconBot } from '../components/ui/icons';
import ChatPanel from '../components/agents/ChatPanel';
import DefinitionsList from '../components/agents/DefinitionsList';
import InstancesList from '../components/agents/InstancesList';
import RunsList from '../components/agents/RunsList';
import JobsList from '../components/agents/JobsList';

type Tab = 'chat' | 'agents' | 'instances' | 'schedules' | 'runs';

const TABS: { id: Tab; label: string }[] = [
  { id: 'chat',      label: 'Chat' },
  { id: 'agents',    label: 'Agents' },
  { id: 'instances', label: 'Instances' },
  { id: 'schedules', label: 'Schedules' },
  { id: 'runs',      label: 'Runs' },
];

const isTab = (v: string | null): v is Tab => !!v && TABS.some((t) => t.id === v);

const Agents: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const tab: Tab = isTab(params.get('tab')) ? (params.get('tab') as Tab) : 'chat';
  const instanceId = params.get('instanceId') ?? undefined;

  useEffect(() => {
    if (!params.get('tab')) {
      const next = new URLSearchParams(params);
      next.set('tab', 'chat');
      setParams(next, { replace: true });
    }
  }, [params, setParams]);

  const switchTab = (id: Tab): void => {
    const next = new URLSearchParams(params);
    next.set('tab', id);
    setParams(next, { replace: true });
  };

  const content = useMemo(() => {
    switch (tab) {
      case 'chat':      return <ChatPanel instanceId={instanceId} />;
      case 'agents':    return <DefinitionsList />;
      case 'instances': return <InstancesList />;
      case 'schedules': return <JobsList />;
      case 'runs':      return <RunsList />;
    }
  }, [tab, instanceId]);

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <PageTitle>
            <IconBot />
            Agents
          </PageTitle>
          <PageSubtitle>
            Chat with the assistant, inspect deployed instances, and replay past runs.
          </PageSubtitle>
        </div>
        <ChipGroup>
          {TABS.map((t) => (
            <Chip
              key={t.id}
              type="button"
              $active={tab === t.id}
              $tone="accent"
              onClick={() => switchTab(t.id)}
            >
              {t.label}
            </Chip>
          ))}
        </ChipGroup>
      </PageHeader>

      {content}
    </PageContainer>
  );
};

export default Agents;
