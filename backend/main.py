# main.py (FastAPI 백엔드)
# 작성자: dyshin
# 마지막 수정: 2025-06-28
# 주요 기능: 회원가입/로그인, 프로필 관리, 멘토 리스트, 매칭, 이미지 업로드, 보안 등

from fastapi import FastAPI, HTTPException, Depends, Body, UploadFile, File, APIRouter
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from datetime import datetime, timedelta
import bcrypt
import uuid
from sqlalchemy import create_engine, Column, String, Text, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import enum
import os
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(openapi_url="/api/openapi.json", docs_url=None)

# CORS 허용 (프론트엔드와 포트 다를 때 네트워크 오류 방지)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

SECRET_KEY = "your-secret-key"  # 실제 서비스에서는 환경변수로 관리
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

DATABASE_URL = "sqlite:///./app.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class UserRole(str, enum.Enum):
    mentor = "mentor"
    mentee = "mentee"

class User(Base):
    __tablename__ = "users"
    email = Column(String, primary_key=True, index=True)
    password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    intro = Column(Text, default="")
    tech_stack = Column(String, default="")
    profile_image = Column(String, default="")

class Match(Base):
    __tablename__ = "matches"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    mentee_email = Column(String, nullable=False)
    mentor_email = Column(String, nullable=False)
    status = Column(String, default="pending")
    message = Column(Text, default="")

# DB 초기화
Base.metadata.create_all(bind=engine)

class UserSignup(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str  # 'mentor' or 'mentee'

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserProfile(BaseModel):
    email: EmailStr
    name: str
    role: str
    intro: Optional[str] = None

class MentorListItem(BaseModel):
    email: EmailStr
    name: str
    intro: Optional[str] = None
    tech_stack: Optional[str] = None

class MatchRequest(BaseModel):
    mentor_email: EmailStr
    message: Optional[str] = ""

class MatchStatus(BaseModel):
    mentee_email: EmailStr
    mentor_email: EmailStr
    status: str  # 'pending', 'accepted', 'rejected'
    message: Optional[str] = ""

# 비밀번호 해시화 함수 (bcrypt만 사용)
def get_password_hash(password):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password, hashed_password):
    print(f"[DEBUG] plain_password: {plain_password}")
    print(f"[DEBUG] hashed_password: {hashed_password}")
    print(f"[DEBUG] hashed_password len: {len(hashed_password)}")
    try:
        result = bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
        print(f"[DEBUG] bcrypt.checkpw result: {result}")
        return result
    except Exception as e:
        print(f"[DEBUG] bcrypt.checkpw error: {e}")
        return False

