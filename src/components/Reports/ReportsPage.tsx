import { useState, useEffect } from 'react';
import { Download, Filter, BarChart3 } from 'lucide-react';
import { supabase, Task, ProgressLog, Subject } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { generateSubjectPerformanceData, generateWeeklyProgressData, generateTaskStatusData, exportToCSV } from '../../lib/chartUtils';
import { BarChart } from './BarChart';
import { PieChart } from './PieChart';

export function ReportsPage() {
  const [tasks, setTasks] = useState<(Task & { subject: Subject })[]>([]);
  const [logs, setLogs] = useState<(ProgressLog & { subject: Subject })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('month');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, dateRange]);

  const loadData = async () => {
    try {
      const startDate = getStartDate();

      const [tasksRes, logsRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('*, subject:subjects(*)')
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('progress_logs')
          .select('*, subject:subjects(*)')
          .gte('date', startDate.toISOString().split('T')[0]),
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (logsRes.error) throw logsRes.error;

      setTasks(tasksRes.data || []);
      setLogs(logsRes.data || []);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = () => {
    const now = new Date();
    if (dateRange === 'week') {
      now.setDate(now.getDate() - 7);
    } else if (dateRange === 'month') {
      now.setMonth(now.getMonth() - 1);
    } else {
      now.setFullYear(now.getFullYear() - 1);
    }
    return now;
  };

  const handleExport = () => {
    const subjectData = generateSubjectPerformanceData(tasks, logs);
    exportToCSV(subjectData, `study-report-${dateRange}-${new Date().toISOString().split('T')[0]}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading reports...</div>
      </div>
    );
  }

  const subjectPerformance = generateSubjectPerformanceData(tasks, logs);
  const weeklyProgress = generateWeeklyProgressData(logs);
  const taskStatus = generateTaskStatusData(tasks);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Performance Reports</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Visualize your academic progress and performance
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center space-x-2 btn-primary px-4 py-2 rounded-lg transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {tasks.length === 0 && logs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No data available</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Start logging tasks and study sessions to see your progress
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Subject Performance
            </h3>
            {subjectPerformance.length > 0 ? (
              <div className="space-y-4">
                {subjectPerformance.map((subject) => (
                  <div key={subject.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {subject.name}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {subject.tasksCompleted}/{subject.tasksTotal} tasks
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          backgroundColor: subject.color,
                          width: `${subject.tasksTotal > 0 ? (subject.tasksCompleted / subject.tasksTotal) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{subject.hoursStudied.toFixed(1)} hours studied</span>
                      {subject.averageGrade > 0 && (
                        <span>{subject.averageGrade.toFixed(1)}% average grade</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No subject data available</p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Weekly Study Hours
            </h3>
            {weeklyProgress.length > 0 ? (
              <BarChart data={weeklyProgress} />
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No study logs available</p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Task Status Distribution
            </h3>
            {taskStatus.length > 0 ? (
              <PieChart data={taskStatus} />
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No task data available</p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Summary Statistics
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Total Study Hours</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {logs.reduce((sum, log) => sum + parseFloat(log.hours_studied.toString()), 0).toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Tasks Completed</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {tasks.filter(t => t.status === 'completed').length}/{tasks.length}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-600 dark:text-gray-400">Completion Rate</span>
                <span className="text-xl font-bold text-green-600">
                  {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
