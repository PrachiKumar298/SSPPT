# Database Setup Instructions

The Student Study Planner database has been created with the following schema:

## Tables Created

### 1. profiles
User profile information extending Supabase auth.users
- User roles: student, mentor, admin
- Theme preferences (light/dark mode)
- Account security features

### 2. subjects
Course and subject information
- Subject details with instructor, credits, semester
- Custom color coding for visual organization
- Linked to user profiles

### 3. study_plans
Weekly study schedule with time blocks
- Day of week scheduling (0-6)
- Time slot management with overlap validation
- Recurrence patterns (once, weekly, daily)
- Location and notes fields

### 4. tasks
Academic tasks and assignments
- Task types: assignment, quiz, revision, exam, project
- Status tracking: pending, in_progress, completed, overdue
- Priority levels: low, medium, high
- Grade tracking (grade and max_grade fields)

### 5. reminders
Automated reminders for tasks
- Scheduled notification times
- Multiple notification types: email, push, both
- Status tracking: pending, sent, failed

### 6. progress_logs
Study session tracking
- Hours studied per session
- Performance ratings (1-5)
- Session notes
- Linked to subjects and optional tasks

### 7. performance_metrics
Aggregated weekly performance data
- Total study hours per week
- Task completion rates
- Average grades by subject

### 8. system_logs
Admin monitoring and system health logs
- Log types: error, warning, info, success
- User activity tracking
- System event monitoring

## Security Features

- **Row Level Security (RLS)** enabled on all tables
- Users can only access their own data
- Admin role has elevated permissions for system management
- Automatic profile creation on user signup
- Secure authentication using Supabase Auth

## Database Features

- Automatic timestamp updates
- Foreign key constraints for data integrity
- Optimized indexes for query performance
- Triggers for automated operations
- Data validation at database level

## Admin Access

To make a user an admin:
1. User must first sign up through the application
2. An existing admin can change the user's role in the Admin Panel
3. Or manually update the database:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'user@example.com';
   ```

## First Admin Setup

For the first admin user, after signing up, manually update your profile:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

Then you can manage other users through the Admin Panel in the application.