def create_access_token(user: dict, expires_delta: Optional[timedelta] = None):
    now = datetime.utcnow()
    expire = now + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    jti = str(uuid.uuid4())
    to_encode = {
        "iss": "lipcoding-app",
        "sub": user["email"],
        "aud": "lipcoding-user",
        "exp": expire,
        "nbf": now,
        "iat": now,
        "jti": jti,
        "name": user["name"],
        "email": user["email"],
        "role": user["role"]
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_aud": False})
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    db.close()
    if user is None:
        raise credentials_exception
    return user

# DB 세션 의존성
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@api_router.post("/signup", status_code=201)
def signup(user: UserSignup, db=Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="이미 가입된 이메일입니다.")
    hashed_pw = get_password_hash(user.password)
    db_user = User(email=user.email, password=hashed_pw, name=user.name, role=user.role)
    db.add(db_user)
    db.commit()
    return {"msg": "회원가입 성공"}

@api_router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db = SessionLocal()
    user = db.query(User).filter(User.email == form_data.username).first()
    db.close()
    if user:
        print(f"[DEBUG] user.password: {user.password}")
        print(f"[DEBUG] user.password len: {len(user.password)}")
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=400, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
    # user 객체를 dict로 변환
    user_dict = {
        "email": user.email,
        "name": user.name,
        "role": user.role.value if hasattr(user.role, 'value') else user.role
    }
    access_token = create_access_token(user_dict)
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/profile", response_model=UserProfile)
def get_profile(current_user: dict = Depends(get_current_user)):
    return {"email": current_user.email, "name": current_user.name, "role": current_user.role, "intro": current_user.intro}

@api_router.put("/profile", response_model=UserProfile)
def update_profile(profile: UserProfile, current_user: dict = Depends(get_current_user)):
    db = SessionLocal()
    user = db.query(User).filter(User.email == current_user.email).first()
    user.name = profile.name
    user.intro = profile.intro
    user.role = profile.role
    db.commit()
    db.close()
    return {"email": user.email, "name": user.name, "role": user.role, "intro": user.intro}

@api_router.get("/mentors", response_model=List[MentorListItem])
def get_mentors(q: Optional[str] = None, sort: Optional[str] = None):
    db = SessionLocal()
    mentors = db.query(User).filter(User.role == UserRole.mentor)
    if q:
        mentors = mentors.filter((User.name.ilike(f"%{q}%")) | (User.tech_stack.ilike(f"%{q}%")))
    # 정렬 옵션: name, tech_stack
    if sort == "name":
        mentors = mentors.order_by(User.name)
    elif sort == "tech_stack":
        mentors = mentors.order_by(User.tech_stack)
    mentors = mentors.all()
    db.close()
    return [{"email": m.email, "name": m.name, "intro": m.intro, "tech_stack": m.tech_stack} for m in mentors]

@api_router.post("/match", response_model=MatchStatus)
def request_match(req: MatchRequest, current_user: User = Depends(get_current_user), db=Depends(get_db)):
    if current_user.role != "mentee":
        raise HTTPException(status_code=403, detail="멘티만 매칭 요청 가능")
    if db.query(Match).filter(Match.mentee_email == current_user.email).first():
        raise HTTPException(status_code=400, detail="이미 매칭 요청이 존재합니다.")
    mentor = db.query(User).filter(User.email == req.mentor_email, User.role == UserRole.mentor).first()
    if not mentor:
        raise HTTPException(status_code=404, detail="해당 멘토를 찾을 수 없습니다.")
    match = Match(mentee_email=current_user.email, mentor_email=req.mentor_email, status="pending", message=req.message)
    db.add(match)
    db.commit()
    return MatchStatus(mentee_email=current_user.email, mentor_email=req.mentor_email, status="pending", message=req.message)

@api_router.get("/match/requests", response_model=List[MatchStatus])
def get_match_requests(current_user: User = Depends(get_current_user), db=Depends(get_db)):
    if current_user.role == "mentor":
        requests = db.query(Match).filter(Match.mentor_email == current_user.email).all()
    else:
        requests = db.query(Match).filter(Match.mentee_email == current_user.email).all()
    return [MatchStatus(mentee_email=m.mentee_email, mentor_email=m.mentor_email, status=m.status, message=m.message) for m in requests]

@api_router.post("/match/respond", response_model=MatchStatus)
def respond_match(mentee_email: EmailStr, accept: bool = Body(...), current_user: User = Depends(get_current_user), db=Depends(get_db)):
    if current_user.role != "mentor":
        raise HTTPException(status_code=403, detail="멘토만 요청 수락/거절 가능")
    request = db.query(Match).filter(Match.mentee_email == mentee_email, Match.mentor_email == current_user.email).first()
    if not request:
        raise HTTPException(status_code=404, detail="요청을 찾을 수 없습니다.")
    if request.status != "pending":
        raise HTTPException(status_code=400, detail="이미 처리된 요청입니다.")
    request.status = "accepted" if accept else "rejected"
    db.commit()
    return MatchStatus(mentee_email=request.mentee_email, mentor_email=request.mentor_email, status=request.status, message=request.message)

@api_router.delete("/match/cancel", status_code=204)
def cancel_match(current_user: User = Depends(get_current_user), db=Depends(get_db)):
    # 멘티만 자신의 매칭 요청 취소 가능
    if current_user.role != "mentee":
        raise HTTPException(status_code=403, detail="멘티만 매칭 요청 취소 가능")
    match = db.query(Match).filter(Match.mentee_email == current_user.email, Match.status == "pending").first()
    if not match:
        raise HTTPException(status_code=404, detail="취소할 매칭 요청이 없습니다.")
    db.delete(match)
    db.commit()
    return

PROFILE_IMG_DIR = "profile_images"
os.makedirs(PROFILE_IMG_DIR, exist_ok=True)

@api_router.post("/profile/image")
def upload_profile_image(file: UploadFile = File(...), current_user: User = Depends(get_current_user), db=Depends(get_db)):
    # 파일 확장자 및 크기 체크
    if not (file.filename.endswith('.jpg') or file.filename.endswith('.png')):
        raise HTTPException(status_code=400, detail="jpg 또는 png 파일만 허용됩니다.")
    contents = file.file.read()
    if len(contents) > 1024 * 1024:
        raise HTTPException(status_code=400, detail="이미지 크기는 1MB 이하만 허용됩니다.")
    # 파일 저장
    ext = os.path.splitext(file.filename)[1]
    filename = f"{current_user.email}{ext}"
    path = os.path.join(PROFILE_IMG_DIR, filename)
    with open(path, "wb") as f:
        f.write(contents)
    # DB에 경로 저장
    user = db.query(User).filter(User.email == current_user.email).first()
    user.profile_image = path
    db.commit()
    return {"msg": "프로필 이미지 업로드 성공", "image_url": f"/profile/image/{current_user.email}"}

@api_router.get("/profile/image/{email}")
def get_profile_image(email: str, db=Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    if not user.profile_image or not os.path.exists(user.profile_image):
        # 기본 이미지 제공
        if user.role == UserRole.mentor:
            return {"url": "https://placehold.co/500x500.jpg?text=MENTOR"}
        else:
            return {"url": "https://placehold.co/500x500.jpg?text=MENTEE"}
    from fastapi.responses import FileResponse
    return FileResponse(user.profile_image)

app.include_router(api_router)

@app.get("/api/openapi.json")
def custom_openapi():
    return app.openapi()

@app.get("/api/swagger-ui")
def custom_swagger_ui():
    return get_swagger_ui_html(openapi_url="/api/openapi.json", title="Mentor-Mentee API Docs")

@app.get("/", include_in_schema=False)
def root_redirect():
    return RedirectResponse(url="/api/swagger-ui")

# 더미 멘토/멘티 계정 자동 생성 (테스트용)
def create_dummy_users():
    db = SessionLocal()
    if not db.query(User).filter(User.email == "mentor@test.com").first():
        db_user = User(
            email="mentor@test.com",
            password=get_password_hash("mentor1234"),
            name="테스트멘토",
            role=UserRole.mentor,
            intro="테스트 멘토입니다.",
            tech_stack="Python, FastAPI"
        )
        db.add(db_user)
    if not db.query(User).filter(User.email == "mentee@test.com").first():
        db_user = User(
            email="mentee@test.com",
            password=get_password_hash("mentee1234"),
            name="테스트멘티",
            role=UserRole.mentee,
            intro="테스트 멘티입니다.",
            tech_stack="React, Vite"
        )
        db.add(db_user)
    db.commit()
    db.close()

create_dummy_users()
