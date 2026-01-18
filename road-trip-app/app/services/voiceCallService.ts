import { webrtcService } from './webrtcService';
import { websocketService } from './websocketService';
import { useAppStore } from '../store/useAppStore';
import { VoiceCall } from '../types';

class VoiceCallService {
  private callDurationInterval: NodeJS.Timeout | null = null;
  private startTime: number = 0;

  async initiateCall(roomId: string) {
    try {
      const store = useAppStore.getState();
      const userId = store.user?.id;
      
      if (!userId) {
        throw new Error('User not logged in');
      }

      console.log('[VoiceCallService] 📞 Initiating call for room:', roomId);
      
      // Send initiate call event via WebSocket
      websocketService.initiateCall(roomId, userId);
      
      // Wait for incoming call event to get call_id, then initialize WebRTC
      // The call state will be set when the server responds with voice-call-incoming
    } catch (error) {
      console.error('[VoiceCallService] ❌ Error initiating call:', error);
      throw error;
    }
  }

  async acceptCall(call: VoiceCall) {
    try {
      const store = useAppStore.getState();
      const userId = store.user?.id;
      
      if (!userId) {
        throw new Error('User not logged in');
      }

      console.log('[VoiceCallService] ✅ Accepting call:', call.id);
      
      // Send accept call event via WebSocket
      websocketService.acceptCall(call.id, userId);
      
      // Initialize WebRTC
      const peerConnection = await webrtcService.initializePeerConnection(call.id);
      
      // Get local stream
      await webrtcService.getLocalStream();
      
      // Wait for offer from initiator, then create answer
      // The offer will come via WebSocket event, handled in handleOffer
      
      // Update store to mark call as accepted (will be set by WebSocket handler)
      // store.setCallAccepted will be called when voice-call-accepted event is received
      
      // Start call duration timer
      this.startCallTimer();
      
      console.log('[VoiceCallService] ✅ Call accepted, waiting for offer');
    } catch (error) {
      console.error('[VoiceCallService] ❌ Error accepting call:', error);
      throw error;
    }
  }

  async handleOffer(call: VoiceCall, offer: string) {
    try {
      console.log('[VoiceCallService] 📥 Received offer for call:', call.id);
      
      // Initialize WebRTC if not already initialized (for non-initiator)
      let peerConnection = webrtcService['peerConnection'];
      if (!peerConnection) {
        await webrtcService.initializePeerConnection(call.id);
      }
      
      // Set remote description
      await webrtcService.setRemoteDescription(offer, 'offer');
      
      // Get local stream if not already got
      if (!webrtcService['localStream']) {
        await webrtcService.getLocalStream();
      }
      
      // Create answer
      const answer = await webrtcService.createAnswer();
      
      // Send answer
      websocketService.sendAnswer(call.id, answer);
      
      console.log('[VoiceCallService] ✅ Answer sent for call:', call.id);
    } catch (error) {
      console.error('[VoiceCallService] ❌ Error handling offer:', error);
      throw error;
    }
  }

  async createOfferForCall(call: VoiceCall) {
    try {
      console.log('[VoiceCallService] 📤 Creating offer for call:', call.id);
      
      // Initialize WebRTC
      await webrtcService.initializePeerConnection(call.id);
      
      // Get local stream
      await webrtcService.getLocalStream();
      
      // Create offer
      const offer = await webrtcService.createOffer();
      
      // Send offer via signaling
      websocketService.sendOffer(call.id, offer);
      
      console.log('[VoiceCallService] ✅ Offer sent for call:', call.id);
    } catch (error) {
      console.error('[VoiceCallService] ❌ Error creating offer:', error);
      throw error;
    }
  }

  async handleAnswer(call: VoiceCall, answer: string) {
    try {
      console.log('[VoiceCallService] 📥 Received answer for call:', call.id);
      await webrtcService.setRemoteDescription(answer, 'answer');
      console.log('[VoiceCallService] ✅ Answer handled for call:', call.id);
    } catch (error) {
      console.error('[VoiceCallService] ❌ Error handling answer:', error);
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
    const store = useAppStore.getState();
    const userId = store.user?.id;
    
    if (!userId) {
      console.error('[VoiceCallService] ❌ User not logged in');
      return;
    }

    console.log('[VoiceCallService] ❌ Rejecting call:', call.id);
    websocketService.rejectCall(call.id, userId);
    store.setCallRejected();
  }

  async endCall(call: VoiceCall) {
    try {
      const store = useAppStore.getState();
      const userId = store.user?.id;
      
      if (!userId) {
        throw new Error('User not logged in');
      }

      console.log('[VoiceCallService] 📞 Ending call:', call.id);
      websocketService.endCall(call.id, userId);
      webrtcService.cleanup();
      this.stopCallTimer();
      store.endCall();
      console.log('[VoiceCallService] ✅ Call ended');
    } catch (error) {
      console.error('[VoiceCallService] ❌ Error ending call:', error);
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
