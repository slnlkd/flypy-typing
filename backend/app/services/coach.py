from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from statistics import mean
from typing import Any, TypedDict

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.ai_runtime import AIRuntime
from app.services.knowledge_base import KnowledgeBaseService

try:
    from langchain_core.prompts import ChatPromptTemplate
except ImportError:  # pragma: no cover - optional dependency
    ChatPromptTemplate = None

try:
    from langgraph.graph import END, START, StateGraph
except ImportError:  # pragma: no cover - optional dependency
    END = START = None
    StateGraph = None


@dataclass(frozen=True)
class KnowledgeSnippet:
    title: str
    content: str
    tags: tuple[str, ...]


class PracticeRecordPayload(TypedDict):
    mode: str
    speed: int
    accuracy: int
    totalChars: int
    correctChars: int
    wrongChars: int
    maxCombo: int
    duration: int
    date: str


class WrongCharPayload(TypedDict):
    char: str
    pinyin: str
    flypyCode: str
    count: int


class CoachState(TypedDict, total=False):
    records: list[PracticeRecordPayload]
    wrong_chars: list[WrongCharPayload]
    goal: str
    content_type: str
    constraints: dict[str, Any]
    metrics: dict[str, float]
    weakness_summary: str
    focuses: list[str]
    citations: list[dict[str, str]]
    tasks: list[dict[str, Any]]
    generated_content: dict[str, Any]
    answer: str


KNOWLEDGE_SNIPPETS: list[KnowledgeSnippet] = [
    KnowledgeSnippet(
        title="训练节奏建议",
        content="提升双拼速度时，先稳住正确率，再逐步提高节奏。建议将 95% 以上正确率作为提速前提。",
        tags=("训练", "速度", "正确率"),
    ),
    KnowledgeSnippet(
        title="专项训练策略",
        content="如果高频错字集中在少数编码上，应优先做专项练习，而不是继续做大范围随机刷题。",
        tags=("训练", "专项", "错字"),
    ),
    KnowledgeSnippet(
        title="文章练习方法",
        content="文章练习适合提升连续输入稳定性，但不适合在基础编码尚未熟悉时过早拉高强度。",
        tags=("文章", "稳定性", "训练"),
    ),
    KnowledgeSnippet(
        title="声母韵母转换",
        content="小鹤双拼的难点通常出现在特殊声母和需要映射转换的韵母，建议把错字先按编码模式聚类。",
        tags=("规则", "声母", "韵母", "编码"),
    ),
]


def _render_prompt(system_prompt: str, user_prompt: str) -> tuple[str, str]:
    if ChatPromptTemplate is None:
        return system_prompt, user_prompt

    template = ChatPromptTemplate.from_messages(
        [
            ("system", "{system_prompt}"),
            ("human", "{user_prompt}"),
        ]
    )
    messages = template.format_messages(system_prompt=system_prompt, user_prompt=user_prompt)
    return str(messages[0].content), str(messages[1].content)


def _compute_metrics(records: list[PracticeRecordPayload]) -> dict[str, float]:
    if not records:
        return {"avg_speed": 0, "avg_accuracy": 0, "avg_duration": 0, "speed_trend": 0}

    recent = records[:10]
    avg_speed = mean(item["speed"] for item in recent)
    avg_accuracy = mean(item["accuracy"] for item in recent)
    avg_duration = mean(item["duration"] for item in recent)
    if len(recent) >= 4:
        speed_trend = mean(item["speed"] for item in recent[:3]) - mean(item["speed"] for item in recent[-3:])
    else:
        speed_trend = 0
    return {
        "avg_speed": round(avg_speed, 1),
        "avg_accuracy": round(avg_accuracy, 1),
        "avg_duration": round(avg_duration, 1),
        "speed_trend": round(speed_trend, 1),
    }


def _weakness_labels(metrics: dict[str, float], wrong_chars: list[WrongCharPayload]) -> list[str]:
    labels: list[str] = []
    if metrics["avg_accuracy"] and metrics["avg_accuracy"] < 92:
        labels.append("正确率波动偏大")
    if metrics["avg_speed"] and metrics["avg_speed"] < 90:
        labels.append("基础速度偏慢")
    if metrics["speed_trend"] < -5:
        labels.append("近期速度有回落")
    if len(wrong_chars) >= 5:
        labels.append("存在稳定高频错字")
    if not labels:
        labels.append("整体稳定，可开始冲刺速度")
    return labels


def _retrieve_knowledge(goal: str, wrong_chars: list[WrongCharPayload]) -> list[dict[str, str]]:
    query_terms = set(goal.split())
    query_terms.update(item["pinyin"] for item in wrong_chars[:5] if item.get("pinyin"))
    ranked: list[tuple[int, KnowledgeSnippet]] = []
    for snippet in KNOWLEDGE_SNIPPETS:
        score = sum(1 for term in query_terms if term and (term in snippet.content or term in snippet.tags))
        ranked.append((score, snippet))
    ranked.sort(key=lambda item: item[0], reverse=True)
    top = [snippet for _, snippet in ranked[:2] if snippet]
    if not top:
        top = KNOWLEDGE_SNIPPETS[:2]
    return [{"title": item.title, "content": item.content} for item in top]


