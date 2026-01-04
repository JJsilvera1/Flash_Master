# ⚡ FlashMaster - Premium AI Flashcard App

A modern, dark-mode flashcard application designed for serious study. Features AI-powered content generation, adaptive quizzes, and game modes.

## Features

### 1. Input & Generation 
- **AI-Powered Creation**:
  - **Generate Terms**: Extract terms/definitions from raw notes or articles.
  - **Smart Context**: Add topics (e.g. "CISSP Domain 1") to guide the AI.
  - **CSV Support**: Outputs clean `Term,Definition` format.
- **Robust Editor**: 
  - Line numbers and scroll syncing.
  - Supports both Pipe (`|`) and Comma (`,`) delimiters.
  - **Local API Key**: Your key is stored securely in your browser's local storage (never on our servers).

### 2. Study Modes
- **Flashcards**: Beautiful 3D flip animations with shuffle and navigation controls.
- **Quiz Mode**:
    - **Smart Distractors**: AI generates *plausible but wrong* answers from the same domain.
    - **Scenario Mode**:
        - **AI-Generated Cases**: Creates complex, situational questions based on 3-5 random cards.
        - **Custom Context**: Priority-based context guiding the AI (e.g. "Focus on management decisions").
        - **Dynamic Difficulty**: (Easy, Medium, Hard) scales the logic and distractor plausibility.
        - **In-Place Rationale**: Replacing the question with a concise 50-word explanation of *why* the answer is correct and why distractors fail.
    - **Auto Next**: Speed flow optimized with seamless state transitions.
- **Match Mode**:
    - A memory game grid with **7 pairs** (14 tiles).
    - **True Shuffle**: Unbiased randomization every game.
- **Recall Mode**:
    - **Active Recall**: Type the answer manually for maximum retention.
    - **Progressive Hints** (3-Stage):
        - Level 1: First 3 letters.
        - Level 2: First 7 letters.
        - Level 3: **AI Max Hint** (Vague conceptual clue).
    - **Smart Grading**: AI scores your answer 0-100% based on meaning.
    - **"I Don't Know"**: Skip option that marks the card as incorrect (0% score).
    - **True Randomization**: Uses a shuffled deck system so you see every card once before repeats.

### 3. Premium UI
- **Dark Mode**: sleek `slate-900` theme with violet/indigo accents.
- **Responsive**: Works on desktop and mobile.
- **Feature Gating**: Disabling AI cleanly locks advanced features like Recall Mode.

## Getting Started

### Prerequisites
- Node.js (v18+)
- An API Key from [OpenRouter](https://openrouter.ai/) (optional, but required for AI features).

### Installation

1. **Clone the repository** (or unzip):
   ```bash
   cd "CISSP Quiz"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the App**:
   ```bash
   npm run dev
   ```
   Open the link shown (usually `http://localhost:5173`).

4. **Configure API Key**:
   - Click the **Settings** ⚙️ icon in the top right.
   - Enter your OpenRouter or OpenAI API Key.
   - It will be saved securely in your browser.

## 🛠 Tech Stack
- **Vite + React**: Blazing fast frontend.
- **OpenRouter API**: Intelligence layer.
- **Lucide React**: Iconography.
- **CSS3**: Variables, Flexbox, Grid, and 3D Transforms.
