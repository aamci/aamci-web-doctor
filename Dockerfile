# ---------- deps ----------
FROM node:20-alpine AS deps
WORKDIR /app
# If you have a lockfile, copy it too:
# COPY package.json package-lock.json ./
COPY package.json ./
RUN npm install

# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# sanity check to fail early if "next" is missing
RUN node -e "console.log('next:', require('next/package.json').version)"
RUN npm run build

# ---------- runtime (standalone) ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Next standalone bundle + static assets
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
