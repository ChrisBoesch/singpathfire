FROM singpath/singpathfire-base:latest
MAINTAINER Damien Lebrun <dinoboff@hotmail.com>

EXPOSE 5555 8885-8888

COPY . /app
WORKDIR /app

CMD ["npm", "start"]