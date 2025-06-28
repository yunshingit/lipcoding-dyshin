import React from "react";
import './MentorCard.css';

export default function MentorCard({ mentor, onMatch, isMatched, isLoading }) {
  // 프로필 이미지 URL 처리
  const imgUrl = mentor.profile_image
    ? mentor.profile_image
    : `https://placehold.co/200x200.jpg?text=MENTOR`;

  return (
    <div className="mentor-card">
      <img
        className="mentor-card-img"
        src={imgUrl}
        alt="프로필"
      />
      <div className="mentor-card-body">
        <div className="mentor-card-name">{mentor.name}</div>
        <div className="mentor-card-tech">{mentor.tech_stack}</div>
        <div className="mentor-card-intro">{mentor.intro}</div>
        <button
          className="mentor-card-btn"
          onClick={() => onMatch(mentor)}
          disabled={isMatched || isLoading}
        >
          {isLoading ? (
            <span className="mentor-card-spinner" />
          ) : isMatched ? "매칭 요청됨" : "매칭 요청"}
        </button>
      </div>
    </div>
  );
}
