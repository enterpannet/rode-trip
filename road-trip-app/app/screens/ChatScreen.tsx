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
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { apiService } from '../services/api';
import { websocketService } from '../services/websocketService';
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

    return () => {
      websocketService.leaveRoom(room.id);
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

  const handleSend = async () => {
    if (!message.trim()) return;

    const messageText = message.trim();
    setMessage('');

    try {
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
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        inverted
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? <Text style={styles.loadingText}>Loading...</Text> : null
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={500}
          placeholderTextColor="#999"
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
  messagesList: {
    padding: 16,
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
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
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
