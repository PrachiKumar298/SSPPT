import { Calendar, Edit2, Trash2, Check, X } from 'lucide-react';
import { Reminder, Task, Subject } from '../../lib/supabase';

type ReminderListProps = {
  reminders: (Reminder & { task: Task & { subject: Subject } })[];
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
  onStatusUpdate: (id: string, status: 'sent' | 'failed') => void;
  isPast?: boolean;
};

export function ReminderList({ reminders, onEdit, onDelete, onStatusUpdate, isPast }: ReminderListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (reminders.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-center py-8">
        {isPast ? 'No past reminders' : 'No upcoming reminders'}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {reminders.map((reminder) => (
        <div
          key={reminder.id}
          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span
                className="px-2 py-1 text-xs font-medium rounded"
                style={{
                  backgroundColor: reminder.task.subject.color + '20',
                  color: reminder.task.subject.color,
                }}
              >
                {reminder.task.subject.name}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                reminder.status === 'sent' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                reminder.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
              }`}>
                {reminder.status}
              </span>
            </div>
            <p className="font-medium text-gray-900 dark:text-white">{reminder.task.title}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{reminder.message}</p>
            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mt-2">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(reminder.remind_at)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {!isPast && reminder.status === 'pending' && (
              <>
                <button
                  onClick={() => onStatusUpdate(reminder.id, 'sent')}
                  className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition"
                  title="Mark as sent"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEdit(reminder)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={() => onDelete(reminder.id)}
              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
