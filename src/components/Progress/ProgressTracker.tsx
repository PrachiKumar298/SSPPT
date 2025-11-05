import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { supabase, ProgressLog, Subject, Task } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ProgressForm } from './ProgressForm';
import { ProgressList } from './ProgressList';

export function ProgressTracker() {
  const [logs, setLogs] = useState<(ProgressLog & { subject: Subject })[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]); // new: fetch tasks for task-based summary
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [logsRes, subjectsRes, tasksRes] = await Promise.all([
        supabase
          .from('progress_logs')
          .select('*, subject:subjects(*)')
          .order('date', { ascending: false }),
        supabase.from('subjects').select('*').order('name', { ascending: true }),
        supabase
          .from('tasks')
          .select('*')
          .order('due_date', { ascending: true })
          .eq('user_id', user!.id),
      ]);

      if (logsRes.error) throw logsRes.error;
      if (subjectsRes.error) throw subjectsRes.error;
      if (tasksRes.error) throw tasksRes.error;

      setLogs(logsRes.data || []);
      setSubjects(subjectsRes.data || []);
      setTasks(tasksRes.data || []);
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this progress log?')) return;

    try {
      const { error } = await supabase.from('progress_logs').delete().eq('id', id);
      if (error) throw error;
      setLogs(logs.filter((l) => l.id !== id));
    } catch (error) {
      console.error('Error deleting log:', error);
      alert('Failed to delete log');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading progress...</div>
      </div>
    );
  }

  // Subject-wise summary (counts per subject)
  type SubjectStat = {
    subjectId: string;
    name: string;
    color: string;
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    overdue: number;
    completionRate: number;
  };

  const subjectMap = new Map<string, SubjectStat>();
  // initialize using known subjects
  subjects.forEach((s) => {
    subjectMap.set(s.id, {
      subjectId: s.id,
      name: s.name,
      color: s.color || '#A78BFA',
      total: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
      overdue: 0,
      completionRate: 0,
    });
  });

  // accumulate counts from tasks
  tasks.forEach((t) => {
    const sid = t.subject_id || 'unknown';
    const stat = subjectMap.get(sid) || {
      subjectId: sid,
      name: (subjects.find(s => s.id === sid)?.name) || 'Unknown',
      color: (subjects.find(s => s.id === sid)?.color) || '#A78BFA',
      total: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0, completionRate: 0,
    };
    stat.total++;
    if (t.status === 'completed') stat.completed++;
    else if (t.status === 'in_progress') stat.inProgress++;
    else if (t.status === 'pending') stat.pending++;
    else if (t.status === 'overdue') stat.overdue++;
    subjectMap.set(sid, stat);
  });

  // compute completion rates
  const subjectStats = Array.from(subjectMap.values()).map((st) => {
    st.completionRate = st.total > 0 ? Math.round((st.completed / st.total) * 100) : 0;
    return st;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Progress Tracker</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-xl">
            Overview of your task progress — see how many tasks are completed or in progress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right mr-2">
            <span className="text-xs text-muted">Tasks</span>
            <span className="text-lg font-semibold">{tasks.length}</span>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 btn-primary px-4 py-2 rounded-lg shadow-md transition disabled:opacity-50"
            disabled={subjects.length === 0}
            title={subjects.length === 0 ? 'Add a subject first' : 'Log a study session'}
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Log Session</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject-wise summary column */}
        <div className="lg:col-span-1 card-bg rounded-xl p-6 shadow">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">By Subject</h3>
          <div className="mt-4 space-y-3">
            {subjectStats.map((s) => (
              <div key={s.subjectId} className="flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-2 h-8 rounded" style={{ backgroundColor: s.color }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{s.total} tasks • {s.inProgress} in progress</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{s.completionRate}%</p>
                  <p className="text-xs text-gray-500">done</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logs list */}
        <div className="lg:col-span-2">
          <ProgressList logs={logs} onDelete={handleDelete} />
        </div>
      </div>

      {showForm && <ProgressForm subjects={subjects} onClose={handleFormClose} />}
    </div>
  );
}
