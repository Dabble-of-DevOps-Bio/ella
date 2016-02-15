The GenAP interpreter is a web app based on AngularJS with a Flask REST backend.

# Development

To start development env with Docker, run **`make dev`** - you may need to do `make build` first

The Dockerfile will read the current `gulpfile.js` and `requirements.txt` and spawn an environment that satisfies these requirements. All Python requirements are installed globally, no virtualenv needed since we're already in an isolated container. Node things are installed to `/dist/node_modules`, gulp is installed both there and globally.

A postgresql instance will also spawn and be automatically linked to the application. To populate the database you can visit the `/reset` route or do `/reset?all=true` to get an expanded data set.

After changing package.json, a new Docker image must be created using `make build` and then `make dev`.

# Testing

Test suites are designed to be run under Docker. All tests are run via the `Makefile`, with `make test` being what GitLab-CI invokes.

Local testing (outside CI):
If not using Docker do `gulp unit` in root of project (All libs must be installed using `npm install` first)
If using Docker, we must first start the docker container and then do `gulp unit` inside it:
- start Docker container using `bin/dev`
- enter the container `docker -it <container id> bash`
- run `gulp unit` inside the container

There are actually several test commands:
    - `gulp unit` runs all unit tests (using Karma). Tests are executed inside a browser, all managed by Karma (see karma.conf.js)
    - `gulp unit-auto`, Similar to `gulp unit-auto` but tests are automatically rerun as test or code is changed.
    - `gulp e2e`, runs end-to-end test using real browser(s). Requires a running Selenium server and a running application. See below.

**Note** The auto running of tests in Docker when files are changed in the host OS, doesn't work. The files
changes are detected and the rebundling is done by the tools (karma-browserify, watchify), but the bundle is stale and doesn't have
your changes. You must run 'gulp unit' or 'gulp unit-auto' again. When the source files are changed inside
Docker the rebundling works. This happens on OS X. When looking at the Karma logs, the message 'serving (cached)' is an indication
of the staleness. When tests are run on the host (eg. not Docker) the auto thing is working.

# End-to-end testing
Running tests against a real environment (meaning your application is running in a browser) requires:
- your application is up and running (something to serving html/js/css and something running the python api)
- a Selenium server

The address of the application and the selenium server is configured in protractor.conf.js.
There is a Docker image for Selenium, try `docker run -d -p 4444:4444 -p 5900:5900 -v /dev/shm:/dev/shm selenium/standalone-chrome-debug:2.48.2`
This image has both Selenium and Chrome installed, see https://github.com/SeleniumHQ/docker-selenium.
The mentioned Docker image has a vnc server so it can be accessed using a VNC client. On OS X there is Screen Sharing in /System/Library/CoreServices/Applications,
most easily started by entering 'vnc://172.16.250.128:5900' in Safari.


# Application structure
Info about AngualarJS and the build system. Ecmascript version.... Choice of tools and so on.

Uses babel-es6-polyfill to get ES6 support, see https://www.npmjs.com/package/babel-es6-polyfill.


# Test framework
- Karma (http://karma-runner.github.io/)
- Jasmine (http://jasmine.github.io/2.4/introduction.html)
- Protractor (https://angular.github.io/protractor/#/)
- Selenium (http://docs.seleniumhq.org/, https://hub.docker.com/r/selenium/)

# Production

### gunicorn + nginx

To start a pseudo-production instance you can use **`bin/production`**.

- Compose automatically calls `bin/helpers/start-wsgi`
- Logs will be placed in the genap directory, these should be changed to suit the production environment
- The `/reset` route will automatically be called after server boot
- To reboot/reload changes, simply run `bin/production` again

### CloudFoundry / Medicloud

Several hacks are needed to get Genap running on CloudFoundry.

- Rename `package.json` to anything else, because CloudFoundry doesn't respect typical ignore patterns - and it immediately thinks it found a nodeJS app, hooray!
- Remove the `gulp:` line from `Procfile` - CF doesn't have a (reasonable) way of doing node+python, so we just ignore the node part and pre-build all assets - oh yeah, you should pre-build all your assets now
- `cp ./ops/prod-GIN/manifest.yml .` from the project root
- Then you *should* be OK to do `cf push`, ignore all the warnings pip throws out since CF is behind by a whole major version of pip


# Running outside of Docker

### Manual install

 - Install [node.js](https://nodejs.org/download/)
 - NPM, the Node Package Manager is installed as part as Node.
 - On OSX you can alleviate the need to run as sudo by [following these instructions](https://github.com/sindresorhus/guides/blob/master/npm-global-without-sudo.md). Highly recommended step on OSX.
 - Next run `npm install`. This will install all the build dependencies for you.
 - To run gulp from the command line you might have to run `npm install -g gulp`, which will install gulp globally.

You'll need to run two processes when developing: the build system and the API.

### Build system

To run the build system, simply run the command: `gulp` - this will build the application, add watchers for any file changes, and automatically reload the browser page when you make a change (requires the `livereload` plugin for Firefox/Chrome).

To just build the application, run: `gulp build` - this builds all the files and puts them into the `src/webui/dev/` directory.

### API

The API also is needed to serve the data.

This is done by launching, in another terminal `PYTHONPATH=/genap/src python /genap/src/api/main.py` - if `DEVELOP=true` is set as an environment variable, the API will launch with debug on.

PostgreSQL needs to be running. To use a different user/db than the default, you may set the `DB_URL` environment variable.
