import { useState, useEffect } from 'react';
import { Calendar, CreditCard as Edit2, Trash2, CheckCircle2, Circle, Clock } from 'lucide-react';
import { Task, Subject, supabase } from '../../lib/supabase';

type TaskListProps = {
  tasks: (Task & { subject: Subject })[];
  onEdit: (task: Task) => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
  onDelete: (taskId: string) => void;
};

const TASK_TYPE_LABELS: Record<Task['task_type'], string> = {
  assignment: 'Assignment',
  quiz: 'Quiz',
  revision: 'Revision',
  exam: 'Exam',
  project: 'Project',
};

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

const STATUS_COLORS = {
  // keep same light background but use black text for pending
  pending: 'bg-gray-100 text-black',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
};

export function TaskList({ tasks, onEdit, onStatusChange, onDelete }: TaskListProps) {
  const [loggedByTask, setLoggedByTask] = useState<Record<string, number>>({});
  useEffect(() => {
    // aggregate logged hours for the currently visible tasks
    const ids = (tasks || []).map(t => t.id).filter(Boolean);
    if (ids.length === 0) {
      setLoggedByTask({});
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('progress_logs')
          .select('task_id, hours_studied')
          .in('task_id', ids);
        if (error) throw error;
        const map: Record<string, number> = {};
        (data || []).forEach((log: any) => {
          if (!log.task_id) return;
          map[log.task_id] = (map[log.task_id] || 0) + parseFloat(log.hours_studied?.toString() || '0');
        });
        if (mounted) setLoggedByTask(map);
      } catch (e) {
        console.error('Failed to load progress logs for tasks:', e);
      }
    })();
    return () => { mounted = false; };
  }, [tasks]);

  // Filter out tasks that are completed or whose due date has already passed.
  const now = new Date();
  const visibleTasks = (tasks || []).filter((t) => {
    try {
      return t.status !== 'completed' && new Date(t.due_date) >= now;
    } catch {
      return t.status !== 'completed';
    }
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const formatted = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (diffDays < 0) return `${formatted} (Overdue)`;
    if (diffDays === 0) return `${formatted} (Today)`;
    if (diffDays === 1) return `${formatted} (Tomorrow)`;
    if (diffDays <= 7) return `${formatted} (${diffDays} days)`;
    return formatted;
  };

  if (visibleTasks.length === 0) {
    return (
      <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
        <p className="text-gray-600">Add tasks to track your academic work</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visibleTasks.map((task) => (
        <div
          key={task.id}
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <button
                  onClick={() =>
                    onStatusChange(
                      task.id,
                      task.status === 'completed' ? 'pending' : 'completed'
                    )
                  }
                  className="flex-shrink-0"
                >
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-400 hover:text-primary-600 transition" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <h3
                    className={`text-lg font-semibold text-gray-900 truncate ${
                      task.status === 'completed' ? 'line-through text-gray-500' : ''
                    }`}
                  >
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4 ml-9">
                <div
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: task.subject.color + '20',
                    color: task.subject.color,
                  }}
                >
                  {task.subject.name}
                </div>

                <span className={`px-2 py-1 rounded text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
                  {task.priority.toUpperCase()}
                </span>

                <span
                  className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[task.status]} ${task.status === 'pending' ? 'font-semibold' : 'font-medium'}`}
                >
                  {task.status.replace('_', ' ').toUpperCase()}
                </span>

                <span className="text-xs text-gray-500">
                  {TASK_TYPE_LABELS[task.task_type]}
                </span>

                {/* Hours remaining (computed from logged progress) */}
                <span className="flex items-center text-xs text-gray-700">
                  <Clock className="w-4 h-4 mr-1 text-gray-500" />
                  {(() => {
                    const logged = loggedByTask[task.id] || 0;
                    const remaining = Math.max(0, (task.hours_required ?? 0) - logged);
                    return <span>{remaining.toFixed(1)}h remaining</span>;
                  })()}
                </span>

                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(task.due_date)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              {task.status === 'pending' && (
                <button
                  onClick={() => onStatusChange(task.id, 'in_progress')}
                  className="p-2 text-primary-600 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition"
                  title="Start working"
                >
                  <Clock className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => onEdit(task)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded transition"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded transition"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
