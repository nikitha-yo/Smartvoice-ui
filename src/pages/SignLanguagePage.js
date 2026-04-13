import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useHandDetection } from '../hooks/useHandDetection';
import { predictGesture, speakText } from '../utils/api';
import './SignLanguagePage.css';

const THROTTLE_MS = 350; // reduce API request frequency
const STABLE_FRAME_COUNT = 2;

export default function SignLanguagePage() {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const lastSent  = useRef(0);
  const lastSpokenAt = useRef(0);
  const recentGesture = useRef({ label: null, count: 0 });
  const lastSpokenGesture = useRef(null);
  const lastHistoryGesture = useRef(null);
  const lastWrist = useRef(null);
  const motionEma = useRef(0);

  const [cameraOn,   setCameraOn]   = useState(false);
  const [gesture,    setGesture]    = useState(null);
  const [sentence,   setSentence]   = useState('');
  const [confidence, setConfidence] = useState(0);
  const [speaking,   setSpeaking]   = useState(false);
  const [autoSpeak,  setAutoSpeak]  = useState(true);
  const [history,    setHistory]    = useState([]);
  const [status,     setStatus]     = useState('idle'); // idle | detecting | detected
  const [cameraError,setCameraError]= useState(null);

  // ── Handle landmarks from MediaPipe ──────────────────────────────────────
  const onLandmarks = useCallback(async (landmarks) => {
    const now = Date.now();
    if (now - lastSent.current < THROTTLE_MS) return;
    lastSent.current = now;
    setStatus('detecting');

    try {
      const wrist = landmarks?.[0];
      if (wrist && typeof wrist.x === 'number' && typeof wrist.y === 'number') {
        if (lastWrist.current) {
          const dx = wrist.x - lastWrist.current.x;
          const dy = wrist.y - lastWrist.current.y;
          const frameMove = Math.sqrt(dx * dx + dy * dy);
          motionEma.current = motionEma.current * 0.7 + frameMove * 0.3;
        }
        lastWrist.current = { x: wrist.x, y: wrist.y };
      }

      const result = await predictGesture(landmarks, 'en', motionEma.current);
      const prev = recentGesture.current;
      const nextCount = prev.label === result.gesture ? prev.count + 1 : 1;
      recentGesture.current = { label: result.gesture, count: nextCount };

      // Stabilize detection: confirm same gesture in consecutive samples.
      if (nextCount >= STABLE_FRAME_COUNT) {
        const isUsable = result.gesture !== 'unknown' && (result.confidence || 0) >= 70;

        if (isUsable) {
          setGesture(result.gesture);
          setSentence(result.sentence);
          setConfidence(result.confidence);
          setStatus('detected');

          // Keep recent detections meaningful: store only when gesture changes.
          if (result.gesture !== lastHistoryGesture.current) {
            lastHistoryGesture.current = result.gesture;
            setHistory(h => [result, ...h].slice(0, 20));
          }
        } else {
          setStatus('idle');
          setConfidence(0);
        }

        // Speak only for a new stable gesture and after cooldown.
        const isNewGesture = result.gesture !== lastSpokenGesture.current;
        const cooldownPassed = Date.now() - lastSpokenAt.current >= 1000;
        if (isUsable && autoSpeak && isNewGesture && cooldownPassed && result.sentence) {
          lastSpokenGesture.current = result.gesture;
          lastSpokenAt.current = Date.now();
          doSpeak(result.sentence);
        }
      }
    } catch {
      setStatus('idle');
    }
  }, [autoSpeak]);

  const { startCamera, stopCamera } = useHandDetection({
    videoRef,
    canvasRef,
    onLandmarks,
    enabled: cameraOn,
    onError: (err) => {
      setCameraError(err?.message || 'Camera error');
      setStatus('idle');
      setCameraOn(false);
    },
  });

  const toggleCamera = async () => {
    setCameraError(null);

    if (cameraOn) {
      stopCamera();
      setCameraOn(false);
      setStatus('idle');
      setGesture(null);
      setSentence('');
      recentGesture.current = { label: null, count: 0 };
      lastSpokenGesture.current = null;
      lastHistoryGesture.current = null;
      lastWrist.current = null;
      motionEma.current = 0;
    } else {
      setCameraOn(true);
      await startCamera();
    }
  };

  const doSpeak = async (text) => {
    if (!text) return;
    setSpeaking(true);
    await speakText(text, 'en');
    setTimeout(() => setSpeaking(false), 2000);
  };

  const triggerSOS = () => {
    const msg = 'Emergency! I need help immediately. Please come to me now.';
    setSentence(msg);
    lastSpokenAt.current = Date.now();
    doSpeak(msg);
  };

  // Update canvas size on mount
  useEffect(() => {
    const c = canvasRef.current;
    if (c) { c.width = 640; c.height = 480; }
  }, []);

  return (
    <div className="sign-page">
      <div className="sign-header">
        <div>
          <h1 className="page-title">Sign Language Camera</h1>
          <p className="page-sub">Show a hand sign — the app reads it and speaks for you</p>
        </div>
        <div className="header-controls">
          <label className="toggle-row">
            <span className="toggle-label">Auto-speak</span>
            <span className={`toggle-track ${autoSpeak ? 'on' : ''}`} onClick={() => setAutoSpeak(v => !v)}>
              <span className="toggle-thumb"/>
            </span>
          </label>
          <button className="btn-danger sos-btn" onClick={triggerSOS}>
            ⚠ SOS
          </button>
        </div>
      </div>

      <div className="sign-grid">
        {/* ── Camera panel ── */}
        <div className="cam-card card">
          <div className="cam-viewport">
            <video
              ref={videoRef}
              className="cam-video"
              autoPlay playsInline muted
            />
            <canvas ref={canvasRef} className="cam-canvas"/>

            {!cameraOn && (
              <div className="cam-placeholder">
                <div className="cam-placeholder-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="7" width="20" height="15" rx="2"/>
                    <path d="M16 3l4 4-4 4"/>
                    <path d="M8 3l-4 4 4 4"/>
                  </svg>
                </div>
                <p>Camera is off</p>
                <p className="cam-hint">Click "Start Camera" to begin</p>
              </div>
            )}

            {cameraOn && (
              <div className="cam-status-badge">
                <span className={`status-dot ${status}`}/>
                {status === 'detecting' ? 'Detecting...' : status === 'detected' ? 'Sign detected' : 'Looking for hand...'}
              </div>
            )}

            {cameraError && (
              <div className="cam-error">
                <strong>Camera error:</strong> {cameraError}
              </div>
            )}
          </div>

          <div className="cam-footer">
            <button className={`cam-toggle-btn ${cameraOn ? 'on' : ''}`} onClick={toggleCamera}>
              {cameraOn ? (
                <><StopIcon/> Stop Camera</>
              ) : (
                <><CamIcon/> Start Camera</>
              )}
            </button>
            <p className="cam-tip">
              {cameraOn
                ? 'Hold your hand clearly in front of the camera'
                : 'Position your hand in front of the webcam'}
            </p>
          </div>
        </div>

        {/* ── Results panel ── */}
        <div className="results-col">

          {/* Detected gesture */}
          <div className="card detect-card">
            <div className="section-label">Detected gesture</div>
            {gesture ? (
              <>
                <div className="gesture-big">{gesture.toUpperCase()}</div>
                <div className="confidence-wrap">
                  <div className="confidence-bar-bg">
                    <div className="confidence-bar" style={{ width: confidence + '%' }}/>
                  </div>
                  <span className="confidence-num">{confidence}% confidence</span>
                </div>
              </>
            ) : (
              <div className="no-gesture">
                {cameraOn ? 'Waiting for a hand sign...' : 'Start camera to detect signs'}
              </div>
            )}
          </div>

          {/* Sentence output */}
          <div className="card sentence-card">
            <div className="section-label">Sentence</div>
            <div className="sentence-output">
              {sentence || 'Detected sentence will appear here'}
            </div>
            <div className="sentence-actions">
              <button
                className={`btn-primary speak-btn ${speaking ? 'speaking' : ''}`}
                onClick={() => doSpeak(sentence)}
                disabled={!sentence || speaking}
              >
                <SpeakIcon/>
                {speaking ? 'Speaking...' : 'Speak Aloud'}
              </button>
              {sentence && (
                <button className="btn-ghost" onClick={() => setSentence('')}>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Gesture hints */}
          <div className="card hints-card">
            <div className="section-label">Gesture guide</div>
            <div className="hints-grid">
              {GESTURE_HINTS.map(h => (
                <div key={h.gesture} className="hint-item">
                  <span className="hint-gesture">{h.gesture}</span>
                  <span className="hint-desc">{h.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent detections ── */}
      {history.length > 0 && (
        <div className="card history-card">
          <div className="section-label">Recent detections this session</div>
          <div className="recent-list">
            {history.slice(0, 6).map((h, i) => (
              <div key={i} className="recent-item" onClick={() => doSpeak(h.sentence)}>
                <span className="recent-gesture">{h.gesture}</span>
                <span className="recent-sentence">{h.sentence}</span>
                <span className="recent-conf">{h.confidence}%</span>
                <SpeakIcon size={13}/>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const GESTURE_HINTS = [
  { gesture: 'Hello',    desc: 'Open palm + slight wave' },
  { gesture: 'Yes',      desc: 'Closed fist' },
  { gesture: 'No',       desc: 'Index + middle finger (V/peace)' },
  { gesture: 'Good',     desc: 'Thumb up, fist closed' },
  { gesture: 'Sorry',    desc: 'Closed fist + small circular motion' },
  { gesture: 'Help',     desc: 'Only index finger pointing up' },
  { gesture: 'Stop',     desc: 'Open palm, steady (no movement)' },
  { gesture: 'Hungry',   desc: 'Open palm + hand moves upward' },
  { gesture: 'Water',    desc: 'Only pinky finger up' },
  { gesture: 'Pain',     desc: 'Thumb + index (gun shape)' },
  { gesture: 'Call',     desc: 'Thumb + pinky (phone shape)' },
  { gesture: 'Doctor',   desc: 'Index + middle + ring up' },
  { gesture: 'Bathroom', desc: 'Four fingers (no thumb)' },
  { gesture: 'Thanks',   desc: 'Thumb + index + middle fingers up' },
  { gesture: 'Did you eat?', desc: 'Index up with thumb open' },
];

const CamIcon   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2"/><circle cx="12" cy="14" r="3"/></svg>;
const StopIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>;
const SpeakIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>
);
