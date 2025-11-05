/*
  # Enhanced Features Migration

  ## Overview
  Adds new fields and tables to support:
  - Hours required tracking for tasks
  - Class schedule management
  - Daily reminders
  - AI planning capabilities

  ## Schema Changes

  ### 1. Add hours_required to tasks table
  New field to track estimated time needed for task completion

  ### 2. Create class_schedules table
  Stores user's regular class timetable to block unavailable times

  ### 3. Add completion tracking fields
  Enhanced progress tracking with hours studied and progress percentage

  ### 4. Create daily_reminders table
  System for automated morning reminders
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'hours_required'
  ) THEN
    ALTER TABLE tasks ADD COLUMN hours_required numeric(5,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'progress_percentage'
  ) THEN
    ALTER TABLE tasks ADD COLUMN progress_percentage integer DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'progress_logs' AND column_name = 'progress_percentage'
  ) THEN
    ALTER TABLE progress_logs ADD COLUMN progress_percentage integer CHECK (progress_percentage BETWEEN 0 AND 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'progress_logs' AND column_name = 'description'
  ) THEN
    ALTER TABLE progress_logs ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'reminder_time'
  ) THEN
    ALTER TABLE profiles ADD COLUMN reminder_time time DEFAULT '07:00:00';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'time_completed'
  ) THEN
    ALTER TABLE tasks ADD COLUMN time_completed numeric(6,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'study_plans' AND column_name = 'task_id'
  ) THEN
    ALTER TABLE study_plans ADD COLUMN task_id uuid REFERENCES tasks(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ensure reminders uniqueness to avoid duplicate automatic reminders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'unique_task_remind' AND t.relname = 'reminders'
  ) THEN
    ALTER TABLE reminders
      ADD CONSTRAINT unique_task_remind UNIQUE (task_id, remind_at);
  END IF;
END $$;

-- Trigger function: refresh/create reminders for a task (two days prior and on due date)
CREATE OR REPLACE FUNCTION refresh_task_reminders()
RETURNS TRIGGER AS $$
DECLARE
  remind_prior timestamptz;
  remind_on_due timestamptz;
  msg text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  -- Remove existing pending reminders for the typical times to avoid duplicates
  DELETE FROM reminders
  WHERE task_id = COALESCE(NEW.id, OLD.id)
    AND remind_at IN (
      (COALESCE(NEW.due_date, OLD.due_date) - INTERVAL '2 days'),
      COALESCE(NEW.due_date, OLD.due_date)
    );

  IF TG_OP IN ('INSERT','UPDATE') THEN
    IF NEW.status IS DISTINCT FROM 'completed' AND NEW.due_date IS NOT NULL THEN
      remind_prior := NEW.due_date - INTERVAL '2 days';
      remind_on_due := NEW.due_date;
      msg := format('Reminder: "%s" is due on %s', COALESCE(NEW.title, 'Task'), NEW.due_date::text);

      INSERT INTO reminders (task_id, user_id, remind_at, message, status, notification_type, created_at)
      VALUES (NEW.id, NEW.user_id, remind_prior, msg, 'pending', 'email', now())
      ON CONFLICT (task_id, remind_at) DO NOTHING;

      INSERT INTO reminders (task_id, user_id, remind_at, message, status, notification_type, created_at)
      VALUES (NEW.id, NEW.user_id, remind_on_due, msg, 'pending', 'email', now())
      ON CONFLICT (task_id, remind_at) DO NOTHING;
    END IF;

    -- If task became completed, remove any pending reminders
    IF NEW.status = 'completed' THEN
      DELETE FROM reminders WHERE task_id = NEW.id AND status = 'pending';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_refresh_task_reminders ON tasks;
CREATE TRIGGER trigger_refresh_task_reminders
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION refresh_task_reminders();

-- Trigger function: when a progress_log is added, update task.time_completed and auto-complete/update performance metrics
CREATE OR REPLACE FUNCTION handle_progress_log_insert()
RETURNS TRIGGER AS $$
DECLARE
  t_hours_required numeric(6,2);
  t_time_completed numeric(6,2);
  t_status text;
  t_due_date timestamptz;
  t_user uuid;
  t_subject uuid;
  wk_start date;
BEGIN
  -- Only operate if a task_id is provided
  IF NEW.task_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Accumulate time_completed and grab task info
  UPDATE tasks
  SET time_completed = COALESCE(time_completed, 0) + NEW.hours_studied,
      updated_at = now()
  WHERE id = NEW.task_id
  RETURNING hours_required, time_completed, status, due_date, user_id, subject_id
  INTO t_hours_required, t_time_completed, t_status, t_due_date, t_user, t_subject;

  -- If task is now completed by time, and wasn't already marked completed, set completion metadata and update performance metrics
  IF t_time_completed IS NOT NULL AND t_hours_required IS NOT NULL AND t_time_completed >= t_hours_required AND t_status IS DISTINCT FROM 'completed' THEN
    UPDATE tasks
    SET status = 'completed',
        completed_at = now(),
        updated_at = now()
    WHERE id = NEW.task_id;

    -- Only update Performance Tracker if the task's due_date is within 7 days from now
    IF t_due_date IS NOT NULL AND abs((now()::date - t_due_date::date)) <= 7 THEN
      wk_start := date_trunc('week', NEW.date)::date;

      INSERT INTO performance_metrics (user_id, subject_id, week_start, total_hours, tasks_completed, tasks_total, updated_at)
      VALUES (t_user, t_subject, wk_start, COALESCE(t_hours_required, 0), 1, 0, now())
      ON CONFLICT (user_id, subject_id, week_start) DO UPDATE
      SET total_hours = performance_metrics.total_hours + EXCLUDED.total_hours,
          tasks_completed = performance_metrics.tasks_completed + EXCLUDED.tasks_completed,
          updated_at = now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_handle_progress_log_insert ON progress_logs;
CREATE TRIGGER trigger_handle_progress_log_insert
  AFTER INSERT ON progress_logs
  FOR EACH ROW
  EXECUTE FUNCTION handle_progress_log_insert();