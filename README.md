# Class mentors

An AngularFire-based version of SingPath


## Requirements

- Node.js;
- npm (usually installed with node);
- Bash (on windows, it will require cygwin or Git Windows environment);
- Selenium (installed by npm);
- PhantomJS (installed by npm);
- nc (netcat).


## Installation

```
git clone https://github.com/ChrisBoesch/singpathfire.git
cd singpathfire
npm install
```

## Testing

To run the application locally:
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