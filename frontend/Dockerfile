# Stage 1: Build the React app
FROM node:22-alpine AS build
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:stable-alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /usr/src/app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
