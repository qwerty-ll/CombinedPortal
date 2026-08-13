from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr

# --- User & Auth Schemas ---
class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    email: Optional[EmailStr] = None
    group_number: Optional[str] = None
    role: Optional[str] = "student"

class UserLogin(BaseModel):
    username: str
    password: str

class EiosLoginRequest(BaseModel):
    username: str
    password: str
    group_number: Optional[str] = None

class SdoLoginRequest(EiosLoginRequest):
    pass

class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    role: str
    group_number: Optional[str] = None
    email: Optional[str] = None
    userpictureurl: Optional[str] = None
    courses: Optional[List[dict]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class RoleUpdateSchema(BaseModel):
    role: str

# --- Forum Schemas ---
class ForumAnswerCreate(BaseModel):
    content: str

class ForumAnswerResponse(BaseModel):
    id: int
    question_id: int
    author_id: int
    author_name: str
    content: str
    is_solution: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ForumQuestionCreate(BaseModel):
    title: str
    category: str = "Учеба"
    content: str

class ForumQuestionResponse(BaseModel):
    id: int
    author_id: int
    author_name: str
    title: str
    category: str
    content: str
    views_count: int
    votes_count: int
    answers_count: int
    user_vote: Optional[int] = 0
    is_pinned: bool
    created_at: datetime

    class Config:
        from_attributes = True

class VoteRequest(BaseModel):
    vote_type: int

# --- Admin Content Schemas ---
class TeacherCreate(BaseModel):
    name: str
    department: str
    role: str
    email: Optional[str] = None
    office: Optional[str] = "Б-209"
    hours: Optional[str] = None
    courses: Optional[str] = None
    photo_url: Optional[str] = None

class TeacherResponse(TeacherCreate):
    id: int

    class Config:
        from_attributes = True

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    is_important: Optional[bool] = False

class AnnouncementResponse(AnnouncementCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class FaqItemCreate(BaseModel):
    question: str
    answer: str
    category: Optional[str] = "Общие"
    order_index: Optional[int] = 0

class FaqItemResponse(FaqItemCreate):
    id: int

    class Config:
        from_attributes = True

# --- Chatbot Schemas ---
class ChatMessageTurn(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessageTurn]] = []

class ChatResponse(BaseModel):
    reply: str
