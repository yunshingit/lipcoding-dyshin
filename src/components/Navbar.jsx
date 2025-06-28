import React from "react";
import { Link, useNavigate } from "react-router-dom";
import './Navbar.css';

export default function Navbar({ isLoggedIn, onLogout }) {
  const navigate = useNavigate();
  return (
    <nav className="navbar">
      <div className="navbar-logo" onClick={() => navigate("/")}>멘토-멘티 매칭</div>
      <div className="navbar-links">
        <Link to="/mentors">멘토 리스트</Link>
        {isLoggedIn ? (
          <>
            <Link to="/profile">내 프로필</Link>
            <Link to="/match">매칭</Link>
            <button className="navbar-btn" onClick={onLogout}>로그아웃</button>
          </>
        ) : (
          <>
            <Link to="/login">로그인</Link>
            <Link to="/signup">회원가입</Link>
          </>
        )}
      </div>
    </nav>
  );
}
