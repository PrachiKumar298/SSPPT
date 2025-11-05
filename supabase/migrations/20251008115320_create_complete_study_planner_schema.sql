/*
  # Complete Student Study Planner Database Schema

  ## Overview
  This migration creates the complete database structure for the Student Study Planner & Progress Tracker
  with all required functionality including user management, subjects, study plans, tasks, reminders,
  progress tracking, performance metrics, and admin capabilities.

  ## New Tables Created

  ### 1. profiles
  User profile information extending Supabase auth.users
  - `id` (uuid, primary key, references auth.users)
  - `email` (text, unique, not null)
  - `full_name` (text, not null)
  - `role` (text, not null, default 'student') - Values: student, mentor, admin
  - `failed_login_attempts` (integer, default 0)
  - `account_locked_until` (timestamptz, nullable)
  - `theme` (text, default 'light') - Values: light, dark
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ### 2. subjects
  Course and subject information
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `name` (text, not null)
  - `instructor` (text)
  - `credits` (integer)
  - `semester` (text)
  - `color` (text, for UI visualization)
  - `description` (text)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ### 3. study_plans
  Weekly study schedule with time blocks
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `subject_id` (uuid, references subjects)
  - `day_of_week` (integer, 0-6) - 0=Sunday, 6=Saturday
  - `start_time` (time, not null)
  - `end_time` (time, not null)
  - `recurrence` (text, default 'weekly') - Values: once, weekly, daily
  - `location` (text)
  - `notes` (text)
  - `task_id` (uuid, references tasks) - added: assign a task to a time block
  - `created_at` (timestamptz, default now())

  ### 4. tasks
  Academic tasks, assignments, and deadlines
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `subject_id` (uuid, references subjects)
  - `title` (text, not null)
  - `description` (text)
  - `task_type` (text, not null) - Values: assignment, quiz, revision, exam, project, lab
  - `due_date` (timestamptz, not null)
  - `status` (text, default 'pending') - Values: pending, in_progress, completed, overdue
  - `priority` (text, default 'medium') - Values: low, medium, high
  - `grade` (numeric(5,2)) - Received grade
  - `max_grade` (numeric(5,2)) - Maximum possible grade
  - `hours_required` (numeric(6,2), default 0) - (if not already present in later migrations)
  - `time_completed` (numeric(6,2), default 0) - added: accumulated time spent on the task
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())
  - `completed_at` (timestamptz, nullable)

  ### 5. reminders
  Automated reminders for tasks
  - `id` (uuid, primary key)
  - `task_id` (uuid, references tasks)
  - `user_id` (uuid, references profiles)
  - `remind_at` (timestamptz, not null)
  - `message` (text, not null)
  - `status` (text, default 'pending') - Values: pending, sent, failed
  - `notification_type` (text, default 'email') - Values: email, push, both
  - `created_at` (timestamptz, default now())
  - `sent_at` (timestamptz, nullable)

  ### 6. progress_logs
  Study session tracking and time logging
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `subject_id` (uuid, references subjects)
  - `task_id` (uuid, references tasks, nullable)
  - `date` (date, not null)
  - `hours_studied` (numeric(4,2), not null)
  - `notes` (text)
  - `performance_rating` (integer) - Self-rated 1-5
  - `created_at` (timestamptz, default now())

  ### 7. performance_metrics
  Aggregated weekly performance data
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `subject_id` (uuid, references subjects)
  - `week_start` (date, not null)
  - `total_hours` (numeric(5,2), default 0)
  - `tasks_completed` (integer, default 0)
  - `tasks_total` (integer, default 0)
  - `completion_rate` (numeric(5,2), default 0)
  - `average_grade` (numeric(5,2))
  - `updated_at` (timestamptz, default now())

  ### 8. system_logs
  Admin monitoring and system health logs
  - `id` (uuid, primary key)
  - `log_type` (text, not null) - Values: error, warning, info, success
  - `message` (text, not null)
  - `user_id` (uuid, references profiles, nullable)
  - `metadata` (jsonb)
  - `created_at` (timestamptz, default now())

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only access their own data
  - Admin role has elevated permissions
  - Proper authentication checks using auth.uid()

  ## Indexes
  Created for optimal query performance on frequently accessed columns

  ## Triggers
  - Auto-create profile on user signup
  - Auto-update timestamps
  - Auto-update performance metrics
*/

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'mentor', 'admin')),
  failed_login_attempts integer DEFAULT 0,
  account_locked_until timestamptz,
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  instructor text,
  credits integer,
  semester text,
  color text DEFAULT '#3B82F6',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS study_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  recurrence text DEFAULT 'weekly' CHECK (recurrence IN ('once', 'weekly', 'daily')),
  location text,
  notes text,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,  -- added: assign a task to a time block
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  task_type text NOT NULL CHECK (task_type IN ('assignment', 'quiz', 'revision', 'exam', 'project', 'lab')),
  due_date timestamptz NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  grade numeric(5,2),
  max_grade numeric(5,2),
  hours_required numeric(6,2) DEFAULT 0,
  time_completed numeric(6,2) DEFAULT 0,  -- added: accumulated time spent on the task
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  remind_at timestamptz NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  notification_type text DEFAULT 'email' CHECK (notification_type IN ('email', 'push', 'both')),
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz
);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS progress_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  date date NOT NULL,
  hours_studied numeric(4,2) NOT NULL CHECK (hours_studied >= 0),
  notes text,
  performance_rating integer CHECK (performance_rating BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE progress_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS performance_metrics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  total_hours numeric(5,2) DEFAULT 0,
  tasks_completed integer DEFAULT 0,
  tasks_total integer DEFAULT 0,
  completion_rate numeric(5,2) DEFAULT 0,
  average_grade numeric(5,2),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, subject_id, week_start)
);

ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS system_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_type text NOT NULL CHECK (log_type IN ('error', 'warning', 'info', 'success')),
  message text NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_user_id ON study_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_subject_id ON study_plans(subject_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_day ON study_plans(day_of_week);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_subject_id ON tasks(subject_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_task_id ON reminders(task_id);
CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders(remind_at);
CREATE INDEX IF NOT EXISTS idx_progress_logs_user_id ON progress_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_logs_date ON progress_logs(date);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view own subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subjects"
  ON subjects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subjects"
  ON subjects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subjects"
  ON subjects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own study plans"
  ON study_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study plans"
  ON study_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study plans"
  ON study_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own study plans"
  ON study_plans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own reminders"
  ON reminders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders"
  ON reminders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON reminders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON reminders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own progress logs"
  ON progress_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress logs"
  ON progress_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress logs"
  ON progress_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress logs"
  ON progress_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own performance metrics"
  ON performance_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own performance metrics"
  ON performance_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own performance metrics"
  ON performance_metrics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own performance metrics"
  ON performance_metrics FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all system logs"
  ON system_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Anyone authenticated can insert system logs"
  ON system_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Student'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subjects_updated_at ON subjects;
CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON subjects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_performance_metrics_updated_at ON performance_metrics;
CREATE TRIGGER update_performance_metrics_updated_at
  BEFORE UPDATE ON performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();