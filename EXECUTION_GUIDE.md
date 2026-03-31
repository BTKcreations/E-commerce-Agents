# 🛍️ ShopSmart AI: Full Project Execution Guide

Welcome to the **ShopSmart AI** E-commerce platform. This guide provides a step-by-step walkthrough to set up and run the project from scratch on any Windows machine.

---

## 🏗️ 1. Technical Architecture Overview

Before you start, here is a quick look at the system structure:

- **Frontend**: A performance-optimized React application (Vite + Tailwind CSS).
- **Backend API**: A Node.js (Express) server handling product catalogs, user authentication, and AI logic.
- **Database**: PostgreSQL with Drizzle ORM for high-integrity data storage.
- **AI Integrations**: Native support for OpenAI GPT-4o and local LLMs via Ollama.

---

## 🛠️ 2. Software Prerequisites

Ensure the following software is installed on your computer:

1.  **Node.js (v18.0.0 or higher)**: [Download here](https://nodejs.org/)
2.  **PostgreSQL (v14 or higher)**: [Download here](https://www.postgresql.org/download/)
    - *Default user:* `postgres`
    - *Default password:* `postgres` (or your chosen password)
3.  **Git**: [Download here](https://git-scm.com/downloads) (Optional, for cloning)

---

## 🚀 3. One-Click Setup (Recommended)

We have provided an automated script to handle the heavy lifting.

1.  Open the project folder in your file explorer.
2.  Double-click **`setup_project.bat`**.
3.  Follow the prompts in the terminal window:
    - It will check for Node.js and installed dependencies.
    - It will install **pnpm** (if missing).
    - It will create a default `.env` file.
    - **Select 'y'** when asked to initialize the database (ensure PostgreSQL is running first).

---

## ⚙️ 4. Manual Configuration (Advanced)

If you prefer to set up manually, follow these steps:

### A. Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecommerce
JWT_SECRET=your_secret_here
AI_INTEGRATIONS_OPENAI_API_KEY=your_key_here
AI_INTEGRATIONS_OPENAI_MODEL=gpt-4o
```

### B. Installation
Run the following in your terminal:
```bash
# Install pnpm (if not already installed)
npm install -g pnpm

# Install project dependencies
pnpm install
```

### C. Database Initialization
```bash
# Create tables
pnpm db:push

# Seed initial product data
pnpm db:seed
```

---

## 🏃 5. Launching the Platform

To start the servers and the store:

1.  Double-click **`run_project.bat`**.
2.  Wait for the terminal windows to initialize (approx. 5-10 seconds).
3.  The store will automatically open in your browser at: 
    👉 **http://localhost:5173**

---

## 🔐 6. Admin Panel & Management

- **Admin URL**: Navigate to `/admin/products` in the store.
- **Privileges**: Any account registered with an email containing the word `"admin"` (e.g., `admin@test.com`) will automatically receive full administrative access to manage products and stock.

---

## 🤖 7. AI Features (Optional)

### Using Ollama (Local AI)
If you want to run AI features locally without an OpenAI API key:
1.  Install [Ollama](https://ollama.com/).
2.  Pull a model: `ollama pull llama3`.
3.  Ensure Ollama is running.
4.  The application will automatically attempt to use the local endpoint if configured.

---

## ⚠️ 8. Troubleshooting

- **Database Connection Refused**: Ensure PostgreSQL is running. Check your password in `.env`.
- **Port Already in Use**: Close any applications running on ports `5173` (Frontend) or `5000` (Backend).
- **Missing Images**: Ensure you have an active internet connection as the product images are served via Unsplash.

---
*Created for Student Major Project | BTKcreations*
