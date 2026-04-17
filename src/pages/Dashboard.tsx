import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { format, isPast, isSameDay } from 'date-fns';
import { useAppContext } from '../context/AppContext';
import LoadingState from '../components/shared/LoadingState';
import ErrorMessage from '../components/shared/ErrorMessage';
import {
  PageContainer, PageHeader, PageTitle, PageSubtitle,
  Grid, Card, CardHeader, CardTitle, CardSubtle, CardBody,
  Badge, Checkbox, EmptyState, Button, Stack, Row,
} from '../components/ui/primitives';
import {
  IconDashboard, IconTasks, IconCalendar, IconBell, IconAlert,
  IconCheck, IconClock, IconPlus,
} from '../components/ui/icons';

const Stat = styled(Card)`
  padding: var(--s-5);
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
`;

const StatLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: var(--text-3);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 6px;

  svg { width: 14px; height: 14px; color: var(--accent); }
`;

const StatValue = styled.div`
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--text-1);
  font-variant-numeric: tabular-nums;
`;

const StatDelta = styled.div<{ $tone?: 'good' | 'bad' | 'neutral' }>`
  font-size: 12px;
  color: ${p => p.$tone === 'good' ? 'var(--success)' : p.$tone === 'bad' ? 'var(--danger)' : 'var(--text-3)'};
`;

const ListItem = styled.div`
  padding: 10px var(--s-5);
  display: flex;
  align-items: center;
  gap: var(--s-3);
  font-size: 13px;
  border-top: 1px solid var(--border-1);

  &:first-child { border-top: none; }
  &:hover { background: var(--bg-3); }
`;

const ItemTitle = styled.span<{ $done?: boolean }>`
  flex: 1;
  min-width: 0;
  color: ${p => p.$done ? 'var(--text-3)' : 'var(--text-1)'};
  font-weight: 500;
  text-decoration: ${p => p.$done ? 'line-through' : 'none'};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Meta = styled.span`
  font-size: 11.5px;
  color: var(--text-3);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
`;

const ViewAll = styled(Link)`
  font-size: 11px;
  font-weight: 500;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const TimerCard = styled(Card)`
  border-color: var(--accent-soft);
  box-shadow: inset 0 0 0 1px var(--accent-soft), 0 0 40px var(--accent-soft);

  &:before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(60% 60% at 50% 0%, var(--accent-soft), transparent 70%);
  }
`;

const TimerInner = styled.div`
  position: relative;
  padding: var(--s-5);
  display: flex;
  align-items: center;
  gap: var(--s-5);
`;

const TimerNumber = styled.div`
  font-family: var(--font-mono);
  font-size: 36px;
  font-weight: 600;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
