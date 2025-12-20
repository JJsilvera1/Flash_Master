import React, { useState, useEffect } from 'react';
import { Trophy, RefreshCw } from 'lucide-react';

export default function MatchMode({ cards: rawCards }) {
    const clean = (s) => (s && typeof s === 'string') ? s.trim().replace(/^(['"])(.*)\1$/, '$2') : s;
    const cards = rawCards ? rawCards.map(c => ({ ...c, term: clean(c.term), definition: clean(c.definition) })) : [];
    const [tiles, setTiles] = useState([]);
    const [selectedTiles, setSelectedTiles] = useState([]);
    const [matchedIds, setMatchedIds] = useState([]);
    const [isWon, setIsWon] = useState(false);

    // Fisher-Yates Shuffle
    const shuffle = (array) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    // Initialize game
    const initGame = () => {
        // Shuffle full deck first, then pick 7
        const shuffledDeck = shuffle(cards);
        const gameCards = shuffledDeck.slice(0, 7);

        const newTiles = gameCards.flatMap(card => [
            { id: card.id + '-term', cardId: card.id, content: card.term, type: 'term' },
            { id: card.id + '-def', cardId: card.id, content: card.definition, type: 'def' }
        ]);

        // Shuffle the tiles again
        setTiles(shuffle(newTiles));
        setMatchedIds([]);
        setSelectedTiles([]);
        setIsWon(false);
    };

    // Effect must only run when rawCards changes (length/id ref), NOT 'cards' which regenerates every render
    // We trust that if rawCards changes, we re-init.
    useEffect(() => {
        initGame();
    }, [rawCards]);

    const handleTileClick = (tile) => {
        // Ignore if already matched or selected
        if (matchedIds.includes(tile.cardId) || selectedTiles.find(t => t.id === tile.id)) return;

        // If we have 2 selected already, don't allow 3rd click until reset (though we usually reset immediately)
        if (selectedTiles.length >= 2) return;

        const newSelected = [...selectedTiles, tile];
        setSelectedTiles(newSelected);

        if (newSelected.length === 2) {
            if (newSelected[0].cardId === newSelected[1].cardId) {
                // Match!
                setMatchedIds(prev => [...prev, newSelected[0].cardId]);
                setSelectedTiles([]);
            } else {
                // Mismatch
                setTimeout(() => {
                    setSelectedTiles([]);
                }, 1000);
            }
        }
    };

    useEffect(() => {
        if (tiles.length > 0 && matchedIds.length === tiles.length / 2) {
            setIsWon(true);
        }
    }, [matchedIds, tiles]);

    if (!cards || cards.length < 2) return <div>Need at least 2 cards to match.</div>;

    return (
        <div>
            <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
                <button className="btn-secondary" onClick={initGame}>
                    <RefreshCw size={16} /> Reset
                </button>
            </div>

            {isWon ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <Trophy size={64} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
                    <h2>All Cleared!</h2>
                    <button className="btn-primary" onClick={initGame}>Play Again</button>
                </div>
            ) : (
                <div className="match-grid">
                    {tiles.map(tile => {
                        const isSelected = selectedTiles.find(t => t.id === tile.id);
                        const isMatched = matchedIds.includes(tile.cardId);
                        const isError = selectedTiles.length === 2 && isSelected && selectedTiles[0].cardId !== selectedTiles[1].cardId;

                        let className = 'match-card';
                        if (isSelected) className += ' selected';
                        if (isMatched) className += ' matched';
                        if (isError) className += ' errors';

                        return (
                            <div
                                key={tile.id}
                                className={className}
                                onClick={() => handleTileClick(tile)}
                            >
                                {tile.content}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
