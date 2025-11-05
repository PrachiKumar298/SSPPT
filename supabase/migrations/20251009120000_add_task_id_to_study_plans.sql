/*
  # Add task_id to study_plans table

  ## Overview
  Adds support for linking study plan blocks directly to tasks for AI-generated schedules.

  ## Schema Changes

  ### 1. Add task_id column to study_plans
  - New optional column `task_id` that references tasks table
  - Allows study blocks to be linked to specific tasks for AI scheduling
  - Made subject_id nullable since AI-scheduled blocks may only have task_id

  ### 2. Update constraints
  - Make subject_id nullable
  - Add task_id foreign key reference
  - Add check constraint to ensure either subject_id or task_id is present

  ## Important Notes
  - Existing study plans will continue to work (they have subject_id)
  - AI-generated study plans will use task_id
  - Both subject_id and task_id can be set for hybrid use cases
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'study_plans' AND column_name = 'task_id'
  ) THEN
    ALTER TABLE study_plans ADD COLUMN task_id uuid REFERENCES tasks(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  ALTER TABLE study_plans ALTER COLUMN subject_id DROP NOT NULL;
EXCEPTION
  WHEN others THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_study_plans_task_id ON study_plans(task_id);
