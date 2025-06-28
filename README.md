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
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```
- API 기본 경로: http://localhost:8080/api
- Swagger: http://localhost:8080/api/swagger-ui
- OpenAPI: http://localhost:8080/api/openapi.json

### 프론트엔드(React+Vite)
```bash
cd src
npm install
npm run dev -- --port 3000
```
- 기본 URL: http://localhost:3000

## 참고 문서
- guide/mentor-mentee-api-spec.md
- guide/mentor-mentee-app-requirements.md
