# 🛍️ ShopSmart AI: E-commerce Platform Guide

Welcome to the **ShopSmart AI** project. This is a high-performance, AI-driven E-commerce application featuring autonomous product discovery, intelligent recommendations, and robust inventory management.

---

## 🛠️ Tech Stack
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion
- **Backend**: Node.js + Express
- **Database**: PostgreSQL with Drizzle ORM
- **Intelligence**: OpenAI API (Customizable via Ollama/Local LLMs)

---

## 🚀 Setup & Execution

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: A local or remote database instance
- **API Key**: An OpenAI API key (or follow the Ollama setup below)

### 2. Environment Configuration
Create a `.env` file in the root directory and configure the following:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce
JWT_SECRET=your_secret_here
AI_INTEGRATIONS_OPENAI_API_KEY=your_openai_key
AI_INTEGRATIONS_OPENAI_MODEL=gpt-4o
```
*(Optionally use Ollama by pointing the base URL to `http://localhost:11434/v1`)*

### 3. Installation
Open your terminal in the project root and run:
```bash
npm install
```

### 4. Database Initialization
To create the tables and seed the database with initial products:
```bash
# Push the schema to your DB
npm run db:push

# Seed with 50+ categorized products
npm run db:seed
```

### 5. Running the Project
The project comes with a convenient automation script:
```bash
# Double click or run in terminal
.\run_project.bat
```
- **Storefront**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

---

## 🍱 Advanced Features

### 🔐 Admin & Authentication
- **Access**: Navigate to `/admin/products` to manage the catalog.
- **Role Control**: Use an email containing `"admin"` (e.g., `admin@smart.com`) to automatically get administrator privileges.

### 📂 Product Categorization
When adding a product, you can:
- **Use Presets**: Select Electronics, Wearables, or Fashion.
- **Add New**: Select **"+ Add New..."** to create a custom Category or Subcategory. This updates the store's sidebar filters instantly.

### 📋 Product Specifications
The form includes a **Dynamic Specification Editor**:
- Add attributes like **"Warranty"**, **"Material"**, or **"Display Size"**.
- These appear in a premium grid layout on the product detail page for the customer.

### 📦 Inventory Sync
- **Automatic Deduction**: Stock is subtracted in real-time when a purchase is confirmed.
- **Overselling Check**: The system will block a checkout if the requested quantity exceeds current stock.

### 🤖 AI Recommendations
The "Related Products" section at the bottom of each page is driven by a context-aware algorithm that prioritizes items in the same **Subcategory** for maximum relevance.

---

## ⚠️ Troubleshooting
- **Database Connection**: Ensure PostgreSQL is running and your `DATABASE_URL` is correct.
- **Registration 400**: If registration fails, the email is likely already in use. Try a different test email.
- **Missing Stock**: If a product doesn't show up, ensure its `stock` is set to more than 0.

---
*Created for Student Major Project | BTKcreations*
