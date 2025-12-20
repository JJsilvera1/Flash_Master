# ⚡ FlashMaster - Premium AI Flashcard App

A modern, dark-mode flashcard application designed for serious study. Features AI-powered content generation, adaptive quizzes, and game modes.

## ✨ Features

### 1. Smart Input & AI Generation 🧠
- **Classic Import**: Paste CSV data (`TERM,DEFINITION`) to instantly create decks.
- **AI "Text-to-Deck"**: Paste raw notes, articles, or summaries. The built-in AI (via OpenRouter) extracts key terms and definitions for you.
- **Auto-Cleaning**: Automatically strips quotes and normalizes text so you don't give away answers.

### 2. Study Modes 📚
- **Flashcards**: Beautiful 3D flip animations with shuffle and navigation controls.
- **Quiz Mode**:
    - **Bidirectional**: Switch between *"Guess the Term"* and *"Guess the Definition"*.
    - **AI Distractors**: Toggle this to have the AI invent 3 plausible but **wrong** answers for every question. This allows you to quiz yourself effectively even on small decks (minimum 1 card!).
    - **Auto Next**: Speed up your flow. Correct answers advance immediately; wrong answers show a 3-second countdown.
- **Match Mode**:
    - A memory game grid with **7 pairs** (14 tiles).
    - **True Shuffle**: Uses Fisher-Yates algorithm for unbiased randomization every game.

### 3. Premium UI 🎨
- **Dark Mode**: sleek `slate-900` theme with violet/indigo accents.
- **Responsive**: Works on desktop and mobile.
- **Clean**: No clutter, just focus.

## 🚀 Getting Started

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

3. **Configure Environment**:
   - Create a file named `.env` in the root folder.
   - Add your API key:
     ```env
     VITE_OPENROUTER_API_KEY=sk-or-your-key-here
     VITE_OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
     ```

4. **Run the App**:
   ```bash
   npm run dev
   ```
   Open the link shown (usually `http://localhost:5173`).

## 🛠 Tech Stack
- **Vite + React**: Blazing fast frontend.
- **OpenRouter API**: Intelligence layer.
- **Lucide React**: Iconography.
- **CSS3**: Variables, Flexbox, Grid, and 3D Transforms.
