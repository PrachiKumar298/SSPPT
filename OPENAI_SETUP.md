# OpenAI Integration Setup Guide

This guide will help you set up OpenAI integration for AI-powered study schedule generation.

## Prerequisites

1. An OpenAI account with API access
2. A Supabase project (already configured)

## Setup Steps

### 1. Get Your OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the API key (it starts with `sk-`)

### 2. Configure Environment Variables

Update your `.env` file with your OpenAI API key:

```env
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

### 3. Deploy the Edge Function

The Edge Function code is located at:
```
supabase/functions/generate-schedule/index.ts
```

You'll need to deploy this function to your Supabase project. Contact your system administrator or refer to Supabase documentation for deployment instructions.

### 4. Apply Database Migration

Apply the migration to add task_id support to study_plans:

```
supabase/migrations/20251009120000_add_task_id_to_study_plans.sql
```

This migration adds the ability to link study plan blocks directly to tasks.

## How It Works

### The AI Scheduling Algorithm

1. **Fetches all pending tasks** from your task list
2. **Analyzes each task** based on:
   - Priority (high, medium, low)
   - Hours required
   - Due date
   - Current progress

3. **Generates optimal schedule** by:
   - Prioritizing high-priority tasks
   - Distributing work across available days before deadlines
   - Splitting large tasks into manageable 1-3 hour study blocks
   - Avoiding conflicts with existing study plans
   - Scheduling during reasonable hours (8 AM - 10 PM)

4. **Creates study blocks** automatically in your weekly planner

### Example Use Case

**Task:** Complete Math Assignment
- Priority: High
- Hours Required: 3 hours
- Due Date: 2 days from now

**AI Schedule:**
- Day 1: 2-hour study block (2:00 PM - 4:00 PM)
- Day 2: 1-hour study block (10:00 AM - 11:00 AM)

The AI leaves buffer time before the deadline and breaks the work into manageable chunks.

## Using the AI Schedule Feature

1. **Create tasks** with the following information:
   - Title and description
   - Priority level
   - Hours required (estimate how long the task will take)
   - Due date

2. **Click "AI Schedule" button** in either:
   - Task Manager page
   - Weekly Study Planner page

3. **Review the generated schedule** - the AI will:
   - Display a summary of blocks created
   - Provide reasoning for the scheduling decisions

4. **View your schedule** in the Weekly Study Planner
   - AI-generated blocks are labeled "AI Generated"
   - You can edit or delete these blocks as needed

## Troubleshooting

### "OPENAI_API_KEY is not configured" Error
- Ensure you've added your API key to the `.env` file
- Restart your development server after updating environment variables

### "Failed to generate schedule" Error
- Check your OpenAI account has sufficient credits
- Verify the API key is correct and active
- Check browser console for detailed error messages

### No Tasks Scheduled
- Ensure you have pending (non-completed) tasks
- Verify tasks have required fields: hours_required, due_date, priority
- Check that due dates are in the future

## API Costs

The AI scheduling feature uses OpenAI's GPT-4o-mini model, which is cost-effective:
- Estimated cost: $0.01-0.05 per schedule generation
- Cost depends on number of tasks being scheduled

## Privacy & Security

- Your task data is sent to OpenAI's API for schedule generation
- OpenAI processes the data according to their privacy policy
- API keys are stored securely as environment variables
- Study schedules are stored in your Supabase database
