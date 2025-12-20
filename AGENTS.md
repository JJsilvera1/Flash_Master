# 🤖 Agent Progress Log

This document tracks the development features and enhancements implemented by the AI Assistant for **FlashMaster**.

## 📅 Chronological Updates

### Phase 1: Foundation 🏗️
- [x] **Project Scaffolding**: Initialized Vite + React project.
- [x] **Core Styling**: Created a robust Dark Mode theme using CSS variables (`--bg-dark`, `--accent-primary`).
- [x] **Basic Components**:
    - `InputSection`: For CSV parsing.
    - `FlashcardMode`: Standard flip interactivity.
    - `StudyDashboard`: Tab creation and state management.

### Phase 2: Game Modes 🎮
- [x] **Quiz Mode**:
    - Implemented multiple-choice logic.
    - Added score tracking.
- [x] **Match Mode**:
    - Built a grid-based memory game.
    - Implemented selection and matching logic.

### Phase 3: AI Integration 🧠
- [x] **OpenRouter Connection**: Securely connected to LLMs via client-side proxy (OpenRouter).
- [x] **Text-to-Deck**: Enabled users to paste raw text; AI converts it to `TERM,DEFINITION` format.
- [x] **AI Distractors**:
    - *Innovation*: Instead of just picking random cards from the deck (which is easy to guess), the AI generates 3 **fake but plausible** answers on the fly.
    - *Benefit*: Allows quizzing on decks with as few as 1 card.

### Phase 4: Polish & Refinement ✨
- [x] **Bug Fixing**:
    - Fixed `position: absolute` CSS layout bug in Quiz Mode.
    - Fixed infinite re-render loop in Match Mode.
- [x] **User Requests**:
    - **Reverse Quiz**: Added toggle for "Term → Def" vs "Def → Term".
    - **Auto Next**: Added countdown timer (3s) for wrong answers and instant advance for correct ones.
    - **Sanitization**: Added auto-stripping of quotes (`"`) from imports to prevent answer leaking.
    - **Randomness**: Upgraded Match Mode to use **Fisher-Yates Shuffle** for true randomness.
    - **Grid Size**: Optimized Match Mode to show exactly **7 pairs** (14 tiles) per row/game.

## 🔮 Future Ideas (Brainstormed)
- [ ] **Spaced Repetition (SRS)** algorithm.
- [ ] **Image Generation** for visual learners.
- [ ] **Export Deck** to JSON/CSV file.
