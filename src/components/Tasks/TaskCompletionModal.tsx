import { useState, FormEvent } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { supabase, Task, Subject } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type TaskCompletionModalProps = {
  task: Task & { subject: Subject };
  onClose: () => void;
  onComplete: () => void;
};

export function TaskCompletionModal({ task, onClose, onComplete }: TaskCompletionModalProps) {
  const [hoursStudied, setHoursStudied] = useState('');
  const [progressPercentage, setProgressPercentage] = useState('100');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const hours = parseFloat(hoursStudied);
      const progress = parseInt(progressPercentage);

      if (isNaN(hours) || hours <= 0) {
        setError('Please enter valid hours studied');
        setLoading(false);
        return;
      }

      if (isNaN(progress) || progress < 0 || progress > 100) {
        setError('Progress must be between 0 and 100');
        setLoading(false);
        return;
      }

      const progressLogData = {
        user_id: user!.id,
        subject_id: task.subject_id,
        task_id: task.id,
        date: new Date().toISOString().split('T')[0],
        hours_studied: hours,
        description: description || null,
        progress_percentage: progress,
        notes: `Completed: ${task.title}`,
      };

      const { error: logError } = await supabase
        .from('progress_logs')
        .insert([progressLogData]);

      if (logError) throw logError;

      const newHoursRequired = Math.max(0, task.hours_required - hours);
      const shouldComplete = progress === 100 || newHoursRequired <= 0;

      const taskUpdateData = {
        hours_required: newHoursRequired,
        progress_percentage: progress,
        status: shouldComplete ? 'completed' as const : task.status,
        ...(shouldComplete && { completed_at: new Date().toISOString() }),
      };

      const { error: taskError } = await supabase
        .from('tasks')
        .update(taskUpdateData)
        .eq('id', task.id);

      if (taskError) throw taskError;

      onComplete();
      onClose();
    } catch (err) {
      console.error('Error logging completion:', err);
      setError('Failed to log task completion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-primary-600" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Log Task Progress
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
            {task.title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {task.subject.name} • {task.hours_required} hours remaining
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hours Studied *
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={hoursStudied}
              onChange={(e) => setHoursStudied(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., 2.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Progress Made (%) *
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progressPercentage}
              onChange={(e) => setProgressPercentage(e.target.value)}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-1">
              <span>0%</span>
              <span className="font-bold text-primary-600 dark:text-primary-400">
                {progressPercentage}%
              </span>
              <span>100%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description / Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="What did you accomplish? Any challenges?"
            />
          </div>

          <div className="bg-secondary-100 dark:bg-secondary-800 p-3 rounded-lg text-sm">
            <p className="text-gray-700 dark:text-gray-300">
              <strong>After logging:</strong>
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-1 space-y-1">
              <li>Hours remaining: {Math.max(0, task.hours_required - (parseFloat(hoursStudied) || 0)).toFixed(1)}h</li>
              <li>{parseInt(progressPercentage) === 100 || Math.max(0, task.hours_required - (parseFloat(hoursStudied) || 0)) <= 0 ? 'Task will be marked as completed' : 'Task will remain active'}</li>
            </ul>
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
              className="flex-1 px-4 py-2 bg-gradient-button text-white rounded-md hover:opacity-90 transition disabled:opacity-50 shadow-md"
            >
              {loading ? 'Logging...' : 'Log Progress'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
