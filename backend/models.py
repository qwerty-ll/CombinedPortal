from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="student") # "student" | "moderator" | "admin"
    group_number = Column(String, nullable=True)
    sdo_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    questions = relationship("ForumQuestion", back_populates="author", cascade="all, delete-orphan")
    answers = relationship("ForumAnswer", back_populates="author", cascade="all, delete-orphan")
    votes = relationship("Vote", back_populates="user", cascade="all, delete-orphan")

class ForumQuestion(Base):
    __tablename__ = "forum_questions"

    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, index=True, nullable=False)
    category = Column(String, default="Учеба") # "Учеба" | "Общежития" | "Мероприятия" | "Карта" | "Другое"
    content = Column(Text, nullable=False)
    views_count = Column(Integer, default=0)
    is_pinned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    author = relationship("User", back_populates="questions")
    answers = relationship("ForumAnswer", back_populates="question", cascade="all, delete-orphan")
    votes = relationship("Vote", back_populates="question", cascade="all, delete-orphan")

class ForumAnswer(Base):
    __tablename__ = "forum_answers"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("forum_questions.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    is_solution = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    question = relationship("ForumQuestion", back_populates="answers")
    author = relationship("User", back_populates="answers")

class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("forum_questions.id"), nullable=False)
    vote_type = Column(Integer, nullable=False) # 1 for Up, -1 for Down

    user = relationship("User", back_populates="votes")
    question = relationship("ForumQuestion", back_populates="votes")

class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    department = Column(String, nullable=False)
    role = Column(String, nullable=False)
    email = Column(String, nullable=True)
    office = Column(String, default="Б-209")
    hours = Column(String, nullable=True)
    courses = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    is_important = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class FaqItem(Base):
    __tablename__ = "faq_items"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(String, nullable=False)
    answer = Column(Text, nullable=False)
    category = Column(String, default="Общие")
    order_index = Column(Integer, default=0)

class AnalyticsQuestion(Base):
    __tablename__ = "analytics_questions"

    id = Column(Integer, primary_key=True, index=True)
    question_text = Column(String, unique=True, index=True, nullable=False)
    ask_count = Column(Integer, default=1)
    last_asked = Column(DateTime, default=datetime.utcnow)
