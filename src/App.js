import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import SignLanguagePage from './pages/SignLanguagePage';
import PhrasesPage     from './pages/PhrasesPage';
import HistoryPage     from './pages/HistoryPage';
import SettingsPage    from './pages/SettingsPage';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="topbar">
          <div className="topbar-brand">
            <span className="brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </span>
            <span className="brand-name">Smart Voice</span>
            <span className="brand-tag">Non-verbal communication</span>
          </div>
        </header>

        <nav className="sidenav">
          <NavLink to="/"         end className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <CamIcon/> Sign Camera
          </NavLink>
          <NavLink to="/phrases"      className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <GridIcon/> Quick Phrases
          </NavLink>
          <NavLink to="/history"      className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <ClockIcon/> History
          </NavLink>
          <NavLink to="/settings"     className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <SettingsIcon/> Settings
          </NavLink>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/"         element={<SignLanguagePage/>}/>
            <Route path="/phrases"  element={<PhrasesPage/>}/>
            <Route path="/history"  element={<HistoryPage/>}/>
            <Route path="/settings" element={<SettingsPage/>}/>
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

const CamIcon      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 3l4 4-4 4"/><path d="M8 3l-4 4 4 4"/></svg>;
const GridIcon     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
const ClockIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const SettingsIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07M4.93 4.93a10 10 0 0 0 0 14.14M8.46 8.46a5 5 0 0 0 0 7.07"/></svg>;
