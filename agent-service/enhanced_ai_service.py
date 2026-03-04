"""
Gantt Graph AI Service - Enhanced Edition
=========================================
智能任务分解、风险预警、进度预测、关键路径分析

Architecture:
- LLM Agent: 自然语言理解和任务规划
- Task Decomposer: 智能任务分解
- Risk Analyzer: 风险预警分析
- Schedule Predictor: 进度预测
- Resource Optimizer: 资源冲突检测
"""

import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any, Tuple, Set
from dataclasses import dataclass, asdict
from enum import Enum
from collections import defaultdict
import heapq

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)


# ===============================
# Enums and Data Models
# ===============================

class RiskLevel(str, Enum):
    """风险等级"""
    NONE = "none"           # 无风险
    LOW = "low"             # 低风险
    MEDIUM = "medium"       # 中风险
    HIGH = "high"           # 高风险
    CRITICAL = "critical"   # 严重风险

class TaskStatus(str, Enum):
    """任务状态"""
    NOT_STARTED = "NotStarted"
    IN_PROGRESS = "InProgress"
    COMPLETED = "Completed"

class Priority(str, Enum):
    """优先级"""
    URGENT = "Urgent"
    IMPORTANT = "Important"
    NORMAL = "Normal"
    LOW = "Low"


@dataclass
class Task:
    """任务模型"""
    id: str
    title: str
    start_date: datetime
    end_date: datetime
    duration_days: int
    progress: float = 0.0
    status: TaskStatus = TaskStatus.NOT_STARTED
    priority: Priority = Priority.NORMAL
    dependencies: List[str] = None
    assignees: List[str] = None
    resources: List[str] = None
    milestone: bool = False
    bucket_id: str = ""
    
    def __post_init__(self):
        if self.dependencies is None:
            self.dependencies = []
        if self.assignees is None:
            self.assignees = []
        if self.resources is None:
            self.resources = []


@dataclass  
class Risk:
    """风险项"""
    task_id: str
    task_title: str
    risk_type: str
    level: RiskLevel
    description: str
    suggestion: str
    impact_days: int = 0


@dataclass
class SchedulePrediction:
    """进度预测结果"""
    predicted_end_date: datetime
    confidence: float  # 0-1
    delay_probability: float  # 0-1
    estimated_delay_days: int
    critical_factors: List[str]


# ===============================
# Request/Response Models
# ===============================

class DecomposeRequest(BaseModel):
    """任务分解请求"""
    goal: str = Field(..., description="项目目标描述")
    start_date: str = Field(..., description="项目开始日期 YYYY-MM-DD")
    deadline: Optional[str] = Field(None, description="项目截止日期")
    team_size: int = Field(3, description="团队人数")
    complexity: str = Field("medium", description="复杂度: low/medium/high")


class DecomposeResponse(BaseModel):
    """任务分解响应"""
    success: bool
    message: str
    phases: List[Dict[str, Any]]  # 阶段列表
    tasks: List[Dict[str, Any]]   # 任务列表
    milestones: List[Dict[str, Any]]  # 里程碑列表
    estimated_duration_days: int
    confidence: float


class RiskAnalysisRequest(BaseModel):
    """风险分析请求"""
    tasks: List[Dict[str, Any]]
    current_date: Optional[str] = None
    check_dependencies: bool = True
    check_resources: bool = True
    check_schedule: bool = True


class RiskAnalysisResponse(BaseModel):
    """风险分析响应"""
    success: bool
    message: str
    risks: List[Dict[str, Any]]
    overall_risk_level: RiskLevel
    risk_summary: Dict[str, int]  # 各级别风险数量
    recommendations: List[str]


class SchedulePredictionRequest(BaseModel):
    """进度预测请求"""
    tasks: List[Dict[str, Any]]
    current_date: Optional[str] = None
    consider_history: bool = True


class SchedulePredictionResponse(BaseModel):
    """进度预测响应"""
    success: bool
    message: str
    prediction: Dict[str, Any]
    critical_path: List[str]
    bottlenecks: List[Dict[str, Any]]
    suggestions: List[str]


class ResourceConflictRequest(BaseModel):
    """资源冲突检测请求"""
    tasks: List[Dict[str, Any]]
    resources: Optional[List[Dict[str, Any]]] = None


class ResourceConflictResponse(BaseModel):
    """资源冲突检测响应"""
    success: bool
    message: str
    conflicts: List[Dict[str, Any]]
    resource_utilization: Dict[str, float]  # 资源利用率
    suggestions: List[str]


class NaturalLanguageRequest(BaseModel):
    """自然语言请求"""
    message: str
    context: Optional[Dict[str, Any]] = None


class NaturalLanguageResponse(BaseModel):
    """自然语言响应"""
    success: bool
    message: str
    intent: str  # 意图识别结果
    actions: List[Dict[str, Any]]
    analysis: Optional[Dict[str, Any]] = None  # 额外分析（如风险）


# ===============================
# Core AI Components
# ===============================

