import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import { supabase, Subject, Task } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type PlanFormProps = {
  subjects: Subject[];
  selectedSlot: { day: number; time: string } | null;
  tasks: (Task & { subject: Subject })[]; // list of incomplete tasks to choose from
  onClose: () => void;
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function PlanForm({ subjects, selectedSlot, tasks, onClose }: PlanFormProps) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [dayOfWeek, setDayOfWeek] = useState(selectedSlot?.day ?? 1);
  const [startTime, setStartTime] = useState(selectedSlot?.time || '09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [recurrence, setRecurrence] = useState<'once' | 'weekly' | 'daily'>('weekly');
  // new: mode toggles between creating a new task inline or assigning an existing one
  const [mode, setMode] = useState<'create' | 'assign'>('create');
  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.id || '');
  // new-task fields
  const [newTitle, setNewTitle] = useState('');
  const [newHours, setNewHours] = useState('1');
  const [newDue, setNewDue] = useState('');
  const [newTaskType, setNewTaskType] = useState<Task['task_type']>('assignment');
  const [newPriority, setNewPriority] = useState<Task['priority']>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const checkOverlap = async () => {
    const { data: existingPlans } = await supabase
      .from('study_plans')
      .select('*')
      .eq('day_of_week', dayOfWeek);

    if (!existingPlans) return false;

    const newStart = startTime;
    const newEnd = endTime;

    for (const plan of existingPlans) {
      const existingStart = plan.start_time.substring(0, 5);
      const existingEnd = plan.end_time.substring(0, 5);

      if (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      ) {
        return true;
      }
    }

    return false;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (startTime >= endTime) {
      setError('End time must be after start time');
      return;
    }

    setLoading(true);

    try {
      const hasOverlap = await checkOverlap();
      if (hasOverlap) {
        setError('This time slot overlaps with an existing study plan. Please choose a different time.');
        setLoading(false);
        return;
      }

      let taskIdToUse: string | null = null;
      let subjectIdToUse: string | null = subjectId;

      if (mode === 'create') {
        // validate new task fields
        const hoursNum = parseFloat(newHours);
        if (!newTitle || isNaN(hoursNum) || hoursNum <= 0 || !newDue) {
          setError('Please provide title, valid hours (>0) and due date for the new task');
          setLoading(false);
          return;
        }

        const taskData = {
          user_id: user!.id,
          subject_id: subjectId,
          title: newTitle,
          description: null,
          task_type: newTaskType,
          due_date: new Date(newDue).toISOString(),
          priority: newPriority,
          hours_required: hoursNum,
          progress_percentage: 0,
          status: 'pending' as const,
        };

        const { data: insertedTasks, error: taskError } = await supabase
          .from('tasks')
          .insert([taskData])
          .select()
          .single();

        if (taskError || !insertedTasks) throw taskError || new Error('Failed to create task');
        taskIdToUse = insertedTasks.id;
        subjectIdToUse = insertedTasks.subject_id;
      } else {
        // assign existing task
        if (!selectedTaskId) {
          setError('Please select an existing task to assign');
          setLoading(false);
          return;
        }
        taskIdToUse = selectedTaskId;
        const chosen = tasks.find(t => t.id === selectedTaskId);
        subjectIdToUse = chosen?.subject_id || subjectId;
      }

      const planData = {
        user_id: user!.id,
        subject_id: subjectIdToUse,
        task_id: taskIdToUse,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        recurrence,
        location: mode === 'create' ? 'Created via Planner' : 'Assigned Task',
        notes: mode === 'create' ? `Task created: ${newTitle}` : `Assigned task id: ${taskIdToUse}`,
      };

      const { error: planError } = await supabase.from('study_plans').insert([planData]);
      if (planError) throw planError;

      onClose();
    } catch (err) {
      console.error('Error saving plan:', err);
      setError('Failed to save study plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add Study Time Block</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center">
              <input type="radio" value="create" checked={mode === 'create'} onChange={() => setMode('create')} className="mr-2" />
              <span className="text-sm font-medium">Create new task</span>
            </label>
            <label className="inline-flex items-center">
              <input type="radio" value="assign" checked={mode === 'assign'} onChange={() => setMode('assign')} className="mr-2" />
              <span className="text-sm font-medium">Assign existing task</span>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* If assigning existing, show dropdown of incomplete tasks */}
          {mode === 'assign' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Task *</label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- choose task --</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.subject?.name || 'No Subject'} — {t.title} (due {new Date(t.due_date).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* If creating a new task inline, show task fields */}
          {mode === 'create' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours Required *</label>
                  <input type="number" step="0.5" min="0.5" value={newHours} onChange={(e) => setNewHours(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date & Time *</label>
                  <input type="datetime-local" value={newDue} onChange={(e) => setNewDue(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
                  <select value={newTaskType} onChange={(e) => setNewTaskType(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="assignment">Assignment</option>
                    <option value="quiz">Quiz</option>
                    <option value="revision">Revision</option>
                    <option value="exam">Exam</option>
                    <option value="project">Project</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              Day of Week *
            </label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DAYS.map((day, index) => (
                <option key={day} value={index}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recurrence *
            </label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as any)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="once">Once</option>
              <option value="weekly">Weekly</option>
              <option value="daily">Daily</option>
            </select>
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
              className="flex-1 px-4 py-2 btn-primary rounded-md hover:opacity-95 transition disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Time Block'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
