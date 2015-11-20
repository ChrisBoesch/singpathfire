FROM node:0.10.40-slim
MAINTAINER Damien Lebrun <dinoboff@hotmail.com>

RUN apt-get update && \
	apt-get install -y vim git wget libfreetype6 libfontconfig bzip2 python && \
	apt-get clean && \
	rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY bower.json gulpfile.js package.json /app/
WORKDIR /app


RUN	npm install && \
	npm cache clear

EXPOSE 5555 8885-8888

COPY bin/ /app/bin
COPY config/ /app/config
COPY lib/ /app/lib
COPY src/ /app/src
COPY .eslintignore .jscsrc .eslintrc Makefile README.md CONTRIBUTING.md LICENSE /app/

CMD ["npm", "start"]