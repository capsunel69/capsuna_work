import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Meetings from './pages/Meetings';
import Reminders from './pages/Reminders';
import Timer from './components/timer/Timer';

// Use React.lazy for the Journals component to work around TypeScript issues
const Journals = React.lazy(() => import('./pages/Journals'));

function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Timer />
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/meetings" element={<Meetings />} />
              <Route path="/reminders" element={<Reminders />} />
              <Route path="/journals" element={<Journals />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </AppProvider>
  );
}

export default App;