def _build_tasks(
    goal: str,
    metrics: dict[str, float],
    wrong_chars: list[WrongCharPayload],
) -> list[dict[str, Any]]:
    top_wrong = wrong_chars[:5]
    tasks = [
        {
            "title": "热身专项",
            "focus": "高频错字",
            "description": (
                f"先刷 {', '.join(item['char'] for item in top_wrong[:3]) or '高频错字'}，"
                "每组 20 个，确保编码和击键路径稳定。"
            ),
        },
        {
            "title": "主训练任务",
            "focus": goal or "综合训练",
            "description": (
                "以 2 轮短时训练为主，第一轮控制正确率，第二轮再提速。"
                if metrics["avg_accuracy"] < 95
                else "保持正确率的同时逐步提速，建议做 180 秒连续输入。"
            ),
        },
        {
            "title": "复盘动作",
            "focus": "练后复盘",
            "description": "练后查看错字是否重复出现，如果重复，第二天继续做专项，不立刻切题型。",
        },
    ]
    return tasks


def _generate_text_content(content_type: str, goal: str, wrong_chars: list[WrongCharPayload]) -> dict[str, Any]:
    chars = [item["char"] for item in wrong_chars[:8]]
    if content_type == "phrase":
        content = " ".join(
            [
                f"{''.join(chars[:2]) or '双拼'}训练",
                "准确输入",
                "稳定节奏",
                "专项突破",
                "持续复盘",
            ]
        )
        return {
            "type": "phrase",
            "title": "AI 生成专项词组",
            "difficulty": "medium",
            "tags": [goal or "专项训练", "词组"],
            "content": content,
        }

    if content_type == "char":
        content = "".join(chars) or "双拼练习稳定提速"
        return {
            "type": "char",
            "title": "AI 生成专项单字",
            "difficulty": "easy",
            "tags": [goal or "专项训练", "单字"],
            "content": content,
        }

    focus = "、".join(chars[:4]) or "易错编码"
    article = (
        f"今天的训练重点是{focus}。先保证编码准确，再逐步提高节奏。"
        "遇到重复错误时，不要急于提速，应先稳定击键路径。"
        "完成两轮短时专项后，再进行一轮文章连续输入，用来观察稳定性是否提升。"
    )
    return {
        "type": "article",
        "title": "AI 生成专项文章",
        "difficulty": "medium",
        "tags": [goal or "专项训练", "文章"],
        "content": article,
    }


