import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import CalendarView from '../components/CalendarView';
import SlotForm from '../components/SlotForm';
import SlotResults from '../components/SlotResults';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [results, setResults] = useState(null);
  const [activeDate, setActiveDate] = useState(new Date());
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [eventFormData, setEventFormData] = useState({ title: '', description: '' });
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserAndEvents();
  }, []);

  const fetchUserAndEvents = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const [userRes, eventsRes, holidaysRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/events/list'),
        api.get(`/events/holidays?year=${currentYear}`)
      ]);
      setUser(userRes.data);
      setEvents([...eventsRes.data, ...holidaysRes.data]);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleFindSlots = async (reqData) => {
    try {
      const res = await api.post('/slots/find', reqData);
      setResults(res.data);
      if (res.data.year && res.data.month) {
        setActiveDate(new Date(res.data.year, res.data.month - 1, 1));
      }
    } catch (err) {
      alert("Failed to find slots");
    }
  };

  const handleConfirmSlotClick = (slot) => {
    setSelectedSlot(slot);
    setEventFormData({ title: 'Workshop', description: '' });
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    if (!eventFormData.title) return;

    try {
      await api.post('/events/confirm', {
        title: eventFormData.title,
        description: eventFormData.description,
        start_date: selectedSlot.start_date,
        end_date: selectedSlot.end_date
      });
      alert("Event confirmed and reminder scheduled!");
      setResults(null);
      setShowConfirmModal(false);
      fetchUserAndEvents();
    } catch (err) {
      alert("Failed to confirm event");
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 style={{ margin: 0, fontWeight: 600 }}>Smart Scheduler</h2>
        <div>
          <span style={{ marginRight: '1rem', color: 'var(--text-muted)' }}>{user?.name}</span>
          <button onClick={() => navigate('/calendar')} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', marginRight: '0.5rem' }}>Full Calendar</button>
          <button onClick={logout} style={{ background: 'transparent', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="panel">
          <h3>Calendar View</h3>
          <CalendarView 
            events={events} 
            activeMonthDate={activeDate}
            onActiveStartDateChange={({ activeStartDate }) => setActiveDate(activeStartDate)}
          />
        </div>

        <div className="panel">
          <h3>Schedule an Event</h3>
          <SlotForm onFindSlots={handleFindSlots} />
          <SlotResults results={results} onConfirm={handleConfirmSlotClick} />
        </div>
      </div>

      {showConfirmModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div className="modal-content" style={{ backgroundColor: 'var(--card)', padding: '2rem', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
            <h3 style={{marginTop: 0}}>Confirm Event</h3>
            <p style={{fontSize: '0.875rem', color: 'var(--text-muted)'}}>
              {selectedSlot.start_date} to {selectedSlot.end_date}
            </p>
            <form onSubmit={handleConfirmSubmit} style={{marginTop: '1rem'}}>
              <div className="form-group" style={{marginBottom: '1rem'}}>
                <label style={{display: 'block', marginBottom: '0.5rem', textAlign: 'left', fontSize: '1.1rem', color: 'var(--primary)', fontWeight: 'bold'}}>Event Title</label>
                <input type="text" className="form-control" style={{width: '100%', boxSizing: 'border-box', fontSize: '1.1rem', color: 'var(--text)', backgroundColor: 'transparent'}} value={eventFormData.title} onChange={e => setEventFormData({...eventFormData, title: e.target.value})} required />
              </div>
              <div className="form-group" style={{marginBottom: '1rem'}}>
                <label style={{display: 'block', marginBottom: '0.5rem', textAlign: 'left', fontSize: '1.1rem', color: 'var(--primary)', fontWeight: 'bold'}}>Description (Optional)</label>
                <textarea className="form-control" style={{width: '100%', boxSizing: 'border-box', minHeight: '80px', fontSize: '1.1rem', color: 'var(--text)', backgroundColor: 'transparent'}} value={eventFormData.description} onChange={e => setEventFormData({...eventFormData, description: e.target.value})} />
              </div>
              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem'}}>
                <button type="button" onClick={() => setShowConfirmModal(false)} style={{padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text)'}}>Cancel</button>
                <button type="submit" className="btn" style={{margin: 0}}>Confirm Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
