import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import { supabase, Subject } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type ProgressFormProps = {
  subjects: Subject[];
  onClose: () => void;
};

export function ProgressForm({ subjects, onClose }: ProgressFormProps) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [hoursStudied, setHoursStudied] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const hours = parseFloat(hoursStudied);
    if (isNaN(hours) || hours <= 0) {
      setError('Please enter a valid number of hours');
      setLoading(false);
      return;
    }

    try {
      const logData = {
        user_id: user!.id,
        subject_id: subjectId,
        date,
        hours_studied: hours,
        notes: notes || null,
      };

      const { error } = await supabase.from('progress_logs').insert([logData]);
      if (error) throw error;

      onClose();
    } catch (err) {
      console.error('Error saving progress:', err);
      setError('Failed to save progress log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
      <div className="max-w-lg w-full card-bg rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Log Study Session
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Quickly record what you studied and how long it took.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md input-bg focus:ring-primary-500"
              >
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                max={new Date().toISOString().slice(0, 10)}
                className="w-full px-3 py-2 border rounded-md input-bg focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hours Studied *
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="24"
              value={hoursStudied}
              onChange={(e) => setHoursStudied(e.target.value)}
              required
              className="w-full px-3 py-3 border rounded-md input-bg focus:ring-primary-500 text-lg font-medium"
              placeholder="e.g., 2.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border rounded-md input-bg focus:ring-primary-500"
              placeholder="What did you study? Key takeaways..."
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 btn-primary rounded-md hover:opacity-95 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
