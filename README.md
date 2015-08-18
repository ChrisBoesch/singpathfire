[![Build Status](https://travis-ci.org/ChrisBoesch/singpathfire.svg)](https://travis-ci.org/ChrisBoesch/singpathfire)
[![Stories in Ready](https://badge.waffle.io/chrisboesch/singpathfire.png?label=ready&title=Ready)](https://waffle.io/chrisboesch/singpathfire)
[![Coverage Status](https://coveralls.io/repos/ChrisBoesch/singpathfire/badge.svg)](https://coveralls.io/r/ChrisBoesch/singpathfire)
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/ChrisBoesch/singpathfire?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

# Class Mentors and SingPathFire

## Requirements

- make
- python 2.7 and pip
- docker (via [docker toolbox] on OSX and Windows)
- docker-compose (via [docker toolbox] on OSX and Windows)
- docker-machine (via [docker toolbox] on OSX and Windows) - only required
on Windows and OS X.


## Installation

On OS X and Windows, we will assume you have a docker host running; e.g.:
```
docker-machine create --driver virtualbox default
docker-machine start
eval "$(docker-machine env default)"
```

Then:
```
git clone https://github.com/ChrisBoesch/singpathfire.git
cd singpathfire
make run
```

The GUI will be available at:
- http://localhost:8888 on linux
- http://192.168.99.100:8888 on OS X and Windows (192.168.99.100 being the IP of the docker host).

## Testing

```
make test
```

## TODO

- a Firebase DB variable to target the developer own Firebase DB.
- E2E tests.

<!-- To run the application locally:
```
npm start                  # starts the server to serve src
npm run serve-build-dev    # starts the server to serve build-dev/
npm run serve-build-debug  # starts the server to serve build-debug/
npm run serve-build-e2e    # starts the server to serve build-e2e/
npm run serve-build        # starts the server to serve build/
npm run serve-dist         # starts the server to serve dist/
```
It will start a server serving the content of src.

To run the tests:
```
npm test          # run unit tests in phantomjs
npm run test-e2e  # run e2e tests in phantomjs
npm run autotest  # rerun unit tests when src files are updated
```

## Build

`src/index.html` in it's default state is set to mock some http requests,
and set to a demo firebase database depending of the context:

- `https://singpath.firebaseio.com/`: production db.
- `https://singpath-play.firebaseio.com/`: staging db (TODO).
- `https://singpath-dev.firebaseio.com/sessions/<random-id>`: testing db.


`index.html` needs to be cleaned before deployment. Five versions can be compiled:

- build-dev: mocked and set to use testing db.
- build-debug: no mocking.
- build: no mocking, js and css scripts are concatenated.
- dist: no mocking, js and css scripts are concatenated and minified.
- e2e: auth mocked and set to use testing db.. It's up to each e2e scenario to
  mock the http requests.

```
npm run build # build all version except dist.
npm run watch # same, but run the build after any changes to the source files.
npm run dist
```
 -->

 [docker toolbox]: https://www.docker.com/toolbox