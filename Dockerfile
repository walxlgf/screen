FROM node:9.4.0

ENV SCREEN_HOME /screen

COPY package*.json ${SCREEN_HOME}/

WORKDIR $SCREEN_HOME

RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
