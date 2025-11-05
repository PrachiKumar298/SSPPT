import { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit2, Trash2, BookOpen } from 'lucide-react';
import { supabase, Subject } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { SubjectForm } from './SubjectForm';

export function SubjectList() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const { user, profile } = useAuth();

  // derive semester length from profile (fallbacks)
  const semLength = (profile as any)?.semester_length ?? (profile as any)?.sem_length ?? 16;

  useEffect(() => {
    if (user) {
      loadSubjects();
    }
  }, [user]);

  const loadSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this subject? This will also remove associated study plans and tasks.')) {
      return;
    }

    try {
      const { error } = await supabase.from('subjects').delete().eq('id', id);
      if (error) throw error;
      setSubjects(subjects.filter((s) => s.id !== id));
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert('Failed to delete subject');
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingSubject(null);
    loadSubjects();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading subjects...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My Subjects</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your courses and subject details
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 btn-primary px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subject</span>
        </button>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No subjects yet
          </h3>
          <p className="text-gray-600 mb-6">
            Get started by adding your first subject
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center space-x-2 btn-primary px-6 py-3 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            <span>Add Your First Subject</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition"
            >
              <div
                className="h-2 rounded-t-lg"
                style={{ backgroundColor: subject.color }}
              />
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {subject.name}
                </h3>
                {subject.instructor && (
                  <p className="text-sm text-gray-600 mb-1">
                    Instructor: {subject.instructor}
                  </p>
                )}
                <div className="text-sm text-gray-500 mb-2">
                  {subject.credits ? <span>{subject.credits} Credits</span> : <span>Credits: N/A</span>}
                </div>
                <div className="text-sm text-gray-500 mb-4">
                  {subject.credits
                    ? (() => {
                        const totalClasses = (subject.credits || 0) * semLength;
                        // For >75% attendance, misses must be strictly less than 25% of total.
                        // Max integer misses that keeps attendance >75% = ceil(0.25*total) - 1
                        const allowed = Math.max(0, Math.ceil(0.25 * totalClasses) - 1);
                        return `Allowed misses (>75% attendance): ${allowed} class${allowed !== 1 ? 'es' : ''}`;
                      })()
                    : 'Allowed misses: N/A'}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(subject)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 rounded shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                    title="Edit subject"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(subject.id)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <SubjectForm
          subject={editingSubject}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
