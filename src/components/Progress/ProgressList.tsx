import { Trash2, Calendar, Clock } from 'lucide-react';
import { ProgressLog, Subject } from '../../lib/supabase';

type ProgressListProps = {
  logs: (ProgressLog & { subject: Subject })[];
  onDelete: (id: string) => void;
};

export function ProgressList({ logs, onDelete }: ProgressListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No study logs yet</h3>
        <p className="text-gray-600">Start logging your study sessions to track progress</p>
      </div>
    );
  }

  const totalHours = logs.reduce((sum, log) => sum + parseFloat(log.hours_studied.toString()), 0);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-primary rounded-xl p-6 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Total Study Time</h3>
            <p className="text-sm opacity-90 mt-1">Across your logged sessions</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-extrabold">{totalHours.toFixed(1)}h</p>
            <p className="text-xs opacity-90 mt-1">
              {logs.length} session{logs.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="relative">
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
              style={{ backgroundColor: log.subject.color }}
            />
            <div className="ml-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-xl transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2"
                      style={{
                        backgroundColor: `${log.subject.color}20`,
                        color: log.subject.color,
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: log.subject.color }}
                      />
                      {log.subject.name}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(log.date)}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm font-semibold text-gray-800 dark:text-gray-100 ml-3">
                      <Clock className="w-4 h-4" />
                      <span>{parseFloat(log.hours_studied.toString()).toFixed(1)}h</span>
                    </div>
                  </div>

                  {log.notes && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{log.notes}</p>
                  )}
                </div>

                <div className="flex flex-col items-end space-y-2 ml-4">
                  <button
                    onClick={() => onDelete(log.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded transition"
                    title="Delete log"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
