import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Meetings from './pages/Meetings';
import Reminders from './pages/Reminders';
import Timer from './components/timer/Timer';

function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Timer />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/meetings" element={<Meetings />} />
            <Route path="/reminders" element={<Reminders />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}

export default App;
