import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthPage } from './components/Auth/AuthPage';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { Dashboard } from './components/Dashboard/Dashboard';
import { SubjectList } from './components/Subjects/SubjectList';
import { StudyPlanner } from './components/Planner/StudyPlanner';
import { TaskManager } from './components/Tasks/TaskManager';
import { ProgressTracker } from './components/Progress/ProgressTracker';
import { ReportsPage } from './components/Reports/ReportsPage';
import { ReminderConsole } from './components/Reminders/ReminderConsole';
import { AdminPanel } from './components/Admin/AdminPanel';
import { supabase } from './lib/supabase'; // added to save settings

function AppContent() {
  const { user, loading, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const tabTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    subjects: 'Subjects',
    planner: 'Study Planner',
    tasks: 'Tasks',
    reminders: 'Reminders',
    progress: 'Progress',
    reports: 'Reports',
    admin: 'Admin Panel',
    settings: 'Settings',
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'subjects':
        return <SubjectList />;
      case 'planner':
        return <StudyPlanner />;
      case 'tasks':
        return <TaskManager />;
      case 'progress':
        return <ProgressTracker />;
      case 'reminders':
        return <ReminderConsole />;
      case 'reports':
        return <ReportsPage />;
      case 'admin':
        return <AdminPanel />;
      case 'settings':
        return <SettingsPanel />; // render working settings panel
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-root flex h-screen overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={tabTitles[activeTab] || 'Dashboard'} />

        <main className="flex-1 overflow-y-auto p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

function SettingsPanel() {
  // useAuth is available inside this file's scope (we'll call it inside AppContent)
  const { profile, user } = useAuth();
  const initial = profile?.semester_length ?? profile?.sem_length ?? 16;
  const [semLength, setSemLength] = useState<string>(String(initial));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setMessage(null);
    setError(null);
    const val = parseInt(semLength, 10);
    if (isNaN(val) || val < 1 || val > 52) {
      setError('Semester length must be a number between 1 and 52.');
      return;
    }
    if (!user || !profile) {
      setError('User not available.');
      return;
    }

    setSaving(true);
    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ semester_length: val })
        .eq('id', profile.id);
      if (updateErr) throw updateErr;
      setMessage('Settings saved.');
    } catch (e: any) {
      console.error('Failed to save settings', e);
      setError(e?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 max-w-xl">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Application Settings</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Semester length (weeks)
          </label>
          <input
            type="number"
            min={1}
            max={52}
            value={semLength}
            onChange={(e) => setSemLength(e.target.value)}
            className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-gray-500 mt-1">Enter semester length in weeks (1–52).</p>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {message && <div className="text-sm text-green-600">{message}</div>}

        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary px-4 py-2 rounded-md disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
