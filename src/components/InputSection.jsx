import React, { useState, useEffect, useRef } from 'react';
import { Save, AlertCircle, Sparkles, Loader2, Settings, HelpCircle, Trash2 } from 'lucide-react';

export default function InputSection({ onSave, onAiEnabledChange, initialAiEnabled }) {
    // Load from local storage or default to empty
    const [text, setText] = useState(() => localStorage.getItem('flashcards_input_text') || '');
    const [context, setContext] = useState(() => localStorage.getItem('flashcards_input_context') || '');

    const [error, setError] = useState(null);
    const [useAI, setUseAI] = useState(initialAiEnabled || false);
    const [isLoading, setIsLoading] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    // Save to local storage whenever text or context changes
    useEffect(() => {
        localStorage.setItem('flashcards_input_text', text);
    }, [text]);

    useEffect(() => {
        localStorage.setItem('flashcards_input_context', context);
    }, [context]);

    // API Config State
    const [showSettings, setShowSettings] = useState(false);
    const [apiConfig, setApiConfig] = useState(() => {
        const saved = localStorage.getItem('flashcards_api_config');
        return saved ? JSON.parse(saved) : {
            provider: 'openrouter', // 'openrouter' | 'openai'
            apiKey: '',
            model: 'google/gemini-2.0-flash-exp:free'
        };
    });

    const updateApiConfig = (newConfig) => {
        const updated = { ...apiConfig, ...newConfig };
        setApiConfig(updated);
        localStorage.setItem('flashcards_api_config', JSON.stringify(updated));
    };

    const handleClear = () => {
        if (window.confirm("Are you sure you want to clear the terms box?")) {
            setText('');
            localStorage.removeItem('flashcards_input_text');
        }
    };

    // Ensure model and provider are valid on mount
    useEffect(() => {
        const validModels = [
            "openai/gpt-oss-120b",
            "qwen/qwen3-vl-235b-a22b-instruct",
            "z-ai/glm-4.5-air",
            "openai/gpt-5.2-chat",
            "anthropic/claude-haiku-4.5",
            "google/gemini-3-flash-preview"
        ];

        let updates = {};
        if (apiConfig.provider !== 'openrouter') {
            updates.provider = 'openrouter';
        }
        if (!validModels.includes(apiConfig.model)) {
            updates.model = validModels[0];
        }

        if (Object.keys(updates).length > 0) {
            updateApiConfig(updates);
        }
    }, []);

    const textareaRef = useRef(null);
    const lineNumbersRef = useRef(null);

    const handleScroll = () => {
        if (textareaRef.current && lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    const handleSave = () => {
        try {
            if (useAI) {
                generateFlashcards();
                return;
            }
            parseAndSave(text);
        } catch (err) {
            setError(err.message);
        }
    };

    const parseAndSave = (inputText) => {
        try {
            const lines = inputText.trim().split('\n');
            const cards = [];
            lines.forEach((line, index) => {
                if (!line.trim()) return;
                // Robust Parse: Try Pipe first, then Comma
                let delimiter = '|';
                let splitIndex = line.indexOf(delimiter);

                if (splitIndex === -1) {
                    delimiter = ',';
                    splitIndex = line.indexOf(delimiter);
                }

                if (splitIndex === -1) {
                    throw new Error(`Line ${index + 1} is missing a separator (| or ,): "${line}"`);
                }

                const clean = (s) => s.trim().replace(/^(['"])(.*)\1$/, '$2');
                const term = clean(line.substring(0, splitIndex));
                const definition = clean(line.substring(splitIndex + 1));

                if (!term || !definition) {
                    throw new Error(`Line ${index + 1} has empty term or definition.`);
                }
                cards.push({ id: Math.random().toString(36).substr(2, 9), term, definition });
            });

            if (cards.length === 0) {
                throw new Error("No valid cards found.");
            }

            onSave(cards);
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const generateFlashcards = async () => {
        if (!text.trim()) {
            setError("Please enter some text to generate cards from.");
            return;
        }

        const apiKey = apiConfig.apiKey || import.meta.env.VITE_OPENROUTER_API_KEY;
        // If still no key and using OpenAI, error. OpenRouter might use free env key.
        if (!apiKey && apiConfig.provider === 'openai') {
            setError("Please enter your OpenAI API Key in settings.");
            setShowSettings(true);
            return;
        }

        // Determine URL and Headers based on provider
        let url, headers, body;

        if (apiConfig.provider === 'openai') {
            url = "https://api.openai.com/v1/chat/completions";
            headers = {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            };
            body = {
                model: apiConfig.model,
                messages: [
                    {
                        role: "system",
                        content: `You are a helpful flashcard generator. extracting key terms and definitions from the user's text. 
                        ${context ? `CONTEXT: The user is studying "${context}". Use this to ensure definitions are relevant to this topic.` : ''}
                        Your output must be strictly in CSV format: TERM,DEFINITION. One per line. Do not include markdown code blocks, headers, or any other conversation. Do not number the lines. Example:
                        Apple,A red fruit
                        Banana,A yellow fruit`
                    },
                    { role: "user", content: text }
                ]
            };
        } else {
            // OpenRouter (Default)
            url = "https://openrouter.ai/api/v1/chat/completions";
            headers = {
                "Authorization": `Bearer ${apiKey || import.meta.env.VITE_OPENROUTER_API_KEY}`,
                "HTTP-Referer": window.location.origin,
                "X-Title": "FlashMaster",
                "Content-Type": "application/json"
            };
            body = {
                model: apiConfig.model,
                messages: [
                    {
                        role: "system",
                        content: `You are a helpful flashcard generator. extracting key terms and definitions from the user's text. 
                        ${context ? `CONTEXT: The user is studying "${context}". Use this to ensure definitions are relevant to this topic.` : ''}
                        Your output must be strictly in CSV format: TERM,DEFINITION. One per line. Do not include markdown code blocks, headers, or any other conversation. Do not number the lines. Example:
                        Apple,A red fruit
                        Banana,A yellow fruit`
                    },
                    { role: "user", content: text }
                ]
            };
        }

        setIsLoading(true);
        setError(null);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, 60000); // Increased to 60s

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: headers,
                signal: controller.signal,
                body: JSON.stringify(body)
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                let message = "Failed to fetch";
                try {
                    const errData = JSON.parse(errorText);
                    message = errData.error?.message || message;
                } catch (e) { /* ignore */ }

                if (response.status === 401) {
                    throw new Error("Invalid API Key. Please check your key in Settings.");
                }
                throw new Error(`${message} (Status: ${response.status})`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            // Clean up potential markdown code blocks if the AI disobeyed
            const cleanContent = content.replace(/```csv/g, '').replace(/```/g, '').trim();

            parseAndSave(cleanContent);

        } catch (err) {
            if (err.message.includes("Failed to fetch")) {
                setError("Connection Failed. Do you have a valid API Key in Settings?");
            } else {
                setError("AI Generation Failed: " + err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const generateTermsOnly = async () => {
        if (!context.trim()) {
            setError("Please enter a topic in the Optional Context box to generate terms (e.g. 'CISSP Domain 1').");
            return;
        }

        const apiKey = apiConfig.apiKey || import.meta.env.VITE_OPENROUTER_API_KEY;
        if (!apiKey && apiConfig.provider === 'openai') {
            setError("Please enter your OpenAI API Key in settings.");
            setShowSettings(true);
            return;
        }

        setIsLoading(true);
        setError(null);

        let url, headers, body;
        const prompt = `Generate 30 high-quality flashcards for the topic: "${context}". Output strictly in CSV format: TERM,DEFINITION. One per line. Do not number lines. No intro/outro text. Example:
        Apple,A red fruit
        Banana,A yellow fruit`;

        if (apiConfig.provider === 'openai') {
            url = "https://api.openai.com/v1/chat/completions";
            headers = {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            };
            body = {
                model: apiConfig.model,
                messages: [{ role: "user", content: prompt }]
            };
        } else {
            url = "https://openrouter.ai/api/v1/chat/completions";
            headers = {
                "Authorization": `Bearer ${apiKey || import.meta.env.VITE_OPENROUTER_API_KEY}`,
                "HTTP-Referer": window.location.origin,
                "X-Title": "FlashMaster",
                "Content-Type": "application/json"
            };
            body = {
                model: apiConfig.model,
                messages: [{ role: "user", content: prompt }]
            };
        }

        try {
            const response = await fetch(url, {
                method: "POST", headers, body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                if (response.status === 401) {
                    throw new Error("Invalid API Key. Please check your key in Settings.");
                }
                throw new Error(`Generation failed (Status: ${response.status}). ${errorText.substring(0, 100)}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;
            const cleanContent = content.replace(/```csv/g, '').replace(/```/g, '').trim();

            setText(prev => prev ? prev + '\n' + cleanContent : cleanContent);

        } catch (err) {
            if (err.message.includes("Failed to fetch")) {
                setError("Connection Failed. Do you have a valid API Key in Settings?");
            } else {
                setError(err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const placeholderCSV = `CIA Triad,Confidentiality Integrity Availability
AES,Advanced Encryption Standard
Two-Factor,Something you know plus something you have`;

    const placeholderAI = `Paste your study notes here! For example:

Security models are critical for CISSP. The Bell-LaPadula model focuses on confidentiality and has the 'No Read Up, No Write Down' rule. Biba, on the other hand, focuses on integrity.`;

    const guideText = `Welcome to FlashMaster! ⚡

1. Manual Mode:
   - Simply enter your terms and definitions in the box, comma separated.
   - Example: Term,Definition
   - Hit "Create Flashcards" to play without AI.

2. AI Power Mode 🤖:
   - Toggle "Use AI Generation".
   - Fill in the "Optional Context" (e.g., "Biology Ch 1").
   - Paste raw notes or click "Generate Terms" to get ~50-100 cards instantly.
   - Enabling AI also unlocks RECALL MODE - the ultimate memory test!`;

    return (
        <div className="input-container">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginBottom: '1rem' }}>
                <div className="action-bar">
                    <button
                        onClick={() => setShowHelp(true)}
                        className="btn-secondary action-btn help-btn"
                        title="How to use"
                    >
                        <HelpCircle size={14} />
                        <span className="btn-text">Help</span>
                    </button>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="btn-secondary action-btn"
                        title="AI Settings"
                    >
                        <Settings size={14} />
                        <span className="btn-text">Settings</span>
                    </button>
                    <label className={`ai-toggle ${useAI ? 'active' : ''}`}>
                        <input
                            type="checkbox"
                            checked={useAI}
                            onChange={(e) => {
                                const newValue = e.target.checked;
                                setUseAI(newValue);
                                if (onAiEnabledChange) onAiEnabledChange(newValue);
                            }}
                        />
                        <Sparkles size={12} className="ai-icon" />
                        <span className="ai-label">
                            Use AI Generation
                        </span>
                    </label>
                </div>
                {!useAI && (
                    <div style={{ fontSize: '0.7rem', color: 'orange', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.5rem' }}>
                        <AlertCircle size={12} />
                        Note: Disabling AI will disable Recall Mode and distractor generation.
                    </div>
                )}
            </div>

            {/* Help Modal */}
            {showHelp && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }}>
                    <div style={{
                        background: 'var(--bg-card)', padding: '2rem', borderRadius: '1rem',
                        maxWidth: '500px', width: '100%', border: '1px solid var(--border)',
                        position: 'relative', maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <h3 style={{ marginTop: 0 }}>How to Use FlashMaster</h3>
                        <div style={{ lineHeight: 1.6, color: 'var(--text-secondary)', textAlign: 'left' }}>
                            <p style={{ marginBottom: '1.5rem' }}>
                                FlashMaster is designed to help you study efficiently using custom flashcards, quizzes, and matching games.
                            </p>

                            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1rem' }}>1. Manual Mode</h4>
                            <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem', marginTop: 0 }}>
                                <li><strong>Input Format:</strong> Enter one term and definition per line, separated by a comma (or pipe `|`).</li>
                                <li><strong>Example:</strong> <code>Term, Definition</code></li>
                                <li><strong>Start:</strong> Click "Create Flashcards" to begin studying immediately.</li>
                            </ul>

                            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1rem' }}>2. AI Generation Mode</h4>
                            <p style={{ marginBottom: '0.5rem' }}>
                                Leverage AI to automatically generate study materials from raw text.
                            </p>
                            <ul style={{ paddingLeft: '1.5rem', marginBottom: '0', marginTop: 0 }}>
                                <li><strong>Enable:</strong> Toggle the "Use AI Generation" switch at the top.</li>
                                <li><strong>Context:</strong> Optionally add a subject (e.g., "CISSP Domain 1") to guide the generation.</li>
                                <li><strong>Input:</strong> Paste your notes, identifiers, or summary text into the main text area.</li>
                                <li><strong>Generate:</strong> Click "Generate Terms" to populate the list for review, or "Generate & Play" to start immediately.</li>
                                <li><strong>Recall Mode:</strong> Enabling AI unlocks Recall Mode, a more advanced testing method.</li>
                            </ul>
                        </div>
                        <button
                            className="btn-primary"
                            style={{ marginTop: '2rem', width: '100%' }}
                            onClick={() => setShowHelp(false)}
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            )}

            {showSettings && (
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    marginBottom: '1rem',
                    textAlign: 'left'
                }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem' }}>AI Configuration</h3>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>API Key (Stored in Browser)</label>
                        <input
                            type="password"
                            value={apiConfig.apiKey}
                            onChange={(e) => updateApiConfig({ apiKey: e.target.value })}
                            placeholder="sk-or-..."
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', background: '#0f172a', color: 'white', border: '1px solid var(--border)' }}
                        />
                        <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            Your key is stored locally in your browser and sent directly to the OpenRouter API.
                        </p>
                    </div>

                    <div style={{ marginBottom: '0.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Model</label>
                        <select
                            value={apiConfig.model}
                            onChange={(e) => updateApiConfig({ model: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', background: '#0f172a', color: 'white', border: '1px solid var(--border)' }}
                        >
                            <option value="openai/gpt-oss-120b">GPT OSS 120B</option>
                            <option value="qwen/qwen3-vl-235b-a22b-instruct">Qwen3 VL 235B</option>
                            <option value="z-ai/glm-4.5-air">GLM 4.5 Air</option>
                            <option value="openai/gpt-5.2-chat">GPT 5.2</option>
                            <option value="anthropic/claude-haiku-4.5">Claude Haiku 4.5</option>
                            <option value="google/gemini-3-flash-preview">Gemini 3 Flash Preview</option>
                        </select>
                    </div>
                </div>
            )}

            {useAI && (
                <div style={{ marginBottom: '1rem' }}>
                    <input
                        type="text"
                        placeholder="Optional Context (e.g. 'CISSP Domain 1', 'Biology 101')"
                        maxLength={100}
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '0.75rem',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem',
                            fontFamily: 'var(--font-family)'
                        }}
                    />
                    <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        {context.length}/100
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', marginBottom: '0' }}>
                        Paste your raw notes, article, or summary below. AI will extract the terms for you.
                    </p>
                </div>
            )}

            <div style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                <p style={{ marginBottom: '0.5rem' }}>
                    <span>Paste your terms below one per line with comma separation: <code>TERM,DEFINITION</code></span>
                </p>
            </div>

            {error && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textAlign: 'left'
                }}>
                    <AlertCircle size={20} />
                    <div>{error}</div>
                </div>
            )}

            <div style={{ position: 'relative', display: 'flex', border: '1px solid var(--border)', borderRadius: '0.75rem', overflow: 'hidden', minHeight: '300px', background: 'var(--bg-card)' }}>
                <div
                    ref={lineNumbersRef}
                    className="line-numbers"
                    style={{
                        padding: '1rem 0.5rem',
                        background: '#0f172a',
                        color: 'var(--text-secondary)',
                        textAlign: 'right',
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                        lineHeight: '1.5',
                        minWidth: '3rem',
                        userSelect: 'none',
                        overflow: 'hidden',
                        opacity: 0.6
                    }}
                >
                    {text.split('\n').map((_, i) => (
                        <div key={i}>{i + 1}</div>
                    ))}
                    {/* Always show at least row 1 */}
                    {text === '' && <div>1</div>}
                </div>
                <textarea
                    ref={textareaRef}
                    className="input-area"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onScroll={handleScroll}
                    placeholder={useAI ? placeholderAI : placeholderCSV}
                    disabled={isLoading}
                    style={{
                        border: 'none',
                        borderRadius: 0,
                        resize: 'none',
                        lineHeight: '1.5',
                        flex: 1,
                        outline: 'none'
                    }}
                />
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <button
                    className="btn-secondary"
                    onClick={handleClear}
                    style={{ color: '#ef4444', borderColor: '#ef4444', padding: '0.5rem 1rem' }}
                    title="Clear all text"
                >
                    <Trash2 size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    Clear
                </button>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'flex-end', flex: 1 }}>
                    {useAI && (
                        <button
                            className="btn-secondary"
                            onClick={generateTermsOnly}
                            disabled={isLoading}
                        >
                            Generate Terms
                        </button>
                    )}
                    <button className="btn-primary" onClick={handleSave} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="spin" style={{ marginRight: '0.5rem', verticalAlign: 'middle', animation: 'spin 1s linear infinite' }} />
                                Generating...
                            </>
                        ) : (
                            <>
                                {useAI ? <Sparkles size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> : <Save size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />}
                                {useAI ? "Generate & Play" : "Create Flashcards"}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {isLoading && useAI && (
                <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    Should take less than 30 seconds to generate all flashcards, depending on how many were added...
                </div>
            )}

            <style>{`
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
    );
}
