FROM mcr.microsoft.com/playwright:v1.65.0-jammy

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN npm ci

RUN python3 -m venv /opt/trafilatura \
    && /opt/trafilatura/bin/pip install --no-cache-dir --upgrade pip \
    && /opt/trafilatura/bin/pip install --no-cache-dir trafilatura

ENV PATH="/opt/trafilatura/bin:$PATH"

COPY . .

EXPOSE 3000

RUN /opt/trafilatura/bin/pip install --no-cache-dir webless

CMD ["npm", "run", "dev"]
