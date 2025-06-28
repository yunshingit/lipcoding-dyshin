import { useState, useEffect, useRef } from 'react';
import Toast, { useToast } from '../components/Toast';

export default function ProfilePage({ token, showToast }) {
  const [profile, setProfile] = useState(null);
  const [profileMsg, setProfileMsg] = useState('');
  const [editProfile, setEditProfile] = useState({ name: '', intro: '', role: 'mentee' });
  const [editMsg, setEditMsg] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [imgLoading, setImgLoading] = useState(false);
  const fileInputRef = useRef();

  // 진입 시 자동 조회
  useEffect(() => {
    if (token) fetchProfile();
    // eslint-disable-next-line
  }, [token]);

  const fetchProfile = async () => {
    setProfileMsg('');
    try {
      const res = await fetch('http://localhost:8000/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data);
        setEditProfile({ name: data.name, intro: data.intro || '', role: data.role });
        setImgUrl(getProfileImgUrl(data.email, data.role));
      }
      else setProfileMsg(data.detail || '프로필 조회 실패');
    } catch (err) {
      setProfileMsg('네트워크 오류');
    }
  };

  const handleEditChange = (e) => {
    setEditProfile({ ...editProfile, [e.target.name]: e.target.value });
    setEditMsg('');
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();
    setEditMsg('');
    try {
      const res = await fetch('http://localhost:8000/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editProfile),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile({ ...profile, ...editProfile });
        setEditMsg('프로필 수정 성공!');
        showToast && showToast('프로필 수정 성공!', 'success');
      }
      else {
        setEditMsg(data.detail || '프로필 수정 실패');
        showToast && showToast(data.detail || '프로필 수정 실패', 'error');
      }
    } catch (err) {
      setEditMsg('네트워크 오류');
      showToast && showToast('네트워크 오류', 'error');
    }
  };

  // 프로필 이미지 업로드
  const handleImgChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.match(/image\/(jpeg|png)/)) {
      showToast && showToast('jpg 또는 png 파일만 업로드 가능합니다.', 'error');
      return;
    }
    if (file.size > 1024 * 1024) {
      showToast && showToast('이미지 크기는 1MB 이하만 허용됩니다.', 'error');
      return;
    }
    setImgLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('http://localhost:8000/profile/image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setImgUrl(`http://localhost:8000/profile/image/${profile.email}?t=${Date.now()}`);
        showToast && showToast('프로필 이미지 업로드 성공', 'success');
      } else {
        showToast && showToast(data.detail || '이미지 업로드 실패', 'error');
      }
    } catch (err) {
      showToast && showToast('네트워크 오류', 'error');
    } finally {
      setImgLoading(false);
      fileInputRef.current.value = '';
    }
  };

  const getProfileImgUrl = (email, role) => {
    if (!email) return role === 'mentor'
      ? 'https://placehold.co/500x500.jpg?text=MENTOR'
      : 'https://placehold.co/500x500.jpg?text=MENTEE';
    return `http://localhost:8000/profile/image/${email}`;
  };

  return (
    <>
      <div className="evangelion-card" style={{ maxWidth: 420 }}>
        <h2 className="evangelion-title">내 프로필</h2>
        {profileMsg && <p style={{ color: '#ff5555' }}>{profileMsg}</p>}
        {profile && (
          <div style={{marginTop:'1em', textAlign:'center'}}>
            <img className="evangelion-profile-img" src={imgUrl} alt="프로필" />
            <div style={{ margin: '0.5em 0' }}>
              <input
                type="file"
                accept="image/jpeg,image/png"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleImgChange}
                disabled={imgLoading}
              />
              <button
                className="evangelion-btn"
                type="button"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                disabled={imgLoading}
                style={{ marginBottom: 8 }}
              >
                {imgLoading ? '업로드 중...' : '프로필 이미지 변경'}
              </button>
            </div>
            <div>이메일: {profile.email}</div>
            <div>이름: {profile.name}</div>
            <div>역할: {profile.role}</div>
            <div>소개: {profile.intro}</div>
          </div>
        )}
        <h3 style={{marginTop:'1.5em'}}>프로필 수정</h3>
        <form onSubmit={handleEditProfile} autoComplete="off">
          <input className="evangelion-input" name="name" placeholder="이름" value={editProfile.name} onChange={handleEditChange} required />
          <input className="evangelion-input" name="intro" placeholder="소개" value={editProfile.intro} onChange={handleEditChange} />
          <select className="evangelion-select" name="role" value={editProfile.role} onChange={handleEditChange}>
            <option value="mentor">멘토</option>
            <option value="mentee">멘티</option>
          </select>
          <button className="evangelion-btn" type="submit" disabled={!token} style={{ width: '100%' }}>프로필 수정</button>
        </form>
        {editMsg && <p style={{ color: editMsg.includes('성공') ? '#39ff14' : '#ff5555', margin: '1em 0 0' }}>{editMsg}</p>}
      </div>
    </>
  );
}
