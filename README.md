# 🐬 Dolphin AI — Next-Gen Multi-Modal AI Assistant

<p align="center">
  <img src="screenshots/hero-banner.png" alt="Dolphin AI Banner" width="100%" />
</p>

<p align="center">
  <strong>A production-ready, privacy-first AI Assistant powered by Local Ollama Models with seamless Cloud AI Fallbacks, Real-Time WebRTC Voice Mode, and Multi-Modal Vision capabilities.</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-screenshots--demo">Screenshots</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-how-to-add-your-project-pictures">Upload Pics</a>
</p>

---

## 📸 Screenshots & Demo

> **Project Media Area**: Place your app screenshots inside the `screenshots/` directory.

<div align="center">

| 💬 **Interactive Chat & Model Selector** | 🎙️ **Real-Time WebRTC Voice Mode** |
| :---: | :---: |
| <img src="screenshots/chat-ui.png" alt="Chat UI" width="450"/> | <img src="screenshots/voice-mode.png" alt="Voice Mode" width="450"/> |
| *Sleek UI with streaming responses & markdown* | *WebRTC voice interaction via LiveKit Inference* |

| 🖼️ **Multi-Modal Vision Analysis** | 📄 **Document Tray & Management** |
| :---: | :---: |
| <img src="screenshots/vision-mode.png" alt="Vision Mode" width="450"/> | <img src="screenshots/document-tray.png" alt="Document Tray" width="450"/> |
| *Client-side compressed image uploads with vision LLMs* | *Upload, manage, and attach documents on the fly* |

</div>

---

## ✨ Features

- **🏠 Local-First AI Engine**: Prioritizes local Ollama models (`qwen2.5:3b`, `llama3.2`, `gemma3`, etc.) to run completely offline on your machine for 100% data privacy.
- **☁️ Automatic Cloud Fallbacks**: Seamlessly fails over to leading cloud providers (Anthropic Claude 3.5, OpenAI GPT-4o, Google Gemini, xAI Grok, Meta Llama) if local models are uninstalled or unreachable.
- **🎙️ Real-Time Voice Conversations**: Powered by LiveKit Cloud WebRTC, featuring speech-to-text (STT), turn detection, turn interruption, and text-to-speech (TTS).
- **👁️ Privacy-First Vision**: Supports photo analysis with client-side image scaling (2048px max edge) and automatic EXIF/GPS metadata removal before sending to models.
- **📄 Native Document Handling**: Upload, preview, and process text and document files directly within your chat conversations.
- **⚡ Dynamic Live Model Switching**: Automatically populates available Ollama models and cloud provider models dynamically without restarting services.
- **💾 Local History Storage**: Full chat history and image attachments are stored safely in IndexedDB inside the user's browser.
- **🎨 Premium UX**: Modern Next.js 16 App Router UI with Tailwind CSS, shadcn/ui components, dynamic voice visualizer, and custom dark mode styling.

---

## 🛠️ Tech Stack

| Tier | Technologies |
| :--- | :--- |
| **Frontend** | Node.js 24, Next.js 16 (App Router), React 19, TypeScript 7, Tailwind CSS 4, shadcn/ui, Lucide Icons |
| **Backend API** | Python 3.13, FastAPI, `uv` Package Manager, Ruff, Pytest, Ollama Python SDK, OpenAI & Anthropic SDKs |
| **Voice Agent** | LiveKit Agent Framework (Python), LiveKit Cloud Inference Engine |
| **Local AI** | Ollama Engine (`localhost:11434`) |
| **Containers** | Docker, Docker Compose |

---

## 🏗️ Architecture & Project Structure

```
agents/
├── ai-assistant/
│   ├── api/                   # FastAPI Backend (Python 3.13)
│   │   ├── app/
│   │   │   ├── routes/        # Chat, Health, Models, Voice, Upload endpoints
│   │   │   ├── providers/     # Ollama, OpenAI, Anthropic, Gemini, Grok plugins
│   │   │   ├── services/      # Chat orchestrator and fallback logic
│   │   │   └── voice/         # LiveKit session generator and voice settings
│   │   └── tests/             # Pytest test suite
│   ├── web/                   # Next.js Frontend (React 19)
│   │   ├── app/               # Main layout and page routes
│   │   ├── components/        # Chat app, Voice bar, Document tray, Photo gallery
│   │   └── hooks/             # Custom hooks for state management
│   ├── agent/                 # LiveKit Voice Agent worker
│   └── docker-compose.yml     # Multi-container orchestration
└── screenshots/               # Directory for project pictures & screenshots
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** v20.9+ or v24+
- **Python** v3.13+ with [`uv`](https://docs.astral.sh/uv/) installed
- **Ollama** (Optional, for running local models): [Download Ollama](https://ollama.com)

---

### Step 1: Run Local Models (Optional)
```bash
ollama pull llama3.2
ollama pull qwen2.5:3b
```

### Step 2: Start Backend API
```bash
cd ai-assistant/api
uv sync
cp .env.example .env

# Start FastAPI dev server (Runs on http://localhost:8000)
uv run fastapi dev app/main.py
```

### Step 3: Start Frontend Web Client
```bash
# Open a new terminal
cd ai-assistant/web
npm install
cp .env.example .env.local

# Start Next.js dev server (Runs on http://localhost:3000)
npm run dev
```

### Step 4: Start LiveKit Voice Agent (Optional)
```bash
# Open a new terminal (API must be running first)
cd ai-assistant/agent
uv sync
cp .env.example .env

# Run Voice Agent
uv run python voice_agent.py dev
```

---

## 🐳 Docker Deployment

To launch the complete stack with single command:

```bash
cd ai-assistant
cp api/.env.example api/.env

# Build and launch all services
docker compose up --build

# Or include Voice Agent container:
docker compose --profile voice up --build
```

---

## 🖼️ How to Add Your Project Pictures

1. Take screenshots of your project in action (or create a hero banner image).
2. Save your images into the `screenshots/` directory:
   - `screenshots/hero-banner.png`
   - `screenshots/chat-ui.png`
   - `screenshots/voice-mode.png`
   - `screenshots/vision-mode.png`
   - `screenshots/document-tray.png`
3. Commit and push to GitHub:
   ```bash
   git add screenshots/ README.md
   git commit -m "feat: add project screenshots"
   git push origin main
   ```

---

## 🧪 Quality Assurance & Testing

```bash
# Run backend tests & lint checks
cd ai-assistant/api
uv run ruff check .
uv run ruff format --check .
uv run pytest

# Run frontend type check & production build validation
cd ai-assistant/web
npm run typecheck
npm run build
```

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
