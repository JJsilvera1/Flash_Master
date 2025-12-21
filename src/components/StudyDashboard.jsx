import React, { useState } from 'react';
import { BookOpen, HelpCircle, Grid, Brain, ArrowLeft } from 'lucide-react';
import FlashcardMode from './FlashcardMode';
import QuizMode from './QuizMode';
import MatchMode from './MatchMode';
import RecallMode from './RecallMode';

export default function StudyDashboard({ cards, onBack, aiEnabled }) {
    const [activeTab, setActiveTab] = useState('study');

    return (
        <div>


            <div className="tabs">
                <button
                    className="tab mobile-only-tab"
                    onClick={onBack}
                >
                    <ArrowLeft size={18} />
                    <span>Terms</span>
                </button>
                <button
                    className={`tab ${activeTab === 'study' ? 'active' : ''}`}
                    onClick={() => setActiveTab('study')}
                >
                    <BookOpen size={18} />
                    <span>Flashcards</span>
                </button>
                <button
                    className={`tab ${activeTab === 'quiz' ? 'active' : ''}`}
                    onClick={() => setActiveTab('quiz')}
                >
                    <HelpCircle size={18} />
                    <span>Quiz</span>
                </button>
                <button
                    className={`tab ${activeTab === 'match' ? 'active' : ''}`}
                    onClick={() => setActiveTab('match')}
                >
                    <Grid size={18} />
                    <span>Match</span>
                </button>
                <button
                    className={`tab ${activeTab === 'recall' ? 'active' : ''}`}
                    onClick={() => aiEnabled && setActiveTab('recall')}
                    disabled={!aiEnabled}
                    title={!aiEnabled ? "Enable AI in Input to use Recall Mode" : "Recall Mode"}
                    style={{ opacity: !aiEnabled ? 0.5 : 1, cursor: !aiEnabled ? 'not-allowed' : 'pointer' }}
                >
                    <Brain size={18} />
                    <span>Recall</span>
                </button>
            </div>

            {activeTab === 'study' && <FlashcardMode cards={cards} />}
            {activeTab === 'quiz' && <QuizMode cards={cards} />}
            {activeTab === 'match' && <MatchMode cards={cards} />}
            {activeTab === 'recall' && <RecallMode cards={cards} />}
        </div >
    );
}
