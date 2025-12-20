import React, { useState } from 'react';
import { BookOpen, HelpCircle, Grid } from 'lucide-react';
import FlashcardMode from './FlashcardMode';
import QuizMode from './QuizMode';
import MatchMode from './MatchMode';

export default function StudyDashboard({ cards, onBack }) {
    const [activeTab, setActiveTab] = useState('study');

    return (
        <div>
            <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
                <button onClick={onBack} style={{ background: 'none', color: 'var(--text-secondary)', textDecoration: 'underline', fontSize: '0.9rem' }}>
                    &larr; Back to Input
                </button>
            </div>

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'study' ? 'active' : ''}`}
                    onClick={() => setActiveTab('study')}
                >
                    <BookOpen size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    Flashcards
                </button>
                <button
                    className={`tab ${activeTab === 'quiz' ? 'active' : ''}`}
                    onClick={() => setActiveTab('quiz')}
                >
                    <HelpCircle size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    Quiz
                </button>
                <button
                    className={`tab ${activeTab === 'match' ? 'active' : ''}`}
                    onClick={() => setActiveTab('match')}
                >
                    <Grid size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    Match
                </button>
            </div>

            {activeTab === 'study' && <FlashcardMode cards={cards} />}
            {activeTab === 'quiz' && <QuizMode cards={cards} />}
            {activeTab === 'match' && <MatchMode cards={cards} />}
        </div>
    );
}
