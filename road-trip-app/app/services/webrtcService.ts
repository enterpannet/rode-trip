import { websocketService } from './websocketService';

// Lazy import WebRTC to avoid loading issues
let RTCPeerConnection: any;
let RTCSessionDescription: any;
let RTCIceCandidate: any;
let MediaStream: any;
let mediaDevices: any;

const loadWebRTC = async () => {
  if (!RTCPeerConnection) {
    try {
      const webrtc = await import('react-native-webrtc');
      RTCPeerConnection = webrtc.RTCPeerConnection;
      RTCSessionDescription = webrtc.RTCSessionDescription;
      RTCIceCandidate = webrtc.RTCIceCandidate;
      MediaStream = webrtc.MediaStream;
      mediaDevices = webrtc.mediaDevices;
    } catch (error) {
      console.error('Failed to load WebRTC module:', error);
      throw new Error('WebRTC is not available. This feature requires a development build or native app.');
    }
  }
};

class WebRTCService {
  private peerConnection: any = null;
  private localStream: any = null;
  private remoteStream: any = null;
  private callId: string | null = null;

  async initializePeerConnection(callId: string): Promise<any> {
    await loadWebRTC();
    
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    this.peerConnection = new RTCPeerConnection(configuration);
    this.callId = callId;

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.callId) {
        websocketService.sendIceCandidate(
          this.callId,
          JSON.stringify(event.candidate)
        );
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        // Update store or trigger callback
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState);
      if (this.peerConnection?.connectionState === 'failed') {
        this.cleanup();
      }
    };

    return this.peerConnection;
  }

  async createOffer(): Promise<string> {
    await loadWebRTC();
    
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false,
    });

    await this.peerConnection.setLocalDescription(offer);
    return JSON.stringify(offer);
  }

  async setRemoteDescription(sdp: string, type: 'offer' | 'answer') {
    await loadWebRTC();
    
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    const sessionDescription = new RTCSessionDescription({
      type,
      sdp,
    });

    await this.peerConnection.setRemoteDescription(sessionDescription);
  }

  async createAnswer(): Promise<string> {
    await loadWebRTC();
    
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return JSON.stringify(answer);
  }

  async addIceCandidate(candidate: string) {
    await loadWebRTC();
    
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    const iceCandidate = new RTCIceCandidate(JSON.parse(candidate));
    await this.peerConnection.addIceCandidate(iceCandidate);
  }

  async getLocalStream(): Promise<any> {
    try {
      await loadWebRTC();
      
      if (!mediaDevices || !mediaDevices.getUserMedia) {
        throw new Error('WebRTC mediaDevices not available');
      }
      
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      this.localStream = stream;

      // Add tracks to peer connection
      if (this.peerConnection) {
        stream.getTracks().forEach((track) => {
          this.peerConnection?.addTrack(track, stream);
        });
      }

      return stream;
    } catch (error) {
      console.error('Error getting local stream:', error);
      throw error;
    }
  }

  getRemoteStream(): any {
    return this.remoteStream;
  }

  muteAudio() {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
    }
  }

  unmuteAudio() {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
    }
  }

  cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.remoteStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.callId = null;
  }
}

export const webrtcService = new WebRTCService();
