import { Task, ProgressLog, Subject } from './supabase';

export function generateSubjectPerformanceData(
  tasks: (Task & { subject: Subject })[],
  logs: (ProgressLog & { subject: Subject })[]
) {
  const subjectMap = new Map<string, {
    name: string;
    color: string;
    tasksCompleted: number;
    tasksTotal: number;
    hoursStudied: number;
    averageGrade: number;
    grades: number[];
  }>();

  tasks.forEach((task) => {
    const key = task.subject_id;
    if (!subjectMap.has(key)) {
      subjectMap.set(key, {
        name: task.subject.name,
        color: task.subject.color,
        tasksCompleted: 0,
        tasksTotal: 0,
        hoursStudied: 0,
        averageGrade: 0,
        grades: [],
      });
    }

    const data = subjectMap.get(key)!;
    data.tasksTotal++;
    if (task.status === 'completed') {
      data.tasksCompleted++;
    }
    if (task.grade && task.max_grade) {
      const percentage = (task.grade / task.max_grade) * 100;
      data.grades.push(percentage);
    }
  });

  logs.forEach((log) => {
    const key = log.subject_id;
    if (subjectMap.has(key)) {
      const data = subjectMap.get(key)!;
      data.hoursStudied += parseFloat(log.hours_studied.toString());
    }
  });

  subjectMap.forEach((data) => {
    if (data.grades.length > 0) {
      data.averageGrade = data.grades.reduce((a, b) => a + b, 0) / data.grades.length;
    }
  });

  return Array.from(subjectMap.values());
}

export function generateWeeklyProgressData(logs: ProgressLog[]) {
  const weekMap = new Map<string, number>();

  logs.forEach((log) => {
    const date = new Date(log.date);
    const weekStart = getWeekStart(date);
    const weekKey = weekStart.toISOString().split('T')[0];

    weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + parseFloat(log.hours_studied.toString()));
  });

  const sorted = Array.from(weekMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-8);

  return sorted.map(([date, hours]) => ({
    week: formatWeekLabel(date),
    hours: Math.round(hours * 10) / 10,
  }));
}

export function generateTaskStatusData(tasks: Task[]) {
  const statusCounts = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0,
  };

  tasks.forEach((task) => {
    statusCounts[task.status]++;
  });

  return Object.entries(statusCounts).map(([status, count]) => ({
    status: status.replace('_', ' '),
    count,
  }));
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function formatWeekLabel(dateString: string): string {
  const date = new Date(dateString);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
}

export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
}
