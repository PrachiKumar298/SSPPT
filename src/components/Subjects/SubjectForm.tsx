import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import { supabase, Subject } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type SubjectFormProps = {
  subject: Subject | null;
  onClose: () => void;
};

const COLORS = [
  // Purples (primary family)
  '#6A0DAD', // primary
  '#8A2BE2', // vivid purple
  '#A78BFA', // soft lavender

  // Teals (complement)
  '#14B8A6', // teal
  '#06B6D4', // cyan-teal

  // Neutral / Slate
  '#64748B', // slate
  '#9CA3AF', // cool grey

  // Accents
  '#EC4899', // rose
  '#F59E0B', // warm amber
];

export function SubjectForm({ subject, onClose }: SubjectFormProps) {
  const [name, setName] = useState(subject?.name || '');
  const [instructor, setInstructor] = useState(subject?.instructor || '');
  const [credits, setCredits] = useState(subject?.credits?.toString() || '');
  const [color, setColor] = useState(subject?.color || COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const subjectData = {
        user_id: user!.id,
        name,
        instructor: instructor || null,
        credits: credits ? parseInt(credits) : null,
        color,
      };

      if (subject) {
        const { error } = await supabase
          .from('subjects')
          .update(subjectData)
          .eq('id', subject.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('subjects').insert([subjectData]);
        if (error) throw error;
      }

      onClose();
    } catch (err) {
      console.error('Error saving subject:', err);
      setError('Failed to save subject');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            {subject ? 'Edit Subject' : 'Add New Subject'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Data Structures"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructor
            </label>
            <input
              type="text"
              value={instructor}
              onChange={(e) => setInstructor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Dr. Smith"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
            <input
              type="number"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="grid grid-cols-8 gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-lg transition ${color === c ? 'ring-2 ring-offset-2 ring-primary-500' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : subject ? 'Update' : 'Add Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
