import { useState } from 'react';
import Toast, { useToast } from '../components/Toast';
import Navbar from '../components/Navbar';

export default function LoginPage({ onLogin, showToast }) {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 실시간 유효성 검사
  const validate = () => {
    if (!loginData.email.includes('@')) return '이메일 형식이 올바르지 않습니다.';
    if (!loginData.password) return '비밀번호를 입력하세요.';
    return '';
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const err = validate();
    if (err) {
      setError(err);
      showToast && showToast(err, 'error');
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('username', loginData.email);
      params.append('password', loginData.password);
      const res = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      });
      let data = null;
      try {
        data = await res.json();
      } catch (jsonErr) {
        setError('서버 응답 오류');
        showToast && showToast('서버 응답 오류', 'error');
        return;
      }
      if (res.ok && data.access_token) {
        setSuccess('로그인 성공!');
        showToast && showToast('로그인 성공!', 'success');
        onLogin && onLogin(data.access_token);
      } else {
        setError((data && data.detail) || `로그인 실패 (HTTP ${res.status})`);
        showToast && showToast((data && data.detail) || '로그인 실패', 'error');
      }
    } catch (err) {
      setError('서버 연결 오류: ' + (err.message || '네트워크 오류'));
      showToast && showToast('네트워크 오류', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="evangelion-card" style={{ maxWidth: 400 }}>
        <h2 className="evangelion-title">로그인</h2>
        <form onSubmit={handleLogin} autoComplete="off">
          <input className="evangelion-input" name="email" type="email" placeholder="이메일" value={loginData.email} onChange={handleLoginChange} required />
          <input className="evangelion-input" name="password" type="password" placeholder="비밀번호" value={loginData.password} onChange={handleLoginChange} required />
          <button className="evangelion-btn" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        {error && <p style={{ color: '#ff5555', margin: '1em 0 0' }}>{error}</p>}
        {success && <p style={{ color: '#39ff14', margin: '1em 0 0' }}>{success}</p>}
      </div>
    </>
  );
}
