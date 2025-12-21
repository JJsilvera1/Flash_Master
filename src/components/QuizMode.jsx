import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, ArrowRight, RefreshCcw, Sparkles, Loader2, AlertCircle, ArrowLeftRight, FastForward } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function QuizMode({ cards: rawCards }) {
    const cards = React.useMemo(() => {
        const clean = (s) => (s && typeof s === 'string') ? s.trim().replace(/^(['"])(.*)\1$/, '$2') : s;
        return rawCards ? rawCards.map(c => ({ ...c, term: clean(c.term), definition: clean(c.definition) })) : [];
    }, [rawCards]);

    // Game State
    const [currentCard, setCurrentCard] = useState(null);
    const [options, setOptions] = useState([]);
    const [selectedOption, setSelectedOption] = useState(null);
    const [view, setView] = useState('question'); // 'question' | 'feedback'
    const [questionQueue, setQuestionQueue] = useState([]);

    // Scoring & History
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [history, setHistory] = useState([]); // { term, definition, questionType, answeredCorrectly, userAnswer }

    // Summary State
    const [showSummary, setShowSummary] = useState(false);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [summaryText, setSummaryText] = useState(null);

    // Settings
    const [useAI, setUseAI] = useState(false);
    const [quizType, setQuizType] = useState('def-to-term');
    const [autoNext, setAutoNext] = useState(false);

    // Async/Timer State
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [aiError, setAiError] = useState(null);
    const [countdown, setCountdown] = useState(null);
    const nextTimerRef = useRef(null);

    const shuffle = (array) => {
        let currentIndex = array.length, randomIndex;
        // While there remain elements to shuffle.
        while (currentIndex !== 0) {
            // Pick a remaining element.
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    };

    const generateQuestion = async () => {
        if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
        setCountdown(null);

        if (!cards || (!useAI && cards.length < 4)) return;

        // Manage Queue
        let nextCard;
        let newQueue = [...questionQueue];

        if (newQueue.length === 0) {
            // Refill and Shuffle
            const indices = cards.map((_, i) => i);
            for (let i = indices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }
            newQueue = indices;
        }

        const nextIndex = newQueue.pop();
        setQuestionQueue(newQueue);
        const randomCard = cards[nextIndex];

        setCurrentCard(randomCard);
        setSelectedOption(null);
        setView('question');
        setAiError(null);

        const questionIsDef = quizType === 'def-to-term';

        if (useAI) {
            setIsLoadingAI(true);
            try {
                const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
                const model = import.meta.env.VITE_OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free";

                if (!apiKey) throw new Error("Missing API Key");

                let systemPrompt = "";
                let userPrompt = `Term: ${randomCard.term}\nDefinition: ${randomCard.definition}`;

                if (questionIsDef) {
                    // REFINED MODE: Real, distinct concepts from the same domain
                    systemPrompt = `You are a concise exam creator. I will give you a Term and Definition. Generate 3 "distractor" TERMS that are REAL, VALID industry terms from the SAME domain. Do NOT generate fake terms. Do NOT generate terms that are chemically similar to the answer (e.g. if answer is "SaaS", don't just say "SaaS V2"). Give distinct concepts that a student might confuse (e.g. if answer is "Phishing", give "Vishing" or "Whaling"). Return ONLY the 3 terms separated by pipe symbol "|". No labeling.`;
                } else {
                    // REFINED MODE: Distinct definitions of related concepts
                    systemPrompt = `You are a concise exam creator. I will give you a Term and Definition. Generate 3 "distractor" DEFINITIONS. IMPORTANT: Do NOT just tweak the correct definition by one word. Instead, write valid definitions for DIFFERENT concepts that belong to the same category. (e.g. If the term is "Symmetric Key", descibe "Public Key" or "Hashing" as the distractors). The distractors must be plausible because they describe real things, but they are WRONG for this specific term. Return ONLY the 3 definitions separated by pipe symbol "|". No labeling.`;
                }

                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "HTTP-Referer": window.location.origin,
                        "X-Title": "FlashMaster",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        "model": model,
                        "messages": [
                            { "role": "system", "content": systemPrompt },
                            { "role": "user", "content": userPrompt }
                        ]
                    })
                });

                if (!response.ok) throw new Error("AI Fetch Failed");

                const data = await response.json();
                const content = data.choices[0].message.content.trim();
                const distractorTexts = content.split('|').map(t => t.trim());

                const distractorOptions = distractorTexts.slice(0, 3).map((text, i) => ({
                    id: `ai-distractor-${i}`,
                    term: questionIsDef ? text : randomCard.term,
                    definition: !questionIsDef ? text : randomCard.definition,
                    label: text,
                    isDistractor: true
                }));

                const correctOption = {
                    ...randomCard,
                    label: questionIsDef ? randomCard.term : randomCard.definition,
                    isDistractor: false
                };

                while (distractorOptions.length < 3 && cards.length > 3) {
                    const c = cards[Math.floor(Math.random() * cards.length)];
                    if (c.id !== randomCard.id) {
                        distractorOptions.push({
                            ...c,
                            label: questionIsDef ? c.term : c.definition,
                            isDistractor: false
                        });
                    }
                }

                const allOptions = shuffle([correctOption, ...distractorOptions]);
                setOptions(allOptions);

            } catch (err) {
                console.error(err);
                setAiError("AI failed, falling back to deck.");
                generateStandardOptions(randomCard);
            } finally {
                setIsLoadingAI(false);
            }
        } else {
            generateStandardOptions(randomCard);
        }
    };

    const generateStandardOptions = (targetCard) => {
        const distractors = [];
        if (cards.length < 4) return;
        while (distractors.length < 3) {
            const c = cards[Math.floor(Math.random() * cards.length)];
            if (c.id !== targetCard.id && !distractors.find(d => d.id === c.id)) {
                distractors.push(c);
            }
        }
        const allCandidates = [targetCard, ...distractors];
        const formattedOptions = allCandidates.map(c => ({
            ...c,
            label: quizType === 'def-to-term' ? c.term : c.definition
        }));
        setOptions(shuffle(formattedOptions));
    };

    const handleFinish = async () => {
        setShowSummary(true);
        if (history.length === 0) {
            setSummaryText("No questions answered yet!");
            return;
        }

        setIsGeneratingSummary(true);
        try {
            const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
            const model = import.meta.env.VITE_OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free";

            // Format history for AI
            const report = history.map((h, i) =>
                `Q${i + 1} [${h.questionType}]: ${h.term} - ${h.answeredCorrectly ? "CORRECT" : "WRONG"}`
            ).join("\n");

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "HTTP-Referer": window.location.origin,
                    "X-Title": "FlashMaster",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": model,
                    "messages": [
                        { "role": "system", "content": "You are a friendly study tutor. Analyze the student's quiz session history. Identify 1) Calculate percentage score. 2) What topics they are strong in. 3) Specific weaknesses or confusion patterns (e.g. 'You keep confusing encryption types'). Give 3 actionable tips. Keep it concise." },
                        { "role": "user", "content": report }
                    ]
                })
            });

            const data = await response.json();
            setSummaryText(data.choices[0].message.content);

        } catch (err) {
            setSummaryText("Failed to generate AI summary. Ensure your API Key is set.");
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    useEffect(() => {
        if ((cards.length >= 4 || useAI) && !currentCard) {
            generateQuestion();
        }
        return () => { if (nextTimerRef.current) clearTimeout(nextTimerRef.current); };
    }, [quizType, cards, useAI]);

    // Countdown
    useEffect(() => {
        if (countdown === null) return;
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            generateQuestion();
        }
    }, [countdown]);

    const handleOptionClick = (option) => {
        if (view === 'feedback' || isLoadingAI) return;

        setSelectedOption(option);
        setView('feedback');

        const isCorrect = option.id === currentCard.id && !option.isDistractor;

        if (isCorrect) {
            setCorrectCount(p => p + 1);
        } else {
            setWrongCount(p => p + 1);
        }

        // Record History
        setHistory(prev => [...prev, {
            term: currentCard.term,
            definition: currentCard.definition,
            questionType: quizType,
            answeredCorrectly: isCorrect,
            userAnswer: option.label
        }]);

        if (autoNext) {
            if (isCorrect) {
                nextTimerRef.current = setTimeout(generateQuestion, 1000);
            } else {
                setCountdown(3);
            }
        }
    };

    const toggleQuizType = () => {
        setQuizType(prev => prev === 'def-to-term' ? 'term-to-def' : 'def-to-term');
        // Reset logic could go here, but maybe we keep score for the session?
        // setCorrectCount(0); setWrongCount(0);
    };

    const handleManualNext = () => {
        if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
        generateQuestion();
    };

    if (!cards || (!useAI && cards.length < 4)) {
        return <div style={{ padding: '2rem' }}>Not enough cards.</div>; // Simplified error state
    }

    const headerText = quizType === 'def-to-term' ? currentCard?.definition : currentCard?.term;

    if (showSummary) {
        return (
            <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
                <button className="btn-secondary" onClick={() => setShowSummary(false)} style={{ marginBottom: '1rem' }}>
                    &larr; Back to Quiz
                </button>
                <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                    <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sparkles color="var(--accent-primary)" /> AI Session Summary
                    </h2>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem' }}>
                        <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>Correct: {correctCount}</span>
                        <span style={{ color: 'var(--error)', fontWeight: 'bold' }}>Wrong: {wrongCount}</span>
                        <span>Total: {history.length}</span>
                    </div>

                    {isGeneratingSummary ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <Loader2 className="spin" size={32} />
                            <p>Analyzing your performance...</p>
                        </div>
                    ) : (
                        <div style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>
                            <ReactMarkdown>{summaryText}</ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', fontWeight: '600' }}>
                        <span style={{ color: 'var(--success)' }}>Correct: {correctCount}</span>
                        <span style={{ color: 'var(--error)' }}>Wrong: {wrongCount}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-secondary" onClick={handleFinish} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                            Finish & Summary
                        </button>
                        <button onClick={toggleQuizType} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} title="Switch Quiz Direction">
                            <ArrowLeftRight size={14} />
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: useAI ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                        <input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} />
                        <Sparkles size={14} /> AI Distractors
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: autoNext ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        <input type="checkbox" checked={autoNext} onChange={(e) => setAutoNext(e.target.checked)} />
                        <FastForward size={14} /> Auto Next
                    </label>
                </div>
            </div>

            {aiError && <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginBottom: '0.5rem' }}><AlertCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />{aiError}</div>}

            <div className="flashcard-front" style={{
                position: 'relative', width: '100%', minHeight: '200px', marginBottom: '2rem', height: 'auto', fontSize: '1.2rem',
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word', padding: '2rem', boxSizing: 'border-box', overflowY: 'auto', maxHeight: '400px'
            }}>
                {currentCard ? headerText : "Loading..."}

                {countdown !== null && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', borderRadius: '1rem',
                        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 10
                    }}>
                        <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{countdown}</div>
                        <div>Next question in...</div>
                        <button onClick={handleManualNext} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'white', color: 'black', borderRadius: '0.5rem' }}>Skip Wait</button>
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {isLoadingAI ? (
                    <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <Loader2 className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                        <p>Generating strict distractors...</p>
                    </div>
                ) : (
                    options.map((option, index) => {
                        let className = 'quiz-option';
                        const letter = String.fromCharCode(65 + index);
                        const isCorrect = option.id === currentCard.id && !option.isDistractor;

                        if (view === 'feedback') {
                            if (isCorrect) className += ' correct';
                            else if (option.id === selectedOption?.id) className += ' wrong';
                        }

                        return (
                            <button key={option.id + option.label} className={className} onClick={() => handleOptionClick(option)} disabled={view === 'feedback'}>
                                <span style={{ marginRight: '0.75rem', fontWeight: 'bold' }}>{letter}.</span>
                                {option.label}
                                {view === 'feedback' && isCorrect && <CheckCircle size={16} style={{ float: 'right', color: 'var(--success)' }} />}
                                {view === 'feedback' && option.id === selectedOption?.id && !isCorrect && <XCircle size={16} style={{ float: 'right', color: 'var(--error)' }} />}
                            </button>
                        );
                    })
                )}
            </div>

            {view === 'feedback' && !countdown && (
                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <button className="btn-primary" onClick={handleManualNext}>
                        {autoNext ? "Next (Auto)" : "Next Question"} <ArrowRight size={18} style={{ marginLeft: '0.5rem', verticalAlign: 'middle' }} />
                    </button>
                </div>
            )}
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
