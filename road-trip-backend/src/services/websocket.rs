use axum::{
    extract::{
        ws::{Message, WebSocket},
        Query, State, WebSocketUpgrade,
    },
    response::Response,
};
use futures::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};
use uuid::Uuid;
use anyhow::Result;

use crate::routes::AppState;
use crate::services::voice_call_signaling::VoiceCallSignalingService;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum WebSocketEvent {
    #[serde(rename = "join-room")]
    JoinRoom { room_id: Uuid },
    #[serde(rename = "leave-room")]
    LeaveRoom { room_id: Uuid },
    #[serde(rename = "location-update")]
    LocationUpdate {
        room_id: Uuid,
        user_id: Uuid,
        latitude: f64,
        longitude: f64,
    },
    #[serde(rename = "new-message")]
    NewMessage {
        room_id: Uuid,
        message_id: Uuid,
        user_id: Uuid,
        text: Option<String>,
        image_url: Option<String>,
        message_type: String,
    },
    #[serde(rename = "user-joined")]
    UserJoined { room_id: Uuid, user_id: Uuid },
    #[serde(rename = "user-left")]
    UserLeft { room_id: Uuid, user_id: Uuid },
    #[serde(rename = "typing")]
    Typing { room_id: Uuid, user_id: Uuid },
    #[serde(rename = "user-typing")]
    UserTyping { room_id: Uuid, user_id: Uuid },
    // Voice call events
    #[serde(rename = "voice-call-initiate")]
    VoiceCallInitiate { room_id: Uuid, initiator_id: Uuid },
    #[serde(rename = "voice-call-accept")]
    VoiceCallAccept { call_id: Uuid, user_id: Uuid },
    #[serde(rename = "voice-call-reject")]
    VoiceCallReject { call_id: Uuid, user_id: Uuid },
    #[serde(rename = "voice-call-end")]
    VoiceCallEnd { call_id: Uuid, user_id: Uuid },
    #[serde(rename = "voice-offer")]
    VoiceOffer { call_id: Uuid, offer: String },
    #[serde(rename = "voice-answer")]
    VoiceAnswer { call_id: Uuid, answer: String },
    #[serde(rename = "ice-candidate")]
    IceCandidate { call_id: Uuid, candidate: String },
    // Voice call response events
    #[serde(rename = "voice-call-incoming")]
    VoiceCallIncoming {
        call_id: Uuid,
        room_id: Uuid,
        initiator_id: Uuid,
    },
    #[serde(rename = "voice-call-accepted")]
    VoiceCallAccepted {
        call_id: Uuid,
        room_id: Uuid,
        user_id: Uuid,
    },
    #[serde(rename = "voice-call-rejected")]
    VoiceCallRejected {
        call_id: Uuid,
        room_id: Uuid,
        user_id: Uuid,
    },
    #[serde(rename = "voice-call-ended")]
    VoiceCallEnded {
        call_id: Uuid,
        room_id: Uuid,
        user_id: Uuid,
    },
}

type RoomBroadcaster = Arc<RwLock<HashMap<Uuid, broadcast::Sender<String>>>>;

pub struct WebSocketService {
    room_broadcasters: RoomBroadcaster,
}

