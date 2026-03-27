import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import api from '../api/axios';
import 'react-calendar/dist/Calendar.css';

export default function FullCalendar() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const [eventsRes, holidaysRes] = await Promise.all([
        api.get('/events/list'),
        api.get(`/events/holidays?year=${currentYear}`)
      ]);
      setEvents([...eventsRes.data, ...holidaysRes.data]);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await api.delete(`/events/${id}`);
      setSelectedEvent(null);
      fetchEvents();
    } catch (err) {
      alert("Failed to delete event.");
    }
  };

  const isDateInEventRange = (d, start, end) => {
    return d >= start && d <= end;
  };

  const renderTileContent = ({ date, view }) => {
    if (view === 'month') {
      const d = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const dayEvents = events.filter(e => isDateInEventRange(d, e.start_date, e.end_date));
      
      return (
        <div className="gc-event-container">
          {dayEvents.map(e => (
            <div 
              key={e._id} 
              className={`gc-event-pill ${e.is_holiday ? 'holiday-pill' : ''}`}
              onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); }}
              title={e.title}
            >
              {e.title}
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="full-calendar-page" style={{ padding: '2rem' }}>
      <div className="dashboard-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontWeight: 600 }}>My Full Calendar</h2>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'transparent', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', color: 'var(--text)' }}>Back to Dashboard</button>
      </div>

      <div className="panel" style={{ padding: '0', overflow: 'hidden' }}>
        <Calendar
          className="google-style-calendar"
          tileContent={renderTileContent}
          prev2Label={null}
          next2Label={null}
        />
      </div>

      {selectedEvent && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--card)', padding: '2rem', borderRadius: '8px', width: '400px', maxWidth: '90%', textAlign: 'left' }}>
            <h3 style={{marginTop: 0, marginBottom: '0.5rem', wordBreak: 'break-word', fontSize: '1.5rem', color: 'var(--primary)'}}>{selectedEvent.title}</h3>
            <p style={{fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: '500'}}>
              {selectedEvent.start_date} to {selectedEvent.end_date}
            </p>
            {selectedEvent.description && (
              <div style={{ marginBottom: '1.5rem', whiteSpace: 'pre-wrap', background: 'transparent', padding: '0', fontSize: '1.1rem', color: 'var(--text)' }}>
                {selectedEvent.description}
              </div>
            )}
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem'}}>
              <button onClick={() => setSelectedEvent(null)} style={{padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text)'}}>Close</button>
              {!selectedEvent.is_holiday && (
                <button onClick={() => handleDeleteEvent(selectedEvent._id)} style={{padding: '0.5rem 1rem', background: '#e11d48', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer'}}>Delete Event</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
