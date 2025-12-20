import React, { useState } from 'react';
import { Save, AlertCircle, Sparkles, Loader2 } from 'lucide-react';

export default function InputSection({ onSave }) {
    const [text, setText] = useState('');
    const [error, setError] = useState(null);
    const [useAI, setUseAI] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [logs, setLogs] = useState([]);

    const addLog = (msg) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
        console.log(msg);
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
                // Simple CSV parse: split by first comma
                const commaIndex = line.indexOf(',');
                if (commaIndex === -1) {
                    throw new Error(`Line ${index + 1} is missing a comma: "${line}"`);
                }

                const clean = (s) => s.trim().replace(/^(['"])(.*)\1$/, '$2');
                const term = clean(line.substring(0, commaIndex));
                const definition = clean(line.substring(commaIndex + 1));

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
        const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
        const model = import.meta.env.VITE_OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free";

        setLogs([]); // Clear previous
        addLog("Starting process...");

        if (!apiKey || apiKey === 'your_key_here') {
            setError("Please set VITE_OPENROUTER_API_KEY in your .env file.");
            addLog("Missing API Key");
            return;
        }

        if (!text.trim()) {
            setError("Please enter some text to generate cards from.");
            addLog("Empty text");
            return;
        }

        setIsLoading(true);
        setError(null);
        addLog("Sending request to OpenRouter...");

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            addLog("Request timed out!");
        }, 30000);

        try {
            addLog(`Using model: ${model}`);
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "HTTP-Referer": window.location.origin,
                    "X-Title": "FlashMaster",
                    "Content-Type": "application/json"
                },
                signal: controller.signal,
                body: JSON.stringify({
                    "model": model,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a helpful flashcard generator. extracting key terms and definitions from the user's text. Your output must be strictly in CSV format: TERM,DEFINITION. One per line. Do not include markdown code blocks, headers, or any other conversation. Do not number the lines."
                        },
                        {
                            "role": "user",
                            "content": text
                        }
                    ]
                })
            });

            clearTimeout(timeoutId);
            addLog(`Response Status: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                addLog(`Error Body: ${errorText.substring(0, 100)}...`);
                let message = "Failed to fetch";
                try {
                    const errData = JSON.parse(errorText);
                    message = errData.error?.message || message;
                } catch (e) { /* ignore */ }
                throw new Error(message);
            }

            const data = await response.json();
            addLog("Data received, parsing...");
            const content = data.choices[0].message.content;

            // Clean up potential markdown code blocks if the AI disobeyed
            const cleanContent = content.replace(/```csv/g, '').replace(/```/g, '').trim();
            addLog(`Content length: ${cleanContent.length}`);

            parseAndSave(cleanContent);
            addLog("Done!");

        } catch (err) {
            addLog(`Caught Error: ${err.message}`);
            setError("AI Generation Failed: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const placeholderCSV = `CIA Triad,Confidentiality Integrity Availability
AES,Advanced Encryption Standard
Two-Factor,Something you know plus something you have`;

    const placeholderAI = `Paste your study notes here! For example:

Security models are critical for CISSP. The Bell-LaPadula model focuses on confidentiality and has the 'No Read Up, No Write Down' rule. Biba, on the other hand, focuses on integrity.`;

    return (
        <div className="input-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>Flashcard Creator</h2>
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    background: useAI ? 'rgba(139, 92, 246, 0.2)' : 'var(--bg-card)',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: useAI ? '1px solid var(--accent-primary)' : '1px solid var(--border)',
                    transition: 'all 0.2s'
                }}>
                    <input
                        type="checkbox"
                        checked={useAI}
                        onChange={(e) => setUseAI(e.target.checked)}
                        style={{ accentColor: 'var(--accent-primary)' }}
                    />
                    <Sparkles size={16} color={useAI ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
                    <span style={{ color: useAI ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 500 }}>
                        Use AI Generation
                    </span>
                </label>
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                {useAI
                    ? "Paste your raw notes, article, or summary below. AI will extract the terms for you."
                    : <span>Paste your terms below one per line: <code>TERM,DEFINITION</code></span>
                }
            </p>

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

            <textarea
                className="input-area"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={useAI ? placeholderAI : placeholderCSV}
                disabled={isLoading}
            />

            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
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

            {logs.length > 0 && (
                <div style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    background: 'black',
                    color: '#00ff00',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    textAlign: 'left',
                    borderRadius: '0.5rem',
                    maxHeight: '200px',
                    overflowY: 'auto'
                }}>
                    <strong>Debug Logs:</strong>
                    {logs.map((log, i) => <div key={i}>{log}</div>)}
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
