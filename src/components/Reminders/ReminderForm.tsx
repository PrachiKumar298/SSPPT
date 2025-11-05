import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import { supabase, Reminder, Task, Subject } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type ReminderFormProps = {
  reminder: Reminder | null;
  tasks: (Task & { subject: Subject })[];
  onClose: () => void;
};

export function ReminderForm({ reminder, tasks, onClose }: ReminderFormProps) {
  const [taskId, setTaskId] = useState(reminder?.task_id || tasks[0]?.id || '');
  const [remindAt, setRemindAt] = useState(
    reminder?.remind_at ? new Date(reminder.remind_at).toISOString().slice(0, 16) : ''
  );
  const [message, setMessage] = useState(reminder?.message || '');
  const [notificationType, setNotificationType] = useState<'email' | 'push' | 'both'>(
    reminder?.notification_type || 'email'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const reminderData = {
        user_id: user!.id,
        task_id: taskId,
        remind_at: new Date(remindAt).toISOString(),
        message: message || `Reminder: Task due soon`,
        notification_type: notificationType,
        status: 'pending' as const,
      };

      if (reminder) {
        const { error } = await supabase
          .from('reminders')
          .update(reminderData)
          .eq('id', reminder.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('reminders').insert([reminderData]);
        if (error) throw error;
      }

      onClose();
    } catch (err) {
      console.error('Error saving reminder:', err);
      setError('Failed to save reminder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {reminder ? 'Edit Reminder' : 'Add New Reminder'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Task *
            </label>
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.subject.name} - {task.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Remind At *
            </label>
            <input
              type="datetime-local"
              value={remindAt}
              onChange={(e) => setRemindAt(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Reminder message"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notification Type *
            </label>
            <select
              value={notificationType}
              onChange={(e) => setNotificationType(e.target.value as any)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="email">Email</option>
              <option value="push">Push Notification</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : reminder ? 'Update' : 'Add Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
