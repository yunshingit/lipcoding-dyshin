import { useState } from 'react';
import Toast, { useToast } from '../components/Toast';
import Navbar from '../components/Navbar';

export default function SignupPage({ showToast }) {
    const [signupData, setSignupData] = useState({
        email: '', password: '', name: '', role: 'mentee',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // 실시간 유효성 검사
    const validate = () => {
        if (!signupData.email.includes('@')) return '이메일 형식이 올바르지 않습니다.';
        if (signupData.password.length < 6) return '비밀번호는 6자 이상이어야 합니다.';
        if (!signupData.name) return '이름을 입력하세요.';
        return '';
    };

    const handleSignupChange = (e) => {
        setSignupData({ ...signupData, [e.target.name]: e.target.value });
        setError('');
        setSuccess('');
    };

    const handleSignup = async (e) => {
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
            const res = await fetch('http://localhost:8000/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(signupData),
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess('회원가입 성공!');
                showToast && showToast('회원가입이 완료되었습니다.', 'success');
                setSignupData({ email: '', password: '', name: '', role: 'mentee' });
            } else {
                setError(data.detail || '회원가입 실패');
                showToast && showToast(data.detail || '회원가입 실패', 'error');
            }
        } catch (err) {
            setError('네트워크 오류');
            showToast && showToast('네트워크 오류', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="evangelion-card" style={{ maxWidth: 400 }}>
                <h2 className="evangelion-title">회원가입</h2>
                <form onSubmit={handleSignup} autoComplete="off">
                    <input className="evangelion-input" name="email" type="email" placeholder="이메일" value={signupData.email} onChange={handleSignupChange} required />
                    <input className="evangelion-input" name="password" type="password" placeholder="비밀번호(6자 이상)" value={signupData.password} onChange={handleSignupChange} required minLength={6} />
                    <input className="evangelion-input" name="name" placeholder="이름" value={signupData.name} onChange={handleSignupChange} required />
                    <select className="evangelion-select" name="role" value={signupData.role} onChange={handleSignupChange}>
                        <option value="mentor">멘토</option>
                        <option value="mentee">멘티</option>
                    </select>
                    <button className="evangelion-btn" type="submit" disabled={loading} style={{ width: '100%' }}>
                        {loading ? '가입 중...' : '회원가입'}
                    </button>
                </form>
                {error && <p style={{ color: '#ff5555', margin: '1em 0 0' }}>{error}</p>}
                {success && <p style={{ color: '#39ff14', margin: '1em 0 0' }}>{success}</p>}
            </div>
        </>
    );
}
