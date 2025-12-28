FROM denoland/deno:2.6.3

# Install system dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    ca-certificates \
    chromium \
    fonts-liberation \
    lsb-release \
    wget \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Skip Puppeteer's own Chromium download to avoid architecture mismatch
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY deno.json deno.lock ./

# Install dependencies and populate node_modules
RUN deno install --allow-scripts=npm:puppeteer@23.11.1

COPY . .

# Cache the main entry point
RUN deno cache run.ts

EXPOSE 3001

CMD ["deno", "task", "launch-server"]
