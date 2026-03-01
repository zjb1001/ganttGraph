# Gantt Graph AI Agent Service

Backend service for processing natural language requests and converting them to structured Gantt chart actions.

## Setup

1. **Install dependencies**
```bash
cd agent-service
pip install -r requirements.txt
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your API key
```

3. **Run the service**
```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --port 8000
```

## API Endpoints

### POST /api/chat
Process natural language chat request.

**Request:**
```json
{
  "message": "Add a task called API Development starting next Monday for 5 days",
  "context": {
    "currentProject": "My Project",
    "buckets": [{"id": "b1", "name": "To Do"}, {"id": "b2", "name": "In Progress"}],
    "recentTasks": ["Task 1", "Task 2"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "I'll create the task 'API Development' starting next Monday for 5 days.",
  "actions": [
    {
      "type": "add_task",
      "params": {
        "title": "API Development",
        "startDate": "2024-03-18",
        "dueDate": "2024-03-23"
      },
      "description": "Create task 'API Development' from Mar 18-23"
    }
  ],
  "needs_clarification": false,
  "clarification_questions": []
}
```

### GET /
Health check and service info.

## Action Types

| Type | Description | Parameters |
|------|-------------|------------|
| `add_task` | Create a new task | title, startDate, dueDate, bucketId, priority, status |
| `add_milestone` | Create a milestone | title, date, bucketId, description |
| `update_task` | Update existing task | taskId, and fields to update |
| `delete_task` | Delete a task | taskId |
| `add_bucket` | Create a group/bucket | name, color |
| `update_bucket` | Update a bucket | bucketId, name, color |
| `delete_bucket` | Delete a bucket | bucketId |
| `add_dependency` | Add task dependency | taskId, dependsOnTaskId |
| `remove_dependency` | Remove task dependency | taskId, dependsOnTaskId |
| `set_progress` | Update task progress | taskId, progress (0-100) |
| `query` | Query information | queryType (tasks, milestones, buckets, summary) |
