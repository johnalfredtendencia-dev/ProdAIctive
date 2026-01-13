// Gemini AI Service - Handles API calls to Google's Gemini AI
import { Message } from '../components/ChatBot';
import { supabase } from './supabaseApi';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Check if API key exists
if (!GEMINI_API_KEY) {
    console.warn('⚠️ Warning: EXPO_PUBLIC_GEMINI_API_KEY is not set. Using mock AI mode for development.');
}

interface TaskData {
    title: string;
    description: string;
    priority: 'High' | 'Medium' | 'Low';
    dueDate: string;
    dueTime: string;
    subject: string;
}

interface ConflictCheck {
    hasConflict: boolean;
    conflictType: 'date' | 'time' | 'priority' | 'multiple' | null;
    conflictingTasks: any[];
    recommendation: string;
}

/**
 * System prompt for ProdAIctive - In-App Guide Assistant
 */
const PRODAICTIVE_SYSTEM_PROMPT = `You are ProdAIctive Assistant, an intelligent in-app guide for the ProdAIctive productivity app. You ONLY help with app-related features and student productivity.

## YOUR IDENTITY
- Name: ProdAIctive Assistant
- Role: In-app guide and productivity helper
- Scope: ONLY ProdAIctive app features and student productivity

## APP FEATURES YOU CAN HELP WITH:

### 1. TASK MANAGEMENT
- Create tasks with: title, description, priority (High/Medium/Low), due date, due time, subject
- When user wants to create a task, respond with JSON:
  {"action": "create_task", "task": {"title": "...", "description": "...", "priority": "High/Medium/Low", "dueDate": "YYYY-MM-DD", "dueTime": "HH:mm", "subject": "..."}}
- Help organize, filter, and prioritize tasks
- Guide on using the Tasks tab

### 2. SCHEDULE CONFLICT DETECTION
When creating tasks, check for conflicts:
- **Same Date Conflict**: Multiple tasks due on same day
- **Same Time Conflict**: Tasks with exact same due time
- **Same Priority Conflict**: High priority tasks competing for attention

For conflicts, respond with:
{"action": "conflict_detected", "conflictType": "date/time/priority", "recommendation": "...", "task": {...}}

### 3. FOCUS/POMODORO TIMER
- Explain how to use the Focus tab
- Help select tasks for focused work sessions
- Guide on Pomodoro technique (25 min focus, 5 min break)
- Explain settings for custom focus/break durations

### 4. CALENDAR
- Guide on adding events to calendar
- Help schedule study sessions
- Explain alarm/notification features

### 5. DASHBOARD
- Explain task overview and statistics
- Guide on viewing upcoming deadlines
- Help understand productivity metrics

## IMPORTANT RULES:
1. STAY IN SCOPE: Only discuss ProdAIctive features and productivity
2. If asked about unrelated topics, politely redirect to app features
3. Be concise - max 2-3 sentences unless explaining a feature
4. Always be encouraging and supportive
5. When creating tasks, extract ALL details or ask for missing info
6. Proactively check for schedule conflicts
7. Use emojis sparingly for friendliness
8. Respond in the user's language

## COMMON RESPONSES:
- For greetings: Welcome them and briefly mention what you can help with
- For "how to" questions: Provide step-by-step guidance
- For task creation: Extract details and check conflicts
- For confusion: Clarify and guide to the right feature

## OUT OF SCOPE (redirect politely):
- General knowledge questions
- Coding help
- Personal advice unrelated to productivity
- Any non-app related queries`;

/**
 * Generate mock AI response for development/testing
 */
const getMockAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Task creation
    if (lowerMessage.includes('create') || lowerMessage.includes('add task') || lowerMessage.includes('new task')) {
        return `{"action": "create_task", "task": {"title": "Study Session", "description": "Complete your study session", "priority": "High", "dueDate": "2026-01-15", "dueTime": "14:00", "subject": "General"}}`;
    }

    // Focus/Pomodoro help
    if (lowerMessage.includes('pomodoro') || lowerMessage.includes('focus') || lowerMessage.includes('timer')) {
        return "🍅 **Using the Focus Timer:**\n1. Go to the **Focus tab**\n2. Select a task from \"Working On\"\n3. Set your focus duration (default 25 min)\n4. Press **Start** and focus until the alarm!\n\nThe timer will alert you when focus time ends, then switch to break mode.";
    }

    // Calendar help
    if (lowerMessage.includes('calendar') || lowerMessage.includes('schedule') || lowerMessage.includes('event')) {
        return "📅 **Using the Calendar:**\n1. Tap any date to view/add events\n2. Fill in event title and time\n3. Toggle alarm to get reminded\n4. Past dates can't be edited\n\nNeed help adding a specific event?";
    }

    // Dashboard help
    if (lowerMessage.includes('dashboard') || lowerMessage.includes('home')) {
        return "🏠 **Dashboard Overview:**\n- See your upcoming tasks at a glance\n- View today's schedule\n- Track completed tasks\n- Quick access to all features\n\nWhat would you like to know more about?";
    }

    // Task help
    if (lowerMessage.includes('task')) {
        return "✅ **Task Management:**\n1. Go to **Tasks tab** to see all tasks\n2. Tap **+** to add new tasks\n3. Set priority (High/Medium/Low)\n4. Add due date and time\n5. Swipe to complete or delete\n\nWant me to help create a task?";
    }

    // Greetings
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return "👋 Hello! I'm your ProdAIctive Assistant. I can help you:\n• Create and manage tasks\n• Use the Pomodoro focus timer\n• Navigate the calendar\n• Detect schedule conflicts\n\nWhat would you like help with?";
    }

    // Default
    return "I'm here to help you with ProdAIctive! I can assist with:\n📋 Creating tasks\n🍅 Focus timer guidance\n📅 Calendar management\n⚠️ Schedule conflict detection\n\nJust ask me anything about the app!";
};

