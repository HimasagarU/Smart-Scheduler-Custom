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
  const [pendingOverlapUserId, setPendingOverlapUserId] = useState(null);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [eventFormData, setEventFormData] = useState({ title: '', description: '' });
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEventData, setNewEventData] = useState({ title: '', description: '', start_date: '', end_date: '' });
  
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
        window.location.href = '/login';
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleFindSlots = async (reqData) => {
    try {
      setPendingOverlapUserId(null);
      const res = await api.post('/slots/find', reqData);
      setResults(res.data);
      if (res.data.year && res.data.month) {
        setActiveDate(new Date(res.data.year, res.data.month - 1, 1));
      }
    } catch (err) {
      alert("Failed to find slots");
    }
  };

  const handleDeadlineSearch = async (reqData) => {
    try {
      setPendingOverlapUserId(null);
      const res = await api.post('/slots/deadline', reqData);
      setResults(res.data);
    } catch (err) {
      alert("Failed to find deadline slots");
    }
  };

  const handleOverlapSearch = async (reqData) => {
    try {
      setPendingOverlapUserId(reqData.other_user_id);
      const res = await api.post('/slots/overlap', reqData);
      setResults(res.data);
      if (res.data.year && res.data.month) {
        setActiveDate(new Date(res.data.year, res.data.month - 1, 1));
      }
    } catch (err) {
      alert("Failed to find overlapping slots");
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
      const res = await api.post('/events/confirm', {
        title: eventFormData.title,
        description: eventFormData.description,
        start_date: selectedSlot.start_date,
        end_date: selectedSlot.end_date,
        other_user_id: pendingOverlapUserId
      });
      alert(res.data.message);
      setResults(null);
      setShowConfirmModal(false);
      fetchUserAndEvents();
    } catch (err) {
      alert("Failed to confirm event");
    }
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
      alert("Custom event created!");
      setShowAddModal(false);
      fetchUserAndEvents();
    } catch (err) {
      alert("Failed to create event");
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 style={{ margin: 0, fontWeight: 600 }}>Smart Scheduler</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={handleCreateNewClick} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>+ Add Event</button>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: '1rem' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{user?.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', background: '#eff6ff', padding: '0.1rem 0.5rem', borderRadius: '1rem' }}>{user?.organization}</span>
          </div>

          <button onClick={() => navigate('/calendar')} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>Full Calendar</button>
          <button onClick={logout} style={{ background: 'transparent', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="panel">
            <h3>Calendar View</h3>
            <CalendarView 
              events={events} 
              activeMonthDate={activeDate}
              onActiveStartDateChange={({ activeStartDate }) => setActiveDate(activeStartDate)}
            />
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#10b981', borderRadius: '3px' }}></span>
                <span>Green color ones are public holidays</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'linear-gradient(45deg, #8b5cf6, #ec4899)', borderRadius: '3px' }}></span>
                <span>Different colored ones are different events</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#fef08a', border: '1px solid #eab308', borderRadius: '3px' }}></span>
                <span>Yellow square is today</span>
              </div>
              <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                <em>For more details check full calendar</em>
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <h3>Schedule an Event</h3>
          <SlotForm onFindSlots={handleFindSlots} onDeadlineSearch={handleDeadlineSearch} onOverlapSearch={handleOverlapSearch} />
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

      {showAddModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div className="modal-content" style={{ backgroundColor: 'var(--card)', padding: '2rem', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
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
