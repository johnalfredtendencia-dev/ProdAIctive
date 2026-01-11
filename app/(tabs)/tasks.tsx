import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import TaskPage, { Task } from '../TaskPage';

const INITIAL_TASKS: Task[] = [
    { id: '1', title: 'Complete Math Assignment', priority: 'High', subject: 'Mathematics', completed: false, duration: '2 hours', dueDate: 'Tomorrow' },
    { id: '2', title: 'Read Chapter 5 - History', priority: 'Medium', subject: 'History', completed: true, duration: '1 hour', dueDate: 'Today' },
    { id: '3', title: 'Physics Lab Report', priority: 'Low', subject: 'Physics', completed: false, duration: '3 hours', dueDate: 'Next Week' },
];

export default function TasksTab() {
    const [tasks, setTasks] = useState(INITIAL_TASKS);

    // Dummy functions for props
    const handleToggleComplete = (id: string) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <TaskPage tasks={tasks} onToggleComplete={handleToggleComplete} onEdit={() => { }} onOpenNew={() => { }} />
        </SafeAreaView>
    );
}