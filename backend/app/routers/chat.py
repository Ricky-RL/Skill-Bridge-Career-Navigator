from fastapi import APIRouter
from app.models.chat import ChatRequest, ChatResponse
from app.services.ai_analyzer import generate_chat_response
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Send a message to the AI career advisor chatbot.

    The chatbot has context about the user's profile, current job being viewed,
    and any analysis results to provide personalized career advice.
    """
    try:
        # Convert Pydantic models to dicts for the AI function
        context_dict = request.context.model_dump()
        history_dicts = [msg.model_dump() for msg in request.history]

        result = await generate_chat_response(
            user_message=request.message,
            context=context_dict,
            history=history_dicts
        )

        return ChatResponse(
            message=result.get("message", ""),
            suggestions=result.get("suggestions", [])
        )

    except Exception as e:
        logger.error(f"Chat error: {e}")
        # Return a graceful fallback instead of 500
        return ChatResponse(
            message="I'm sorry, I'm having trouble right now. Please try again in a moment.",
            suggestions=[
                "What skills are most in-demand?",
                "How can I prepare for interviews?",
                "What should I focus on learning?"
            ]
        )
