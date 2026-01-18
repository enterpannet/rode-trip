use axum::{
    extract::{
        ws::{Message, WebSocket},
        State, WebSocketUpgrade,
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
    State(_app_state): State<AppState>,
) -> Response {
    ws.on_upgrade(|socket| handle_socket(socket))
}

async fn handle_socket(socket: WebSocket) {
    let (mut sender, mut receiver) = socket.split();
    let room_receivers: Arc<RwLock<HashMap<Uuid, broadcast::Receiver<String>>>> = Arc::new(RwLock::new(HashMap::new()));
    let ws_service = WebSocketService::new();
    let room_receivers_rx = room_receivers.clone();

    let mut rx_task = tokio::spawn(async move {
        while let Some(msg) = receiver.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    if let Ok(event) = serde_json::from_str::<WebSocketEvent>(&text) {
                        match event {
                            WebSocketEvent::JoinRoom { room_id } => {
                                let tx = ws_service.get_or_create_room_sender(room_id).await;
                                let rx = tx.subscribe();
                                room_receivers_rx.write().await.insert(room_id, rx);
                            }
                            WebSocketEvent::LeaveRoom { room_id } => {
                                room_receivers_rx.write().await.remove(&room_id);
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
    let mut tx_task = tokio::spawn(async move {
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
