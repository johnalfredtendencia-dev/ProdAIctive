import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AddTaskData } from '../../components/AddTaskModal';
import { supabase } from '../../services/supabaseApi';
import TaskPage, { Task } from '../TaskPage';

const INITIAL_TASKS: Task[] = [];

// Generate proper UUID
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Ensure user profile exists in profiles table
const ensureUserExists = async (userId: string, email: string | undefined) => {
    try {
        // First check if profile exists
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .maybeSingle();

        if (!existingProfile) {
            // Profile doesn't exist, create it
            const { error: insertError } = await supabase
                .from('profiles')
                .insert([{ 
                    id: userId,
                    email: email || '',
                }]);

            if (insertError) {
                // Profile might be auto-created by trigger, ignore "already exists" errors
                console.log('Insert profile info (might already exist):', insertError);
            }
        }
        return true;
    } catch (error) {
        console.error('Error ensuring profile exists:', error);
        return false;
    }
};

export default function TasksTab() {
    const [tasks, setTasks] = useState(INITIAL_TASKS);

    // Fetch tasks from Supabase on component load
    useEffect(() => {
        fetchTasks();
    }, []);

    // Helper to format time from 24h to 12h
    const formatTimeFrom24 = (time: string | null) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    const fetchTasks = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
                // Ensure user exists before fetching
                await ensureUserExists(user.id, user.email);

                const { data: userTasks, error } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('users_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching tasks:', error);
                    return;
                }

                if (userTasks) {
                    const formattedTasks = userTasks.map((t: any) => {
                        let duration = t.duration || '';
                        if (!duration && t.due_time) {
                            duration = formatTimeFrom24(t.due_time);
                        }
                        
                        return {
                            id: t.id,
                            title: t.title,
                            description: t.description,
                            dueDate: t.due_date || 'Today',
                            duration,
                            priority: t.priority || 'Medium',
                            subject: t.subject || 'Task',
                            completed: t.is_completed || false,
                        };
                    });
                    setTasks(formattedTasks);
                }
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    // Handle toggle complete - synced with Supabase
    const handleToggleComplete = async (id: string) => {
        try {
            const task = tasks.find(t => t.id === id);
            if (!task) return;

            const newCompleted = !task.completed;

            const { error } = await supabase
                .from('tasks')
                .update({ is_completed: newCompleted })
                .eq('id', id);

            if (error) {
                console.error('Error updating task:', error);
                Alert.alert('Error', 'Failed to update task. Please try again.');
                return;
            }

            setTasks(tasks.map(t => t.id === id ? { ...t, completed: newCompleted } : t));
        } catch (error) {
            console.error('Error toggling task:', error);
            Alert.alert('Error', 'Failed to update task. Please try again.');
        }
    };

    // Handle adding a new task - synced with Supabase
    const handleAddTask = async (taskData: AddTaskData) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                Alert.alert('Error', 'You must be logged in to add tasks.');
                return;
            }

            // IMPORTANT: Ensure user exists in users table first
            const userCreated = await ensureUserExists(user.id, user.email);
            if (!userCreated) {
                Alert.alert('Error', 'Failed to verify user. Please try again.');
                return;
            }

            const uuid = generateUUID();
            
            const formatTimeForDisplay = (date: Date) => {
                return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            };

            const newTask: Task = {
                id: uuid,
                title: taskData.title,
                description: taskData.description,
                dueDate: taskData.dueDate,
                duration: `${formatTimeForDisplay(taskData.startTime)} - ${formatTimeForDisplay(taskData.endTime)}`,
                priority: taskData.priority,
                subject: 'Task',
                completed: false,
                pomodoro: taskData.pomodoro,
            };

            // Save to Supabase
            const { error } = await supabase.from('tasks').insert([
                {
                    id: newTask.id,
                    users_id: user.id,
                    title: newTask.title,
                    description: newTask.description,
                    due_date: newTask.dueDate,
                    priority: newTask.priority,
                    subject: newTask.subject,
                    is_completed: newTask.completed,
                }
            ]);

            if (error) {
                console.error('Error saving task:', error);
                Alert.alert('Error', `Failed to save task: ${error.message}`);
                return;
            }
            
            setTasks([newTask, ...tasks]);
        } catch (error) {
            console.error('Error adding task:', error);
            Alert.alert('Error', 'Failed to add task. Please try again.');
        }
    };

    // Handle deleting a task - synced with Supabase
    const handleDeleteTask = async (id: string) => {
        Alert.alert(
            "Delete Task",
            "Are you sure you want to delete this task?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('tasks')
                                .delete()
                                .eq('id', id);

                            if (error) {
                                console.error('Error deleting task:', error);
                                Alert.alert('Error', 'Failed to delete task. Please try again.');
                                return;
                            }

                            setTasks(tasks.filter(t => t.id !== id));
                        } catch (error) {
                            console.error('Error deleting task:', error);
                            Alert.alert('Error', 'Failed to delete task. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    // Handle editing a task - shows delete option
    const handleEditTask = (task: Task) => {
        Alert.alert(
            task.title,
            "What would you like to do?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => handleDeleteTask(task.id),
                },
                {
                    text: task.completed ? "Mark Incomplete" : "Mark Complete",
                    onPress: () => handleToggleComplete(task.id),
                },
            ]
        );
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <TaskPage 
                tasks={tasks} 
                onToggleComplete={handleToggleComplete}
                onAddTask={handleAddTask}
                onEdit={handleEditTask} 
                onOpenNew={() => { }} 
            />
        </SafeAreaView>
    );
}