repo-name ?= singpath/singpathfire-dev
tag ?= latest
version ?= $(shell python -c 'import json;p=open("package.json");print json.load(p)["version"];p.close()')

docker ?= docker
compose ?= docker-compose

default: build

build:
	${docker} build --rm=true -t ${repo-name}:${version} .
	${docker} rmi ${repo-name}:${tag} > /dev/null 2>&1 || echo "latest tag not set yet."
	${docker} tag -f ${repo-name}:${version} ${repo-name}:${tag}

run: build
	${compose} up

test: build
	${docker} run -ti --rm ${repo-name}:${version} npm run lint && npm run test

run-bash: build
	${docker} run -ti --rm ${repo-name}:${version} bash

.PHONY: build run test run-badh