/**
 * Call Gemini AI API with conversation context
 */
export const getGeminiResponse = async (userMessage: string, conversationHistory: Message[]): Promise<string> => {
    // Use mock mode if API key is missing
    if (!GEMINI_API_KEY) {
        console.log('🧪 Using mock AI mode (no Gemini API key)');
        return getMockAIResponse(userMessage);
    }

    try {
        // Format conversation history for Gemini
        const formattedHistory = conversationHistory
            .slice(-10) // Keep last 10 messages for context
            .map((msg) => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }],
            }));

        // Gemini API endpoint
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [{ text: PRODAICTIVE_SYSTEM_PROMPT }],
                    },
                    contents: [
                        ...formattedHistory,
                        {
                            role: 'user',
                            parts: [{ text: userMessage }],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 500,
                        topP: 0.95,
                        topK: 40,
                    },
                    safetySettings: [
                        {
                            category: 'HARM_CATEGORY_HARASSMENT',
                            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                        },
                        {
                            category: 'HARM_CATEGORY_HATE_SPEECH',
                            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                        },
                        {
                            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                        },
                        {
                            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                        },
                    ],
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Gemini API Error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorData,
            });
            throw new Error(`Gemini API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!content) {
            console.error('❌ No content in Gemini response:', data);
            throw new Error('Gemini returned empty response');
        }

        return content;
    } catch (error) {
        console.error('❌ Error calling Gemini service:', {
            message: error instanceof Error ? error.message : String(error),
            error,
        });
        // Fallback to mock response on error
        return getMockAIResponse(userMessage);
    }
};

/**
 * Parse AI response for task creation or conflict detection
 */
export const parseAIResponse = (aiResponse: string): { action: string; data: any } | null => {
    try {
        // Look for JSON in the response
        const jsonMatch = aiResponse.match(/\{[\s\S]*?"action"[\s\S]*?\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                action: parsed.action,
                data: parsed,
            };
        }
    } catch (error) {
        console.log('No action JSON in response');
    }
    return null;
};

/**
 * Check for schedule conflicts when creating a task
 */
export const checkScheduleConflicts = async (
    newTask: TaskData,
    userId: string
): Promise<ConflictCheck> => {
    try {
        // Fetch existing tasks for the user
        const { data: existingTasks, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('users_id', userId)
            .eq('is_completed', false);

        if (error || !existingTasks) {
            return { hasConflict: false, conflictType: null, conflictingTasks: [], recommendation: '' };
        }

        const conflicts: ConflictCheck = {
            hasConflict: false,
            conflictType: null,
            conflictingTasks: [],
            recommendation: '',
        };

        // Check for same date
        const sameDateTasks = existingTasks.filter((t) => t.due_date === newTask.dueDate);
        
        // Check for same time on same date
        const sameTimeTasks = sameDateTasks.filter((t) => t.due_time === newTask.dueTime);
        
        // Check for same priority on same date
        const samePriorityTasks = sameDateTasks.filter((t) => t.priority === newTask.priority);

        if (sameTimeTasks.length > 0) {
            conflicts.hasConflict = true;
            conflicts.conflictType = 'time';
            conflicts.conflictingTasks = sameTimeTasks;
            conflicts.recommendation = `⚠️ Time Conflict: You already have "${sameTimeTasks[0].title}" at ${newTask.dueTime} on ${newTask.dueDate}. Consider adjusting the time.`;
        } else if (samePriorityTasks.length > 0 && newTask.priority === 'High') {
            conflicts.hasConflict = true;
            conflicts.conflictType = 'priority';
            conflicts.conflictingTasks = samePriorityTasks;
            conflicts.recommendation = `📊 Priority Conflict: Multiple high-priority tasks on ${newTask.dueDate}. I recommend completing "${samePriorityTasks[0].title}" first based on the earlier deadline.`;
        } else if (sameDateTasks.length >= 3) {
            conflicts.hasConflict = true;
            conflicts.conflictType = 'date';
            conflicts.conflictingTasks = sameDateTasks;
            conflicts.recommendation = `📅 Busy Day Alert: You have ${sameDateTasks.length} tasks on ${newTask.dueDate}. Consider spreading them out or prioritizing carefully.`;
        }

        return conflicts;
    } catch (error) {
        console.error('Error checking conflicts:', error);
        return { hasConflict: false, conflictType: null, conflictingTasks: [], recommendation: '' };
    }
};

/**
 * Get AI recommendation for priority conflicts
 */
export const getConflictRecommendation = async (
    task1: any,
    task2: any
): Promise<string> => {
    if (!GEMINI_API_KEY) {
        return `I recommend completing "${task1.title}" first as it was created earlier. After finishing it, move on to "${task2.title}".`;
    }

    try {
        const prompt = `Compare these two tasks and recommend which should be done first in 1-2 sentences:
Task 1: "${task1.title}" (${task1.subject || 'General'}, ${task1.priority} priority, due ${task1.due_date} at ${task1.due_time})
Task 2: "${task2.title}" (${task2.subject || 'General'}, ${task2.priority} priority, due ${task2.due_date} at ${task2.due_time})`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.5, maxOutputTokens: 150 },
                }),
            }
        );

        if (!response.ok) throw new Error('Failed to get recommendation');

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 
            `Complete "${task1.title}" first, then "${task2.title}".`;
    } catch (error) {
        return `I recommend completing "${task1.title}" first, then "${task2.title}".`;
    }
};

// ========== CHAT HISTORY SYNC WITH SUPABASE ==========

export interface ChatMessage {
    id: string;
    user_id: string;
    session_id: string;
    message_text: string;
    sender: 'user' | 'bot';
    created_at: string;
}

export interface ChatSession {
    id: string;
    user_id: string;
    title: string;
    created_at: string;
    updated_at: string;
}

/**
 * Create a new chat session in Supabase
 */
export const createChatSession = async (userId: string, title: string): Promise<ChatSession | null> => {
    try {
        const { data, error } = await supabase
            .from('chat_sessions')
            .insert([
                {
                    users_id: userId,
                    title: title || 'New Chat',
                },
            ])
            .select()
            .single();

        if (error) {
            console.error('Error creating chat session:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error creating chat session:', error);
        return null;
    }
};

/**
 * Get all chat sessions for a user
 */
export const getChatSessions = async (userId: string): Promise<ChatSession[]> => {
    try {
        const { data, error } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('users_id', userId)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching chat sessions:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error fetching chat sessions:', error);
        return [];
    }
};

/**
 * Save a message to Supabase
 */
export const saveChatMessage = async (
    userId: string,
    sessionId: string,
    messageText: string,
    sender: 'user' | 'bot'
): Promise<ChatMessage | null> => {
    try {
        const { data, error } = await supabase
            .from('chat_messages')
            .insert([
                {
                    users_id: userId,
                    session_id: sessionId,
                    message_text: messageText,
                    sender: sender,
                },
            ])
            .select()
            .single();

        if (error) {
            console.error('Error saving message:', error);
            return null;
        }

        // Update session's updated_at
        await supabase
            .from('chat_sessions')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', sessionId);

        return data;
    } catch (error) {
        console.error('Error saving message:', error);
        return null;
    }
};

/**
 * Get messages for a chat session
 */
export const getChatMessages = async (sessionId: string): Promise<ChatMessage[]> => {
    try {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
};

/**
 * Delete a chat session and its messages
 */
export const deleteChatSession = async (sessionId: string): Promise<boolean> => {
    try {
        // Delete messages first
        await supabase.from('chat_messages').delete().eq('session_id', sessionId);

        // Then delete session
        const { error } = await supabase.from('chat_sessions').delete().eq('id', sessionId);

        if (error) {
            console.error('Error deleting session:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error deleting session:', error);
        return false;
    }
};

/**
 * Update chat session title
 */
export const updateChatSessionTitle = async (sessionId: string, title: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('chat_sessions')
            .update({ title })
            .eq('id', sessionId);

        if (error) {
            console.error('Error updating session title:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error updating session title:', error);
        return false;
    }
};

/**
 * Analyze and compare tasks for priority decision using Gemini AI
 */
export const analyzePriorityConflict = async (task1: TaskData, task2: TaskData): Promise<string> => {
    // Use mock response if API key is missing
    if (!GEMINI_API_KEY) {
        return `Based on the task details, I recommend doing "${task1.title}" first as it covers more essential topics. Complete it, then move to "${task2.title}".`;
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `You are a study assistant. Compare 2 tasks with same priority and deadline. Recommend which should be done first and why. Be brief (1-2 sentences).

Task 1: "${task1.title}" (${task1.subject}, ${task1.priority} priority, due ${task1.dueDate} at ${task1.dueTime})
Task 2: "${task2.title}" (${task2.subject}, ${task2.priority} priority, due ${task2.dueDate} at ${task2.dueTime})

Which should be done first?`,
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 150,
                    },
                }),
            }
        );

        if (!response.ok) {
            throw new Error('Failed to analyze priority conflict');
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'I recommend completing both tasks as soon as possible.';
    } catch (error) {
        console.error('Error analyzing priority:', error);
        return `I recommend doing "${task1.title}" first based on the subject importance.`;
    }
};
