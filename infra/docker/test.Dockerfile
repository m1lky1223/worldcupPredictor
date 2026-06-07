FROM node:22-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.json tsconfig.base.json ./
COPY packages/ packages/
COPY apps/ apps/
COPY tests/ tests/
COPY data/ data/
COPY scripts/ scripts/
RUN pnpm install --frozen-lockfile
CMD ["pnpm", "run", "test:bdd"]
