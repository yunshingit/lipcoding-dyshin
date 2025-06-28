import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import MentorListPage from './pages/MentorListPage';
import ProfilePage from './pages/ProfilePage';
import MatchPage from './pages/MatchPage';
import './App.css';
import Navbar from "./components/Navbar";
import Toast, { useToast } from "./components/Toast";

function App() {
  const [token, setToken] = useState('');
  const [toast, showToast] = useToast();

  // 로그아웃
  const handleLogout = () => setToken('');

  return (
    <Router>
      <Navbar isLoggedIn={!!token} onLogout={handleLogout} />
      <main className="main-content">
        <Toast {...toast} />
        <Routes>
          <Route path="/" element={<Navigate to="/mentors" />} />
          <Route path="/signup" element={<SignupPage showToast={showToast} />} />
          <Route path="/login" element={<LoginPage onLogin={setToken} showToast={showToast} />} />
          <Route path="/mentors" element={<MentorListPage token={token} showToast={showToast} />} />
          <Route path="/profile" element={token ? <ProfilePage token={token} showToast={showToast} /> : <Navigate to="/login" />} />
          <Route path="/match" element={token ? <MatchPage token={token} showToast={showToast} /> : <Navigate to="/login" />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
