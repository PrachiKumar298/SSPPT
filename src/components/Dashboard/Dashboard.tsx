import { useState, useEffect } from 'react';
import { BookOpen, CheckSquare, Clock, TrendingUp } from 'lucide-react';
import { supabase, Task, Subject, StudyPlan } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { TaskProgressCircle } from '../Progress/TaskProgressCircle';

type TodoTask = Task & { subject: Subject; remainingHours?: number; progressPercent?: number };

export function Dashboard() {
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    upcomingTasks: 0,
  });
  const [todoTasks, setTodoTasks] = useState<TodoTask[]>([]);
  // new: tasks due within next 24 hours (reminders shown on dashboard)
  const [dueSoonReminders, setDueSoonReminders] = useState<TodoTask[]>([]);
  const [todayPlans, setTodayPlans] = useState<(StudyPlan & { subject: Subject })[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const nowISO = new Date().toISOString();
      const [subjectsRes, tasksRes, plansRes] = await Promise.all([
        supabase.from('subjects').select('id'),
        supabase.from('tasks').select('*, subject:subjects(*)').order('due_date', { ascending: true }),
        supabase
          .from('study_plans')
          .select('*, subject:subjects(*)')
          .eq('day_of_week', new Date().getDay()),
      ]);

      if (subjectsRes.error) throw subjectsRes.error;
      if (tasksRes.error) throw tasksRes.error;
      if (plansRes.error) throw plansRes.error;

      const tasks = tasksRes.data || [];
      // single now / weekFromNow used throughout this function
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Fetch progress logs for these tasks so we can compute remaining hours
      const taskIds = tasks.map((t: Task) => t.id).filter(Boolean);
      let logs: any[] = [];
      if (taskIds.length > 0) {
        const { data: logsRes, error: logsErr } = await supabase
          .from('progress_logs')
          .select('*')
          .in('task_id', taskIds);
        if (logsErr) throw logsErr;
        logs = logsRes || [];
      }

      // Aggregate logged hours per task
      const loggedByTask = new Map<string, number>();
      logs.forEach((log: any) => {
        if (!log.task_id) return;
        const prev = loggedByTask.get(log.task_id) || 0;
        loggedByTask.set(log.task_id, prev + parseFloat(log.hours_studied.toString()));
      });

      // Filter visible tasks (not completed and due >= now)
      const visibleTasks = (tasks || []).filter((t: Task) => {
        try {
          return t.status !== 'completed' && new Date(t.due_date) >= now;
        } catch {
          return t.status !== 'completed';
        }
      });

      // Build todo tasks with computed remaining and progress percent
      const todoWithStats: TodoTask[] = visibleTasks.map((t: any) => {
        const totalLogged = loggedByTask.get(t.id) || 0;
        // Estimate remaining: assume task.hours_required represents remaining hours (common in this app)
        const remaining = Math.max(0, (t.hours_required || 0) - totalLogged);

        // Determine progress percent:
        // - prefer explicit progress_percentage if available
        // - otherwise estimate = logged / (logged + remaining)
        let progress = t.progress_percentage || 0;
        if (!progress) {
          const totalEstimate = totalLogged + remaining;
          progress = totalEstimate > 0 ? Math.round((totalLogged / totalEstimate) * 100) : 0;
        }
        progress = Math.min(100, Math.max(0, progress));

        return {
          ...t,
          subject: t.subject,
          remainingHours: Math.round(remaining * 10) / 10,
          progressPercent: progress,
        };
      });

      // Exclude tasks that are already effectively complete (status completed OR computed progress >= 100)
      const activeTodo = todoWithStats.filter(t => t.status !== 'completed' && (t.progressPercent ?? 0) < 100);

      // Build "due within 24 hours" reminders list (incomplete & not fully progressed)
      const oneDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const dueSoon = activeTodo.filter(t => {
        try {
          const due = new Date(t.due_date);
          return due >= now && due <= oneDay;
        } catch {
          return false;
        }
      });

      setStats({
        totalSubjects: subjectsRes.data?.length || 0,
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t) => t.status === 'completed').length,
        upcomingTasks: todoWithStats.filter((t) => {
          const due = new Date(t.due_date);
          return due >= now && due <= weekFromNow;
        }).length,
      });

      setTodoTasks(activeTodo.slice(0, 5));
      setDueSoonReminders(dueSoon.slice(0, 5));
      setTodayPlans(plansRes.data || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Due within 24 hours reminders */}
      {dueSoonReminders.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Due within 24 hours</h3>
          <div className="space-y-2">
            {dueSoonReminders.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{t.title}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t.subject.name} • Due {new Date(t.due_date).toLocaleString()} • {(t.remainingHours ?? 0).toFixed(1)}h remaining
                  </p>
                </div>
                <div className="ml-4">
                  <TaskProgressCircle percent={t.progressPercent ?? 0} size={40} strokeWidth={5} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          label="Total Subjects"
          value={stats.totalSubjects}
          color="bg-blue-600"
        />
        <StatCard
          icon={CheckSquare}
          label="Total Tasks"
          value={stats.totalTasks}
          color="bg-green-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Completed"
          value={stats.completedTasks}
          color="bg-purple-600"
        />
        <StatCard
          icon={Clock}
          label="Upcoming (7 days)"
          value={stats.upcomingTasks}
          color="bg-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Today's Schedule</h3>
          {todayPlans.length === 0 ? (
            <p className="text-gray-500">No study sessions scheduled for today</p>
          ) : (
            <div className="space-y-3">
              {todayPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center space-x-3 p-3 rounded-lg"
                  style={{ backgroundColor: plan.subject.color + '15' }}
                >
                  <div
                    className="w-1 h-12 rounded"
                    style={{ backgroundColor: plan.subject.color }}
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{plan.subject.name}</p>
                    <p className="text-sm text-gray-600">
                      {plan.start_time.substring(0, 5)} - {plan.end_time.substring(0, 5)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">To Do Tasks</h3>
          {todoTasks.length === 0 ? (
            <p className="text-gray-500">No tasks yet</p>
          ) : (
            <div className="space-y-3">
              {todoTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:shadow-sm transition"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <TaskProgressCircle percent={task.progressPercent ?? 0} size={48} strokeWidth={6} />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium text-gray-900 truncate ${
                          task.status === 'completed' ? 'line-through text-gray-500' : ''
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {task.subject.name} • Due: {new Date(task.due_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {(task.remainingHours ?? 0).toFixed(1)}h remaining
                      </p>
                    </div>
                  </div>
                  <span
                    className={`ml-2 px-2 py-1 text-xs font-medium rounded ${
                      task.priority === 'high'
                        ? 'bg-red-100 text-red-800'
                        : task.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
