# Manual Setup Guide for AI Schedule Feature

## What Changed

### 1. New Files Created
- `supabase/functions/generate-schedule/index.ts` - Edge function for AI scheduling
- `src/lib/aiScheduler.ts` - Client-side service to call the Edge function
- `OPENAI_SETUP.md` - Documentation for OpenAI integration

### 2. Modified Files

#### `.env` (Line 4 added)
```env
OPENAI_API_KEY=your_openai_api_key_here
```

#### `src/components/Tasks/TaskManager.tsx`
- Line 2: Added `Sparkles` import
- Line 7: Added `import { generateAISchedule } from '../../lib/aiScheduler';`
- Line 17: Added `const [generatingSchedule, setGeneratingSchedule] = useState(false);`
- Lines 92-107: Added `handleGenerateSchedule` function
- Lines 133-151: Added AI Schedule button in the UI

#### `src/components/Planner/StudyPlanner.tsx`
- Line 2: Added `Sparkles` import
- Line 7: Added `import { generateAISchedule } from '../../lib/aiScheduler';`
- Line 15: Added `const [generatingSchedule, setGeneratingSchedule] = useState(false);`
- Lines 77-93: Added `handleGenerateSchedule` function
- Lines 113-131: Added AI Schedule button in the UI

### 3. Database Migration
- `supabase/migrations/20251009120000_add_task_id_to_study_plans.sql` - Adds task_id column to study_plans table

## How to Fix the Issues

### Problem 1: Database Tables Don't Exist

You need to apply the migrations. The error shows:
```
Could not find the table 'public.subjects' in the schema cache
Could not find the table 'public.tasks' in the schema cache
Could not find the table 'public.profiles' in the schema cache
```

**Solution:** Apply the migrations in order:

1. First migration:
```bash
# If using Supabase CLI:
supabase db push

# OR manually run this SQL in your Supabase dashboard SQL editor:
# Copy the entire contents of:
# supabase/migrations/20251008115320_create_complete_study_planner_schema.sql
```

2. Second migration:
```bash
# Copy the entire contents of:
# supabase/migrations/20251009081705_add_enhanced_features.sql
```

3. Third migration:
```bash
# Copy the entire contents of:
# supabase/migrations/20251009120000_add_task_id_to_study_plans.sql
```

### Problem 2: Edge Function Not Deployed

The 500 error from `generate-schedule` endpoint means the Edge function isn't deployed.

**Solution:**

1. Deploy the Edge function using Supabase CLI:
```bash
supabase functions deploy generate-schedule
```

2. Add the OpenAI API key as a secret:
```bash
supabase secrets set OPENAI_API_KEY=sk-your-actual-key-here
```

### Problem 3: Missing OpenAI API Key

**Solution:**

1. Get your OpenAI API key from https://platform.openai.com/api-keys
2. Add it to your `.env` file:
```env
OPENAI_API_KEY=sk-your-actual-openai-api-key
```
3. Restart your dev server

## Step-by-Step Manual Setup

### Step 1: Apply Database Migrations

Go to your Supabase Dashboard → SQL Editor and run these in order:

**Migration 1:** Run the entire content of `supabase/migrations/20251008115320_create_complete_study_planner_schema.sql`

**Migration 2:** Run the entire content of `supabase/migrations/20251009081705_add_enhanced_features.sql`

**Migration 3:** Run this SQL:
```sql
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
```

### Step 2: Deploy Edge Function

Option A - Using Supabase CLI (recommended):
```bash
cd your-project-directory
supabase functions deploy generate-schedule
supabase secrets set OPENAI_API_KEY=sk-your-actual-key
```

Option B - Manual deployment via Supabase Dashboard:
1. Go to Edge Functions in Supabase Dashboard
2. Create new function named "generate-schedule"
3. Copy contents of `supabase/functions/generate-schedule/index.ts`
4. Deploy the function
5. Add OPENAI_API_KEY in Secrets section

### Step 3: Configure Environment Variables

Update your `.env` file:
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-your-openai-key
```

### Step 4: Restart Development Server

```bash
npm run dev
```

## Verification Steps

1. **Check Database:** Go to Supabase Dashboard → Table Editor
   - You should see: profiles, subjects, tasks, study_plans, etc.

2. **Check Edge Function:** Go to Supabase Dashboard → Edge Functions
   - You should see: generate-schedule (deployed)

3. **Test the App:**
   - Login/Signup
   - Add a subject (e.g., "Math")
   - Add a task with:
     - Priority: High
     - Hours Required: 3
     - Due Date: 2 days from now
   - Click "AI Schedule" button
   - Check Weekly Planner for generated blocks

## Troubleshooting

### "Could not find the table" errors
- Migrations not applied. Run all SQL migrations in Supabase Dashboard.

### "Failed to load resource" on generate-schedule endpoint
- Edge function not deployed. Deploy using Supabase CLI or Dashboard.

### "OPENAI_API_KEY is not configured"
- Add OpenAI key to Supabase secrets: `supabase secrets set OPENAI_API_KEY=sk-xxx`

### Can't add subjects
- Database tables don't exist. Apply migration 1 first.

### AI Schedule button does nothing
- Check browser console for errors
- Verify Edge function is deployed
- Verify OpenAI API key is set in Supabase secrets (not just .env)

## Quick Test Without AI (Alternative)

If you want to test the app without AI scheduling:
1. Apply database migrations (Step 1)
2. Use the app to manually create subjects, tasks, and study plans
3. Skip the Edge function deployment
4. The AI Schedule button won't work, but everything else will

## Summary of What AI Scheduling Does

When you click "AI Schedule":
1. Fetches all your pending tasks
2. Sends them to OpenAI GPT-4o-mini
3. AI analyzes priority, hours needed, and deadlines
4. Generates optimal study blocks (1-3 hour sessions)
5. Distributes work across days before deadlines
6. Creates study plan entries in your weekly calendar

Example: 3-hour medium priority task due in 2 days → AI creates 2-hour block today + 1-hour block tomorrow.
