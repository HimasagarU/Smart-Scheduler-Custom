import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function CalendarView({ events, activeMonthDate, onActiveStartDateChange }) {
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

  const customEventColors = new Map();
  const holidayDates = new Set();

  events.forEach(e => {
    let current = new Date(`${e.start_date}T00:00:00`);
    const end = new Date(`${e.end_date}T00:00:00`);
    while (current <= end) {
      const dStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      if (e.is_holiday) {
        holidayDates.add(dStr);
      } else {
        if (!customEventColors.has(dStr)) {
          customEventColors.set(dStr, getColorForEvent(e._id));
        }
      }
      current.setDate(current.getDate() + 1);
    }
  });

  const dynamicStyles = Array.from(customEventColors.entries()).map(([dStr, color]) => {
    if (holidayDates.has(dStr)) {
      return `.event-tile-${dStr.replace(/-/g, '')} { background: linear-gradient(135deg, ${color} 50%, #10b981 50%) !important; color: white !important; border-radius: 50%; }`;
    }
    return `.event-tile-${dStr.replace(/-/g, '')} { background: ${color} !important; color: white !important; border-radius: 50%; }`;
  }).join('\n');

  return (
    <div className="calendar-wrapper">
      <style>{dynamicStyles}</style>
      <Calendar
        activeStartDate={activeMonthDate}
        onActiveStartDateChange={onActiveStartDateChange}
        tileClassName={({ date, view }) => {
          if (view === 'month') {
            let classes = [];
            if (date.getDay() === 0) classes.push('sunday-tile');
            const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            if (customEventColors.has(dStr)) {
              classes.push(`event-tile-${dStr.replace(/-/g, '')}`);
            } else if (holidayDates.has(dStr)) {
              classes.push('has-holiday');
            }
            return classes.join(' ');
          }
        }}
        prev2Label={null}
        next2Label={null}
      />
    </div>
  );
}
