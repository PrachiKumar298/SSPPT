# Student Study Planner & Progress Tracker

A comprehensive academic productivity platform designed to help students manage their workload through structured planning, real-time tracking, and intelligent reminders.

## Features

### 1. **User Authentication**
- Secure email/password registration and login
- Role-based access control (Student, Mentor, Admin)
- Automatic profile creation on signup
- Session management with Supabase Auth

### 2. **Dashboard**
- Real-time statistics overview
- Today's study schedule
- Upcoming tasks (7-day view)
- Completion metrics
- Quick access to all major features

### 3. **Subject Management**
- Add, edit, and delete subjects
- Track instructor, credits, and semester details
- Color-coded organization
- Subject descriptions

### 4. **Study Planner**
- Visual weekly calendar interface
- Time-blocked scheduling (drag-and-drop capable)
- **Automatic overlap validation** - prevents conflicting time slots
- Recurrence options (once, weekly, daily)
- Color-coded by subject

### 5. **Task Manager**
- Create tasks linked to subjects
- Task types: Assignment, Quiz, Revision, Exam, Project
- Priority levels: Low, Medium, High
- Status tracking: Pending, In Progress, Completed, Overdue
- Grade tracking (score and maximum grade)
- Filter by status and priority
- Mark tasks complete with timestamps

### 6. **Reminder Console**
- Schedule reminders for tasks
- Multiple notification types: Email, Push, Both
- Upcoming and past reminders view
- Edit and delete reminders
- Manual status updates (mark as sent/failed)

### 7. **Progress Tracker**
- Log study sessions with hours studied
- Link sessions to specific subjects
- Add session notes
- Performance ratings (1-5 scale)
- Total hours calculation
- Historical progress view

### 8. **Reports & Analytics**
- **Subject Performance** - Task completion rates, study hours, average grades per subject
- **Weekly Study Hours** - Bar chart visualization of study time trends
- **Task Status Distribution** - Visual breakdown of task statuses
- **Summary Statistics** - Total hours, completion rates, and more
- **CSV Export** - Download reports for external analysis
- Date range filtering (Last 7 days, 30 days, All time)

### 9. **Admin Panel**
- System overview dashboard
- User management with role assignment
- Total users, active users, subjects, and tasks statistics
- System logs monitoring (error, warning, info, success)
- User role updates (Student, Mentor, Admin)

### 10. **Dark Mode**
- Toggle between light and dark themes
- Preference saved per user
- Persistent across sessions
- Applied to all components

## Technical Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with dark mode support
- **Icons**: Lucide React
- **Backend**: Supabase
  - Authentication
  - PostgreSQL Database
  - Row Level Security (RLS)
- **Build Tool**: Vite

## Database Schema

The application uses 8 main tables:
1. **profiles** - User information and preferences
2. **subjects** - Course details
3. **study_plans** - Time-blocked schedules
4. **tasks** - Academic tasks and assignments
5. **reminders** - Scheduled notifications
6. **progress_logs** - Study session logs
7. **performance_metrics** - Aggregated weekly data
8. **system_logs** - Admin monitoring

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed schema information.

## Security Features

- **Row Level Security (RLS)** on all tables
- Users can only access their own data
- Admin role for elevated permissions
- Secure authentication with Supabase
- Environment variable protection for sensitive keys

## Getting Started

### Prerequisites
- Node.js 16+ installed
- Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Environment variables are pre-configured in `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

4. Database is already set up with all required tables and policies

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Build for production:
   ```bash
   npm run build
   ```

## First-Time Setup

### Creating the First Admin User

1. Sign up through the application interface
2. Manually update your role in the database:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
   ```
3. Refresh the application
4. Access the Admin Panel from the sidebar

After the first admin is created, you can manage other users through the Admin Panel interface.

## Usage Guide

### For Students

1. **Set Up Subjects**: Add all your courses with details
2. **Create Study Plan**: Schedule time blocks for each subject
3. **Add Tasks**: Create assignments and deadlines
4. **Set Reminders**: Schedule notifications for important tasks
5. **Log Progress**: Record study sessions after completion
6. **View Reports**: Track your performance and identify areas for improvement

### For Admins

1. **Monitor System**: Check system health in Admin Panel
2. **Manage Users**: View and update user roles
3. **Review Logs**: Monitor system events and errors
4. **Oversee Activity**: Track platform usage statistics

## Features by Page

### Login/Registration Page
- Email/password authentication
- Role assignment (defaults to student)
- Automatic profile creation
- Redirect based on role

### Dashboard
- Statistics cards (subjects, tasks, completed, upcoming)
- Today's schedule with color-coded time blocks
- Recent tasks list with priorities
- Quick access buttons

### Subjects Page
- Grid layout of subject cards
- Color-coded headers
- Instructor and credit information
- Edit and delete capabilities
- Add new subjects modal

### Study Planner Page
- Weekly calendar grid view
- Time slots from 6 AM to 11 PM
- Color-coded subject blocks
- **Overlap validation prevents conflicts**
- Click to add new time blocks
- Hover to see delete option

### Tasks Page
- Comprehensive task list
- Filter by status and priority
- Visual status indicators
- One-click completion toggle
- Task type badges
- Due date displays with relative time

### Reminders Page
- Upcoming reminders section
- Past reminders history
- Notification type selection
- Custom message input
- DateTime picker for scheduling

### Progress Page
- Study session entry form
- Total hours summary card
- Chronological session list
- Subject-specific tracking
- Performance rating input

### Reports Page
- Multiple visualization types
- Interactive date range filters
- CSV export functionality
- Subject performance breakdown
- Weekly trend charts
- Task status pie charts
- Summary statistics

### Admin Panel
- System statistics cards
- User management table
- Role assignment dropdown
- System logs with type filtering
- Activity monitoring

## Non-Functional Requirements

- **Performance**: Dashboard loads < 3 seconds
- **Usability**: Intuitive UI with minimal learning curve
- **Reliability**: Data persisted securely in Supabase
- **Security**: HTTPS-only, RLS enabled, encrypted credentials
- **Responsive**: Optimized for desktop use
- **Accessible**: Dark mode for reduced eye strain

## Future Enhancements

- PDF report exports
- Advanced reminder customization
- Mentor dashboards for team tracking
- Mobile responsiveness improvements
- Push notification integration
- Calendar integration (Google Calendar, etc.)
- Study session timer
- Pomodoro technique integration

## Contributing

This is a full-featured academic productivity platform built with modern web technologies. The modular architecture makes it easy to extend and customize.

## License

This project is provided as-is for educational and personal use.

## Support

For issues or questions, please refer to the documentation or check the system logs in the Admin Panel.

---

**Built with** React, TypeScript, Tailwind CSS, and Supabase
