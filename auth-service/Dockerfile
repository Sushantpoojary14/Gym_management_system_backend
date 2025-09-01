# Development stage
FROM node:latest AS builder

WORKDIR /usr/src/app

COPY package*.json ./


RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3001
CMD ["npm", "run", "start:dev"]

# Production stage
# FROM node:18-alpine AS production

# ARG NODE_ENV=production
# ENV NODE_ENV=${NODE_ENV}

# WORKDIR /usr/src/app/notification_service

# COPY notification_service/package*.json ./
# COPY notification_service/prisma ./prisma/

# RUN npm install --only=production

# COPY --from=development /usr/src/app/notification_service/dist ./dist

# CMD ["node", "dist/main"]
