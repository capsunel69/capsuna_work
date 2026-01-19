import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Meetings from './pages/Meetings';
import Reminders from './pages/Reminders';
import Timer from './components/timer/Timer';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <ProtectedRoute>
            <Layout>
              <Timer />
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/meetings" element={<Meetings />} />
                <Route path="/reminders" element={<Reminders />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
