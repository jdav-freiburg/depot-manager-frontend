# build image
FROM oven/bun:1-alpine AS builder

ARG CONFIGURATION=prod

RUN apk update && apk add make git

WORKDIR /app

# copy package.json and bun.lock first
# this allows us to cache the bun install if those have not changed
COPY package.json /app
COPY bun.lock /app
RUN bun install --frozen-lockfile

COPY . /app
RUN bun run build --configuration=${CONFIGURATION}

# dist image
FROM nginx:alpine
# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*
# From 'builder' copy website to default nginx public folder
COPY --from=builder /app/dist/depot/browser /usr/share/nginx/html
# Additional startup stuff
ADD docker/nginx_default_with_api.conf.template /etc/nginx/conf.d/default.conf.template
ADD docker/nginx_default.conf /etc/nginx/conf.d/default.conf
ADD src/env.js.template /usr/share/nginx/html/env.js.template
ADD docker/startup.sh /bin/startup.sh
EXPOSE 80
CMD ["sh", "/bin/startup.sh"]
