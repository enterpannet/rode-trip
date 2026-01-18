use anyhow::Result;
use chrono::Utc;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::entities::voice_call;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum VoiceCallEvent {
    #[serde(rename = "voice-call-initiate")]
    Initiate {
        room_id: Uuid,
        initiator_id: Uuid,
        call_id: Uuid,
    },
    #[serde(rename = "voice-call-accept")]
    Accept {
        call_id: Uuid,
        user_id: Uuid,
    },
    #[serde(rename = "voice-call-reject")]
    Reject {
        call_id: Uuid,
        user_id: Uuid,
    },
    #[serde(rename = "voice-call-end")]
    End {
        call_id: Uuid,
        user_id: Uuid,
    },
    #[serde(rename = "voice-offer")]
    Offer {
        call_id: Uuid,
        offer: String, // SDP offer
    },
    #[serde(rename = "voice-answer")]
    Answer {
        call_id: Uuid,
        answer: String, // SDP answer
    },
    #[serde(rename = "ice-candidate")]
    IceCandidate {
        call_id: Uuid,
        candidate: String, // ICE candidate
    },
}

pub struct VoiceCallSignalingService {
    db: DatabaseConnection,
}

impl VoiceCallSignalingService {
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    pub async fn initiate_call(
        &self,
        room_id: Uuid,
        initiator_id: Uuid,
    ) -> Result<voice_call::Model> {
        let new_call = voice_call::ActiveModel {
            id: Set(Uuid::new_v4()),
            room_id: Set(room_id),
            initiator_id: Set(initiator_id),
            start_time: Set(Utc::now()),
            end_time: Set(None),
            status: Set("ringing".to_string()),
        };

        let call = new_call.insert(&self.db).await?;
        Ok(call)
    }

    pub async fn accept_call(&self, call_id: Uuid) -> Result<voice_call::Model> {
        let call = voice_call::Entity::find_by_id(call_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Call not found"))?;

        let mut call: voice_call::ActiveModel = call.into();
        call.status = Set("active".to_string());

        let call = call.update(&self.db).await?;
        Ok(call)
    }

    pub async fn reject_call(&self, call_id: Uuid) -> Result<()> {
        self.end_call(call_id).await
    }

    pub async fn end_call(&self, call_id: Uuid) -> Result<()> {
        let call = voice_call::Entity::find_by_id(call_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Call not found"))?;

        let mut call: voice_call::ActiveModel = call.into();
        call.status = Set("ended".to_string());
        call.end_time = Set(Some(Utc::now()));

        call.update(&self.db).await?;
        Ok(())
    }

    pub async fn get_call(&self, call_id: Uuid) -> Result<voice_call::Model> {
        voice_call::Entity::find_by_id(call_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Call not found"))
    }

    pub async fn get_active_call_in_room(&self, room_id: Uuid) -> Result<Option<voice_call::Model>> {
        let call = voice_call::Entity::find()
            .filter(voice_call::Column::RoomId.eq(room_id))
            .filter(
                voice_call::Column::Status
                    .eq("ringing")
                    .or(voice_call::Column::Status.eq("active")),
            )
            .one(&self.db)
            .await?;

        Ok(call)
    }
}
