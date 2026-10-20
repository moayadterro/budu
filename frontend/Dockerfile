# Simple dev container for the Next.js frontend.
# For production use a multi-stage build (next build + next start).
FROM node:24.21.0-alpine

WORKDIR /app

# Install deps first for better layer caching
COPY package*.json ./
RUN npm install

# App source (overlaid by a bind mount in docker-compose for live reload)
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
