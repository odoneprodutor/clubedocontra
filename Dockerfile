# Build Stage
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Set default Environment Variables for Build
ARG VITE_SUPABASE_URL=https://kdkpwqhjkxufnexmumay.supabase.co
ARG VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtka3B3cWhqa3h1Zm5leG11bWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NzcwNTgsImV4cCI6MjA4MTM1MzA1OH0.XBK9De_3lXfXrIChtnsTetEUfYDW3_5lGDQ6VgE2jMg

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# Production Stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
