# 🐬 Dolphin AI — Next-Gen Multi-Modal AI Assistant

> A production-ready, privacy-first AI Assistant powered by **Local Ollama Models** with seamless **Cloud AI Fallbacks** (OpenAI, Anthropic, Google Gemini, xAI Grok, Meta Llama), featuring **Real-time WebRTC Voice Mode** and **Multi-Modal Vision Capabilities**.

---

## 📸 Screenshots & Showcase

> **Add your project screenshots here!**  
> Create a `screenshots/` folder in the root directory and save your images there, then replace the image paths below.

| 💬 **Interactive Chat & Model Selection** | 🎙️ **Real-Time Voice Mode** |
| :---: | :---: |
| ![Chat UI Showcase](screenshots/chat-ui.png) | ![Voice Mode Showcase](screenshots/voice-mode.png) |
| *Sleek dark-mode interface with live streaming & markdown* | *WebRTC voice interaction via LiveKit Inference* |

| 🖼️ **Vision & Multi-Modal Analysis** | 📄 **Document Tray & Management** |
| :---: | :---: |
| ![Vision Showcase](screenshots/vision-mode.png) | ![Document Tray Showcase](screenshots/document-tray.png) |
| *Client-side compressed image uploads with vision LLMs* | *Upload, manage, and attach documents on the fly* |

---

## ✨ Features

- **🏠 Local-First Intelligence**: Prioritizes local Ollama models (`qwen2.5:3b`, `llama3.2`, `gemma3`, etc.) to run privately on your machine without cloud dependencies.
- **☁️ Seamless Cloud Fallbacks**: Automatically falls back to leading cloud AI providers (Anthropic Claude, OpenAI GPT-4o, Google Gemini, xAI Grok, Meta Llama) if local models are uninstalled or offline.
- **🎙️ Real-Time Voice Mode (WebRTC)**: Ultra-low latency voice conversations powered by LiveKit Cloud, complete with turn detection, interruption handling, speech-to-text (STT), and text-to-speech (TTS).
- **👁️ Privacy-Preserving Vision**: Drag-and-drop or paste up to 5 photos per message. Images are automatically scaled to 2048px on the client side and sanitized (EXIF & GPS metadata removed) before processing.
- **📄 Document Processing & Attachments**: Attach and analyze documents natively alongside chat sessions.
- **⚡ Dynamic Model Picker**: Detects installed Ollama models and available Cloud API keys live without requiring app restarts.
- **💾 Local History**: Stores chat transcripts and image attachments locally in IndexedDB for maximum user privacy.
- **🎨 Premium UI/UX**: Built with Next.js 16, React 19, Tailwind CSS, and shadcn/ui with dark mode and smooth animations.

---

## 🛠️ Technology Stack

| Component | Technologies Used |
| :--- | :--- |
| **Frontend** | Node.js 24, Next.js 16 (App Router), React 19, TypeScript 7, Tailwind CSS, shadcn/ui |
| **Backend API** | Python 3.13, FastAPI, `uv` Package Manager, Ruff, Pytest, Ollama SDK, OpenAI & Anthropic SDKs |
| **Voice Agent** | LiveKit Agent Framework, Python 3.13, LiveKit Cloud Inference Engine |
| **Local AI Engine** | Ollama (`localhost:11434`) |
| **Deployment** | Docker & Docker Compose |

---

## 🏗️ Project Architecture

```
agents/
├── ai-assistant/
│   ├── api/             # FastAPI backend service (Python 3.13)
│   │   ├── app/         # Routes, core settings, providers, voice endpoints
│   │   └── tests/       # Pytest test suite
│   ├── web/             # Next.js frontend application (React 19)
│   │   ├── app/         # App router pages and global styles
│   │   ├── components/  # Chat UI, Voice visualizer, Photo gallery, Document tray
│   │   └── hooks/       # Custom React hooks (use-chat, use-voice, use-models)
│   ├── agent/           # LiveKit Voice Agent worker
│   └── docker-compose.yml # Containerized orchestration
└── screenshots/         # Directory for project showcase images
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** 20.9+ or 24+
- **Python** 3.13+ with [`uv`](https://docs.astral.sh/uv/) installed
- **Ollama** (Optional, for local AI model support): [Download Ollama](https://ollama.com)

---

### Option A: Local Development Setup

#### 1. Local AI Models (Optional but Recommended)
```bash
ollama pull llama3.2
ollama pull qwen2.5:3b
```

#### 2. Backend API
```bash
cd ai-assistant/api
uv sync

# Configure Environment Variables
cp .env.example .env
# (Optional) Add your API keys for OpenAI, Anthropic, Gemini, or LiveKit in .env

# Run Dev Server (Starts on http://localhost:8000)
uv run fastapi dev app/main.py
```

#### 3. Frontend Web Client
```bash
# Open a new terminal window
cd ai-assistant/web
npm install

# Configure Environment Variables
cp .env.example .env.local

# Run Dev Server (Starts on http://localhost:3000)
npm run dev
```

#### 4. LiveKit Voice Agent (Optional)
```bash
# Open a new terminal window (API must be running)
cd ai-assistant/agent
uv sync

# Configure LiveKit credentials in .env
cp .env.example .env

# Run Voice Agent
uv run python voice_agent.py dev
```

---

### Option B: Docker Setup

Run all services (API, Web, and optionally Voice Agent) via Docker Compose:

```bash
cd ai-assistant

# Copy and configure environment variables
cp api/.env.example api/.env

# Build and start services
docker compose up --build

# (Optional) Start with Voice Agent profile
docker compose --profile voice up --build
```

---

## ⚙️ Environment Variables

### Backend (`ai-assistant/api/.env`)
```env
# Server Config
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development
ALLOW_CLOUD_FALLBACK=true

# Ollama Config
OLLAMA_BASE_URL=http://localhost:11434

# Cloud AI API Keys (Optional)
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
GEMINI_API_KEY=your_gemini_key_here
GROK_API_KEY=your_grok_key_here

# LiveKit Voice Credentials (Optional)
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
```

---

## 🖼️ How to Upload Project Screenshots

To make your repository look amazing on GitHub:

1. **Take Screenshots**: Capture your app running (e.g. Chat UI, Voice Bar active, Vision upload, Document tray).
2. **Save Images**: Place the images inside the `screenshots/` directory at the root of the repository:
   - `screenshots/chat-ui.png`
   - `screenshots/voice-mode.png`
   - `screenshots/vision-mode.png`
   - `screenshots/document-tray.png`
3. **Commit & Push**:
   ```bash
   git add screenshots/
   git commit -m "Add project screenshots"
   git push origin main
   ```
The image gallery table at the top of this README will automatically display your screenshots!

---

## 🧪 Testing & Quality Assurance

### Run Backend Tests & Linting
```bash
cd ai-assistant/api
uv run ruff check .
uv run ruff format --check .
uv run pytest
```

### Run Frontend Typecheck & Build Validation
```bash
cd ai-assistant/web
npm run typecheck
npm run build
```

---

## 📄 License

This project is licensed under the **MIT License**. Feel free to customize and extend it for your own personal or commercial projects.