class LLMClient:
    """LLM客户端"""
    
    def __init__(self):
        self.api_key = os.getenv("LLM_API_KEY") or os.getenv("OPENAI_API_KEY")
        self.base_url = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
        self.model = os.getenv("LLM_MODEL", "gpt-4")
        
        try:
            from openai import OpenAI
            self.client = OpenAI(api_key=self.api_key, base_url=self.base_url)
            self._use_new_api = True
        except ImportError:
            import openai
            openai.api_key = self.api_key
            openai.api_base = self.base_url
            self._use_new_api = False
            self.client = None
    
    def chat(self, messages: List[Dict[str, str]], temperature: float = 0.3) -> str:
        """发送对话请求"""
        if not self.api_key:
            raise ValueError("LLM API key not configured")
        
        if self._use_new_api:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                timeout=60
            )
            return response.choices[0].message.content
        else:
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=messages,
                temperature=temperature
            )
            return response.choices[0].message.content


class TaskDecomposer:
    """智能任务分解器"""
    
    def __init__(self, llm: LLMClient):
        self.llm = llm
    
    def decompose(self, request: DecomposeRequest) -> DecomposeResponse:
        """将项目目标分解为具体任务"""
        
        complexity_guidance = {
            "low": "任务粒度较粗，每个阶段3-5个任务",
            "medium": "中等粒度，每个阶段5-8个任务",
            "high": "精细粒度，每个阶段8-12个任务，包含详细的子任务"
        }
        
        system_prompt = f"""你是一个专业的项目管理专家，擅长将项目目标分解为可执行的任务。

请将用户的项目目标分解为结构化的任务计划，包括：
1. 项目阶段（Phase）- 逻辑上的大阶段
2. 具体任务（Task）- 可执行的工作项  
3. 里程碑（Milestone）- 关键节点

约束条件：
- 团队规模: {request.team_size}人
- 复杂度要求: {complexity_guidance.get(request.complexity, complexity_guidance['medium'])}
- 开始日期: {request.start_date}
{f"- 截止日期: {request.deadline}" if request.deadline else ""}

输出格式必须是JSON：
{{
    "phases": [
        {{
            "name": "阶段名称",
            "description": "阶段描述",
            "order": 1
        }}
    ],
    "tasks": [
        {{
            "title": "任务名称",
            "phase": "所属阶段",
            "duration_days": 3,
            "priority": "Normal|Important|Urgent",
            "dependencies": ["前置任务标题"],
            "assignee_role": "角色建议"
        }}
    ],
    "milestones": [
        {{
            "title": "里程碑名称",
            "date_offset_days": 14,
            "description": "达成标准"
        }}
    ],
    "estimated_duration_days": 30,
    "confidence": 0.85
}}"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"项目目标: {request.goal}"}
        ]
        
        try:
            response = self.llm.chat(messages, temperature=0.4)
            
            # 解析JSON
            json_str = self._extract_json(response)
            result = json.loads(json_str)
            
            # 计算日期并生成完整任务列表
            tasks = self._calculate_dates(result, request.start_date)
            
            return DecomposeResponse(
                success=True,
                message=f"成功分解项目为{len(result.get('phases', []))}个阶段，{len(tasks)}个任务",
                phases=result.get("phases", []),
                tasks=tasks,
                milestones=result.get("milestones", []),
                estimated_duration_days=result.get("estimated_duration_days", 0),
                confidence=result.get("confidence", 0.8)
            )
            
        except Exception as e:
            logger.error(f"Task decomposition failed: {e}")
            return DecomposeResponse(
                success=False,
                message=f"任务分解失败: {str(e)}",
                phases=[],
                tasks=[],
                milestones=[],
                estimated_duration_days=0,
                confidence=0
            )
    
    def _extract_json(self, text: str) -> str:
        """从文本中提取JSON"""
        if "```json" in text:
            return text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            return text.split("```")[1].split("```")[0].strip()
        return text.strip()
    
    def _calculate_dates(self, result: Dict, start_date_str: str) -> List[Dict]:
        """计算任务的具体日期"""
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        tasks = result.get("tasks", [])
        
        # 按阶段分组处理
        current_date = start_date
        current_phase = None
        
        for task in tasks:
            # 如果进入新阶段，增加一些缓冲时间
            if task.get("phase") != current_phase:
                if current_phase is not None:
                    current_date += timedelta(days=1)  # 阶段间隔
                current_phase = task.get("phase")
            
            duration = task.get("duration_days", 3)
            task["start_date"] = current_date.strftime("%Y-%m-%d")
            end_date = current_date + timedelta(days=duration - 1)
            task["end_date"] = end_date.strftime("%Y-%m-%d")
            
            current_date = end_date + timedelta(days=1)
        
        return tasks


class RiskAnalyzer:
    """风险分析器"""
    
    def analyze(self, request: RiskAnalysisRequest) -> RiskAnalysisResponse:
        """分析项目风险"""
        risks = []
        current_date = datetime.now()
        if request.current_date:
            current_date = datetime.strptime(request.current_date, "%Y-%m-%d")
        
        tasks = self._parse_tasks(request.tasks)
        
        # 1. 检查依赖风险
        if request.check_dependencies:
            risks.extend(self._check_dependency_risks(tasks))
        
        # 2. 检查进度风险
        if request.check_schedule:
            risks.extend(self._check_schedule_risks(tasks, current_date))
        
        # 3. 检查资源风险
        if request.check_resources:
            risks.extend(self._check_resource_risks(tasks))
        
        # 统计风险
        risk_summary = self._summarize_risks(risks)
        overall_level = self._calculate_overall_risk(risks)
        recommendations = self._generate_recommendations(risks, tasks)
        
        return RiskAnalysisResponse(
            success=True,
            message=f"发现{len(risks)}个风险项",
            risks=[asdict(r) for r in risks],
            overall_risk_level=overall_level,
            risk_summary=risk_summary,
            recommendations=recommendations
        )
    
    def _parse_tasks(self, task_dicts: List[Dict]) -> List[Task]:
        """解析任务字典"""
        tasks = []
        for t in task_dicts:
            task = Task(
                id=t.get("id", ""),
                title=t.get("title", ""),
                start_date=datetime.strptime(t.get("startDate", t.get("start_date", "2025-01-01")), "%Y-%m-%d"),
                end_date=datetime.strptime(t.get("dueDate", t.get("end_date", "2025-01-01")), "%Y-%m-%d"),
                duration_days=t.get("duration", 1),
                progress=t.get("progress", t.get("completedPercent", 0)),
                status=TaskStatus(t.get("status", "NotStarted")),
                priority=Priority(t.get("priority", "Normal")),
                dependencies=t.get("dependencies", []),
                milestone=t.get("taskType", "") == "milestone"
            )
            tasks.append(task)
        return tasks
    
    def _check_dependency_risks(self, tasks: List[Task]) -> List[Risk]:
        """检查依赖风险"""
        risks = []
        task_map = {t.id: t for t in tasks}
        
        for task in tasks:
            for dep_id in task.dependencies:
                if dep_id not in task_map:
                    risks.append(Risk(
                        task_id=task.id,
                        task_title=task.title,
                        risk_type="依赖缺失",
                        level=RiskLevel.HIGH,
                        description=f"任务依赖的任务'{dep_id}'不存在",
                        suggestion="检查依赖关系或添加缺失的任务"
                    ))
                else:
                    dep_task = task_map[dep_id]
                    # 检查依赖任务是否延期
                    if dep_task.progress < 100 and dep_task.end_date < datetime.now():
                        risks.append(Risk(
                            task_id=task.id,
                            task_title=task.title,
                            risk_type="依赖延期",
                            level=RiskLevel.MEDIUM,
                            description=f"前置任务'{dep_task.title}'已延期",
                            suggestion="催促前置任务完成或调整当前任务开始时间",
                            impact_days=(datetime.now() - dep_task.end_date).days
                        ))
        
        # 检查循环依赖
        cycles = self._detect_cycles(tasks)
        for cycle in cycles:
            risks.append(Risk(
                task_id=cycle[0],
                task_title="多个任务",
                risk_type="循环依赖",
                level=RiskLevel.CRITICAL,
                description=f"发现循环依赖: {' -> '.join(cycle)}",
                suggestion="重新设计任务依赖关系，消除循环"
            ))
        
        return risks
    
    def _detect_cycles(self, tasks: List[Task]) -> List[List[str]]:
        """检测循环依赖"""
        graph = defaultdict(list)
        for task in tasks:
            for dep in task.dependencies:
                graph[task.id].append(dep)
        
        cycles = []
        visited = set()
        rec_stack = set()
        
        def dfs(node: str, path: List[str]):
            visited.add(node)
            rec_stack.add(node)
            path.append(node)
            
            for neighbor in graph.get(node, []):
                if neighbor not in visited:
                    dfs(neighbor, path)
                elif neighbor in rec_stack:
                    # 发现循环
                    cycle_start = path.index(neighbor)
                    cycle = path[cycle_start:] + [neighbor]
                    cycles.append(cycle)
            
            path.pop()
            rec_stack.remove(node)
        
        for task in tasks:
            if task.id not in visited:
                dfs(task.id, [])
        
        return cycles
    
    def _check_schedule_risks(self, tasks: List[Task], current_date: datetime) -> List[Risk]:
        """检查进度风险"""
        risks = []
        
        for task in tasks:
            # 检查延期任务
            if task.end_date < current_date and task.progress < 100:
                days_overdue = (current_date - task.end_date).days
                level = RiskLevel.HIGH if days_overdue > 7 else RiskLevel.MEDIUM
                
                risks.append(Risk(
                    task_id=task.id,
                    task_title=task.title,
                    risk_type="任务延期",
                    level=level,
                    description=f"任务已延期{days_overdue}天，当前进度{task.progress}%",
                    suggestion="立即跟进任务进展，必要时调整计划或增加资源",
                    impact_days=days_overdue
                ))
            
            # 检查即将到期的紧急任务
            days_to_deadline = (task.end_date - current_date).days
            if 0 < days_to_deadline <= 3 and task.progress < 80:
                risks.append(Risk(
                    task_id=task.id,
                    task_title=task.title,
                    risk_type="即将到期",
                    level=RiskLevel.MEDIUM,
                    description=f"任务{days_to_deadline}天后到期，当前进度{task.progress}%",
                    suggestion="优先完成此任务，可能需要加班或调整优先级",
                    impact_days=days_to_deadline
                ))
            
            # 检查长时间未更新的任务
            if task.status == TaskStatus.IN_PROGRESS and task.progress == 0:
                risks.append(Risk(
                    task_id=task.id,
                    task_title=task.title,
                    risk_type="进度停滞",
                    level=RiskLevel.LOW,
                    description="任务状态为进行中但进度为0，可能已停滞",
                    suggestion="确认任务实际状态，更新进度或重新分配"
                ))
        
        return risks
    
    def _check_resource_risks(self, tasks: List[Task]) -> List[Risk]:
        """检查资源风险"""
        risks = []
        
        # 统计每人负责的任务数
        assignee_tasks = defaultdict(list)
        for task in tasks:
            for assignee in task.assignees:
                assignee_tasks[assignee].append(task)
        
        # 检查任务过载
        for assignee, tasks_list in assignee_tasks.items():
            active_tasks = [t for t in tasks_list if t.progress < 100]
            if len(active_tasks) > 5:
                risks.append(Risk(
                    task_id="",
                    task_title=f"{assignee}的资源负载",
                    risk_type="资源过载",
                    level=RiskLevel.MEDIUM,
                    description=f"{assignee}同时负责{len(active_tasks)}个未完成任务",
                    suggestion="重新分配任务或调整优先级"
                ))
        
        return risks
    
    def _summarize_risks(self, risks: List[Risk]) -> Dict[str, int]:
        """汇总风险统计"""
        summary = {"critical": 0, "high": 0, "medium": 0, "low": 0, "none": 0}
        for risk in risks:
            summary[risk.level.value] += 1
        return summary
    
    def _calculate_overall_risk(self, risks: List[Risk]) -> RiskLevel:
        """计算整体风险等级"""
        if any(r.level == RiskLevel.CRITICAL for r in risks):
            return RiskLevel.CRITICAL
        if any(r.level == RiskLevel.HIGH for r in risks):
            return RiskLevel.HIGH
        if sum(1 for r in risks if r.level == RiskLevel.MEDIUM) >= 3:
            return RiskLevel.MEDIUM
        if any(r.level == RiskLevel.MEDIUM for r in risks):
            return RiskLevel.LOW
        return RiskLevel.NONE
    
    def _generate_recommendations(self, risks: List[Risk], tasks: List[Task]) -> List[str]:
        """生成建议"""
        recommendations = []
        
        # 按风险类型分组
        risk_types = defaultdict(list)
        for risk in risks:
            risk_types[risk.risk_type].append(risk)
        
        if "循环依赖" in risk_types:
            recommendations.append("【紧急】立即消除循环依赖，重新设计任务关系")
        
        if "任务延期" in risk_types:
            overdue_count = len(risk_types["任务延期"])
            recommendations.append(f"【重要】{overdue_count}个任务已延期，需要召开进度评审会")
        
        if "资源过载" in risk_types:
            recommendations.append("【建议】优化资源分配，避免单人任务过于集中")
        
        if not recommendations:
            recommendations.append("项目整体健康，继续保持当前节奏")
        
        return recommendations


class SchedulePredictor:
    """进度预测器"""
    
    def predict(self, request: SchedulePredictionRequest) -> SchedulePredictionResponse:
        """预测项目完成时间"""
        tasks = self._parse_tasks(request.tasks)
        current_date = datetime.now()
        if request.current_date:
            current_date = datetime.strptime(request.current_date, "%Y-%m-%d")
        
        # 计算关键路径
        critical_path = self._calculate_critical_path(tasks)
        
        # 预测完成日期
        prediction = self._predict_completion(tasks, critical_path, current_date)
        
        # 找出瓶颈
        bottlenecks = self._identify_bottlenecks(tasks, critical_path)
        
        # 生成建议
        suggestions = self._generate_suggestions(tasks, prediction, bottlenecks)
        
        return SchedulePredictionResponse(
            success=True,
            message="进度预测完成",
            prediction={
                "predicted_end_date": prediction.predicted_end_date.strftime("%Y-%m-%d"),
                "confidence": prediction.confidence,
                "delay_probability": prediction.delay_probability,
                "estimated_delay_days": prediction.estimated_delay_days,
                "critical_factors": prediction.critical_factors
            },
            critical_path=critical_path,
            bottlenecks=bottlenecks,
            suggestions=suggestions
        )
    
    def _parse_tasks(self, task_dicts: List[Dict]) -> List[Task]:
        """解析任务"""
        tasks = []
        for t in task_dicts:
            task = Task(
                id=t.get("id", ""),
                title=t.get("title", ""),
                start_date=datetime.strptime(t.get("startDate", t.get("start_date", "2025-01-01")), "%Y-%m-%d"),
                end_date=datetime.strptime(t.get("dueDate", t.get("end_date", "2025-01-01")), "%Y-%m-%d"),
                duration_days=t.get("duration", 1),
                progress=t.get("progress", t.get("completedPercent", 0)),
                status=TaskStatus(t.get("status", "NotStarted")),
                dependencies=t.get("dependencies", [])
            )
            tasks.append(task)
        return tasks
    
    def _calculate_critical_path(self, tasks: List[Task]) -> List[str]:
        """使用CPM算法计算关键路径"""
        if not tasks:
            return []
        
        task_map = {t.id: t for t in tasks}
        
        # 计算最早开始/结束时间（前向遍历）
        earliest_start = {}
        earliest_finish = {}
        
        # 拓扑排序
        sorted_tasks = self._topological_sort(tasks)
        
        for task in sorted_tasks:
            if not task.dependencies:
                earliest_start[task.id] = task.start_date
            else:
                max_ef = max(
                    earliest_finish.get(dep, task.start_date)
                    for dep in task.dependencies
                )
                earliest_start[task.id] = max_ef
            
            earliest_finish[task.id] = earliest_start[task.id] + timedelta(days=task.duration_days - 1)
        
        # 找出关键路径（总浮动时间为0的任务）
        project_end = max(earliest_finish.values()) if earliest_finish else datetime.now()
        
        critical_path = []
        for task in sorted_tasks:
            lf = project_end  # 简化：假设最晚完成等于项目结束
            ls = lf - timedelta(days=task.duration_days - 1)
            ef = earliest_finish.get(task.id, task.end_date)
            
            # 如果最早完成等于最晚完成，则在关键路径上
            if abs((ef - lf).days) <= 1:
                critical_path.append(task.id)
        
        return critical_path
    
    def _topological_sort(self, tasks: List[Task]) -> List[Task]:
        """拓扑排序任务"""
        task_map = {t.id: t for t in tasks}
        in_degree = {t.id: len(t.dependencies) for t in tasks}
        
        # 找到入度为0的任务
        queue = [t for t in tasks if in_degree[t.id] == 0]
        result = []
        
        while queue:
            task = queue.pop(0)
            result.append(task)
            
            # 找到依赖于此任务的其他任务
            for t in tasks:
                if task.id in t.dependencies:
                    in_degree[t.id] -= 1
                    if in_degree[t.id] == 0:
                        queue.append(t)
        
        # 添加剩余任务（有循环依赖的情况）
        for task in tasks:
            if task not in result:
                result.append(task)
        
        return result
    
    def _predict_completion(
        self, 
        tasks: List[Task], 
        critical_path: List[str], 
        current_date: datetime
    ) -> SchedulePrediction:
        """预测完成时间"""
        
        # 计算已完成和剩余工作
        total_work = sum(t.duration_days for t in tasks)
        completed_work = sum(t.duration_days * (t.progress / 100) for t in tasks)
        remaining_work = total_work - completed_work
        
        # 计算历史完成速度（最近完成的任务）
        completed_tasks = [t for t in tasks if t.progress == 100]
        if completed_tasks:
            avg_velocity = len(completed_tasks) / max(1, (current_date - min(t.start_date for t in completed_tasks)).days)
        else:
            avg_velocity = 0.1  # 默认假设
        
        # 预测剩余天数
        if avg_velocity > 0:
            predicted_remaining_days = int(remaining_work / avg_velocity / len(tasks))
        else:
            predicted_remaining_days = int(remaining_work)
        
        # 考虑风险因素调整
        delay_probability = self._calculate_delay_probability(tasks, critical_path)
        if delay_probability > 0.5:
            predicted_remaining_days = int(predicted_remaining_days * 1.3)
        
        predicted_end = current_date + timedelta(days=predicted_remaining_days)
        
        # 找出关键影响因素
        critical_factors = []
        if len([t for t in tasks if t.progress < 100 and t.end_date < current_date]) > 0:
            critical_factors.append("存在延期任务")
        if len(critical_path) > len(tasks) * 0.6:
            critical_factors.append("关键路径过长")
        
        return SchedulePrediction(
            predicted_end_date=predicted_end,
            confidence=max(0.3, 1 - delay_probability),
            delay_probability=delay_probability,
            estimated_delay_days=max(0, predicted_remaining_days - (max(t.end_date for t in tasks) - current_date).days),
            critical_factors=critical_factors if critical_factors else ["按计划进行"]
        )
    
    def _calculate_delay_probability(self, tasks: List[Task], critical_path: List[str]) -> float:
        """计算延期概率"""
        risk_factors = 0
        
        # 延期任务比例
        overdue = len([t for t in tasks if t.progress < 100 and t.end_date < datetime.now()])
        if overdue > 0:
            risk_factors += min(0.5, overdue / len(tasks))
        
        # 关键路径上的未完成高优先级任务
        critical_incomplete = [
            t for t in tasks 
            if t.id in critical_path and t.progress < 100 and t.priority in [Priority.URGENT, Priority.IMPORTANT]
        ]
        risk_factors += len(critical_incomplete) * 0.1
        
        # 进度落后
        for t in tasks:
            if t.progress < 100:
                expected_progress = self._calculate_expected_progress(t)
                if t.progress < expected_progress * 0.7:
                    risk_factors += 0.1
        
        return min(0.95, risk_factors)
    
    def _calculate_expected_progress(self, task: Task) -> float:
        """计算期望进度"""
        if datetime.now() < task.start_date:
            return 0
        if datetime.now() > task.end_date:
            return 100
        
        total_days = (task.end_date - task.start_date).days + 1
        elapsed_days = (datetime.now() - task.start_date).days
        return min(100, max(0, (elapsed_days / total_days) * 100))
    
    def _identify_bottlenecks(self, tasks: List[Task], critical_path: List[str]) -> List[Dict]:
        """识别瓶颈"""
        bottlenecks = []
        
        for task_id in critical_path:
            task = next((t for t in tasks if t.id == task_id), None)
            if task and task.progress < 100:
                # 检查是否有多个任务依赖于此
                dependents = [t for t in tasks if task_id in t.dependencies]
                if len(dependents) > 2:
                    bottlenecks.append({
                        "task_id": task_id,
                        "task_title": task.title,
                        "type": "依赖瓶颈",
                        "impact": f"阻塞{len(dependents)}个后续任务",
                        "severity": "high"
                    })
        
        return bottlenecks
    
    def _generate_suggestions(
        self, 
        tasks: List[Task], 
        prediction: SchedulePrediction, 
        bottlenecks: List[Dict]
    ) -> List[str]:
        """生成建议"""
        suggestions = []
        
        if prediction.delay_probability > 0.7:
            suggestions.append("⚠️ 延期风险极高，建议立即评估是否需要调整项目范围或截止日期")
        elif prediction.delay_probability > 0.4:
            suggestions.append("⚡ 存在延期风险，建议加快关键路径上的任务进度")
        
        if bottlenecks:
            suggestions.append(f"🎯 发现{len(bottlenecks)}个瓶颈任务，优先解决: {', '.join(b['task_title'] for b in bottlenecks[:3])}")
        
        # 资源建议
        in_progress = [t for t in tasks if t.status == TaskStatus.IN_PROGRESS]
        if len(in_progress) > 5:
            suggestions.append("📊 并行任务过多，建议聚焦完成关键任务")
        
        if not suggestions:
            suggestions.append("✅ 项目进展良好，继续保持")
        
        return suggestions


class ResourceOptimizer:
    """资源优化器"""
    
    def analyze_conflicts(self, request: ResourceConflictRequest) -> ResourceConflictResponse:
        """分析资源冲突"""
        tasks = self._parse_tasks(request.tasks)
        
        # 检测资源冲突
        conflicts = self._detect_conflicts(tasks)
        
        # 计算资源利用率
        utilization = self._calculate_utilization(tasks)
        
        # 生成优化建议
        suggestions = self._generate_optimization_suggestions(conflicts, utilization)
        
        return ResourceConflictResponse(
            success=True,
            message=f"检测到{len(conflicts)}个资源冲突",
            conflicts=[asdict(c) if isinstance(c, Risk) else c for c in conflicts],
            resource_utilization=utilization,
            suggestions=suggestions
        )
    
    def _parse_tasks(self, task_dicts: List[Dict]) -> List[Task]:
        """解析任务"""
        tasks = []
        for t in task_dicts:
            task = Task(
                id=t.get("id", ""),
                title=t.get("title", ""),
                start_date=datetime.strptime(t.get("startDate", t.get("start_date", "2025-01-01")), "%Y-%m-%d"),
                end_date=datetime.strptime(t.get("dueDate", t.get("end_date", "2025-01-01")), "%Y-%m-%d"),
                duration_days=t.get("duration", 1),
                assignees=t.get("assigneeIds", []) if isinstance(t.get("assigneeIds"), list) else [],
                resources=t.get("resources", [])
            )
            tasks.append(task)
        return tasks
    
    def _detect_conflicts(self, tasks: List[Task]) -> List[Dict]:
        """检测资源冲突"""
        conflicts = []
        
        # 检查人员冲突（同一人在同一时间被分配多个任务）
        assignee_schedule = defaultdict(list)
        for task in tasks:
            for assignee in task.assignees:
                assignee_schedule[assignee].append(task)
        
        for assignee, assigned_tasks in assignee_schedule.items():
            # 检查重叠
            for i, task1 in enumerate(assigned_tasks):
                for task2 in assigned_tasks[i+1:]:
                    if self._tasks_overlap(task1, task2):
                        conflicts.append({
                            "type": "人员冲突",
                            "resource": assignee,
                            "task1": task1.title,
                            "task2": task2.title,
                            "overlap_days": self._calculate_overlap(task1, task2),
                            "severity": "high"
                        })
        
        return conflicts
    
    def _tasks_overlap(self, task1: Task, task2: Task) -> bool:
        """检查两个任务是否时间重叠"""
        return task1.start_date <= task2.end_date and task2.start_date <= task1.end_date
    
    def _calculate_overlap(self, task1: Task, task2: Task) -> int:
        """计算重叠天数"""
        start = max(task1.start_date, task2.start_date)
        end = min(task1.end_date, task2.end_date)
        return max(0, (end - start).days + 1)
    
    def _calculate_utilization(self, tasks: List[Task]) -> Dict[str, float]:
        """计算资源利用率"""
        utilization = {}
        
        # 计算每人工作负载
        assignee_workload = defaultdict(int)
        for task in tasks:
            for assignee in task.assignees:
                assignee_workload[assignee] += task.duration_days
        
        # 标准化为百分比（假设每月20个工作日）
        for assignee, days in assignee_workload.items():
            utilization[assignee] = min(100, days / 20 * 100)
        
        return dict(utilization)
    
    def _generate_optimization_suggestions(self, conflicts: List[Dict], utilization: Dict[str, float]) -> List[str]:
        """生成优化建议"""
        suggestions = []
        
        if conflicts:
            suggestions.append(f"⚠️ 发现{len(conflicts)}个资源冲突，建议重新分配任务或调整时间")
        
        # 找出过载和欠载的资源
        overloaded = [name for name, load in utilization.items() if load > 80]
        underloaded = [name for name, load in utilization.items() if load < 30]
        
        if overloaded:
            suggestions.append(f"🔴 {', '.join(overloaded)} 工作负载过高(>80%)，建议分担任务")
        
        if underloaded:
            suggestions.append(f"🟢 {', '.join(underloaded)} 工作负载较低(<30%)，可分配更多任务")
        
        if not suggestions:
            suggestions.append("✅ 资源分配合理")
        
        return suggestions


# ===============================
# Unified AI Service
# ===============================

class EnhancedGanttAIService:
    """增强版甘特图AI服务"""
    
    def __init__(self):
        self.llm = LLMClient()
        self.decomposer = TaskDecomposer(self.llm)
        self.risk_analyzer = RiskAnalyzer()
        self.predictor = SchedulePredictor()
        self.optimizer = ResourceOptimizer()
    
    def process_natural_language(self, request: NaturalLanguageRequest) -> NaturalLanguageResponse:
        """处理自然语言请求"""
        
        # 意图识别
        intent = self._identify_intent(request.message)
        
        # 根据意图调用相应的功能
        if intent == "decompose":
            return self._handle_decompose_request(request)
        elif intent == "risk_analysis":
            return self._handle_risk_request(request)
        elif intent == "schedule_prediction":
            return self._handle_prediction_request(request)
        elif intent == "resource_optimization":
            return self._handle_resource_request(request)
        else:
            # 默认处理（基本操作）
            return self._handle_basic_operations(request)
    
    def _identify_intent(self, message: str) -> str:
        """识别用户意图"""
        msg_lower = message.lower()
        
        decomposition_keywords = ["分解", "拆解", "规划", "plan", "分解任务", "智能分解"]
        risk_keywords = ["风险", "预警", "分析风险", "risk", "分析风险"]
        prediction_keywords = ["预测", "什么时候完成", "进度预测", "predict", "forecast"]
        resource_keywords = ["资源", "冲突", "负载", "resource", "冲突检测"]
        
        for kw in decomposition_keywords:
            if kw in msg_lower:
                return "decompose"
        
        for kw in risk_keywords:
            if kw in msg_lower:
                return "risk_analysis"
        
        for kw in prediction_keywords:
            if kw in msg_lower:
                return "schedule_prediction"
        
        for kw in resource_keywords:
            if kw in msg_lower:
                return "resource_optimization"
        
        return "basic"
    
    def _handle_decompose_request(self, request: NaturalLanguageRequest) -> NaturalLanguageResponse:
        """处理任务分解请求"""
        # 从消息中提取信息
        goal = request.message.replace("分解", "").replace("规划", "").strip()
        
        decompose_req = DecomposeRequest(
            goal=goal,
            start_date=datetime.now().strftime("%Y-%m-%d"),
            team_size=3,
            complexity="medium"
        )
        
        result = self.decomposer.decompose(decompose_req)
        
        if result.success:
            # 转换为actions
            actions = []
            
            # 先创建分组
            for phase in result.phases:
                actions.append({
                    "type": "add_bucket",
                    "params": {"name": phase["name"], "bucketType": "task"},
                    "description": f"创建阶段: {phase['name']}"
                })
            
            # 再创建任务
            for task in result.tasks:
                actions.append({
                    "type": "add_task",
                    "params": {
                        "title": task["title"],
                        "startDate": task["start_date"],
                        "dueDate": task["end_date"],
                        "priority": task.get("priority", "Normal"),
                        "bucketId": task.get("phase", "")
                    },
                    "description": f"创建任务: {task['title']}"
                })
            
            return NaturalLanguageResponse(
                success=True,
                message=result.message,
                intent="decompose",
                actions=actions,
                analysis={
                    "estimated_duration": result.estimated_duration_days,
                    "confidence": result.confidence
                }
            )
        else:
            return NaturalLanguageResponse(
                success=False,
                message=result.message,
                intent="decompose",
                actions=[]
            )
    
    def _handle_risk_request(self, request: NaturalLanguageRequest) -> NaturalLanguageResponse:
        """处理风险分析请求"""
        if not request.context or "tasks" not in request.context:
            return NaturalLanguageResponse(
                success=False,
                message="请先提供项目任务数据",
                intent="risk_analysis",
                actions=[]
            )
        
        risk_req = RiskAnalysisRequest(tasks=request.context["tasks"])
        result = self.risk_analyzer.analyze(risk_req)
        
        return NaturalLanguageResponse(
            success=result.success,
            message=result.message,
            intent="risk_analysis",
            actions=[],
            analysis={
                "overall_risk": result.overall_risk_level.value,
                "risk_count": sum(result.risk_summary.values()),
                "risks": result.risks[:5],  # 只返回前5个
                "recommendations": result.recommendations
            }
        )
    
    def _handle_prediction_request(self, request: NaturalLanguageRequest) -> NaturalLanguageResponse:
        """处理进度预测请求"""
        if not request.context or "tasks" not in request.context:
            return NaturalLanguageResponse(
                success=False,
                message="请先提供项目任务数据",
                intent="schedule_prediction",
                actions=[]
            )
        
        pred_req = SchedulePredictionRequest(tasks=request.context["tasks"])
        result = self.predictor.predict(pred_req)
        
        return NaturalLanguageResponse(
            success=result.success,
            message=result.message,
            intent="schedule_prediction",
            actions=[],
            analysis={
                "prediction": result.prediction,
                "critical_path": result.critical_path,
                "bottlenecks": result.bottlenecks,
                "suggestions": result.suggestions
            }
        )
    
    def _handle_resource_request(self, request: NaturalLanguageRequest) -> NaturalLanguageResponse:
        """处理资源优化请求"""
        if not request.context or "tasks" not in request.context:
            return NaturalLanguageResponse(
                success=False,
                message="请先提供项目任务数据",
                intent="resource_optimization",
                actions=[]
            )
        
        resource_req = ResourceConflictRequest(tasks=request.context["tasks"])
        result = self.optimizer.analyze_conflicts(resource_req)
        
        return NaturalLanguageResponse(
            success=result.success,
            message=result.message,
            intent="resource_optimization",
            actions=[],
            analysis={
                "conflicts": result.conflicts,
                "utilization": result.resource_utilization,
                "suggestions": result.suggestions
            }
        )
    
    def _handle_basic_operations(self, request: NaturalLanguageRequest) -> NaturalLanguageResponse:
        """处理基本操作请求"""
        # 这里可以集成原有的基本操作逻辑
        # 简化处理，返回提示
        return NaturalLanguageResponse(
            success=True,
            message="我可以帮您：1) 智能分解任务 2) 分析项目风险 3) 预测完成时间 4) 优化资源分配。请描述您的需求。",
            intent="basic",
            actions=[],
            analysis={}
        )


# ===============================
# FastAPI Application
# ===============================

app = FastAPI(
    title="Gantt Graph AI Service - Enhanced",
    description="智能任务分解、风险预警、进度预测、资源优化",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service instance
ai_service = EnhancedGanttAIService()


@app.get("/")
async def root():
    return {
        "service": "Gantt Graph AI Service - Enhanced",
        "version": "2.0.0",
        "features": [
            "智能任务分解",
            "风险预警分析",
            "进度预测",
            "资源冲突检测",
            "关键路径分析"
        ]
    }


@app.post("/api/v2/decompose", response_model=DecomposeResponse)
async def decompose_tasks(request: DecomposeRequest):
    """智能任务分解"""
    return ai_service.decomposer.decompose(request)


@app.post("/api/v2/analyze-risks", response_model=RiskAnalysisResponse)
async def analyze_risks(request: RiskAnalysisRequest):
    """风险分析"""
    return ai_service.risk_analyzer.analyze(request)


@app.post("/api/v2/predict-schedule", response_model=SchedulePredictionResponse)
async def predict_schedule(request: SchedulePredictionRequest):
    """进度预测"""
    return ai_service.predictor.predict(request)


@app.post("/api/v2/analyze-resources", response_model=ResourceConflictResponse)
async def analyze_resources(request: ResourceConflictRequest):
    """资源分析"""
    return ai_service.optimizer.analyze_conflicts(request)


@app.post("/api/v2/chat", response_model=NaturalLanguageResponse)
async def chat(request: NaturalLanguageRequest):
    """统一对话接口"""
    return ai_service.process_natural_language(request)


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, reload=True)
