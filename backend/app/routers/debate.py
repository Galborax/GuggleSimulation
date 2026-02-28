from fastapi import APIRouter
from app.schemas.debate import StartDebateRequest, NextRoundRequest, JudgeRequest, DebateResponse, DebriefRequest
from app.services.gemini_service import debate_agent_turn, judge_debate, debrief_agent_reply

router = APIRouter()

_debates: dict[int, dict] = {}
_debate_counter = 0

AGENTS = [
    {"name": "Alex Chen", "role": "Visionary Investor", "emoji": "🚀"},
    {"name": "Diana Lim", "role": "Skeptic Analyst", "emoji": "🔍"},
    {"name": "Ravi Kumar", "role": "Market Expert", "emoji": "📊"},
]


@router.get("/personas")
async def get_personas():
    return {"personas": AGENTS + [{"name": "Victoria Wong", "role": "Judge", "emoji": "⚖️"}]}


@router.post("/start", response_model=DebateResponse)
async def start_debate(req: StartDebateRequest):
    global _debate_counter
    _debate_counter += 1
    debate_id = _debate_counter
    rounds = []

    first_agent = AGENTS[0]
    content = await debate_agent_turn(
        first_agent["name"], first_agent["role"],
        req.topic, req.business_context or "", []
    )
    rounds.append({
        "round": 1, "agent": first_agent["name"],
        "role": first_agent["role"], "emoji": first_agent["emoji"],
        "content": content,
    })

    _debates[debate_id] = {
        "debate_id": debate_id,
        "topic": req.topic,
        "business_context": req.business_context or "",
        "session_id": req.session_id,
        "rounds": rounds,
        "agent_index": 1,
        "judge_summary": None,
        "status": "active",
    }

    return DebateResponse(
        debate_id=debate_id,
        topic=req.topic,
        rounds=rounds,
        status="active",
    )


@router.post("/next")
async def next_round(req: NextRoundRequest):
    debate = _debates.get(req.debate_id)
    if not debate:
        return {"error": "Debate not found"}

    idx = debate["agent_index"] % len(AGENTS)
    agent = AGENTS[idx]
    content = await debate_agent_turn(
        agent["name"], agent["role"],
        debate["topic"], debate["business_context"],
        debate["rounds"],
    )
    round_data = {
        "round": len(debate["rounds"]) + 1,
        "agent": agent["name"],
        "role": agent["role"],
        "emoji": agent["emoji"],
        "content": content,
    }
    debate["rounds"].append(round_data)
    debate["agent_index"] += 1

    if len(debate["rounds"]) >= 6:
        debate["status"] = "ready_for_judge"

    return {
        "debate_id": req.debate_id,
        "new_round": round_data,
        "total_rounds": len(debate["rounds"]),
        "status": debate["status"],
    }


@router.post("/judge")
async def run_judge(req: JudgeRequest):
    debate = _debates.get(req.debate_id)
    if not debate:
        return {"error": "Debate not found"}
    summary = await judge_debate(
        debate["topic"], debate["business_context"], debate["rounds"]
    )
    debate["judge_summary"] = summary
    debate["status"] = "concluded"
    return {"debate_id": req.debate_id, "judge_summary": summary, "status": "concluded"}


@router.get("/{debate_id}")
async def get_debate(debate_id: int):
    debate = _debates.get(debate_id)
    if not debate:
        return {"error": "Debate not found"}
    return debate


# Per-(debate + thread_key) chat history for Threaded Memory
_debrief_histories: dict[str, list] = {}


@router.post("/debrief")
async def debrief_agent(req: DebriefRequest):
    """
    Post-Debate Debrief: 1-on-1 Q&A with the agent who made a specific claim.
    Maintains per-thread chat history so the AI never loses context mid-conversation.
    Returns the agent reply + an optional timeline_suggestion for the
    'Apply to Financial Timeline' button.
    """
    debate = _debates.get(req.debate_id)
    if not debate:
        return {"error": "Debate not found"}

    # Threaded Memory: each (debate_id, claim) combination has its own chat log
    thread_key = req.thread_key or f"{req.debate_id}:{hash(req.claim)}"
    history = _debrief_histories.setdefault(thread_key, [])

    # Add user message to history before calling AI
    history.append({"role": "user", "content": req.user_message})

    result = await debrief_agent_reply(
        agent_name=req.agent_name,
        agent_role=req.agent_role,
        topic=debate["topic"],
        business_context=debate["business_context"],
        claim=req.claim,
        debate_transcript=debate["rounds"],
        chat_history=history[:-1],   # pass history BEFORE current message
        user_message=req.user_message,
    )

    # Append AI reply to history for next turn
    history.append({"role": "assistant", "content": result["reply"]})

    return {
        "thread_key": thread_key,
        "agent_name": req.agent_name,
        "agent_role": req.agent_role,
        "reply": result["reply"],
        "timeline_suggestion": result["timeline_suggestion"],
        "history": history,
    }


@router.delete("/debrief/{thread_key}")
async def clear_debrief_thread(thread_key: str):
    """Reset chat history for a debrief thread (start fresh)."""
    _debrief_histories.pop(thread_key, None)
    return {"cleared": thread_key}
