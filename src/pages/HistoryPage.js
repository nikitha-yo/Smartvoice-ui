import React, { useEffect, useState } from 'react';
import { getHistory, clearHistory, speakText } from '../utils/api';
import './HistoryPage.css';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [speaking, setSpeaking] = useState(null);

  const load = () => {
    setLoading(true);
    getHistory(100).then(h => { setHistory(h); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const doSpeak = async (text, id) => {
    setSpeaking(id);
    await speakText(text);
    setTimeout(() => setSpeaking(null), 2500);
  };

  const handleClear = async () => {
    if (!window.confirm('Clear all history?')) return;
    await clearHistory();
    setHistory([]);
  };

  const fmt = dt => {
    const d = new Date(dt);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="history-page">
      <div className="history-header">
        <div>
          <h1 className="page-title">Gesture History</h1>
          <p className="page-sub">All detected gestures from the camera</p>
        </div>
        {history.length > 0 && (
          <button className="btn-ghost" onClick={handleClear}>Clear all</button>
        )}
      </div>

      {loading && <div className="hist-empty">Loading...</div>}

      {!loading && history.length === 0 && (
        <div className="hist-empty">
          <div className="hist-empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <p>No gesture history yet.</p>
          <p>Use the Sign Camera to start detecting signs.</p>
        </div>
      )}

      {!loading && history.length > 0 && (
        <div className="hist-table-wrap card">
          <table className="hist-table">
            <thead>
              <tr>
                <th>Gesture</th>
                <th>Sentence</th>
                <th>Language</th>
                <th>Time</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id} className={speaking === h.id ? 'speaking-row' : ''}>
                  <td><span className="hist-gesture">{h.gesture}</span></td>
                  <td className="hist-sentence">{h.sentence}</td>
                  <td><span className="hist-lang">{h.language?.toUpperCase()}</span></td>
                  <td className="hist-time">{fmt(h.created_at)}</td>
                  <td>
                    <button className="hist-speak-btn" onClick={() => doSpeak(h.sentence, h.id)}>
                      <SpeakIcon/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && history.length > 0 && (
        <div className="hist-stats">
          <div className="stat-card">
            <div className="stat-num">{history.length}</div>
            <div className="stat-label">Total gestures</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">
              {[...new Set(history.map(h => h.gesture))].length}
            </div>
            <div className="stat-label">Unique signs</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">
              {history[0] ? history[0].gesture : '—'}
            </div>
            <div className="stat-label">Last gesture</div>
          </div>
        </div>
      )}
    </div>
  );
}

const SpeakIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>
);
