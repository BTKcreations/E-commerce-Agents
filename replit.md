# ShopSmart AI - E-Commerce Platform

## Overview

A fully functional AI-powered e-commerce platform with 5 autonomous AI agents built on a React + Vite frontend and Express backend with PostgreSQL.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/ecommerce)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: OpenAI via Replit AI Integrations (gpt-5-mini)
- **Validation**: Zod (zod/v4), drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server with all routes
│   └── ecommerce/          # React + Vite frontend
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   ├── integrations-openai-ai-server/  # OpenAI server-side helpers
│   └── integrations-openai-ai-react/   # OpenAI React hooks
```

## AI Agents

1. **Recommendation Engine** (`/api/recommendations`) — AI-powered product recommendations based on session/browsing context
2. **Dynamic Pricing & Demand Forecasting** (`/api/pricing/forecast`, `/api/pricing/adjust`, `/api/pricing/alerts`) — Predicts demand, adjusts prices, sends reorder alerts
3. **Product Q&A Agent** (`/api/qa/ask`, `/api/qa/search`) — Answers product questions, natural language search
4. **Negotiation Agent** (`/api/negotiation/start`, `/api/negotiation/offer`) — Price negotiation with counter-offers
5. **Customer Support Agent** (`/api/support/chat`, `/api/support/return`) — Handles queries, returns, FAQs

## Database Schema

- `products` — Product catalog with pricing, specs, demand score
- `reviews` — Product reviews with ratings
- `cart_items` — Session-based cart
- `orders` — Order history
- `negotiations` — Negotiation sessions
- `conversations` — OpenAI chat conversations
- `messages` — Chat messages

## Pages

- **Home** — Hero banner, featured products, AI recommendations
- **Products** — Grid with filters, AI natural language search
- **Product Detail** — Full specs, Q&A agent, reviews, negotiation
- **Cart** — Session-based cart management
- **Orders** — Order history
- **AI Dashboard** — All 5 agent panels with real-time data
