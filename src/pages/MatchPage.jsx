import { useState } from 'react';
import Toast, { useToast } from '../components/Toast';
import Navbar from '../components/Navbar';

const statusColor = {
  accepted: '#39ff14',
  rejected: '#ff1744',
  pending: '#ffea00',
};
const statusLabel = {
  accepted: '수락',
  rejected: '거절',
  pending: '대기',
};

export default function MatchPage({ token, showToast }) {
  const [matchMentor, setMatchMentor] = useState('');
  const [matchMsg, setMatchMsg] = useState('');
  const [matchList, setMatchList] = useState([]);
  const [matchListMsg, setMatchListMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);

  // 매칭 요청 API
  const handleMatch = async (e) => {
    e.preventDefault();
    setMatchMsg('');
    if (!matchMentor.includes('@')) {
      setMatchMsg('이메일 형식이 올바르지 않습니다.');
      showToast && showToast('이메일 형식이 올바르지 않습니다.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mentor_email: matchMentor }),
      });
      const data = await res.json();
      if (res.ok) {
        setMatchMsg('매칭 요청 성공!');
        showToast && showToast('매칭 요청 성공!', 'success');
        setMatchMentor('');
      } else {
        setMatchMsg(data.detail || '매칭 요청 실패');
        showToast && showToast(data.detail || '매칭 요청 실패', 'error');
      }
    } catch (err) {
      setMatchMsg('네트워크 오류');
      showToast && showToast('네트워크 오류', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 매칭 요청 목록 조회
  const fetchMatchList = async () => {
    setMatchListMsg('');
    setListLoading(true);
    try {
      const res = await fetch('http://localhost:8000/match/requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setMatchList(data);
      else setMatchListMsg('매칭 요청 목록 조회 실패');
    } catch (err) {
      setMatchListMsg('네트워크 오류');
    } finally {
      setListLoading(false);
    }
  };

  return (
    <>
      <div className="evangelion-card" style={{ maxWidth: 500 }}>
        <h2 className="evangelion-title">멘토 매칭</h2>
        <form onSubmit={handleMatch} autoComplete="off">
          <input
            className="evangelion-input"
            name="mentor_email"
            placeholder="멘토 이메일"
            value={matchMentor}
            onChange={(e) => setMatchMentor(e.target.value)}
            required
          />
          <button
            className="evangelion-btn"
            type="submit"
            disabled={!token || loading}
            style={{ width: '100%' }}
          >
            {loading ? '요청 중...' : '매칭 요청'}
          </button>
        </form>
        {matchMsg && <p style={{ color: matchMsg.includes('성공') ? '#39ff14' : '#ff5555', margin: '1em 0 0' }}>{matchMsg}</p>}
        <h3 style={{marginTop:'1.5em'}}>매칭 요청 목록</h3>
        <button
          className="evangelion-btn"
          onClick={fetchMatchList}
          disabled={!token || listLoading}
          style={{ width: '100%', marginBottom: 8 }}
        >
          {listLoading ? '조회 중...' : '매칭 요청 목록 조회'}
        </button>
        {matchListMsg && <p style={{ color: '#ff5555' }}>{matchListMsg}</p>}
        <ul className="evangelion-list">
          {matchList.map((m, i) => (
            <li key={i}>
              <span style={{ color: '#7c3aed' }}>{m.mentee_email}</span> →{' '}
              <span style={{ color: '#39ff14' }}>{m.mentor_email}</span> [
              <b style={{ color: statusColor[m.status] }}>{statusLabel[m.status] || m.status}</b>
              ]
              {m.message && (
                <div
                  style={{
                    fontSize: '0.95em',
                    color: '#ffea00',
                  }}
                >
                  메시지: {m.message}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
