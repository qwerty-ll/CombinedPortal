from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator

# --- User & Auth Schemas ---
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=80)
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=200)
    email: Optional[EmailStr] = None
    group_number: Optional[str] = Field(None, max_length=50)

    @field_validator("password")
    @classmethod
    def validate_password_quality(cls, v: str) -> str:
        if not v or len(v.strip()) < 6:
            raise ValueError("Пароль должен иметь длину не менее 6 символов")
        return v

    @field_validator("username")
    @classmethod
    def validate_username_chars(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 3:
            raise ValueError("Имя пользователя должно содержать не менее 3 символов")
        return cleaned

class UserLogin(BaseModel):
    username: str = Field(..., min_length=1, max_length=80)
    password: str = Field(..., min_length=1, max_length=128)

class EiosLoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=80)
    password: str = Field(..., min_length=1, max_length=128)
    group_number: Optional[str] = Field(None, max_length=50)

class SdoLoginRequest(EiosLoginRequest):
    pass

class UserUpdateProfile(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=200)
    group_number: Optional[str] = Field(None, max_length=50)

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
    content: str = Field(..., min_length=1, max_length=10000)

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
    title: str = Field(..., min_length=3, max_length=300)
    category: str = Field("Учеба", max_length=100)
    content: str = Field(..., min_length=10, max_length=20000)

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

    # FIX: Only allow valid vote values: 1 (upvote) or -1 (downvote)
    @field_validator("vote_type")
    @classmethod
    def validate_vote_type(cls, v: int) -> int:
        if v not in (1, -1):
            raise ValueError("vote_type must be 1 (upvote) or -1 (downvote)")
        return v

# --- Admin Content Schemas ---
class TeacherCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    department: str = Field(..., max_length=200)
    role: str = Field(..., max_length=200)
    email: Optional[str] = Field(None, max_length=200)
    office: Optional[str] = Field("Б-209", max_length=50)
    hours: Optional[str] = Field(None, max_length=200)
    courses: Optional[str] = Field(None, max_length=500)
    photo_url: Optional[str] = Field(None, max_length=500)

class TeacherResponse(TeacherCreate):
    id: int

    class Config:
        from_attributes = True

class AnnouncementCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    content: str = Field(..., min_length=1, max_length=5000)
    is_important: Optional[bool] = False

class AnnouncementResponse(AnnouncementCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class FaqItemCreate(BaseModel):
    question: str = Field(..., min_length=1, max_length=500)
    answer: str = Field(..., min_length=1, max_length=5000)
    category: Optional[str] = Field("Общие", max_length=100)
    order_index: Optional[int] = 0

class FaqItemResponse(FaqItemCreate):
    id: int

    class Config:
        from_attributes = True

class SubjectCreate(BaseModel):
    subject_code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=300)
    short_name: str = Field(..., min_length=1, max_length=100)
    emoji: Optional[str] = Field("📚", max_length=10)
    color: Optional[str] = Field("#007AFF", max_length=20)
    difficulty: Optional[int] = Field(3, ge=1, le=5)
    hours: Optional[int] = Field(108, ge=1)
    credits: Optional[int] = Field(3, ge=1)
    semester: Optional[int] = Field(1, ge=1, le=12)
    control_type: Optional[str] = Field("Зачет", max_length=50)
    extra_type: Optional[str] = Field(None, max_length=50)
    description: str = Field(..., min_length=1, max_length=5000)
    mascot_hack: Optional[str] = Field(None, max_length=2000)
    senior_advice: Optional[str] = Field(None, max_length=2000)

class SubjectResponse(SubjectCreate):
    id: int

    class Config:
        from_attributes = True

# --- Chatbot Schemas ---
class ChatMessageTurn(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., max_length=2000)

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)
    history: Optional[List[ChatMessageTurn]] = Field(default_factory=list, max_length=20)

class ChatResponse(BaseModel):
    reply: str


class UserAdaptationResponse(BaseModel):
    user_id: int
    username: str
    full_name: str
    group_number: Optional[str] = None
    completed_steps: List[int]
    progress_percent: float
    last_updated: Optional[datetime] = None

    class Config:
        from_attributes = True

