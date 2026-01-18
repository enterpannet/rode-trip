import { webrtcService } from './webrtcService';
import { websocketService } from './websocketService';
import { useAppStore } from '../store/useAppStore';
import { VoiceCall } from '../types';

class VoiceCallService {
  private callDurationInterval: NodeJS.Timeout | null = null;
  private startTime: number = 0;

  async initiateCall(roomId: string) {
    try {
      websocketService.initiateCall(roomId);
      // The call state will be set when the server responds
    } catch (error) {
      console.error('Error initiating call:', error);
      throw error;
    }
  }

  async acceptCall(call: VoiceCall) {
    try {
      const store = useAppStore.getState();
      
      // Initialize WebRTC
      const peerConnection = await webrtcService.initializePeerConnection(call.id);
      
      // Get local stream
      await webrtcService.getLocalStream();
      
      // Create answer
      const answer = await webrtcService.createAnswer();
      
      // Send answer via signaling
      websocketService.sendAnswer(call.id, answer);
      
      // Update store
      store.setCallAccepted(call);
      
      // Start call duration timer
      this.startCallTimer();
      
      console.log('Call accepted');
    } catch (error) {
      console.error('Error accepting call:', error);
      throw error;
    }
  }

  async handleOffer(call: VoiceCall, offer: string) {
    try {
      const peerConnection = await webrtcService.initializePeerConnection(call.id);
      
      // Set remote description
      await webrtcService.setRemoteDescription(offer, 'offer');
      
      // Get local stream
      await webrtcService.getLocalStream();
      
      // Create answer
      const answer = await webrtcService.createAnswer();
      
      // Send answer
      websocketService.sendAnswer(call.id, answer);
      
      console.log('Call offer handled');
    } catch (error) {
      console.error('Error handling offer:', error);
      throw error;
    }
  }

  async handleAnswer(call: VoiceCall, answer: string) {
    try {
      await webrtcService.setRemoteDescription(answer, 'answer');
      console.log('Call answer handled');
    } catch (error) {
      console.error('Error handling answer:', error);
      throw error;
    }
  }

  async handleIceCandidate(call: VoiceCall, candidate: string) {
    try {
      await webrtcService.addIceCandidate(candidate);
      console.log('ICE candidate handled');
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
      throw error;
    }
  }

  rejectCall(call: VoiceCall) {
    websocketService.rejectCall(call.id);
    useAppStore.getState().setCallRejected();
  }

  async endCall(call: VoiceCall) {
    try {
      websocketService.endCall(call.id);
      webrtcService.cleanup();
      this.stopCallTimer();
      useAppStore.getState().endCall();
      console.log('Call ended');
    } catch (error) {
      console.error('Error ending call:', error);
      throw error;
    }
  }

  mute() {
    webrtcService.muteAudio();
  }

  unmute() {
    webrtcService.unmuteAudio();
  }

  private startCallTimer() {
    this.startTime = Date.now();
    this.callDurationInterval = setInterval(() => {
      const duration = Math.floor((Date.now() - this.startTime) / 1000);
      const store = useAppStore.getState();
      if (store.callState) {
        store.setCallState({
          ...store.callState,
          callDuration: duration,
        });
      }
    }, 1000);
  }

  private stopCallTimer() {
    if (this.callDurationInterval) {
      clearInterval(this.callDurationInterval);
      this.callDurationInterval = null;
    }
    this.startTime = 0;
  }
}

export const voiceCallService = new VoiceCallService();
