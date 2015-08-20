cwd = $(shell pwd)

repo-base-name ?= singpath/singpathfire-base
repo-dev-name ?= singpath/singpathfire-dev
tag ?= latest
version ?= $(shell python -c 'import json;p=open("package.json");print json.load(p)["version"];p.close()')

docker ?= docker
compose ?= docker-compose

srcFiles = $(shell find ./src)
configFiles = $(shell find ./config)

.images/${repo-base-name}.${tag}: .images/${repo-base-name}.${version}
	mkdir -p .images/singpath
	${docker} rmi ${repo-base-name}:${tag} > /dev/null 2>&1 || echo "latest tag not set yet."
	${docker} tag -f ${repo-base-name}:${version} ${repo-base-name}:${tag}
	touch $@

.images/${repo-base-name}.${version}: Dockerfile.base package.json bower.json
	mkdir -p .images/singpath
	${docker} build --rm=true -t ${repo-base-name}:${version} -f ./Dockerfile.base .
	touch $@

.images/${repo-dev-name}.${tag}: .images/${repo-dev-name}.${version}
	mkdir -p .images/singpath
	${docker} rmi ${repo-dev-name}:${tag} > /dev/null 2>&1 || echo "latest tag not set yet."
	${docker} tag -f ${repo-dev-name}:${version} ${repo-dev-name}:${tag}
	touch $@

.images/${repo-dev-name}.${version}: .images/${repo-base-name}.${tag}  Dockerfile gulpfile.js ${srcFiles} ${configFiles}
	mkdir -p .images/singpath
	${docker} build --rm=true -t ${repo-dev-name}:${version} .
	touch $@

images: .images/${repo-dev-name}.${tag}

run: .images/${repo-dev-name}.${version}
	${compose} up

test: .images/${repo-dev-name}.${version}
	${docker} run -ti --rm ${repo-dev-name}:${version} npm run lint && npm run test

run-bash: .images/${repo-dev-name}.${version}
	${docker} run -ti --rm ${repo-dev-name}:${version} bash