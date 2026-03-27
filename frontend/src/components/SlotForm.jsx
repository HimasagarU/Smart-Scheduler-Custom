import { useState } from 'react';
import { Calendar as CalendarIcon, Filter } from 'lucide-react';

export default function SlotForm({ onFindSlots }) {
  const [nDays, setNDays] = useState(2);
  const [monthStr, setMonthStr] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [avoidDays, setAvoidDays] = useState(['Saturday', 'Sunday']);
  const [preferDays, setPreferDays] = useState([]);
  const [holidayPref, setHolidayPref] = useState('avoid');
  
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleSubmit = (e) => {
    e.preventDefault();
    const [year, month] = monthStr.split('-').map(Number);
    onFindSlots({ n_days: parseInt(nDays), month, year, blackout_days: avoidDays, prefer_days: preferDays, holiday_pref: holidayPref });
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

  return (
    <form onSubmit={handleSubmit} className="slot-form">
      <div className="form-group">
        <label><CalendarIcon size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }}/> Days Needed</label>
        <input type="number" min="1" max="14" className="form-control" value={nDays} onChange={e => setNDays(e.target.value)} required />
      </div>
      
      <div className="form-group">
        <label>Preferred Month</label>
        <input type="month" className="form-control" value={monthStr} onChange={e => setMonthStr(e.target.value)} required />
      </div>

      <div className="form-group">
        <label><Filter size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }}/> Public Holidays</label>
        <select className="form-control" value={holidayPref} onChange={e => setHolidayPref(e.target.value)}>
          <option value="avoid">Avoid Holidays</option>
          <option value="ignore">Ignore Holidays</option>
          <option value="prefer">Prefer Holidays</option>
        </select>
      </div>

      <div className="form-group">
        <label><Filter size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }}/> Day Preferences</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
          <div>
            <span style={{fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem'}}>Avoid Days</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
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
          <div>
            <span style={{fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem'}}>Prefer Days</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
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
        </div>
      </div>

      <button type="submit" className="btn">Find Free Slots</button>
    </form>
  );
}
