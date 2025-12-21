import React, { useState, useEffect } from 'react';
import InputSection from './components/InputSection';
import StudyDashboard from './components/StudyDashboard';
import { Zap, Github, ArrowLeft } from 'lucide-react';
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"



function App() {
  // Try to load from local storage
  const [cards, setCards] = useState(() => {
    const saved = localStorage.getItem('flashcards');
    return saved ? JSON.parse(saved) : [];
  });

  // AI State
  const [aiEnabled, setAiEnabled] = useState(false);

  const [mode, setMode] = useState(cards.length > 0 ? 'study' : 'input');

  const handleSaveCards = (newCards) => {
    setCards(newCards);
    localStorage.setItem('flashcards', JSON.stringify(newCards));
    setMode('study');
  };

  const handleBack = () => {
    setMode('input');
  };

  return (
    <div className="app-main">
      <header className="app-header">
        {mode === 'study' && (
          <button
            onClick={handleBack}
            className="btn-secondary header-back"
          >
            <ArrowLeft size={14} />
            <span className="back-text">Terms</span>
          </button>
        )}
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, display: 'inline-block' }}>
            <Zap size={32} style={{ color: '#a855f7', stroke: '#a855f7', verticalAlign: 'middle', marginRight: '0.5rem' }} />
            FlashMaster
          </h1>
          <p className="header-tagline" style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Test your memory with flashcards, quizzes, matching, and recall modes.
          </p>
        </div>
        <a
          href="https://github.com/JJsilvera1/CISSP-Quiz"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary header-github"
        >
          <Github size={14} />
          <span>GitHub</span>
        </a>
      </header>

      <main>
        {mode === 'input' ? (
          <InputSection onSave={handleSaveCards} onAiEnabledChange={setAiEnabled} initialAiEnabled={aiEnabled} />
        ) : (
          <StudyDashboard cards={cards} onBack={handleBack} aiEnabled={aiEnabled} />
        )}
      </main>

      <footer className="footer">
        <p>&copy; 2025 FlashMaster. Built for effortless and easy learning. Created by: Jordan S.</p>
        <a
          href="https://github.com/JJsilvera1/CISSP-Quiz"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary footer-github"
        >
          <Github size={14} />
          <span>GitHub</span>
        </a>
      </footer>
      <Analytics />
      <SpeedInsights />
    </div>
  );
}


export default App;
