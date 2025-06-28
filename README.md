# Mentor-Mentee Matching Web App

## 프로젝트 개요
멘토와 멘티를 매칭하는 웹앱입니다. 백엔드는 FastAPI(Python), 프론트엔드는 React(Vite)로 구성되어 있습니다.

## 주요 기능
- 회원가입/로그인(JWT 인증)
- 프로필 관리(멘토/멘티)
- 멘토 목록/검색/정렬
- 멘티의 멘토 매칭 요청
- 멘토의 요청 수락/거절

## 실행 방법

### 백엔드(FastAPI)
```bash
cd backend
uvicorn main:app --reload
```

### 프론트엔드(React+Vite)
```bash
npm run dev
```

## 참고 문서
- guide/mentor-mentee-api-spec.md
- guide/mentor-mentee-app-requirements.md
