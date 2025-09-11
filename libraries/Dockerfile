FROM node:18-alpine
WORKDIR /opt/excalidraw-libraries

COPY package.json ./

RUN yarn --frozen-lockfile --network-timeout 600000

ARG NODE_ENV=production
ARG CORS_ORIGIN=${CORS_ORIGIN}
ENV CORS_ORIGIN=${CORS_ORIGIN}

RUN apk update && apk add sed bash python3 py3-pip

RUN pip3 install --break-system-packages --upgrade google-api-python-client oauth2client black

COPY . .

RUN yarn build

EXPOSE 8080
ENTRYPOINT [ "yarn", "start" ]