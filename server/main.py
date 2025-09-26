# main.py
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import datetime
import uvicorn

app = FastAPI(
    title="Issue Tracker API",
    description="A simple API for managing project issues.",
    version="1.0.0",
)

# Configure CORS to allow requests from the React frontend
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Models (Using Pydantic) ---
class IssueBase(BaseModel):
    title: str = Field(..., min_length=1)
    description: str
    status: str
    priority: str
    assignee: str

class IssueCreate(IssueBase):
    pass

class IssueUpdate(IssueBase):
    pass

class Issue(IssueBase):
    id: int
    createdAt: datetime.datetime
    updatedAt: datetime.datetime

    class Config:
        orm_mode = True

class IssueListResponse(BaseModel):
    items: List[Issue]
    total: int

# --- In-memory database ---
issues_db: Dict[int, Issue] = {}
next_id = 1

def generate_initial_issues():
    global issues_db, next_id
    initial_issues = [
        {"title": 'Fix login button styling on mobile', "description": 'The login button is misaligned on screens smaller than 375px. Needs CSS adjustment.', "status": 'Open', "priority": 'High', "assignee": 'Alice'},
        {"title": 'Implement password reset functionality', "description": 'Users need a way to reset their password via email. This involves backend and frontend changes.', "status": 'In Progress', "priority": 'High', "assignee": 'Bob'},
        {"title": 'Update documentation for API endpoint v2', "description": 'The documentation for the new /api/v2/users endpoint is outdated. It needs to reflect the new response format.', "status": 'Open', "priority": 'Medium', "assignee": 'Charlie'},
        {"title": 'Refactor user authentication service', "description": 'The current authentication service is monolithic and hard to maintain. It should be broken down into smaller, testable units.', "status": 'Done', "priority": 'Low', "assignee": 'Alice'},
        {"title": 'Add loading spinners to data tables', "description": 'When data is being fetched for tables, a loading spinner should be displayed to improve user experience.', "status": 'In Progress', "priority": 'Medium', "assignee": 'David'},
        {"title": 'UI bug on the dashboard with dark mode', "description": 'The chart colors on the dashboard are not visible in dark mode.', "status": 'Open', "priority": 'High', "assignee": 'Eve'},
        {"title": 'Optimize database query for reports', "description": 'The quarterly report generation is too slow. The main SQL query needs optimization.', "status": 'Done', "priority": 'High', "assignee": 'Frank'},
        {"title": 'Add support for single sign-on (SSO)', "description": 'Integrate with an OAuth2 provider to allow users to sign in with their Google accounts.', "status": 'Open', "priority": 'Medium', "assignee": 'Grace'},
        {"title": 'Fix typo in the footer', "description": 'There is a spelling mistake in the copyright notice in the footer.', "status": 'Open', "priority": 'Low', "assignee": 'Bob'},
        {"title": 'Prepare for production release v1.2.0', "description": 'Create a release branch, update version numbers, and run final regression tests.', "status": 'In Progress', "priority": 'High', "assignee": 'Heidi'}
    ]
    for issue_data in initial_issues:
        new_issue = Issue(
            id=next_id,
            createdAt=datetime.datetime.now(),
            updatedAt=datetime.datetime.now(),
            **issue_data
        )
        issues_db[next_id] = new_issue
        next_id += 1

generate_initial_issues()

# --- Endpoints ---
@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/issues", response_model=IssueListResponse)
def read_issues(
    q: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assignee: Optional[str] = None,
    sort_by: str = "updatedAt",
    sort_dir: str = "desc",
    page: int = 1,
    page_size: int = 5,
):
    filtered_issues = list(issues_db.values())
    
    if q:
        filtered_issues = [
            issue for issue in filtered_issues if q.lower() in issue.title.lower()
        ]
    if status:
        filtered_issues = [
            issue for issue in filtered_issues if issue.status == status
        ]
    if priority:
        filtered_issues = [
            issue for issue in filtered_issues if issue.priority == priority
        ]
    if assignee:
        filtered_issues = [
            issue for issue in filtered_issues if issue.assignee == assignee
        ]

    # Custom sort logic
    PRIORITY_ORDER = {'High': 0, 'Medium': 1, 'Low': 2}
    def get_sort_key(issue):
        if sort_by == 'priority':
            return PRIORITY_ORDER.get(issue.priority, 99)
        if sort_by == 'id':
            return issue.id
        if sort_by == 'updatedAt':
            # sort by datetime; consistent
            return issue.updatedAt
        # fallback to attribute
        return getattr(issue, sort_by, None)

    filtered_issues.sort(key=get_sort_key, reverse=(sort_dir == "desc"))

    # Pagination
    total = len(filtered_issues)
    start_index = (page - 1) * page_size
    end_index = start_index + page_size
    paginated_issues = filtered_issues[start_index:end_index]

    return {"items": paginated_issues, "total": total}

@app.get("/issues/{issue_id}", response_model=Issue)
def read_issue(issue_id: int):
    issue = issues_db.get(issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue

@app.post("/issues", response_model=Issue, status_code=201)
def create_issue(issue: IssueCreate):
    global next_id
    new_issue = Issue(
        id=next_id,
        createdAt=datetime.datetime.now(),
        updatedAt=datetime.datetime.now(),
        **issue.dict()
    )
    issues_db[next_id] = new_issue
    next_id += 1
    return new_issue

@app.put("/issues/{issue_id}", response_model=Issue)
def update_issue(issue_id: int, updated_issue: IssueUpdate):
    issue = issues_db.get(issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    issue.title = updated_issue.title
    issue.description = updated_issue.description
    issue.status = updated_issue.status
    issue.priority = updated_issue.priority
    issue.assignee = updated_issue.assignee
    issue.updatedAt = datetime.datetime.now()

    issues_db[issue_id] = issue
    return issue

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
