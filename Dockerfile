# # --- build ---
# FROM node:20-alpine AS build
# WORKDIR /app

# # 1) deps
# COPY package*.json ./
# RUN npm ci || npm install

# # 2) sources
# COPY . .

# # 3) s'assurer que "public" existe (même vide)
# RUN mkdir -p /app/public

# # 4) build Next.js (produit .next ; si output=standalone => .next/standalone)
# RUN npm run build

# # --- runner ---
# FROM node:20-alpine AS runner
# WORKDIR /app
# ENV NODE_ENV=production
# ENV PORT=3000

# # 5) copier le serveur standalone et les assets
# COPY --from=build /app/.next/standalone ./
# COPY --from=build /app/.next/static ./.next/static
# COPY --from=build /app/public ./public 

# EXPOSE 3000
# CMD ["node", "server.js"]
# --- deps ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# --- build ---
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p /app/public
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
RUN npm run build

# --- runner ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]