impl WebSocketService {
    pub fn new() -> Self {
        Self {
            room_broadcasters: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn get_or_create_room_sender(&self, room_id: Uuid) -> broadcast::Sender<String> {
        let broadcasters = self.room_broadcasters.read().await;
        if let Some(sender) = broadcasters.get(&room_id) {
            return sender.clone();
        }
        drop(broadcasters);

        let mut broadcasters = self.room_broadcasters.write().await;
        let (tx, _rx) = broadcast::channel(100);
        broadcasters.insert(room_id, tx.clone());
        tx
    }

    pub async fn broadcast_to_room(&self, room_id: Uuid, event: WebSocketEvent) -> Result<()> {
        let sender = {
            let broadcasters = self.room_broadcasters.read().await;
            broadcasters.get(&room_id).cloned()
        };

        if let Some(sender) = sender {
            let message = serde_json::to_string(&event)?;
            let _ = sender.send(message);
        }

        Ok(())
    }

    pub async fn remove_room(&self, room_id: Uuid) {
        let mut broadcasters = self.room_broadcasters.write().await;
        broadcasters.remove(&room_id);
    }
}

pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    Query(params): Query<HashMap<String, String>>,
    State(app_state): State<AppState>,
) -> Response {
    // Extract session token from query params
    let session_token = params.get("token").cloned();
    ws.on_upgrade(move |socket| handle_socket(socket, app_state, session_token))
}

async fn handle_socket(socket: WebSocket, app_state: AppState, session_token: Option<String>) {
    let (mut sender, mut receiver) = socket.split();
    let room_receivers: Arc<RwLock<HashMap<Uuid, broadcast::Receiver<String>>>> = Arc::new(RwLock::new(HashMap::new()));
    let ws_service = app_state.websocket_service.clone();
    let room_receivers_rx = room_receivers.clone();
    let db = app_state.db.clone();
    let auth_service = app_state.auth_service.clone();
    
    // Create voice call signaling service
    let voice_call_service = VoiceCallSignalingService::new((*db).clone());

    // Authenticate user from session token
    let user_id = if let Some(token) = session_token {
        match auth_service.validate_session(&token).await {
            Ok(user) => {
                eprintln!("WebSocket authenticated user: {}", user.id);
                user.id
            }
            Err(e) => {
                eprintln!("WebSocket authentication failed: {}", e);
                // Close connection if authentication fails
                let _ = sender.close().await;
                return;
            }
        }
    } else {
        eprintln!("WebSocket connection without session token - closing");
        // Close connection if no token provided
        let _ = sender.close().await;
        return;
    };
    
    let user_id_clone = user_id;

    let rx_task = tokio::spawn(async move {
        while let Some(msg) = receiver.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    if let Ok(event) = serde_json::from_str::<WebSocketEvent>(&text) {
                        match event {
                            WebSocketEvent::JoinRoom { room_id } => {
                                let tx = ws_service.get_or_create_room_sender(room_id).await;
                                let rx = tx.subscribe();
                                room_receivers_rx.write().await.insert(room_id, rx);
                                
                                // Notify room members
                                let _ = ws_service.broadcast_to_room(room_id, WebSocketEvent::UserJoined {
                                    room_id,
                                    user_id: user_id_clone,
                                }).await;
                            }
                            WebSocketEvent::LeaveRoom { room_id } => {
                                room_receivers_rx.write().await.remove(&room_id);
                                
                                // Notify room members
                                let _ = ws_service.broadcast_to_room(room_id, WebSocketEvent::UserLeft {
                                    room_id,
                                    user_id: user_id_clone,
                                }).await;
                            }
                            WebSocketEvent::VoiceCallInitiate { room_id, initiator_id } => {
                                // Verify that initiator_id matches authenticated user
                                if initiator_id != user_id_clone {
                                    eprintln!("VoiceCallInitiate: initiator_id mismatch. Expected: {}, Got: {}", user_id_clone, initiator_id);
                                    continue;
                                }
                                
                                // Create call in database
                                match voice_call_service.initiate_call(room_id, initiator_id).await {
                                    Ok(call) => {
                                        // Broadcast to all room members except initiator
                                        let _ = ws_service.broadcast_to_room(room_id, WebSocketEvent::VoiceCallIncoming {
                                            call_id: call.id,
                                            room_id,
                                            initiator_id,
                                        }).await;
                                    }
                                    Err(e) => {
                                        eprintln!("Error initiating call: {}", e);
                                    }
                                }
                            }
                            WebSocketEvent::VoiceCallAccept { call_id, user_id } => {
                                // Verify that user_id matches authenticated user
                                if user_id != user_id_clone {
                                    eprintln!("VoiceCallAccept: user_id mismatch. Expected: {}, Got: {}", user_id_clone, user_id);
                                    continue;
                                }
                                
                                match voice_call_service.accept_call(call_id).await {
                                    Ok(call) => {
                                        // Broadcast to room members
                                        let _ = ws_service.broadcast_to_room(call.room_id, WebSocketEvent::VoiceCallAccepted {
                                            call_id: call.id,
                                            room_id: call.room_id,
                                            user_id,
                                        }).await;
                                    }
                                    Err(e) => {
                                        eprintln!("Error accepting call: {}", e);
                                    }
                                }
                            }
                            WebSocketEvent::VoiceCallReject { call_id, user_id } => {
                                // Verify that user_id matches authenticated user
                                if user_id != user_id_clone {
                                    eprintln!("VoiceCallReject: user_id mismatch. Expected: {}, Got: {}", user_id_clone, user_id);
                                    continue;
                                }
                                
                                match voice_call_service.get_call(call_id).await {
                                    Ok(call) => {
                                        let _ = voice_call_service.reject_call(call_id).await;
                                        // Broadcast to room members
                                        let _ = ws_service.broadcast_to_room(call.room_id, WebSocketEvent::VoiceCallRejected {
                                            call_id,
                                            room_id: call.room_id,
                                            user_id,
                                        }).await;
                                    }
                                    Err(e) => {
                                        eprintln!("Error rejecting call: {}", e);
                                    }
                                }
                            }
                            WebSocketEvent::VoiceCallEnd { call_id, user_id } => {
                                // Verify that user_id matches authenticated user
                                if user_id != user_id_clone {
                                    eprintln!("VoiceCallEnd: user_id mismatch. Expected: {}, Got: {}", user_id_clone, user_id);
                                    continue;
                                }
                                
                                match voice_call_service.get_call(call_id).await {
                                    Ok(call) => {
                                        let _ = voice_call_service.end_call(call_id).await;
                                        // Broadcast to room members
                                        let _ = ws_service.broadcast_to_room(call.room_id, WebSocketEvent::VoiceCallEnded {
                                            call_id,
                                            room_id: call.room_id,
                                            user_id,
                                        }).await;
                                    }
                                    Err(e) => {
                                        eprintln!("Error ending call: {}", e);
                                    }
                                }
                            }
                            // WebRTC signaling - forward to room members
                            WebSocketEvent::VoiceOffer { call_id, offer } => {
                                // Get room_id from call
                                if let Ok(call) = voice_call_service.get_call(call_id).await {
                                    // Broadcast signaling message to room
                                    let _ = ws_service.broadcast_to_room(call.room_id, WebSocketEvent::VoiceOffer {
                                        call_id,
                                        offer,
                                    }).await;
                                }
                            }
                            WebSocketEvent::VoiceAnswer { call_id, answer } => {
                                // Get room_id from call
                                if let Ok(call) = voice_call_service.get_call(call_id).await {
                                    // Broadcast signaling message to room
                                    let _ = ws_service.broadcast_to_room(call.room_id, WebSocketEvent::VoiceAnswer {
                                        call_id,
                                        answer,
                                    }).await;
                                }
                            }
                            WebSocketEvent::IceCandidate { call_id, candidate } => {
                                // Get room_id from call
                                if let Ok(call) = voice_call_service.get_call(call_id).await {
                                    // Broadcast signaling message to room
                                    let _ = ws_service.broadcast_to_room(call.room_id, WebSocketEvent::IceCandidate {
                                        call_id,
                                        candidate,
                                    }).await;
                                }
                            }
                            _ => {}
                        }
                    }
                }
                Ok(Message::Close(_)) => break,
                _ => {}
            }
        }
    });

    let room_receivers_tx = room_receivers.clone();
    let tx_task = tokio::spawn(async move {
        loop {
            tokio::select! {
                _ = tokio::time::sleep(tokio::time::Duration::from_millis(100)) => {
                    let mut receivers = room_receivers_tx.write().await;
                    let mut to_remove = Vec::new();
                    for (room_id, receiver) in receivers.iter_mut() {
                        if let Ok(message) = receiver.try_recv() {
                            if sender.send(Message::Text(message.into())).await.is_err() {
                                to_remove.push(*room_id);
                                break;
                            }
                        }
                    }
                    for room_id in to_remove {
                        receivers.remove(&room_id);
                    }
                }
            }
        }
    });

    tokio::select! {
        _ = rx_task => {}
        _ = tx_task => {}
    }
}
