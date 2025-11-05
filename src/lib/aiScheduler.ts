import { supabase } from './supabase';

export interface ScheduleResult {
  success: boolean;
  schedule: {
    task_id: string;
    date: string;
    start_time: string;
    end_time: string;
    hours: number;
  }[];
  reasoning: string;
  tasksScheduled: number;
}

export async function generateAISchedule(): Promise<ScheduleResult> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-schedule`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate schedule');
  }

  return await response.json();
}
