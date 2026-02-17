# Sentinel Architect

> AI-powered GitHub Pull Request reviewer that delivers dual-perspective code reviews/ architectural analysis via **Google Gemini** and security auditing via **Grok (xAI)**, posted directly as PR comments.

## Overview

Sentinel Architect is a GitHub App backend built with [NestJS](https://nestjs.com). It listens for pull request webhooks, queues review jobs via BullMQ, fetches the PR diff, runs it through two AI models in parallel, and posts a consolidated review comment back on the pull request.


## Tech Stack

- **Framework**: NestJS 11 (TypeScript, Node.js)
- **Job Queue**: BullMQ + Redis
- **GitHub API**: Octokit (GitHub App authentication)
- **AI — Architect**: Google Gemini 2.0 Flash (`@google/genai`) 
- **AI — Security**: Grok 4 via xAI REST API

## Prerequisites

- **Node.js** >= 18
- **Redis** server running on `localhost:6379` (or configure accordingly)
- A registered **GitHub App** with:
  - Webhook URL pointing to `<your-host>/webhooks`
  - `pull_request` event subscription
  - Permissions: Pull requests (read), Issues (write)
  - A generated private key (`.pem` file)
- **Google Gemini API key** ([Google AI Studio](https://aistudio.google.com/))
- **Grok API key** ([xAI Console](https://console.x.ai/))

## Environment Variables

Create a `.env` file in the project root:

```env
# Server
PORT=3000

# GitHub App
GITHUB_APP_ID=<your-github-app-id>
GITHUB_PRIVATE_KEY_PATH=<path-to-your-private-key.pem>
GITHUB_WEBHOOK_SECRET=<your-webhook-secret>

# AI Providers
GEMINI_API_KEY=<your-gemini-api-key>
GROK_API_KEY=<your-grok-api-key>
```

## Installation

```bash
npm install
```

## Running the App

```bash
# Start Redis
redis-server

# Development
npm run start:dev

# Production build
npm run build
npm run start:prod
```

The server listens on the configured `PORT` (default `3000`). Expose the `/webhooks` endpoint to GitHub. For local development tunnel tool such as [ngrok](https://ngrok.com/) or [smee.io](https://smee.io/) can be used.

## Key Design Decisions

- **Raw body parsing** is enabled at bootstrap so webhook HMAC-SHA256 signatures can be verified against the untouched payload.
- **BullMQ** decouples webhook ingestion from AI processing. GitHub gets a fast `202 Accepted` while reviews are processed asynchronously with automatic retries (3 attempts, exponential backoff).
- **Parallel AI calls**, Gemini (for architecture) and Grok (for security) reviews run concurrently via `Promise.all`, minimising total latency.
- **GitHub App auth**, each installation gets its own scoped Octokit client via `OctokitService`, following the GitHub App authentication model.


* Start Redis with Docker
```
docker run --name sentinel-redis -p 6379:6379 -d redis
```

