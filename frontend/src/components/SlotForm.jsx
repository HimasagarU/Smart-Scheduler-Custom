import { useState } from 'react';
import { Calendar as CalendarIcon, Filter, Users, Clock } from 'lucide-react';
import api from '../api/axios';

export default function SlotForm({ onFindSlots, onDeadlineSearch, onOverlapSearch }) {
  const [mode, setMode] = useState('normal'); // 'normal' | 'deadline' | 'overlap'
  const [nDays, setNDays] = useState(2);
  const [monthStr, setMonthStr] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [avoidDays, setAvoidDays] = useState(['Sunday']);
  const [preferDays, setPreferDays] = useState([]);
  const [holidayPref, setHolidayPref] = useState('avoid');

  // Deadline mode
  const [deadline, setDeadline] = useState('');

  // Overlap mode
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleSubmit = (e) => {
    e.preventDefault();
    const [year, month] = monthStr.split('-').map(Number);

    if (mode === 'deadline') {
      onDeadlineSearch({ n_days: parseInt(nDays), deadline, blackout_days: avoidDays, holiday_pref: holidayPref });
    } else if (mode === 'overlap') {
      if (!selectedUser) return alert('Please select a user to find overlap with');
      onOverlapSearch({ n_days: parseInt(nDays), month, year, other_user_id: selectedUser.id, blackout_days: avoidDays, holiday_pref: holidayPref });
    } else {
      onFindSlots({ n_days: parseInt(nDays), month, year, blackout_days: avoidDays, prefer_days: preferDays, holiday_pref: holidayPref });
    }
  };

  const handleDayToggle = (day, type) => {
    if (type === 'avoid') {
      setAvoidDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
      setPreferDays(prev => prev.filter(d => d !== day));
    } else {
      setPreferDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
      setAvoidDays(prev => prev.filter(d => d !== day));
    }
  };

  const handleEmailSearch = async (value) => {
    setSearchEmail(value);
    setSelectedUser(null);
    if (value.length >= 3) {
      try {
        const res = await api.get(`/auth/search?q=${encodeURIComponent(value)}`);
        setSearchResults(res.data);
      } catch { setSearchResults([]); }
    } else {
      setSearchResults([]);
    }
  };

  const modeTabStyle = (m) => ({
    flex: 1,
    padding: '0.5rem',
    border: 'none',
    borderBottom: mode === m ? '2px solid var(--primary)' : '2px solid transparent',
    background: 'transparent',
    color: mode === m ? 'var(--primary)' : 'var(--text-muted)',
    cursor: 'pointer',
    fontWeight: mode === m ? 600 : 400,
    fontSize: '0.8rem',
    transition: 'all 0.2s'
  });

  return (
    <div>
      {/* Mode Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
        <button type="button" style={modeTabStyle('normal')} onClick={() => setMode('normal')}>
          <CalendarIcon size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />Find Slots
        </button>
        <button type="button" style={modeTabStyle('deadline')} onClick={() => setMode('deadline')}>
          <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />Deadline
        </button>
        <button type="button" style={modeTabStyle('overlap')} onClick={() => setMode('overlap')}>
          <Users size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />Overlap
        </button>
      </div>

      <form onSubmit={handleSubmit} className="slot-form">
        <div className="form-group">
          <label><CalendarIcon size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }}/>Days Needed</label>
          <input type="number" min="1" max="14" className="form-control" value={nDays} onChange={e => setNDays(e.target.value)} required />
        </div>

        {/* Normal mode: month picker */}
        {mode === 'normal' && (
          <div className="form-group">
            <label>Preferred Month</label>
            <input type="month" className="form-control" value={monthStr} onChange={e => setMonthStr(e.target.value)} required />
          </div>
        )}

        {/* Deadline mode: deadline date */}
        {mode === 'deadline' && (
          <div className="form-group">
            <label><Clock size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }}/>Deadline Date</label>
            <input type="date" className="form-control" value={deadline} onChange={e => setDeadline(e.target.value)} required />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
              Finds the latest free window before this date
            </span>
          </div>
        )}

        {/* Overlap mode: month + user search */}
        {mode === 'overlap' && (
          <>
            <div className="form-group">
              <label>Month</label>
              <input type="month" className="form-control" value={monthStr} onChange={e => setMonthStr(e.target.value)} required />
            </div>
            <div className="form-group">
              <label><Users size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }}/>Find User by Email</label>
              <input
                type="text"
                className="form-control"
                placeholder="Type email to search..."
                value={searchEmail}
                onChange={e => handleEmailSearch(e.target.value)}
              />
              {searchResults.length > 0 && !selectedUser && (
                <div style={{ border: '1px solid var(--border)', borderRadius: '6px', marginTop: '0.25rem', maxHeight: '120px', overflowY: 'auto' }}>
                  {searchResults.map(u => (
                    <div
                      key={u.id}
                      onClick={() => { setSelectedUser(u); setSearchEmail(u.email); setSearchResults([]); }}
                      style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.85rem', borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => e.target.style.background = '#f3f4f6'}
                      onMouseLeave={e => e.target.style.background = 'transparent'}
                    >
                      <strong>{u.name}</strong> — {u.email}
                    </div>
                  ))}
                </div>
              )}
              {selectedUser && (
                <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: '#eff6ff', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>✓ {selectedUser.name} ({selectedUser.email})</span>
                  <button type="button" onClick={() => { setSelectedUser(null); setSearchEmail(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' }}>✕</button>
                </div>
              )}
            </div>
          </>
        )}

        <div className="form-group">
          <label><Filter size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }}/> Public Holidays</label>
          <select className="form-control" value={holidayPref} onChange={e => setHolidayPref(e.target.value)}>
            <option value="avoid">Avoid Holidays</option>
            <option value="prefer">Prefer Holidays</option>
          </select>
        </div>

        <div className="form-group">
          <label><Filter size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }}/> Avoid Days</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
            {DAYS.map(day => (
              <button
                type="button"
                key={`avoid-${day}`}
                onClick={() => handleDayToggle(day, 'avoid')}
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '1rem',
                  border: `1px solid ${avoidDays.includes(day) ? 'var(--primary)' : 'var(--border)'}`,
                  background: avoidDays.includes(day) ? 'var(--primary)' : 'transparent',
                  color: avoidDays.includes(day) ? 'white' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.75rem'
                }}
              >
                {day.substring(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Prefer days only in normal mode */}
        {mode === 'normal' && (
          <div className="form-group">
            <label>Prefer Days</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {DAYS.map(day => (
                <button
                  type="button"
                  key={`prefer-${day}`}
                  onClick={() => handleDayToggle(day, 'prefer')}
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    border: `1px solid ${preferDays.includes(day) ? '#10b981' : 'var(--border)'}`,
                    background: preferDays.includes(day) ? '#10b981' : 'transparent',
                    color: preferDays.includes(day) ? 'white' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  {day.substring(0, 3)}
                </button>
              ))}
            </div>
          </div>
        )}

        <button type="submit" className="btn">
          {mode === 'normal' ? 'Find Free Slots' : mode === 'deadline' ? 'Find Before Deadline' : 'Find Overlap'}
        </button>
      </form>
    </div>
  );
}
