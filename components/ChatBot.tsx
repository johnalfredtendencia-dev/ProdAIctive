import { LinearGradient } from 'expo-linear-gradient';
import { Download, History, MessageCircle, Mic, MicOff, Send, Settings, Trash2, Volume, Volume2, VolumeX, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
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

// Simple storage using state - data persists during app session
const storageCache = new Map<string, string>();

interface Message {
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
}

interface ChatBotProps {
  isOpen: boolean;
  onToggle: () => void;
}

const { width, height } = Dimensions.get('window');

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
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#E0E0E0',
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
    backgroundColor: '#FF5A5F',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  botMessageText: {
    color: '#2D3436',
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
    backgroundColor: '#A0A0A0',
    marginRight: 4,
  },
  inputSection: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
    gap: 8,
  },
  inputField: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2D3436',
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
    color: '#2D3436',
  },
  historyItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 8,
  },
  historyItemActive: {
    borderColor: '#FF5A5F',
    backgroundColor: '#FFE0E0',
  },
  historyItemTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2D3436',
    marginBottom: 4,
  },
  historyItemMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  historyItemMetaText: {
    fontSize: 11,
    color: '#A0A0A0',
  },
  emptyHistory: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#A0A0A0',
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

export function ChatBot({ isOpen, onToggle }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your ProdAIctive assistant. I can help you manage tasks, schedule events, start focus sessions, and answer questions about your studies. How can I help you today?",
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
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

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
  }, []);

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
      setShowHistory(false);
    }
  };

  const startNewChat = () => {
    setMessages([
      {
        id: '1',
        text: "Hi! I'm your ProdAIctive assistant. I can help you manage tasks, schedule events, start focus sessions, and answer questions about your studies. How can I help you today?",
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
    setCurrentSessionId(null);
    setShowHistory(false);
  };

  const deleteChatSession = async (sessionId: string) => {
    const updatedSessions = chatSessions.filter((s) => s.id !== sessionId);
    setChatSessions(updatedSessions);

    try {
      storageCache.set('prodaictive-chat-sessions', JSON.stringify(updatedSessions));
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

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (
      lowerMessage.includes('pomodoro') ||
      lowerMessage.includes('focus') ||
      lowerMessage.includes('timer')
    ) {
      return "Perfect! The Pomodoro Technique is great for productivity! I recommend starting with 25-minute focus sessions followed by 5-minute breaks. Try the Focus tab to start a session. Would you like tips on how to make the most of your focus time?";
    } else if (lowerMessage.includes('task') || lowerMessage.includes('assignment')) {
      return "I can help you create and manage tasks! Would you like me to add a new task to your list? Just tell me the details and I'll set it up for you.";
    } else if (lowerMessage.includes('schedule') || lowerMessage.includes('calendar')) {
      return "Let me help you with scheduling! I can add events to your calendar, check your availability, or remind you about upcoming deadlines. What would you like to schedule?";
    } else if (lowerMessage.includes('study') || lowerMessage.includes('exam')) {
      return "Great! I can help you create a study plan, set study reminders, or organize your study materials. Consider using the Pomodoro timer for focused study sessions. What subject are you working on?";
    } else if (lowerMessage.includes('break') || lowerMessage.includes('tired')) {
      return "Taking breaks is crucial for productivity! The Pomodoro technique includes regular breaks. Try a 5-minute break after 25 minutes of work, or a longer 15-minute break after 4 sessions. Want me to remind you when to take breaks?";
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hello! I'm here to help you stay organized with your studies. You can ask me to create tasks, schedule study sessions, start a Pomodoro timer, or get study tips!";
    } else {
      return 'I understand! Let me help you with that. I can assist with task management, scheduling, Pomodoro focus sessions, study planning, and answering questions about your coursework.';
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(inputText),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);

      if (autoSpeak) {
        speakText(botResponse.text);
      }
    }, 1500);
  };

  const speakText = (text: string) => {
    // Use React Native's Speak API if available via expo-speech
    // For now, this is a placeholder
    console.log('Speaking:', text);
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
                <Text style={styles.headerSubtitle}>Always here to help</Text>
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
