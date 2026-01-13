import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { Download, History, MessageCircle, Mic, MicOff, Send, Settings, Trash2, Volume, Volume2, VolumeX, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import {
  checkScheduleConflicts,
  createChatSession,
  deleteChatSession as deleteSessionFromDB,
  getChatMessages,
  getChatSessions,
  getGeminiResponse,
  parseAIResponse,
  saveChatMessage
} from '../services/geminiService';
import { supabase } from '../services/supabaseApi';
import { createTaskFromAI } from '../services/taskService';
// Simple storage using state - data persists during app session
const storageCache = new Map<string, string>();

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  lastUpdated: Date;
  supabaseId?: string; // Track Supabase session ID
}

interface ChatBotProps {
  isOpen: boolean;
  onToggle: () => void;
}

const { width, height } = Dimensions.get('window');

export function ChatBot({ isOpen, onToggle }: ChatBotProps) {
    const { colors, isDarkMode } = useTheme();
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [currentSupabaseSessionId, setCurrentSupabaseSessionId] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);
    const scrollPosition = useRef(0);

    const styles = StyleSheet.create({
        backdrop: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        container: {
            position: 'absolute',
            bottom: 100,
            left: '50%',
            width: '80%',
            height: height * 0.5,
            marginLeft: '-40%',
            backgroundColor: colors.cardBg,
            borderRadius: 30,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -5 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 30,
        },
        header: {
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.primary,
        },
        headerLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        headerTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: '#FFFFFF',
            marginLeft: 8,
        },
        headerSubtitle: {
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.8)',
            marginLeft: 8,
        },
        headerRight: {
            flexDirection: 'row',
            gap: 8,
        },
        messagesContainer: {
            flex: 1,
            paddingHorizontal: 12,
            paddingVertical: 12,
            backgroundColor: colors.background,
        },
        messageGroup: {
            marginVertical: 6,
            flexDirection: 'row',
        },
        userMessageGroup: {
            justifyContent: 'flex-end',
        },
        messageBubble: {
            maxWidth: '80%',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20,
        },
        userBubble: {
            backgroundColor: colors.primary,
            borderBottomRightRadius: 4,
        },
        botBubble: {
            backgroundColor: isDarkMode ? colors.background : '#F0F0F0',
            borderBottomLeftRadius: 4,
            borderWidth: 1,
            borderColor: colors.border,
        },
        messageText: {
            fontSize: 14,
            lineHeight: 20,
        },
        userMessageText: {
            color: '#FFFFFF',
        },
        botMessageText: {
            color: colors.text,
        },
        listenButton: {
            marginTop: 8,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 8,
            paddingVertical: 4,
        },
        typingIndicator: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 8,
        },
        typingDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.grayText,
            marginRight: 4,
        },
        inputSection: {
            flexDirection: 'row',
            paddingHorizontal: 12,
            paddingVertical: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            alignItems: 'center',
            gap: 8,
            backgroundColor: colors.cardBg,
        },
        inputField: {
            flex: 1,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
            fontSize: 14,
            color: colors.text,
            backgroundColor: colors.background,
        },
        sendButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
        },
        historyContainer: {
            flex: 1,
            padding: 12,
            backgroundColor: colors.background,
        },
        historyHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
        },
        historyTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
        },
        historyItem: {
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 8,
            backgroundColor: colors.cardBg,
        },
        historyItemActive: {
            borderColor: colors.primary,
            backgroundColor: isDarkMode ? colors.background : '#FFE0E0',
        },
        historyItemTitle: {
            fontSize: 13,
            fontWeight: '500',
            color: colors.text,
            marginBottom: 4,
        },
        historyItemMeta: {
            flexDirection: 'row',
            gap: 8,
        },
        historyItemMetaText: {
            fontSize: 11,
            color: colors.grayText,
        },
        emptyHistory: {
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 40,
        },
        emptyHistoryText: {
            fontSize: 14,
            color: colors.grayText,
            marginTop: 8,
        },
        headerIconButton: {
            width: 36,
            height: 36,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
        },
        badge: {
            position: 'absolute',
            top: -4,
            right: -4,
            backgroundColor: '#FFD700',
            borderRadius: 10,
            minWidth: 20,
            height: 20,
            justifyContent: 'center',
            alignItems: 'center',
        },
        badgeText: {
            fontSize: 10,
            fontWeight: '600',
            color: '#FF6B00',
        },
    });

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "👋 Hi! I'm your ProdAIctive Assistant. How can I help you today?",
            sender: 'bot',
            timestamp: new Date(),
        },
    ]);
    const [inputText, setInputText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [autoSpeak, setAutoSpeak] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(true);
    const scrollViewRef = useRef<ScrollView>(null);

    // Quick action options
    const quickActions = [
        { id: 'create', label: '📋 Create Task' },
        { id: 'help', label: '❓ Task Help' },
        { id: 'guide', label: '📖 App Guide' },
        { id: 'focus', label: '🍅 Focus Help' },
    ];

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat sessions from storage cache
  useEffect(() => {
    loadChatSessions();
    loadUserAndSessions();
  }, []);

  // Load user and sync sessions from Supabase
  const loadUserAndSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Sync from Supabase (will fail gracefully if tables don't exist)
        await syncChatSessionsFromSupabase(user.id);
      } else {
        console.log('No authenticated user found - chat will work locally only');
      }
    } catch (error) {
      console.log('Chat history sync skipped:', error instanceof Error ? error.message : 'Unknown error');
      // Continue without sync - local chat still works
    }
  };

  // Sync chat sessions from Supabase
  const syncChatSessionsFromSupabase = async (uid: string) => {
    try {
      const dbSessions = await getChatSessions(uid);
      
      // If no sessions found or empty array, just continue with local storage
      if (!dbSessions || dbSessions.length === 0) {
        console.log('No chat sessions in database - using local storage');
        return;
      }
      
      const formattedSessions: ChatSession[] = await Promise.all(
        dbSessions.map(async (session) => {
          try {
            const dbMessages = await getChatMessages(session.id);
            return {
              id: session.id,
              supabaseId: session.id,
              title: session.title,
              createdAt: new Date(session.created_at),
              lastUpdated: new Date(session.updated_at),
              messages: dbMessages.map((msg) => ({
                id: msg.id,
                text: msg.message_text,
                sender: msg.sender,
                timestamp: new Date(msg.created_at),
              })),
            };
          } catch (msgError) {
            console.log('Error loading messages for session:', session.id);
            // Return session with empty messages
            return {
              id: session.id,
              supabaseId: session.id,
              title: session.title,
              createdAt: new Date(session.created_at),
              lastUpdated: new Date(session.updated_at),
              messages: [],
            };
          }
        })
      );
      
      setChatSessions(formattedSessions);
      storageCache.set('prodaictive-chat-sessions', JSON.stringify(formattedSessions));
      console.log(`✅ Synced ${formattedSessions.length} chat sessions from Supabase`);
    } catch (error) {
      // Log but don't fail - chat still works locally
      console.log('Chat sync skipped (tables may not exist yet):', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Save current session when messages change
  useEffect(() => {
    if (messages.length > 1) {
      saveCurrentSession();
    }
  }, [messages]);

  const loadChatSessions = async () => {
    try {
      const savedSessions = storageCache.get('prodaictive-chat-sessions');
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        const sessions = parsed.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          lastUpdated: new Date(session.lastUpdated),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
        setChatSessions(sessions);
      }
    } catch (error) {
      console.log('Error loading chat sessions:', error);
    }
  };

  const saveCurrentSession = async () => {
    try {
      const sessionTitle = generateSessionTitle(messages);
      const session: ChatSession = {
        id: currentSessionId || Date.now().toString(),
        title: sessionTitle,
        messages: messages,
        createdAt:
          currentSessionId && chatSessions.find((s) => s.id === currentSessionId)
            ? chatSessions.find((s) => s.id === currentSessionId)!.createdAt
            : new Date(),
        lastUpdated: new Date(),
      };

      const updatedSessions = currentSessionId
        ? chatSessions.map((s) => (s.id === currentSessionId ? session : s))
        : [...chatSessions, session];

      setChatSessions(updatedSessions);

      storageCache.set('prodaictive-chat-sessions', JSON.stringify(updatedSessions));

      if (!currentSessionId) {
        setCurrentSessionId(session.id);
      }
    } catch (error) {
      console.log('Error saving chat session:', error);
    }
  };

  const generateSessionTitle = (msgs: Message[]) => {
    const userMessages = msgs.filter((m) => m.sender === 'user');
    if (userMessages.length === 0) return 'New Chat';

    const firstUserMsg = userMessages[0].text;
    return firstUserMsg.length > 30 ? firstUserMsg.substring(0, 30) + '...' : firstUserMsg;
  };

  const loadChatSession = (sessionId: string) => {
    const session = chatSessions.find((s) => s.id === sessionId);
    if (session) {
      setMessages(session.messages);
      setCurrentSessionId(sessionId);
      setCurrentSupabaseSessionId(session.supabaseId || sessionId);
      setShowHistory(false);
    }
  };

  const startNewChat = async () => {
    const welcomeMessage = "👋 Hi! I'm your ProdAIctive Assistant. How can I help you today?";
    setShowQuickActions(true);
    
    setMessages([
      {
        id: '1',
        text: welcomeMessage,
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
    setCurrentSessionId(null);
    setCurrentSupabaseSessionId(null);
    setShowHistory(false);
    
    // Create new session in Supabase when user sends first message
    // (handled in handleSendMessage)
  };

  const deleteChatSession = async (sessionId: string) => {
    const sessionToDelete = chatSessions.find((s) => s.id === sessionId);
    const updatedSessions = chatSessions.filter((s) => s.id !== sessionId);
    setChatSessions(updatedSessions);

    try {
      storageCache.set('prodaictive-chat-sessions', JSON.stringify(updatedSessions));
      
      // Delete from Supabase
      if (sessionToDelete?.supabaseId) {
        await deleteSessionFromDB(sessionToDelete.supabaseId);
      } else {
        // If no supabaseId, try using the session id directly
        await deleteSessionFromDB(sessionId);
      }
    } catch (error) {
      console.log('Error deleting chat session:', error);
    }

    if (currentSessionId === sessionId) {
      startNewChat();
    }
  };

  const exportChatHistory = async () => {
    try {
      const dataStr = JSON.stringify(chatSessions, null, 2);
      Alert.alert(
        'Export Chat History',
        'Your chat history has been copied. You can paste it into a text file to save it.',
        [
          {
            text: 'OK',
            onPress: () => console.log('Export confirmed'),
          },
        ]
      );
      console.log('Chat history:', dataStr);
    } catch (error) {
      Alert.alert('Error', 'Failed to export chat history');
    }
  };

  // Predefined responses for quick actions (no AI needed)
  const getQuickActionResponse = (actionId: string): string | null => {
    switch (actionId) {
      case 'create':
        return "📋 **Let's create a task!**\n\nPlease tell me:\n• Task title\n• Due date (e.g., tomorrow, Jan 15)\n• Time (e.g., 3pm)\n• Priority (High/Medium/Low)\n\nExample: \"Study math tomorrow at 3pm, high priority\"";
      case 'help':
        return "❓ **Task Help**\n\nCommon issues:\n\n**Can't find my tasks?**\n→ Go to Tasks tab, check filters\n\n**Task not saving?**\n→ Make sure all fields are filled\n\n**Want to edit a task?**\n→ Tap on any task to edit\n\n**Delete a task?**\n→ Swipe left on the task\n\nNeed more help? Just ask!";
      case 'focus':
        return "🍅 **Focus Timer Guide**\n\n1. Go to **Focus tab**\n2. Select a task to work on\n3. Set your focus time (default 25 min)\n4. Press **Start** and focus!\n5. Take a break when timer ends\n\n**Tips:**\n• Short breaks: 5 minutes\n• Long breaks: 15-30 minutes\n• Complete 4 sessions = 1 cycle";
      default:
        return null;
    }
  };

  // Handle quick action button press
  const handleQuickAction = async (actionId: string) => {
    setShowQuickActions(false);
    
    // Add user's selection as a message
    const actionLabels: Record<string, string> = {
      'create': 'I want to create a task',
      'help': 'I need help with tasks',
      'guide': 'Show me the app guide',
      'focus': 'Help with Focus timer',
    };
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: actionLabels[actionId] || actionId,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    
    // For 'guide', use Gemini AI
    if (actionId === 'guide') {
      setIsTyping(true);
      try {
        const aiResponse = await getGeminiResponse('Give me a complete guide on how to use ProdAIctive app', messages);
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: aiResponse,
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botResponse]);
      } catch (error) {
        const fallbackResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: "📖 **ProdAIctive Guide**\n\n**Dashboard** - See your daily overview\n**Tasks** - Create and manage tasks\n**Focus** - Pomodoro timer for productivity\n**Calendar** - Schedule events\n**Settings** - Customize the app\n\nTap any tab to explore!",
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, fallbackResponse]);
      }
      setIsTyping(false);
      return;
    }
    
    // For other actions, use predefined responses
    const response = getQuickActionResponse(actionId);
    if (response) {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    }
  };

  const getBotResponse = async (userMessage: string): Promise<string> => {
    try {
      // Call Gemini AI API with conversation context
      const response = await getGeminiResponse(userMessage, messages);
      return response;
    } catch (error) {
      console.error('Error calling Gemini AI API:', error);
      // Fallback to basic response if AI fails
      return "I'm having trouble connecting right now. Here's what you can do:\n\n📋 **Tasks** - Manage your to-do list\n🍅 **Focus** - Start a Pomodoro session\n📅 **Calendar** - View your schedule\n\nTry again or use the buttons above!";
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // Hide quick actions when user sends a message
    setShowQuickActions(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    const currentUserInput = inputText; // Store before clearing
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Try to save user message to Supabase (non-blocking)
    try {
      if (userId && currentSupabaseSessionId) {
        await saveChatMessage(userId, currentSupabaseSessionId, currentUserInput, 'user');
      } else if (userId && !currentSupabaseSessionId) {
        // Create new session in Supabase
        const newSession = await createChatSession(userId, currentUserInput.substring(0, 30));
        if (newSession) {
          setCurrentSupabaseSessionId(newSession.id);
          await saveChatMessage(userId, newSession.id, currentUserInput, 'user');
        }
      }
    } catch (saveError) {
      // Don't fail the chat - just log and continue
      console.log('Message saved locally (Supabase sync skipped)');
    }

    try {
      // Get AI response from Gemini
      const aiResponse = await getBotResponse(currentUserInput);
      
      // Check if AI wants to perform an action (task creation, etc.)
      const parsedAction = parseAIResponse(aiResponse);
      
      if (parsedAction?.action === 'create_task' && parsedAction.data?.task) {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const taskData = parsedAction.data.task;
          
          // Check for schedule conflicts BEFORE creating
          const conflicts = await checkScheduleConflicts({
            title: taskData.title,
            description: taskData.description || '',
            priority: taskData.priority || 'Medium',
            dueDate: taskData.dueDate,
            dueTime: taskData.dueTime || '23:59',
            subject: taskData.subject || 'General',
          }, user.id);
          
          // Create the task in database
          const createdTask = await createTaskFromAI({
            title: taskData.title,
            description: taskData.description || '',
            priority: taskData.priority || 'Medium',
            due_date: taskData.dueDate,
            due_time: taskData.dueTime || '23:59',
            subject: taskData.subject || 'General',
          }, user.id);
          
          if (createdTask) {
            let finalResponse = `✅ Task "${taskData.title}" created successfully!\n📅 Priority: ${taskData.priority}\n📌 Due: ${taskData.dueDate} at ${taskData.dueTime || '23:59'}`;
            
            // Add conflict warning if detected
            if (conflicts.hasConflict) {
              finalResponse += `\n\n${conflicts.recommendation}`;
            }
            
            const botResponse: Message = {
              id: (Date.now() + 1).toString(),
              text: finalResponse,
              sender: 'bot',
              timestamp: new Date(),
            };
            
            setMessages((prev) => [...prev, botResponse]);
            
            // Save bot response to Supabase (non-blocking)
            if (userId && currentSupabaseSessionId) {
              saveChatMessage(userId, currentSupabaseSessionId, finalResponse, 'bot').catch(() => {});
            }
          } else {
            const errorResponse: Message = {
              id: (Date.now() + 1).toString(),
              text: "I tried to create the task but encountered an error. Please try creating it manually in the Tasks tab.",
              sender: 'bot',
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorResponse]);
            
            if (userId && currentSupabaseSessionId) {
              saveChatMessage(userId, currentSupabaseSessionId, errorResponse.text, 'bot').catch(() => {});
            }
          }
        }
      } else {
        // Regular AI response (no task creation)
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: aiResponse,
          sender: 'bot',
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, botResponse]);
        
        // Save bot response to Supabase (non-blocking)
        if (userId && currentSupabaseSessionId) {
          saveChatMessage(userId, currentSupabaseSessionId, aiResponse, 'bot').catch(() => {});
        }
      }
      
      setIsTyping(false);

      if (autoSpeak) {
        await speakText(aiResponse);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      setIsTyping(false);
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error. Please try again.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    }
  };

  const speakText = async (text: string) => {
    try {
      // Stop any ongoing speech first
      await Speech.stop();
      
      // Speak the text
      await Speech.speak(text, {
        language: 'en',
        pitch: 1,
        rate: 0.9,
        onDone: () => {
          console.log('✅ Speech finished');
        },
        onError: (error: any) => {
          console.error('❌ Speech error:', error);
        },
      });
    } catch (error: any) {
      console.error('Error speaking text:', error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onToggle}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onToggle}
      />

      <View style={styles.container}>
        {/* Header */}
        <LinearGradient colors={['#FF5A5F', '#FF8085']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MessageCircle color="#FFFFFF" size={24} />
              <View>
                <Text style={styles.headerTitle}>ProdAIctive Assistant</Text>
                <Text style={styles.headerSubtitle}>Powered by Gemini AI</Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              {/* History Button */}
              <TouchableOpacity
                style={[styles.headerIconButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
                onPress={() => setShowHistory(!showHistory)}
              >
                <History color="#FFFFFF" size={18} />
                {chatSessions.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{chatSessions.length}</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Settings Button */}
              <TouchableOpacity
                style={[styles.headerIconButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
                onPress={() => setShowSettings(!showSettings)}
              >
                <Settings color="#FFFFFF" size={18} />
              </TouchableOpacity>

              {/* Close Button */}
              <TouchableOpacity
                style={[styles.headerIconButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
                onPress={onToggle}
              >
                <X color="#FFFFFF" size={18} />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Settings Menu */}
        {showSettings && (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderBottomWidth: 1,
              borderBottomColor: '#E0E0E0',
              paddingVertical: 8,
              paddingHorizontal: 12,
            }}
          >
            <TouchableOpacity
              style={{ paddingVertical: 8 }}
              onPress={() => {
                setAutoSpeak(!autoSpeak);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {autoSpeak ? <Volume color="#FF5A5F" size={18} /> : <VolumeX color="#A0A0A0" size={18} />}
                  <Text style={{ fontSize: 14, color: '#2D3436' }}>
                    {autoSpeak ? 'Disable' : 'Enable'} Auto-Speak
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#E0E0E0' }}
              onPress={startNewChat}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MessageCircle color="#FF5A5F" size={18} />
                <Text style={{ fontSize: 14, color: '#2D3436' }}>New Chat</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#E0E0E0' }}
              onPress={exportChatHistory}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Download color="#FF5A5F" size={18} />
                <Text style={{ fontSize: 14, color: '#2D3436' }}>Export History</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* History Sidebar */}
        {showHistory ? (
          <View style={styles.historyContainer}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Chat History</Text>
              <TouchableOpacity
                onPress={startNewChat}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#FF5A5F',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MessageCircle color="#FF5A5F" size={14} />
                  <Text style={{ fontSize: 12, color: '#FF5A5F', fontWeight: '600' }}>New</Text>
                </View>
              </TouchableOpacity>
            </View>

            {chatSessions.length === 0 ? (
              <View style={styles.emptyHistory}>
                <History color="rgba(160, 160, 160, 0.3)" size={48} />
                <Text style={styles.emptyHistoryText}>No chat history yet</Text>
              </View>
            ) : (
              <FlatList
                data={chatSessions}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item: session }) => (
                  <TouchableOpacity
                    onPress={() => loadChatSession(session.id)}
                    style={[
                      styles.historyItem,
                      currentSessionId === session.id && styles.historyItemActive,
                    ]}
                  >
                    <Text style={styles.historyItemTitle} numberOfLines={1}>
                      {session.title}
                    </Text>
                    <View style={styles.historyItemMeta}>
                      <Text style={styles.historyItemMetaText}>{formatDate(session.lastUpdated)}</Text>
                      <Text style={styles.historyItemMetaText}>•</Text>
                      <Text style={styles.historyItemMetaText}>{session.messages.length} messages</Text>
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        deleteChatSession(session.id);
                      }}
                      style={{ marginTop: 8 }}
                    >
                      <Trash2 color="#FF5A5F" size={16} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        ) : (
          <>
            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              showsVerticalScrollIndicator={true}
            >
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[styles.messageGroup, message.sender === 'user' && styles.userMessageGroup]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      message.sender === 'user' ? styles.userBubble : styles.botBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        message.sender === 'user' ? styles.userMessageText : styles.botMessageText,
                      ]}
                    >
                      {message.text}
                    </Text>
                    {message.sender === 'bot' && (
                      <TouchableOpacity
                        onPress={() => speakText(message.text)}
                        style={styles.listenButton}
                      >
                        <Volume2 color="#FF5A5F" size={14} />
                        <Text style={{ fontSize: 11, color: '#FF5A5F', marginLeft: 4 }}>Listen</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}

              {/* Quick Action Buttons */}
              {showQuickActions && messages.length <= 2 && (
                <View style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                }}>
                  {quickActions.map((action) => (
                    <TouchableOpacity
                      key={action.id}
                      onPress={() => handleQuickAction(action.id)}
                      style={{
                        backgroundColor: isDarkMode ? colors.cardBg : '#FFF5F5',
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: colors.primary,
                      }}
                    >
                      <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '500' }}>
                        {action.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Typing Indicator */}
              {isTyping && (
                <View style={[styles.messageGroup, { justifyContent: 'flex-start' }]}>
                  <View style={[styles.messageBubble, styles.botBubble]}>
                    <View style={styles.typingIndicator}>
                      <View style={styles.typingDot} />
                      <View style={styles.typingDot} />
                      <View style={styles.typingDot} />
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input */}
            <View style={styles.inputSection}>
              <TextInput
                style={styles.inputField}
                placeholder="Type your message..."
                placeholderTextColor="#A0A0A0"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity
                onPress={isListening ? () => setIsListening(false) : () => setIsListening(true)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {isListening ? (
                  <MicOff color="#FF5A5F" size={20} />
                ) : (
                  <Mic color="#A0A0A0" size={20} />
                )}
              </TouchableOpacity>
              <LinearGradient
                colors={['#FF5A5F', '#FF8085']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sendButton}
              >
                <TouchableOpacity
                  onPress={handleSendMessage}
                  disabled={!inputText.trim()}
                  style={{
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: inputText.trim() ? 1 : 0.5,
                  }}
                >
                  <Send color="#FFFFFF" size={20} />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}
