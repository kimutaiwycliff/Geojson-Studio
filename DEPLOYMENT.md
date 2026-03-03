# Deployment Guide

GeoJSON Studio is a pure client-side app — no database, no secrets, no server logic. This makes deployment straightforward. Two paths are covered below: **Vercel** (zero-config, recommended) and **Docker** (self-hosted, two flavours).

---

## Table of Contents

- [Vercel](#vercel)
- [Docker — Static + Nginx](#docker--static--nginx-recommended)
- [Docker — Node.js Server](#docker--nodejs-server)
- [Environment & Build Notes](#environment--build-notes)

---

## Vercel

`adapter-auto` (already in `svelte.config.js`) detects Vercel automatically — no adapter swap needed.

### Option A — Connect GitHub repo (recommended)

1. Push the repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → Import your repository
3. Vercel auto-detects SvelteKit. Leave all settings as defaults
4. Click **Deploy**

Done. Every push to `main` triggers a new deployment automatically.

### Option B — Vercel CLI

```bash
# Install the CLI once
bun add -g vercel

# From the project root
vercel

# Follow the prompts:
#   Set up and deploy: Y
#   Which scope: (your account)
#   Link to existing project: N
#   Project name: geojson-studio
#   Directory: ./
#   Override settings: N
```

For subsequent deploys:

```bash
vercel --prod
```

### Custom domain

In the Vercel dashboard → your project → **Settings → Domains** → add `geojson-studio.yourdomain.com`.

---

## Docker — Static + Nginx (recommended)

Best choice for this app since everything is static HTML/JS/CSS. Nginx serves the files with zero Node.js overhead and handles client-side routing correctly.

### Step 1 — Switch to the static adapter

```bash
bun add -D @sveltejs/adapter-static
```

Edit `svelte.config.js`:

```js
import adapter from '@sveltejs/adapter-static';

const config = {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',   // needed for SPA client-side routing
      precompress: false
    })
  }
};

export default config;
```

### Step 2 — Add a `nginx.conf`

Create `nginx.conf` in the project root:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Serve pre-compressed assets if they exist
    gzip_static on;

    # SPA fallback — all paths serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache immutable build assets aggressively
    location /_app/immutable/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Don't cache the root index
    location = /index.html {
        add_header Cache-Control "no-cache";
    }
}
```

### Step 3 — Create the `Dockerfile`

Create `Dockerfile` in the project root:

```dockerfile
# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM oven/bun:1 AS builder

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .
RUN bun run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:alpine

# Copy built static files
COPY --from=builder /app/build /usr/share/nginx/html

# Copy our nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Step 4 — Build and run

```bash
# Build the image
docker build -t geojson-studio .

# Run it
docker run -p 8080:80 geojson-studio
```

Open [http://localhost:8080](http://localhost:8080).

### With Docker Compose

Create `docker-compose.yml`:

```yaml
services:
  geojson-studio:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
```

```bash
docker compose up -d          # start in background
docker compose down           # stop
docker compose up -d --build  # rebuild and restart
```

---

## Docker — Node.js Server

Use this if you plan to add server-side routes or SSR in the future.

### Step 1 — Switch to the Node adapter

```bash
bun add -D @sveltejs/adapter-node
```

Edit `svelte.config.js`:

```js
import adapter from '@sveltejs/adapter-node';

const config = {
  kit: {
    adapter: adapter({
      out: 'build'
    })
  }
};

export default config;
```

### Step 2 — Create the `Dockerfile`

```dockerfile
# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# Prune dev dependencies
RUN bun install --frozen-lockfile --production

# ── Stage 2: Run ──────────────────────────────────────────────────────────────
FROM oven/bun:1-slim

WORKDIR /app

# Copy only what's needed to run
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

CMD ["node", "build/index.js"]
```

### Step 3 — Build and run

```bash
docker build -t geojson-studio .
docker run -p 3000:3000 geojson-studio
```

Open [http://localhost:3000](http://localhost:3000).

### With Docker Compose

```yaml
services:
  geojson-studio:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
```

---

## Environment & Build Notes

### Switching adapters without breaking Vercel

If you add the static or node adapter for Docker but still want Vercel to work, you can keep `adapter-auto` installed and let Vercel detect the environment, while your `Dockerfile` installs the specific adapter at build time. Or maintain two config files and swap via a build script.

The simplest approach for most projects: use **adapter-static** everywhere (Vercel, Docker/Nginx, GitHub Pages) since this app has no server routes.

### `.dockerignore`

Add this to keep image build times fast:

```
node_modules
.svelte-kit
build
.git
*.md
.env*
```

Create this file as `.dockerignore` at the project root.

### Image sizes (approximate)

| Approach | Final image size |
|---|---|
| Nginx + static | ~25 MB |
| Bun + Node server | ~130 MB |

Nginx wins for a purely static app.

### Ports

| Deployment | Default port |
|---|---|
| Dev server | 5173 |
| Vite preview | 4173 |
| Docker/Nginx | 8080 (host) → 80 (container) |
| Docker/Node | 3000 |
| Vercel | automatic (443 / HTTPS) |
