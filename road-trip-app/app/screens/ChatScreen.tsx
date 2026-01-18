import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { apiService } from '../services/api';
import { websocketService } from '../services/websocketService';
import { voiceCallService } from '../services/voiceCallService';
import { Message, Room } from '../types';

interface ChatScreenProps {
  navigation: any;
  route: {
    params: {
      room: Room;
    };
  };
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }) => {
  const { room } = route.params;
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const insets = useSafeAreaInsets();

  const messages = useAppStore((state) =>
    state.messages.filter((msg) => msg.room_id === room.id).sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  );
  const setMessages = useAppStore((state) => state.setMessages);
  const addMessage = useAppStore((state) => state.addMessage);
  const user = useAppStore((state) => state.user);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
    
    // Join room WebSocket for real-time messages
    websocketService.joinRoom(room.id);

    // Handle keyboard events
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        // Scroll to bottom when keyboard appears
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 100);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        // Optional: scroll when keyboard hides
      }
    );

    return () => {
      websocketService.leaveRoom(room.id);
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [room.id]);

  const loadMessages = async (pageNum: number = 0) => {
    try {
      if (pageNum === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await apiService.getMessages(room.id, pageNum, 20);
      const currentMessages = useAppStore.getState().messages.filter((msg) => msg.room_id === room.id);
      
      if (pageNum === 0) {
        setMessages(response.messages || []);
      } else {
        setMessages([...currentMessages, ...(response.messages || [])]);
      }

      setHasMore(response.total_pages > pageNum + 1);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleCall = async () => {
    try {
      await voiceCallService.initiateCall(room.id);
      // Navigate to voice call screen
      navigation.navigate('VoiceCall');
    } catch (error) {
      console.error('Error initiating call:', error);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    const messageText = message.trim();
    setMessage('');

    // Optimistically add message
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      room_id: room.id,
      user_id: user?.id || '',
      text: messageText,
      message_type: 'text',
      created_at: new Date().toISOString(),
    };
    addMessage(tempMessage);

    try {
      // Send to backend
      const sentMessage = await apiService.sendMessage(room.id, messageText);
      
      // Replace temp message with real one
      const currentMessages = useAppStore.getState().messages.filter((msg) => msg.room_id === room.id);
      setMessages(
        currentMessages.map((msg) => (msg.id === tempMessage.id ? sentMessage : msg))
      );

      // Also send via WebSocket for real-time
      websocketService.sendMessage(room.id, messageText);
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      const currentMessages = useAppStore.getState().messages.filter((msg) => msg.room_id === room.id);
      setMessages(currentMessages.filter((msg) => msg.id !== tempMessage.id));
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadMessages(page + 1);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.user_id === user?.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwn ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <Text style={[styles.messageText, isOwn ? styles.ownMessageText : styles.otherMessageText]}>
          {item.text}
        </Text>
        <Text style={[styles.messageTime, isOwn ? styles.ownMessageTime : styles.otherMessageTime]}>
          {new Date(item.created_at).toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        style={styles.flatList}
        inverted
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        ListFooterComponent={
          loadingMore ? <Text style={styles.loadingText}>Loading...</Text> : null
        }
      />

      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={styles.callButton}
          onPress={handleCall}
        >
          <Text style={styles.callButtonText}>📞</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={500}
          placeholderTextColor="#999"
          textAlignVertical="center"
        />
        <TouchableOpacity
          style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!message.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  flatList: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0E0E0',
  },
  messageText: {
    fontSize: 16,
  },
  ownMessageText: {
    color: '#FFF',
  },
  otherMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
    minHeight: 60,
  },
  callButton: {
    backgroundColor: '#34C759',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  callButtonText: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    marginRight: 8,
    maxHeight: 100,
    minHeight: 40,
    fontSize: 16,
    includeFontPadding: false,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  sendButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    padding: 8,
    color: '#666',
  },
});
