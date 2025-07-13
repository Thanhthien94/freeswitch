# Frontend Dockerfile for Next.js Development
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Copy Docker environment file
COPY .env.docker .env.local

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
