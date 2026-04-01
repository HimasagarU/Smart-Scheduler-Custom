import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import api from '../api/axios';
import 'react-calendar/dist/Calendar.css';

export default function FullCalendar() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEventData, setNewEventData] = useState({ title: '', description: '', start_date: '', end_date: '' });
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
        window.location.href = '/login';
      }
    }
  };

  const handleDeleteEvent = async (id, scope = 'me') => {
    try {
      await api.delete(`/events/${id}?scope=${scope}`);
      setSelectedEvent(null);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete event.");
    }
  };

  const isDateInEventRange = (d, start, end) => {
    return d >= start && d <= end;
  };

  const handleDayClick = (value) => {
    const d = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
    setNewEventData({ title: '', description: '', start_date: d, end_date: d });
    setShowAddModal(true);
  };

  const handleCreateNewClick = () => {
    const today = new Date();
    const d = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setNewEventData({ title: '', description: '', start_date: d, end_date: d });
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newEventData.title || !newEventData.start_date || !newEventData.end_date) return;

    try {
      await api.post('/events/confirm', newEventData);
      setShowAddModal(false);
      fetchEvents();
    } catch (err) {
      alert("Failed to create event");
    }
  };

  const EVENT_COLORS = [
    '#8b5cf6', '#d946ef', '#ec4899', '#db2777', '#4f46e5', '#64748b', '#ef4444'
  ];

  const getColorForEvent = (eventId) => {
    let hash = 0;
    for (let i = 0; i < eventId.length; i++) {
      hash = eventId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % EVENT_COLORS.length;
    return EVENT_COLORS[index];
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
              style={!e.is_holiday ? { backgroundColor: getColorForEvent(e._id) } : {}}
              onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); }}
              title={e.title}
            >
              {e.title} {e.shared_with && '👥'}
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
        <div>
          <button onClick={handleCreateNewClick} style={{ background: 'var(--primary)', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', color: 'white', marginRight: '0.5rem' }}>+ Add Event</button>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'transparent', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', color: 'var(--text)' }}>Back to Dashboard</button>
        </div>
      </div>

      <div className="panel" style={{ padding: '0', overflow: 'hidden' }}>
        <Calendar
          className="google-style-calendar"
          tileContent={renderTileContent}
          tileClassName={({ date, view }) => view === 'month' && date.getDay() === 0 ? 'sunday-tile' : null}
          onClickDay={handleDayClick}
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
            {selectedEvent.shared_with && (
              <p style={{fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '1rem'}}>
                👥 Shared with: {selectedEvent.shared_with} {selectedEvent.is_organizer ? '(You are the organizer)' : ''}
              </p>
            )}
            {selectedEvent.description && (
              <div style={{ marginBottom: '1.5rem', whiteSpace: 'pre-wrap', background: 'transparent', padding: '0', fontSize: '1.1rem', color: 'var(--text)' }}>
                {selectedEvent.description}
              </div>
            )}
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem'}}>
              <button onClick={() => setSelectedEvent(null)} style={{padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text)'}}>Close</button>
              {!selectedEvent.is_holiday && (
                <div style={{display: 'flex', gap: '0.5rem'}}>
                  {selectedEvent.shared_with && selectedEvent.is_organizer && (
                     <button onClick={() => { if(window.confirm("Cancel this event for everyone?")) handleDeleteEvent(selectedEvent._id, 'all') }} style={{padding: '0.5rem 1rem', background: '#dc2626', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', fontWeight: 'bold'}}>Cancel for everyone</button>
                  )}
                  <button onClick={() => { if(window.confirm("Remove from your calendar?")) handleDeleteEvent(selectedEvent._id, 'me') }} style={{padding: '0.5rem 1rem', background: '#ef4444', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer'}}>Remove from my calendar</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--card)', padding: '2rem', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
            <h3 style={{marginTop: 0}}>Add Custom Event</h3>
            <form onSubmit={handleAddSubmit} style={{marginTop: '1rem'}}>
              <div className="form-group" style={{marginBottom: '1rem'}}>
                <label style={{display: 'block', marginBottom: '0.5rem', textAlign: 'left', fontSize: '1.1rem', color: 'var(--primary)', fontWeight: 'bold'}}>Event Title</label>
                <input type="text" className="form-control" style={{width: '100%', boxSizing: 'border-box', fontSize: '1.1rem', color: 'var(--text)', backgroundColor: 'transparent'}} value={newEventData.title} onChange={e => setNewEventData({...newEventData, title: e.target.value})} required />
              </div>
              <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem'}}>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '0.5rem', textAlign: 'left', fontSize: '1.1rem', color: 'var(--primary)', fontWeight: 'bold'}}>Start Date</label>
                  <input type="date" className="form-control" style={{width: '100%', boxSizing: 'border-box', fontSize: '1.1rem', color: 'var(--text)', backgroundColor: 'transparent'}} value={newEventData.start_date} onChange={e => setNewEventData({...newEventData, start_date: e.target.value})} required />
                </div>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '0.5rem', textAlign: 'left', fontSize: '1.1rem', color: 'var(--primary)', fontWeight: 'bold'}}>End Date</label>
                  <input type="date" className="form-control" style={{width: '100%', boxSizing: 'border-box', fontSize: '1.1rem', color: 'var(--text)', backgroundColor: 'transparent'}} value={newEventData.end_date} onChange={e => setNewEventData({...newEventData, end_date: e.target.value})} required />
                </div>
              </div>
              <div className="form-group" style={{marginBottom: '1rem'}}>
                <label style={{display: 'block', marginBottom: '0.5rem', textAlign: 'left', fontSize: '1.1rem', color: 'var(--primary)', fontWeight: 'bold'}}>Description (Optional)</label>
                <textarea className="form-control" style={{width: '100%', boxSizing: 'border-box', minHeight: '80px', fontSize: '1.1rem', color: 'var(--text)', backgroundColor: 'transparent'}} value={newEventData.description} onChange={e => setNewEventData({...newEventData, description: e.target.value})} />
              </div>
              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem'}}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text)'}}>Cancel</button>
                <button type="submit" className="btn" style={{margin: 0}}>Create Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
