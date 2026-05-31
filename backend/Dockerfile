FROM node:20-alpine AS node-builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm@8
RUN pnpm install
COPY . .
RUN pnpm build

FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1
WORKDIR /app

RUN apt-get update \
    && apt-get install -y build-essential libpq-dev git \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the full project
COPY . .

# Copy built frontend assets from the node builder into Django staticfiles
RUN mkdir -p /app/backend/staticfiles
COPY --from=node-builder /app/dist /app/backend/staticfiles

WORKDIR /app/backend

# Collect static (bring static files into STATIC_ROOT)
RUN python manage.py collectstatic --noinput || true

ENV PORT=8000
CMD ["sh", "-c", "gunicorn config.wsgi:application --bind 0.0.0.0:${PORT} --workers 3"]
