import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function CalendarView({ events, activeMonthDate, onActiveStartDateChange }) {
  const eventDates = new Set();
  const holidayDates = new Set();

  events.forEach(e => {
    let current = new Date(`${e.start_date}T00:00:00`);
    const end = new Date(`${e.end_date}T00:00:00`);
    while (current <= end) {
      const dStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      if (e.is_holiday) {
        holidayDates.add(dStr);
      } else {
        eventDates.add(dStr);
      }
      current.setDate(current.getDate() + 1);
    }
  });

  return (
    <div className="calendar-wrapper">
      <Calendar
        activeStartDate={activeMonthDate}
        onActiveStartDateChange={onActiveStartDateChange}
        tileClassName={({ date, view }) => {
          if (view === 'month') {
            let classes = [];
            const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            if (eventDates.has(dStr)) classes.push('has-event');
            if (holidayDates.has(dStr)) classes.push('has-holiday');
            return classes.join(' ');
          }
        }}
        prev2Label={null}
        next2Label={null}
      />
    </div>
  );
}
