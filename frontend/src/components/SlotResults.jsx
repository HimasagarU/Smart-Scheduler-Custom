export default function SlotResults({ results, onConfirm }) {
  if (!results) return null;

  return (
    <div className="slot-results-container" style={{ marginTop: '2rem' }}>
      <h4 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginTop: 0 }}>Results</h4>
      {results.message && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{results.message}</p>}
      
      {results.slots.length === 0 ? (
        <p>No valid slots found.</p>
      ) : (
        results.slots.map((slot, idx) => (
          <div key={idx} className="slot-result">
            <div>
              <strong>{slot.start_date}</strong> to <strong>{slot.end_date}</strong>
            </div>
            <button className="btn btn-small" onClick={() => onConfirm(slot)}>Confirm</button>
          </div>
        ))
      )}
    </div>
  );
}
