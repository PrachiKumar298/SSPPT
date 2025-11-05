import { useState, useEffect } from 'react';
import { Plus, Bell, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase, Reminder, Task, Subject } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ReminderForm } from './ReminderForm';
import { ReminderList } from './ReminderList';

export function ReminderConsole() {
  const [reminders, setReminders] = useState<(Reminder & { task: Task & { subject: Subject } })[]>([]);
  const [tasks, setTasks] = useState<(Task & { subject: Subject })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const { user, profile } = useAuth();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [remindersRes, tasksRes] = await Promise.all([
        supabase
          .from('reminders')
          .select('*, task:tasks(*, subject:subjects(*))')
          .order('remind_at', { ascending: true }),
        supabase
          .from('tasks')
          .select('*, subject:subjects(*)')
          .neq('status', 'completed')
          .order('due_date', { ascending: true }),
      ]);

      if (remindersRes.error) throw remindersRes.error;
      if (tasksRes.error) throw tasksRes.error;

      // raw data
      let existingReminders = remindersRes.data || [];
      const incompleteTasks = tasksRes.data || [];

      // --- deduplicate existingReminders locally and in DB ---
      // key: `${task_id}-${remind_at_iso}`
      const grouped = existingReminders.reduce<Record<string, (typeof existingReminders)[0][]>>((acc, r) => {
        const key = `${r.task_id ?? 'null'}::${new Date(r.remind_at).toISOString()}`;
        (acc[key] ||= []).push(r);
        return acc;
      }, {});

      // collect DB ids to delete (keep first per key)
      const idsToDelete: string[] = [];
      const dedupedReminders: typeof existingReminders = [];
      Object.values(grouped).forEach((group) => {
        if (group.length === 0) return;
        // keep the earliest created one (or first)
        const keeper = group[0];
        dedupedReminders.push(keeper);
        if (group.length > 1) {
          // mark the rest for deletion
          const extras = group.slice(1).map((g) => g.id).filter(Boolean) as string[];
          idsToDelete.push(...extras);
        }
      });

      if (idsToDelete.length > 0) {
        try {
          const { error: delErr } = await supabase.from('reminders').delete().in('id', idsToDelete);
          if (delErr) {
            console.warn('Failed to remove duplicate reminder rows from DB (non-fatal):', delErr);
          } else {
            // reflect deletion in local list
            existingReminders = dedupedReminders;
          }
        } catch (e) {
          console.warn('Error deleting duplicate reminders:', e);
          existingReminders = dedupedReminders;
        }
      } else {
        existingReminders = dedupedReminders;
      }

      // now existingReminders is deduplicated

      // ensure automatic reminders exist: two days prior and on due date (if task still incomplete)
      try {
        // user's preferred time (profiles.reminder_time), default to 07:00:00
        const reminderTime = (profile && profile.reminder_time) ? profile.reminder_time : '07:00:00';

        // helper to compute remind_at datetime (dateObj is a Date for the target day)
        const setTimeOnDate = (dateObj: Date, timeStr: string) => {
          const [h, m, s] = timeStr.split(':').map((v) => parseInt(v, 10) || 0);
          const d = new Date(dateObj);
          d.setHours(h, m, s || 0, 0);
          return d;
        };

        const now = new Date();
        const twoDaysAhead = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

        const remindersToInsert: any[] = [];

        for (const task of incompleteTasks) {
          if (!task.due_date) continue;
          const due = new Date(task.due_date);
          // we still compute the two candidates; we'll only insert if candidate is future
          // (no need to skip here)

          // compute two reminder datetimes
          const twoDaysBefore = new Date(due);
          twoDaysBefore.setDate(due.getDate() - 2);
          const remindTwoDays = setTimeOnDate(twoDaysBefore, reminderTime);
          const remindOnDue = setTimeOnDate(due, reminderTime);

          const candidates = [remindTwoDays, remindOnDue];

          for (const candidate of candidates) {
            // only schedule reminders in the future
            if (candidate <= now) continue;

            // check if an existing reminder for this task at the same date/time exists
            const exists = existingReminders.some((r: any) => {
              return r.task_id === task.id && new Date(r.remind_at).toISOString() === candidate.toISOString();
            });
            if (!exists) {
              remindersToInsert.push({
                user_id: user!.id,
                task_id: task.id,
                remind_at: candidate.toISOString(),
                message: `Reminder: "${task.title}" is due on ${new Date(task.due_date).toLocaleString()}`,
                notification_type: 'email' as const,
                status: 'pending' as const,
              });
            }
          }
        }

        if (remindersToInsert.length > 0) {
          const { data: inserted, error: insertError } = await supabase
            .from('reminders')
            .insert(remindersToInsert)
            .select('*, task:tasks(*, subject:subjects(*))');
          if (insertError) {
            console.error('Error inserting automatic reminders:', insertError);
          } else {
            // merge and dedupe inserted vs existing
            const combined = [...existingReminders, ...(inserted || [])];
            const mapByKey = new Map<string, typeof combined[0]>();
            for (const r of combined) {
              const key = `${r.task_id ?? 'null'}::${new Date(r.remind_at).toISOString()}`;
              if (!mapByKey.has(key)) mapByKey.set(key, r);
            }
            setReminders(Array.from(mapByKey.values()).sort((a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime()));
          }
        } else {
          setReminders((existingReminders || []).sort((a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime()));
        }
      } catch (autoErr) {
        console.error('Auto reminder generation failed:', autoErr);
        setReminders((existingReminders || []).sort((a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime()));
      }

      setTasks(incompleteTasks);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this reminder?')) return;

    try {
      const { error } = await supabase.from('reminders').delete().eq('id', id);
      if (error) throw error;
      setReminders(reminders.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting reminder:', error);
      alert('Failed to delete reminder');
    }
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingReminder(null);
    loadData();
  };

  const handleStatusUpdate = async (id: string, status: 'sent' | 'failed') => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ status, sent_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading reminders...</div>
      </div>
    );
  }

  // classify reminders: pending future ones are upcoming; anything sent/failed or remind_at <= now or task completed goes to past
  const now = new Date();
  const upcomingReminders = reminders.filter(r => {
    const remindAt = new Date(r.remind_at);
    const taskCompleted = r.task?.status === 'completed' || false;
    return r.status === 'pending' && remindAt > now && !taskCompleted;
  });
  const pastReminders = reminders.filter(r => {
    const remindAt = new Date(r.remind_at);
    const taskCompleted = r.task?.status === 'completed' || false;
    return r.status !== 'pending' || remindAt <= now || taskCompleted;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reminder Console</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Schedule and manage task reminders
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 btn-primary px-4 py-2 rounded-lg transition disabled:opacity-50"
          disabled={tasks.length === 0}
        >
          <Plus className="w-4 h-4" />
          <span>Add Reminder</span>
        </button>
      </div>

      {tasks.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded">
          Please add tasks first before creating reminders.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Upcoming Reminders ({upcomingReminders.length})
            </h3>
          </div>
          <ReminderList
            reminders={upcomingReminders}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusUpdate={handleStatusUpdate}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Past Reminders ({pastReminders.length})
            </h3>
          </div>
          <ReminderList
            reminders={pastReminders}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusUpdate={handleStatusUpdate}
            isPast
          />
        </div>
      </div>

      {showForm && (
        <ReminderForm
          reminder={editingReminder}
          tasks={tasks}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
