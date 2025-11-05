import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
	console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. Supabase client may fail to initialize.');
}

export const supabase = createClient(SUPABASE_URL ?? '', SUPABASE_ANON_KEY ?? '');

// Minimal, portable types used across the app:
export type Profile = {
	id: string;
	full_name?: string | null;
	email?: string | null;
	role?: 'student' | 'mentor' | 'admin' | string | null;
	reminder_time?: string | null;
	semester_length_weeks?: number | null;
	created_at?: string | null;
};

export type Subject = {
	id: string;
	user_id: string;
	name: string;
	instructor?: string | null;
	credits?: number | null;
	semester?: string | null;
	color?: string | null;
	created_at?: string | null;
};

export type Task = {
	id: string;
	user_id: string;
	subject_id?: string | null;
	title: string;
	description?: string | null;
	task_type: 'assignment' | 'quiz' | 'revision' | 'exam' | 'project' | string;
	due_date?: string | null;
	priority: 'low' | 'medium' | 'high' | string;
	hours_required?: number | null;
	progress_percentage?: number | null;
	status: 'pending' | 'in_progress' | 'completed' | 'overdue' | string;
	created_at?: string | null;
};

export type ProgressLog = {
	id: string;
	user_id: string;
	subject_id?: string | null;
	task_id?: string | null;
	date: string; // YYYY-MM-DD
	hours_studied: number;
	notes?: string | null;
	created_at?: string | null;
};

export type StudyPlan = {
	id: string;
	user_id: string;
	subject_id?: string | null;
	task_id?: string | null;
	day_of_week: number; // 0-6
	start_time: string; // "09:00"
	end_time: string; // "10:00"
	recurrence?: 'once' | 'weekly' | 'daily' | string | null;
	location?: string | null;
	notes?: string | null;
	created_at?: string | null;
};

export type Reminder = {
	id: string;
	user_id: string;
	task_id?: string | null;
	remind_at: string; // ISO datetime
	message?: string | null;
	notification_type?: 'email' | 'push' | 'both' | string | null;
	status?: 'pending' | 'sent' | 'failed' | string | null;
	sent_at?: string | null;
	created_at?: string | null;
};
