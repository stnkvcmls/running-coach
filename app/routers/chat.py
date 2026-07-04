"""Streaming chat with the AI coach and durable coach-memory CRUD."""
import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import ChatMessage, CoachMemory, User
from app.schemas import (
    ChatHistoryResponse,
    ChatMessageResponse,
    ChatRequest,
    CoachMemoryRequest,
    CoachMemoryResponse,
    CoachMemoryUpdateRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/chat", response_model=ChatHistoryResponse)
def api_get_chat(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.asc())
        .limit(limit)
        .all()
    )
    return ChatHistoryResponse(
        messages=[
            ChatMessageResponse(
                id=m.id,
                role=m.role,
                content=m.content,
                created_at=m.created_at,
                activity_id=m.activity_id,
                actions=json.loads(m.actions_json) if m.actions_json else None,
            )
            for m in messages
        ]
    )


@router.delete("/chat")
def api_clear_chat(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).delete()
    db.commit()
    return {"cleared": True}


@router.post("/chat")
def api_post_chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.ai_coach import chat_stream as _chat_stream
    from app.database import db_session as make_session

    # Save user message immediately
    user_msg = ChatMessage(
        user_id=current_user.id,
        role="user",
        content=req.message,
        activity_id=req.activity_id,
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    # Fetch conversation history (up to 20 prior turns) for multi-turn context
    history_rows = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.user_id == current_user.id,
            ChatMessage.id < user_msg.id,
        )
        .order_by(ChatMessage.created_at.asc())
        .limit(20)
        .all()
    )
    history = [{"role": m.role, "content": m.content} for m in history_rows]

    user_id = current_user.id
    new_message = req.message
    activity_id = req.activity_id

    def generate():
        full_response: list[str] = []
        actions: list[dict] = []
        try:
            with make_session() as session:
                event_iter = _chat_stream(session, new_message, history, user_id, activity_id)
                for event in event_iter:
                    if event["type"] == "token":
                        full_response.append(event["text"])
                        yield f"data: {json.dumps({'token': event['text']})}\n\n"
                    elif event["type"] == "action":
                        actions.append(event["action"])
                        yield f"data: {json.dumps({'action': event['action']})}\n\n"

                # Persist the complete AI response
                assistant_msg = ChatMessage(
                    user_id=user_id,
                    role="assistant",
                    content="".join(full_response),
                    actions_json=json.dumps(actions) if actions else None,
                )
                session.add(assistant_msg)
                session.commit()
        except Exception as exc:
            logger.exception("Chat streaming error")
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# --- Coach Memory ---

@router.get("/coach-memory", response_model=list[CoachMemoryResponse])
def api_list_coach_memory(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    memories = (
        db.query(CoachMemory)
        .filter(CoachMemory.user_id == current_user.id)
        .order_by(CoachMemory.created_at.desc())
        .all()
    )
    return memories


@router.post("/coach-memory", response_model=CoachMemoryResponse)
def api_create_coach_memory(
    req: CoachMemoryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    memory = CoachMemory(
        user_id=current_user.id,
        category=req.category,
        tag=req.tag,
        note=req.note,
    )
    db.add(memory)
    db.commit()
    db.refresh(memory)
    return memory


@router.put("/coach-memory/{memory_id}", response_model=CoachMemoryResponse)
def api_update_coach_memory(
    memory_id: int,
    req: CoachMemoryUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    memory = (
        db.query(CoachMemory)
        .filter(CoachMemory.id == memory_id, CoachMemory.user_id == current_user.id)
        .first()
    )
    if memory is None:
        raise HTTPException(status_code=404, detail="Memory not found")
    for key, value in req.model_dump(exclude_unset=True).items():
        setattr(memory, key, value)
    db.commit()
    db.refresh(memory)
    return memory


@router.delete("/coach-memory/{memory_id}")
def api_delete_coach_memory(
    memory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    memory = (
        db.query(CoachMemory)
        .filter(CoachMemory.id == memory_id, CoachMemory.user_id == current_user.id)
        .first()
    )
    if memory is None:
        raise HTTPException(status_code=404, detail="Memory not found")
    db.delete(memory)
    db.commit()
    return {"deleted": True}
