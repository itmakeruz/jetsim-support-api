FROM node:18-alpine AS development

WORKDIR /usr/src/app

# Kerakli kutubxonalarni o'rnating
# RUN apk add --no-cache libssl1.1

COPY --chown=node:node package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY --chown=node:node . .

USER node

###################
# BUILD FOR PRODUCTION
###################

FROM node:18-alpine AS build

WORKDIR /usr/src/app

# Kerakli kutubxonalarni o'rnating
# RUN apk add --no-cache libssl1.1

COPY --chown=node:node package*.json ./
COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=development /usr/src/app/prisma ./prisma
COPY --chown=node:node . .




RUN npx prisma generate
RUN npm run build

ENV NODE_ENV production

RUN npm install --only=production && npm cache clean --force

USER node

###################
# PRODUCTION
###################

FROM node:18-alpine3.15 AS production

RUN apk add --no-cache libssl1.1

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node --from=build /usr/src/app/src ./src
COPY --chown=node:node --from=build /usr/src/app/prisma ./prisma
COPY --chown=node:node --from=build /usr/src/app/.env ./.env

EXPOSE 3000
CMD [ "node", "dist/main" ]