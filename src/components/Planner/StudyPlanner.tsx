import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { supabase, StudyPlan, Subject, Task } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { WeeklyCalendar } from './WeeklyCalendar';
import { PlanForm } from './PlanForm';

export function StudyPlanner() {
  const [plans, setPlans] = useState<(StudyPlan & { subject: Subject })[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  // new: incomplete tasks for assignment option in planner
  const [tasks, setTasks] = useState<(Task & { subject: Subject })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; time: string } | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const nowISO = new Date().toISOString();
      const [plansRes, subjectsRes, tasksRes] = await Promise.all([
        supabase
          .from('study_plans')
          .select('*, subject:subjects(*)')
          .order('day_of_week', { ascending: true }),
        supabase
          .from('subjects')
          .select('*')
          .order('name', { ascending: true }),
        // fetch incomplete tasks to allow assignment to a slot
        supabase
          .from('tasks')
          .select('*, subject:subjects(*)')
          .neq('status', 'completed')
          .gte('due_date', nowISO)
          .order('due_date', { ascending: true }),
      ]);

      if (plansRes.error) throw plansRes.error;
      if (subjectsRes.error) throw subjectsRes.error;
      if (tasksRes.error) throw tasksRes.error;

      setPlans(plansRes.data || []);
      setSubjects(subjectsRes.data || []);
      setTasks(tasksRes.data || []);
    } catch (error) {
      console.error('Error loading planner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (day: number, time: string) => {
    if (subjects.length === 0) {
      alert('Please add subjects first before creating a study plan.');
      return;
    }
    setSelectedSlot({ day, time });
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedSlot(null);
    loadData();
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Delete this study plan slot?')) return;

    try {
      const { error } = await supabase.from('study_plans').delete().eq('id', id);
      if (error) throw error;
      setPlans(plans.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Failed to delete plan');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading study planner...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Weekly Study Planner</h2>
            <p className="text-sm text-gray-600 mt-1">
              Schedule your study sessions throughout the week
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 btn-primary px-4 py-2 rounded-lg transition disabled:opacity-50"
              disabled={subjects.length === 0}
            >
              <Plus className="w-4 h-4" />
              <span>Add Time Block</span>
            </button>
          </div>
        </div>

        {subjects.length === 0 && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
            Please add subjects first before creating a study plan.
          </div>
        )}
      </div>

      <WeeklyCalendar
        plans={plans}
        onSlotClick={handleSlotClick}
        onDeletePlan={handleDeletePlan}
      />

      {showForm && (
        <PlanForm
          subjects={subjects}
          selectedSlot={selectedSlot}
          tasks={tasks} // pass incomplete tasks for "Assign existing" option
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
