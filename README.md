# singpathfire

An AngularFire-based version of SingPath


## Requirements

- Node.js;
- npm (usually installed with node);
- Bash (on windows, it will require cygwin or Git Windows environment);
- Selenium (installed by npm);
- PhantomJS (installed by npm).


## Installation

```
git clone https://github.com/ChrisBoesch/singpathfire.git
cd singpathfire
npm install
```

## Testing

To run the application locally:
```
npm start
```
It will start a server serving the content of src.

To run the tests:
```
npm test          # run unit tests in phantomjs
npm run test-e2e  # run e2e tests in phantomjs
npm run autotest  # rerun unit tests when src files are updated
```

## Build

`src/index.html` in it's default state is set to mock some http requests. 
It's needs to be cleaned before deploy. Four versions can be compiled:
- build-debug: no mocking.
- build: no mocking, js and css scripts are concatenated.
- e2e: mocking is available, but setup. It's up to each e2e scenario to 
  mock the requests.
- dist: no mocking, js and css scripts are concatenated and minified.

```
npm run build # build all version except dist.
npm run watch # same, but run the build after any changes to the source files.
npm run dist
```