class CoachService:
    """AI coaching service with optional LangGraph/OpenAI runtime and deterministic fallback."""

    def __init__(self) -> None:
        self.runtime = AIRuntime()
        self.knowledge_service = KnowledgeBaseService()

    async def analyze(
        self,
        *,
        db: AsyncSession,
        records: list[PracticeRecordPayload],
        wrong_chars: list[WrongCharPayload],
        goal: str,
    ) -> dict[str, Any]:
        citations = await self._retrieve_knowledge(db, goal, wrong_chars)
        state = {"records": records, "wrong_chars": wrong_chars, "goal": goal, "citations": citations}
        final_state = await self._run_graph(state)
        return {
            "summary": final_state["weakness_summary"],
            "weaknesses": final_state["focuses"],
            "recommendedFocus": final_state["focuses"][:3],
            "tasks": final_state["tasks"],
            "citations": final_state["citations"],
            "meta": {
                "usedModel": self.runtime.enabled,
                "usedLangGraph": StateGraph is not None,
            },
        }

    async def generate_tasks(
        self,
        *,
        records: list[PracticeRecordPayload],
        wrong_chars: list[WrongCharPayload],
        goal: str,
    ) -> dict[str, Any]:
        metrics = _compute_metrics(records)
        tasks = _build_tasks(goal, metrics, wrong_chars)
        return {"tasks": tasks, "summary": f"当前建议优先围绕“{goal or '综合提升'}”组织训练。"}

    async def generate_content(
        self,
        *,
        records: list[PracticeRecordPayload],
        wrong_chars: list[WrongCharPayload],
        goal: str,
        content_type: str,
    ) -> dict[str, Any]:
        generated = _generate_text_content(content_type, goal, wrong_chars)
        system_prompt, user_prompt = _render_prompt(
            "你是中文双拼训练内容生成助手，输出紧凑、自然、适合打字练习的文本。",
            (
                f"生成一段适合小鹤双拼用户练习的 {content_type} 内容。"
                f"训练目标：{goal or '综合提升'}。"
                f"高频错字：{', '.join(item['char'] for item in wrong_chars[:8]) or '无'}。"
                "直接输出正文，不要解释。"
            ),
        )
        model_text = await self.runtime.complete_text(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )
        if model_text:
            generated["content"] = model_text.strip()
        return generated

    async def answer_question(
        self,
        *,
        db: AsyncSession,
        question: str,
        records: list[PracticeRecordPayload],
        wrong_chars: list[WrongCharPayload],
    ) -> dict[str, Any]:
        citations = await self._retrieve_knowledge(db, question, wrong_chars)
        fallback_answer = self._fallback_answer(question, records, wrong_chars, citations)
        system_prompt, user_prompt = _render_prompt(
            "你是小鹤双拼训练教练，只用中文回答，优先给出可执行建议。",
            (
                f"用户问题：{question}\n"
                f"最近平均表现：{_compute_metrics(records)}\n"
                f"高频错字：{wrong_chars[:5]}\n"
                f"参考知识：{citations}\n"
                "请给出简洁实用的回答，并引用参考知识中的观点。"
            ),
        )
        model_answer = await self.runtime.complete_text(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )
        return {"answer": (model_answer or fallback_answer).strip(), "citations": citations}

    async def _retrieve_knowledge(
        self,
        db: AsyncSession,
        query: str,
        wrong_chars: list[WrongCharPayload],
    ) -> list[dict[str, str]]:
        query_text = " ".join([query, *(item["pinyin"] for item in wrong_chars[:5] if item.get("pinyin"))]).strip()
        retrieved = await self.knowledge_service.retrieve(db, query=query_text or query)
        if retrieved:
            return [{"title": item.title, "content": item.content} for item in retrieved]
        return _retrieve_knowledge(query, wrong_chars)

    async def _run_graph(self, state: CoachState) -> CoachState:
        if StateGraph is None:
            return self._fallback_graph(state)

        def collect_user_state(input_state: CoachState) -> CoachState:
            input_state["metrics"] = _compute_metrics(input_state["records"])
            return input_state

        def analyze_weakness(input_state: CoachState) -> CoachState:
            metrics = input_state["metrics"]
            focuses = _weakness_labels(metrics, input_state["wrong_chars"])
            input_state["focuses"] = focuses
            input_state["weakness_summary"] = (
                f"最近平均速度 {metrics['avg_speed']} 字/分，平均正确率 {metrics['avg_accuracy']}%。"
                f"当前最值得优先处理的是：{'、'.join(focuses[:3])}。"
            )
            return input_state

        def retrieve_knowledge(input_state: CoachState) -> CoachState:
            if "citations" not in input_state:
                input_state["citations"] = _retrieve_knowledge(input_state["goal"], input_state["wrong_chars"])
            return input_state

        def generate_plan(input_state: CoachState) -> CoachState:
            metrics = input_state["metrics"]
            input_state["tasks"] = _build_tasks(input_state["goal"], metrics, input_state["wrong_chars"])
            return input_state

        graph = StateGraph(CoachState)
        graph.add_node("collect_user_state", collect_user_state)
        graph.add_node("analyze_weakness", analyze_weakness)
        graph.add_node("retrieve_knowledge", retrieve_knowledge)
        graph.add_node("generate_plan", generate_plan)
        graph.add_edge(START, "collect_user_state")
        graph.add_edge("collect_user_state", "analyze_weakness")
        graph.add_edge("analyze_weakness", "retrieve_knowledge")
        graph.add_edge("retrieve_knowledge", "generate_plan")
        graph.add_edge("generate_plan", END)
        app = graph.compile()
        return app.invoke(state)

    def _fallback_graph(self, state: CoachState) -> CoachState:
        metrics = _compute_metrics(state["records"])
        focuses = _weakness_labels(metrics, state["wrong_chars"])
        citations = _retrieve_knowledge(state["goal"], state["wrong_chars"])
        tasks = _build_tasks(state["goal"], metrics, state["wrong_chars"])
        state["focuses"] = focuses
        state["citations"] = citations
        state["tasks"] = tasks
        state["weakness_summary"] = (
            f"最近平均速度 {metrics['avg_speed']} 字/分，平均正确率 {metrics['avg_accuracy']}%。"
            f"优先建议：{'、'.join(focuses[:3])}。"
        )
        return state

    def _fallback_answer(
        self,
        question: str,
        records: list[PracticeRecordPayload],
        wrong_chars: list[WrongCharPayload],
        citations: list[dict[str, str]],
    ) -> str:
        metrics = _compute_metrics(records)
        top = Counter({item["char"]: item["count"] for item in wrong_chars}).most_common(3)
        top_text = "、".join(char for char, _ in top) or "暂无明显高频错字"
        citation_text = "；".join(item["title"] for item in citations)
        return (
            f"针对“{question}”，建议先把正确率稳定在 95% 左右，再做提速。"
            f"你当前平均速度约 {metrics['avg_speed']} 字/分，平均正确率约 {metrics['avg_accuracy']}%。"
            f"当前最值得先处理的错字是：{top_text}。"
            f"可参考：{citation_text}。"
        )
