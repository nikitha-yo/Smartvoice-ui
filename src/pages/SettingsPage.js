import React, { useState } from 'react';
import { speakText } from '../utils/api';
import './SettingsPage.css';

export default function SettingsPage() {
  const [testText, setTestText] = useState('Hello, I am using Smart Voice to communicate.');
  const [tested,   setTested]   = useState(false);

  const testVoice = async () => {
    await speakText(testText, 'en');
    setTested(true);
    setTimeout(() => setTested(false), 3000);
  };

  return (
    <div className="settings-page">
      <h1 className="page-title">Settings</h1>
      <p className="page-sub">Configure accessibility options</p>

      <div className="settings-grid">
        {/* Voice test */}
        <div className="card settings-card">
          <div className="settings-card-title">Voice Test</div>

          <div className="setting-label" style={{ marginBottom: 8 }}>Test voice output</div>
          <textarea
            className="test-input"
            rows={2}
            value={testText}
            onChange={e => setTestText(e.target.value)}
          />
          <button
            className={`btn-primary test-btn ${tested ? 'btn-teal' : ''}`}
            onClick={testVoice}
          >
            <SpeakIcon/> {tested ? 'Playing...' : 'Test Voice'}
          </button>
        </div>

        {/* Gesture info */}
        <div className="card settings-card">
          <div className="settings-card-title">Gesture Reference</div>
          <p className="settings-hint-text">
            The app uses your webcam + MediaPipe AI to detect 21 hand landmarks in real time.
            These are classified into gestures using a rule-based engine (or a trained CNN if you add a model file).
          </p>

          <div className="gesture-ref-list">
            {GESTURE_REF.map(g => (
              <div key={g.sign} className="ref-row">
                <span className="ref-sign">{g.sign}</span>
                <span className="ref-desc">{g.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tech stack */}
        <div className="card settings-card">
          <div className="settings-card-title">Tech Stack</div>
          <div className="tech-list">
            {TECH_STACK.map(t => (
              <div key={t.name} className="tech-row">
                <div>
                  <div className="tech-name">{t.name}</div>
                  <div className="tech-desc">{t.desc}</div>
                </div>
                <span className={`tech-badge tech-${t.type}`}>{t.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="card settings-card about-card">
          <div className="settings-card-title">About Smart Voice</div>
          <p className="settings-hint-text">
            Smart Voice is an accessibility web application that helps non-verbal users communicate
            using sign language detected by AI. It converts hand gestures to speech in real time,
            supports voice playback profiles, and stores phrase history locally.
          </p>
          <div className="about-badges">
            <span className="about-badge">React 18</span>
            <span className="about-badge">Flask 3</span>
            <span className="about-badge">MediaPipe</span>
            <span className="about-badge">gTTS</span>
            <span className="about-badge">SQLite</span>
            <span className="about-badge">TensorFlow</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const GESTURE_REF = [
  { sign: 'Hello',    desc: 'Open palm + slight wave' },
  { sign: 'Yes',      desc: 'Closed fist' },
  { sign: 'No',       desc: 'Index + middle finger (V/peace)' },
  { sign: 'Help',     desc: 'Only index finger pointing up' },
  { sign: 'Stop',     desc: 'Open palm, steady (no movement)' },
  { sign: 'Water',    desc: 'Only pinky finger up' },
  { sign: 'Pain',     desc: 'Thumb + index (gun shape)' },
  { sign: 'Call',     desc: 'Thumb + pinky (phone shape)' },
  { sign: 'Doctor',   desc: 'Index + middle + ring finger up' },
  { sign: 'Bathroom', desc: 'Four fingers (no thumb)' },
  { sign: 'Thanks',   desc: 'Thumb + index + middle fingers up' },
  { sign: 'Did you eat?', desc: 'Index up with thumb open' },
];

const TECH_STACK = [
  { name: 'React 18',       desc: 'Frontend UI framework',              type: 'frontend' },
  { name: 'MediaPipe Hands',desc: 'Real-time hand landmark detection',  type: 'ai' },
  { name: 'Flask 3',        desc: 'Python backend REST API',            type: 'backend' },
  { name: 'gTTS',           desc: 'Google Text-to-Speech engine',       type: 'ai' },
  { name: 'SQLite',         desc: 'Local database for history/phrases', type: 'backend' },
  { name: 'TensorFlow',     desc: 'Optional CNN model upgrade path',    type: 'ai' },
  { name: 'NLTK / spaCy',  desc: 'NLP for sentence mapping',           type: 'ai' },
];

const SpeakIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>
);