`;

const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const Dashboard: React.FC = () => {
  const {
    tasks, meetings, reminders, currentTimer, currentDate,
    activeTaskId, isLoading, error,
    convertReminderToTask, toggleTaskCompletion,
  } = useAppContext();

  const hasAnyData = tasks.length + meetings.length + reminders.length > 0;
  if (isLoading && !hasAnyData) return <LoadingState message="Loading control panel…" />;
  if (error && !hasAnyData) return <ErrorMessage message={error} />;

  const incompleteTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks
    .filter(t => t.completed)
    .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime());

  const overdueTasks = tasks.filter(t =>
    !t.completed && t.dueDate && isPast(new Date(t.dueDate)) && new Date(t.dueDate) < new Date(currentDate)
  );

  const upcomingMeetings = meetings
    .filter(m => !m.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const todayReminders = reminders.filter(r => {
    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);
    if (!r.recurring) {
      if (r.completed || r.convertedToTask) return false;
      const d = new Date(r.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    }
    let show = false;
    if (r.recurring === 'daily') show = true;
    else if (r.recurring === 'weekly' && r.recurringConfig) show = today.getDay() === r.recurringConfig.dayOfWeek;
    else if (r.recurring === 'monthly' && r.recurringConfig) {
      if (r.recurringConfig.subtype === 'dayOfMonth') {
        show = today.getDate() === r.recurringConfig.dayOfMonth;
      } else {
        const wn = r.recurringConfig.weekNum!;
        const dw = r.recurringConfig.dayOfWeek!;
        let target;
        if (wn === -1) {
          const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          let day = last.getDate();
          while (new Date(today.getFullYear(), today.getMonth(), day).getDay() !== dw) day--;
          target = new Date(today.getFullYear(), today.getMonth(), day);
        } else {
          const first = new Date(today.getFullYear(), today.getMonth(), 1);
          let off = dw - first.getDay();
          if (off < 0) off += 7;
          target = new Date(today.getFullYear(), today.getMonth(), 1 + off + (wn - 1) * 7);
        }
        show = isSameDay(today, target);
      }
    }
    if (!show) return false;
    return !(r.completedInstances || []).some(d => isSameDay(new Date(d), today));
  });

  const activeTask = tasks.find(t => t.id === activeTaskId);

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <PageTitle><IconDashboard /> Overview</PageTitle>
          <PageSubtitle>{format(currentDate, "EEEE, MMMM d · yyyy")}</PageSubtitle>
        </div>
        <Row $gap={2}>
          <Link to="/tasks"><Button $variant="primary"><IconPlus /> New task</Button></Link>
        </Row>
      </PageHeader>

      <Grid $min="220px">
        <Stat>
          <StatLabel><IconTasks /> Active tasks</StatLabel>
          <StatValue>{incompleteTasks.length}</StatValue>
          <StatDelta $tone={overdueTasks.length ? 'bad' : 'good'}>
            {overdueTasks.length ? `${overdueTasks.length} overdue` : 'On track'}
          </StatDelta>
        </Stat>
        <Stat>
          <StatLabel><IconCheck /> Completed</StatLabel>
          <StatValue>{completedTasks.length}</StatValue>
          <StatDelta $tone="neutral">All time</StatDelta>
        </Stat>
        <Stat>
          <StatLabel><IconCalendar /> Upcoming meetings</StatLabel>
          <StatValue>{upcomingMeetings.length}</StatValue>
          <StatDelta $tone="neutral">Scheduled</StatDelta>
        </Stat>
        <Stat>
          <StatLabel><IconBell /> Today's reminders</StatLabel>
          <StatValue>{todayReminders.length}</StatValue>
          <StatDelta $tone="neutral">Due today</StatDelta>
        </Stat>
      </Grid>

      {activeTaskId && activeTask && (
        <TimerCard>
          <TimerInner>
            <TimerNumber>{formatTime(currentTimer)}</TimerNumber>
            <Stack $gap={1}>
              <Row $gap={2}>
                <Badge $variant="accent"><IconClock /> Tracking</Badge>
                <span style={{ fontWeight: 600 }}>{activeTask.title}</span>
              </Row>
              <Meta>Total: {formatTime(activeTask.timeSpent + currentTimer)}</Meta>
            </Stack>
          </TimerInner>
        </TimerCard>
      )}

      <Grid $min="380px">
        <Card>
          <CardHeader>
            <CardTitle><IconTasks /> Tasks to do <CardSubtle>{incompleteTasks.length}</CardSubtle></CardTitle>
            <ViewAll to="/tasks">View all →</ViewAll>
          </CardHeader>
          <CardBody>
            {incompleteTasks.length === 0 ? (
              <EmptyState><IconCheck /><div>All clear. Nothing pending.</div></EmptyState>
            ) : incompleteTasks.slice(0, 6).map(task => (
              <ListItem key={task.id}>
                <Checkbox $checked={false} onClick={() => toggleTaskCompletion(task.id)} />
                <ItemTitle>{task.title}</ItemTitle>
                {task.dueDate && isPast(new Date(task.dueDate)) && <Badge $variant="danger">Overdue</Badge>}
                <Badge $variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'}>
                  {task.priority}
                </Badge>
              </ListItem>
            ))}
          </CardBody>
        </Card>

        {overdueTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle><IconAlert /> Overdue <CardSubtle>{overdueTasks.length}</CardSubtle></CardTitle>
              <ViewAll to="/tasks">View all →</ViewAll>
            </CardHeader>
            <CardBody>
              {overdueTasks.slice(0, 5).map(task => (
                <ListItem key={task.id}>
                  <ItemTitle>{task.title}</ItemTitle>
                  <Meta>{format(new Date(task.dueDate!), 'MMM d')}</Meta>
                </ListItem>
              ))}
            </CardBody>
          </Card>
        )}

        {todayReminders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle><IconBell /> Today's reminders <CardSubtle>{todayReminders.length}</CardSubtle></CardTitle>
              <ViewAll to="/reminders">View all →</ViewAll>
            </CardHeader>
            <CardBody>
              {todayReminders.map(reminder => {
                const created = reminder.recurring
                  ? (reminder.convertedToTaskDates || []).some(d => {
                      const t = new Date(currentDate); t.setHours(0,0,0,0);
                      return isSameDay(new Date(d), t);
                    })
                  : reminder.convertedToTask;
                return (
                  <ListItem key={reminder.id}>
                    <ItemTitle>{reminder.title}</ItemTitle>
                    {created
                      ? <Badge $variant="purple">Task created</Badge>
                      : <Button $size="sm" $variant="ghost" onClick={() => convertReminderToTask(reminder.id)}>
                          <IconPlus /> Task
                        </Button>}
                  </ListItem>
                );
              })}
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle><IconCalendar /> Upcoming meetings</CardTitle>
            <ViewAll to="/meetings">View all →</ViewAll>
          </CardHeader>
          <CardBody>
            {upcomingMeetings.length === 0 ? (
              <EmptyState><IconCalendar /><div>No meetings scheduled.</div></EmptyState>
            ) : upcomingMeetings.map(m => (
              <ListItem key={m.id}>
                <ItemTitle>
                  {m.title}
                  {new Date(m.date) < new Date(currentDate) && ' '}
                </ItemTitle>
                {new Date(m.date) < new Date(currentDate) && <Badge $variant="danger">Overdue</Badge>}
                <Meta>{format(new Date(m.date), 'MMM d · HH:mm')}</Meta>
              </ListItem>
            ))}
          </CardBody>
        </Card>

        {completedTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle><IconCheck /> Recently completed</CardTitle>
              <ViewAll to="/tasks">View all →</ViewAll>
            </CardHeader>
            <CardBody>
              {completedTasks.slice(0, 5).map(task => (
                <ListItem key={task.id}>
                  <Checkbox $checked={true} onClick={() => toggleTaskCompletion(task.id)} />
                  <ItemTitle $done>{task.title}</ItemTitle>
                  <Meta>{format(new Date(task.completedAt || task.createdAt), 'MMM d')}</Meta>
                </ListItem>
              ))}
            </CardBody>
          </Card>
        )}
      </Grid>
    </PageContainer>
  );
};

export default Dashboard;
