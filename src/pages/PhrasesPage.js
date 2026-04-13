import React, { useEffect, useState } from 'react';
import { getPhrases, addPhrase, speakText } from '../utils/api';
import './PhrasesPage.css';

const CATEGORIES = ['all', 'urgent', 'needs', 'social', 'response', 'feelings', 'custom'];

export default function PhrasesPage() {
  const [phrases,  setPhrases]  = useState([]);
  const [category, setCategory] = useState('all');
  const [speaking, setSpeaking] = useState(null);
  const [showAdd,  setShowAdd]  = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newSent,  setNewSent]  = useState('');
  const [newCat,   setNewCat]   = useState('custom');
  const [typed,    setTyped]    = useState('');

  useEffect(() => {
    getPhrases().then(setPhrases).catch(() => {});
  }, []);

  const filtered = category === 'all'
    ? phrases
    : phrases.filter(p => p.category === category);

  const doSpeak = async (text, id) => {
    setSpeaking(id);
    await speakText(text, 'en');
    setTimeout(() => setSpeaking(null), 2500);
  };

  const handleAdd = async () => {
    if (!newLabel.trim() || !newSent.trim()) return;
    await addPhrase({ label: newLabel, sentence: newSent, category: newCat, language: 'en' });
    const updated = await getPhrases();
    setPhrases(updated);
    setNewLabel(''); setNewSent(''); setShowAdd(false);
  };

  const speakTyped = () => {
    if (typed.trim()) doSpeak(typed, 'typed');
  };

  return (
    <div className="phrases-page">
      <div className="phrases-header">
        <div>
          <h1 className="page-title">Quick Phrases</h1>
          <p className="page-sub">Tap any phrase to hear it spoken aloud</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(v => !v)}>
          + Add Phrase
        </button>
      </div>

      {/* Free text → speak */}
      <div className="card type-speak-card">
        <div className="section-label">Type anything to speak</div>
        <div className="type-row">
          <input
            className="type-input"
            placeholder="Type a sentence and press Speak..."
            value={typed}
            onChange={e => setTyped(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && speakTyped()}
          />
          <button
            className={`btn-primary ${speaking === 'typed' ? 'btn-speaking' : ''}`}
            onClick={speakTyped}
            disabled={!typed.trim()}
          >
            <SpeakIcon/> Speak
          </button>
        </div>
      </div>

      {/* Add phrase form */}
      {showAdd && (
        <div className="card add-card">
          <div className="section-label">Add a custom phrase</div>
          <div className="add-form">
            <input className="add-input" placeholder="Label (e.g. Good morning)" value={newLabel} onChange={e => setNewLabel(e.target.value)}/>
            <input className="add-input" placeholder="Full sentence to speak" value={newSent} onChange={e => setNewSent(e.target.value)}/>
            <select className="add-select" value={newCat} onChange={e => setNewCat(e.target.value)}>
              {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="add-actions">
              <button className="btn-primary" onClick={handleAdd}>Save Phrase</button>
              <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="cat-row">
        {CATEGORIES.map(c => (
          <button
            key={c}
            className={`cat-pill ${category === c ? 'active' : ''}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Phrase grid */}
      <div className="phrase-grid">
        {filtered.map(p => (
          <button
            key={p.id}
            className={`phrase-tile ${speaking === p.id ? 'speaking' : ''} cat-${p.category}`}
            onClick={() => doSpeak(p.sentence, p.id)}
          >
            <div className="tile-label">{p.label}</div>
            <div className="tile-sentence">{p.sentence}</div>
            <div className="tile-footer">
              <span className={`tile-cat cat-badge-${p.category}`}>{p.category}</span>
              <SpeakIcon size={13}/>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">No phrases in this category yet.</div>
      )}
    </div>
  );
}

const SpeakIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>
);
