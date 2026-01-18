import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { apiService } from '../services/api';
import { websocketService } from '../services/websocketService';
import { Room } from '../types';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [createRoomName, setCreateRoomName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const user = useAppStore((state) => state.user);
  const rooms = useAppStore((state) => state.rooms);
  const setRooms = useAppStore((state) => state.setRooms);
  const setLoading = useAppStore((state) => state.setLoading);
  const setError = useAppStore((state) => state.setError);
  const addRoom = useAppStore((state) => state.addRoom);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const userRooms = await apiService.getRooms();
      setRooms(userRooms);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to load rooms';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRooms();
    setRefreshing(false);
  };

  const handleCreateRoom = async () => {
    if (!createRoomName.trim()) return;

    try {
      setLoading(true);
      const newRoom = await apiService.createRoom(createRoomName.trim());
      addRoom(newRoom);
      setShowCreateModal(false);
      setCreateRoomName('');
      navigation.navigate('Map', { room: newRoom });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to create room';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinRoomId.trim()) return;

    try {
      setLoading(true);
      await apiService.joinRoom(joinRoomId.trim());
      await loadRooms();
      setShowJoinModal(false);
      setJoinRoomId('');
      Alert.alert('Success', 'Joined room successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to join room';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRoomPress = (room: Room) => {
    navigation.navigate('Map', { room });
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
      useAppStore.getState().reset();
      websocketService.disconnect();
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderRoomItem = ({ item }: { item: Room }) => (
    <TouchableOpacity
      style={styles.roomItem}
      onPress={() => handleRoomPress(item)}
    >
      <Text style={styles.roomName}>{item.name}</Text>
      {item.description && (
        <Text style={styles.roomDescription}>{item.description}</Text>
      )}
      <Text style={styles.roomDate}>
        Created: {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {user?.name}!</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.createButton]}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.actionButtonText}>Create Room</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.joinButton]}
          onPress={() => setShowJoinModal(true)}
        >
          <Text style={styles.actionButtonText}>Join Room</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Your Rooms</Text>

      <FlatList
        data={rooms}
        renderItem={renderRoomItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No rooms yet. Create or join a room to get started!
          </Text>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* Create Room Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Room</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter room name"
              value={createRoomName}
              onChangeText={setCreateRoomName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirm]}
                onPress={handleCreateRoom}
              >
                <Text style={styles.modalConfirmText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join Room Modal */}
      <Modal
        visible={showJoinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join Room</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter room ID"
              value={joinRoomId}
              onChangeText={setJoinRoomId}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setShowJoinModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirm]}
                onPress={handleJoinRoom}
              >
                <Text style={styles.modalConfirmText}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  logoutText: {
    fontSize: 16,
    color: '#007AFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  createButton: {
    backgroundColor: '#007AFF',
  },
  joinButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 12,
    color: '#333',
  },
  listContent: {
    padding: 16,
  },
  roomItem: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roomName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  roomDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  roomDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 32,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  modalCancel: {
    backgroundColor: '#E0E0E0',
  },
  modalCancelText: {
    color: '#333',
    fontWeight: '600',
  },
  modalConfirm: {
    backgroundColor: '#007AFF',
  },
  modalConfirmText: {
    color: '#FFF',
    fontWeight: '600',
  },
});
