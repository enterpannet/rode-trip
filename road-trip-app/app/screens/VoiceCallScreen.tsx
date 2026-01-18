import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { voiceCallService } from '../services/voiceCallService';
import { VoiceCall } from '../types';

interface VoiceCallScreenProps {
  navigation: any;
  route: {
    params?: {
      call?: any;
    };
  };
}

export const VoiceCallScreen: React.FC<VoiceCallScreenProps> = ({ navigation, route }) => {
  const callState = useAppStore((state) => state.callState);
  const user = useAppStore((state) => state.user);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (!callState) {
      navigation.goBack();
    }
  }, [callState, navigation]);

  if (!callState || !callState.call) {
    return null;
  }

  const { call, isIncoming, isActive, callDuration } = callState;
  const isInitiator = call.initiator_id === user?.id;

  const handleAccept = async () => {
    try {
      await voiceCallService.acceptCall(call);
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  };

  const handleReject = () => {
    voiceCallService.rejectCall(call);
    navigation.goBack();
  };

  const handleEnd = async () => {
    try {
      await voiceCallService.endCall(call);
      navigation.goBack();
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  const handleMute = () => {
    if (muted) {
      voiceCallService.unmute();
    } else {
      voiceCallService.mute();
    }
    setMuted(!muted);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.callerName}>
        {isInitiator ? 'Calling...' : 'Incoming Call'}
      </Text>

      {isActive && (
        <Text style={styles.duration}>{formatDuration(callDuration)}</Text>
      )}

      {isIncoming && !isActive && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.acceptButton]}
            onPress={handleAccept}
          >
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={handleReject}
          >
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      {isActive && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.muteButton, muted && styles.muteButtonActive]}
            onPress={handleMute}
          >
            <Text style={styles.buttonText}>{muted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.endButton]}
            onPress={handleEnd}
          >
            <Text style={styles.buttonText}>End Call</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  duration: {
    fontSize: 20,
    color: '#FFF',
    marginBottom: 32,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 32,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    minWidth: 120,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  endButton: {
    backgroundColor: '#FF3B30',
  },
  muteButton: {
    backgroundColor: '#6C757D',
  },
  muteButtonActive: {
    backgroundColor: '#DC3545',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
