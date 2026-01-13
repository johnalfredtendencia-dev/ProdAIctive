// Task Service - Handle task creation, management, and AI-assisted decisions
import { analyzePriorityConflict } from './geminiService';
import { supabase } from './supabaseApi';

interface Task {
  id?: string;
  user_id?: string;
  title: string;
  description?: string;
  priority: 'High' | 'Medium' | 'Low';
  is_completed?: boolean;
  due_date: string;
  due_time?: string;
  subject?: string;
  created_at?: string;
}

/**
 * Create a new task in Supabase
 */
export const createTaskFromAI = async (task: Task, userId: string): Promise<Task | null> => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          users_id: userId,
          title: task.title,
          description: task.description || '',
          priority: task.priority || 'Medium',
          is_completed: false,
          due_date: task.due_date,
          due_time: task.due_time || '23:59',
          subject: task.subject || 'General',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating task:', error);
    return null;
  }
};

/**
 * Get user's tasks
 */
export const getUserTasks = async (userId: string): Promise<Task[]> => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('users_id', userId)
      .eq('is_completed', false)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
};

/**
 * Check for tasks with same priority and due date
 */
export const checkPriorityConflict = (tasks: Task[]): { conflict: boolean; tasks: Task[] } => {
  if (tasks.length < 2) {
    return { conflict: false, tasks: [] };
  }

  // Find tasks with same priority and due date
  const grouped = new Map<string, Task[]>();

  tasks.forEach((task) => {
    const key = `${task.priority}_${task.due_date}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(task);
  });

  // Find conflicts
  for (const [key, conflictTasks] of grouped) {
    if (conflictTasks.length > 1) {
      return { conflict: true, tasks: conflictTasks };
    }
  }

  return { conflict: false, tasks: [] };
};

/**
 * Get AI recommendation for conflicting tasks
 */
export const getAIPriorityRecommendation = async (task1: Task, task2: Task): Promise<string> => {
  try {
    const recommendation = await analyzePriorityConflict(
      {
        title: task1.title,
        description: task1.description || '',
        priority: task1.priority as 'High' | 'Medium' | 'Low',
        dueDate: task1.due_date,
        dueTime: task1.due_time || '23:59',
        subject: task1.subject || 'General',
      },
      {
        title: task2.title,
        description: task2.description || '',
        priority: task2.priority as 'High' | 'Medium' | 'Low',
        dueDate: task2.due_date,
        dueTime: task2.due_time || '23:59',
        subject: task2.subject || 'General',
      }
    );

    return recommendation;
  } catch (error) {
    console.error('Error getting AI recommendation:', error);
    return `I recommend checking both tasks - "${task1.title}" and "${task2.title}" - and starting with whichever feels more urgent.`;
  }
};

/**
 * Parse natural language task input
 */
export const extractTaskFromText = (text: string): Partial<Task> | null => {
  // Simple extraction - AI will do the heavy lifting
  // Look for dates, priorities, subjects mentioned in text
  
  const task: Partial<Task> = {};

  // Extract priority if mentioned
  if (text.toLowerCase().includes('urgent') || text.toLowerCase().includes('asap')) {
    task.priority = 'High';
  } else if (text.toLowerCase().includes('medium') || text.toLowerCase().includes('important')) {
    task.priority = 'Medium';
  } else if (text.toLowerCase().includes('low') || text.toLowerCase().includes('whenever')) {
    task.priority = 'Low';
  }

  // Extract common subject patterns
  const subjectMatch = text.match(/for\s+(\w+)|in\s+(\w+)|subject[:\s]+(\w+)/i);
  if (subjectMatch) {
    task.subject = subjectMatch[1] || subjectMatch[2] || subjectMatch[3];
  }

  // Extract date pattern (simple)
  const dateMatch = text.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/);
  if (dateMatch) {
    // Convert to YYYY-MM-DD format
    const parts = dateMatch[1].split(/[/-]/);
    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    const month = parts[0].padStart(2, '0');
    const day = parts[1].padStart(2, '0');
    task.due_date = `${year}-${month}-${day}`;
  }

  return Object.keys(task).length > 0 ? task : null;
};

/**
 * Format task as readable string for AI
 */
export const formatTaskForAI = (task: Task): string => {
  const dueTime = task.due_time || 'End of day';
  return `📌 ${task.title}\n   Priority: ${task.priority}\n   Due: ${task.due_date} at ${dueTime}\n   Subject: ${task.subject || 'General'}`;
};
