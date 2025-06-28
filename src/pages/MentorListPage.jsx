import { useState, useEffect } from 'react';
import Toast, { useToast } from '../components/Toast';
import MentorCard from '../components/MentorCard';

export default function MentorListPage() {
  const [mentors, setMentors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matching, setMatching] = useState({}); // {email: true}
  const [matched, setMatched] = useState({}); // {email: true}
  const [toast, showToast] = useToast();

  // 멘토 리스트 자동 조회
  useEffect(() => {
    fetchMentors();
    // eslint-disable-next-line
  }, []);

  // 검색/정렬 적용
  useEffect(() => {
    let data = [...mentors];
    if (search) {
      data = data.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          (m.tech_stack || '').toLowerCase().includes(search.toLowerCase())
      );
    }
    if (sort === 'name') data.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'tech_stack') data.sort((a, b) => (a.tech_stack || '').localeCompare(b.tech_stack || ''));
    setFiltered(data);
  }, [mentors, search, sort]);

  const fetchMentors = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8000/mentors');
      const data = await res.json();
      if (res.ok) setMentors(data);
      else setError('멘토 리스트 조회 실패');
    } catch (err) {
      setError('네트워크 오류');
    } finally {
      setLoading(false);
    }
  };

  // 매칭 요청
  const handleMatch = async (mentor) => {
    setMatching((prev) => ({ ...prev, [mentor.email]: true }));
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mentor_email: mentor.email }),
      });
      if (res.ok) {
        setMatched((prev) => ({ ...prev, [mentor.email]: true }));
        showToast('매칭 요청이 전송되었습니다.', 'success');
      } else {
        const data = await res.json();
        showToast(data.detail || '매칭 요청 실패', 'error');
      }
    } catch (err) {
      showToast('네트워크 오류', 'error');
    } finally {
      setMatching((prev) => ({ ...prev, [mentor.email]: false }));
    }
  };

  return (
    <>
      <Toast {...toast} />
      <div className="evangelion-card" style={{ maxWidth: 600 }}>
        <h2 className="evangelion-title">멘토 리스트</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="이름 또는 기술스택 검색"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 120, borderRadius: 6, border: '1px solid #7c3aed', padding: 8 }}
          />
          <select value={sort} onChange={e => setSort(e.target.value)} style={{ borderRadius: 6, padding: 8 }}>
            <option value="">정렬 없음</option>
            <option value="name">이름순</option>
            <option value="tech_stack">기술스택순</option>
          </select>
        </div>
        {loading ? (
          <div style={{ color: '#aaa', margin: '2em 0' }}>로딩 중...</div>
        ) : error ? (
          <div style={{ color: '#ff5555', margin: '2em 0' }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: '#aaa', margin: '2em 0' }}>멘토가 없습니다.</div>
        ) : (
          <ul className="evangelion-list" style={{ listStyle: 'none', padding: 0 }}>
            {filtered.map((m) => (
              <li key={m.email} style={{ marginBottom: 16 }}>
                <MentorCard
                  mentor={m}
                  onMatch={handleMatch}
                  isMatched={!!matched[m.email]}
                  isLoading={!!matching[m.email]}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
