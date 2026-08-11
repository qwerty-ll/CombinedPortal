from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.database import get_db
import app.models as models
import app.schemas as schemas
import app.core.security as security

router = APIRouter(prefix="/api/v1/forum", tags=["Forum"])

@router.get("/questions", response_model=List[schemas.ForumQuestionResponse])
def get_forum_questions(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: Optional[models.User] = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.ForumQuestion)
    if category and category != "Все":
        query = query.filter(models.ForumQuestion.category == category)
    if search:
        safe_search = search.replace("%", "\\%").replace("_", "\\_")
        query = query.filter(
            (models.ForumQuestion.title.ilike(f"%{safe_search}%")) | 
            (models.ForumQuestion.content.ilike(f"%{safe_search}%"))
        )

    questions = query.order_by(models.ForumQuestion.is_pinned.desc(), models.ForumQuestion.created_at.desc()).all()

    q_ids = [q.id for q in questions]
    votes_dict = {}
    answers_dict = {}
    user_votes_dict = {}

    if q_ids:
        votes_query = (
            db.query(models.Vote.question_id, models.Vote.vote_type, func.count(models.Vote.id))
            .filter(models.Vote.question_id.in_(q_ids))
            .group_by(models.Vote.question_id, models.Vote.vote_type)
            .all()
        )
        for q_id, v_type, count in votes_query:
            if q_id not in votes_dict:
                votes_dict[q_id] = 0
            votes_dict[q_id] += count if v_type == 1 else -count

        answers_query = (
            db.query(models.ForumAnswer.question_id, func.count(models.ForumAnswer.id))
            .filter(models.ForumAnswer.question_id.in_(q_ids))
            .group_by(models.ForumAnswer.question_id)
            .all()
        )
        answers_dict = {q_id: count for q_id, count in answers_query}

        if current_user:
            u_votes = (
                db.query(models.Vote.question_id, models.Vote.vote_type)
                .filter(models.Vote.question_id.in_(q_ids), models.Vote.user_id == current_user.id)
                .all()
            )
            user_votes_dict = {q_id: v_type for q_id, v_type in u_votes}

    result = []
    for q in questions:
        result.append(schemas.ForumQuestionResponse(
            id=q.id,
            author_id=q.author_id,
            author_name=q.author.full_name if q.author else "Студент",
            title=q.title,
            category=q.category,
            content=q.content,
            views_count=q.views_count,
            votes_count=votes_dict.get(q.id, 0),
            answers_count=answers_dict.get(q.id, 0),
            user_vote=user_votes_dict.get(q.id, 0),
            is_pinned=q.is_pinned,
            created_at=q.created_at
        ))
    return result

@router.post("/questions", response_model=schemas.ForumQuestionResponse)
def create_question(
    q_in: schemas.ForumQuestionCreate,
    current_user: models.User = Depends(security.require_current_user),
    db: Session = Depends(get_db)
):
    new_q = models.ForumQuestion(
        author_id=current_user.id,
        title=q_in.title,
        category=q_in.category,
        content=q_in.content
    )
    db.add(new_q)
    db.commit()
    db.refresh(new_q)

    return schemas.ForumQuestionResponse(
        id=new_q.id,
        author_id=new_q.author_id,
        author_name=current_user.full_name,
        title=new_q.title,
        category=new_q.category,
        content=new_q.content,
        views_count=0,
        votes_count=0,
        answers_count=0,
        user_vote=0,
        is_pinned=False,
        created_at=new_q.created_at
    )

@router.get("/questions/{question_id}", response_model=schemas.ForumQuestionResponse)
def get_question_detail(
    question_id: int,
    current_user: Optional[models.User] = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(models.ForumQuestion).filter(models.ForumQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Вопрос не найден")

    q.views_count += 1
    db.commit()

    upvotes = db.query(models.Vote).filter(models.Vote.question_id == q.id, models.Vote.vote_type == 1).count()
    downvotes = db.query(models.Vote).filter(models.Vote.question_id == q.id, models.Vote.vote_type == -1).count()
    answers_count = db.query(models.ForumAnswer).filter(models.ForumAnswer.question_id == q.id).count()

    user_vote = 0
    if current_user:
        v = db.query(models.Vote).filter(models.Vote.question_id == q.id, models.Vote.user_id == current_user.id).first()
        if v:
            user_vote = v.vote_type

    return schemas.ForumQuestionResponse(
        id=q.id,
        author_id=q.author_id,
        author_name=q.author.full_name if q.author else "Студент",
        title=q.title,
        category=q.category,
        content=q.content,
        views_count=q.views_count,
        votes_count=upvotes - downvotes,
        answers_count=answers_count,
        user_vote=user_vote,
        is_pinned=q.is_pinned,
        created_at=q.created_at
    )

@router.get("/questions/{question_id}/answers", response_model=List[schemas.ForumAnswerResponse])
def get_question_answers(question_id: int, db: Session = Depends(get_db)):
    answers = db.query(models.ForumAnswer).filter(models.ForumAnswer.question_id == question_id).order_by(models.ForumAnswer.created_at.asc()).all()
    return [
        schemas.ForumAnswerResponse(
            id=a.id,
            question_id=a.question_id,
            author_id=a.author_id,
            author_name=a.author.full_name if a.author else "Студент",
            content=a.content,
            is_solution=a.is_solution,
            created_at=a.created_at
        )
        for a in answers
    ]

@router.post("/questions/{question_id}/answers", response_model=schemas.ForumAnswerResponse)
def post_answer(
    question_id: int,
    ans_in: schemas.ForumAnswerCreate,
    current_user: models.User = Depends(security.require_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(models.ForumQuestion).filter(models.ForumQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Вопрос не найден")

    new_ans = models.ForumAnswer(
        question_id=question_id,
        author_id=current_user.id,
        content=ans_in.content
    )
    db.add(new_ans)
    db.commit()
    db.refresh(new_ans)

    return schemas.ForumAnswerResponse(
        id=new_ans.id,
        question_id=new_ans.question_id,
        author_id=new_ans.author_id,
        author_name=current_user.full_name,
        content=new_ans.content,
        is_solution=False,
        created_at=new_ans.created_at
    )

@router.post("/questions/{question_id}/vote")
def vote_question(
    question_id: int,
    req: schemas.VoteRequest,
    current_user: models.User = Depends(security.require_current_user),
    db: Session = Depends(get_db)
):
    vote = db.query(models.Vote).filter(models.Vote.question_id == question_id, models.Vote.user_id == current_user.id).first()
    if vote:
        if vote.vote_type == req.vote_type:
            db.delete(vote)
        else:
            vote.vote_type = req.vote_type
    else:
        new_vote = models.Vote(user_id=current_user.id, question_id=question_id, vote_type=req.vote_type)
        db.add(new_vote)
    db.commit()
    return {"status": "ok"}
