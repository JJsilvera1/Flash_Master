import React, { useState, useEffect } from 'react';
import InputSection from './components/InputSection';
import StudyDashboard from './components/StudyDashboard';
import { Zap } from 'lucide-react';

function App() {
  // Try to load from local storage
  const [cards, setCards] = useState(() => {
    const saved = localStorage.getItem('flashcards');
    return saved ? JSON.parse(saved) : [];
  });

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
    <div style={{ minHeight: '100vh', padding: '1rem' }}>
      <header style={{ marginBottom: '3rem', marginTop: '1rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
          <Zap size={32} style={{ color: '#a855f7', stroke: '#a855f7', verticalAlign: 'middle', marginRight: '0.5rem' }} />
          FlashMaster
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Premium Study Tool</p>
      </header>

      <main>
        {mode === 'input' ? (
          <InputSection onSave={handleSaveCards} />
        ) : (
          <StudyDashboard cards={cards} onBack={handleBack} />
        )}
      </main>

      <footer style={{ marginTop: '4rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
        &copy; {new Date().getFullYear()} FlashMaster. Built for effortless learning.
      </footer>
    </div>
  );
}

export default App;
