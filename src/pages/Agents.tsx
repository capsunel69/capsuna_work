import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  PageContainer, PageHeader, PageTitle, PageSubtitle,
  ChipGroup, Chip,
} from '../components/ui/primitives';
import { IconBot } from '../components/ui/icons';
import DefinitionsList from '../components/agents/DefinitionsList';
import InstancesList from '../components/agents/InstancesList';
import RunsList from '../components/agents/RunsList';
import JobsList from '../components/agents/JobsList';

type Tab = 'agents' | 'instances' | 'schedules' | 'runs';

const TABS: { id: Tab; label: string }[] = [
  { id: 'agents',    label: 'Agents' },
  { id: 'instances', label: 'Instances' },
  { id: 'schedules', label: 'Schedules' },
  { id: 'runs',      label: 'Runs' },
];

const isTab = (v: string | null): v is Tab => !!v && TABS.some((t) => t.id === v);

const Agents: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const tab: Tab = isTab(params.get('tab')) ? (params.get('tab') as Tab) : 'agents';

  useEffect(() => {
    const raw = params.get('tab');
    if (!raw || !isTab(raw)) {
      const next = new URLSearchParams(params);
      next.set('tab', 'agents');
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
      case 'agents':    return <DefinitionsList />;
      case 'instances': return <InstancesList />;
      case 'schedules': return <JobsList />;
      case 'runs':      return <RunsList />;
    }
  }, [tab]);

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <PageTitle>
            <IconBot />
            Agents
          </PageTitle>
          <PageSubtitle>
            Manage agent definitions, deployed instances, schedules, and replay past runs. Use the
            floating assistant to chat — it stays open as you navigate.
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
