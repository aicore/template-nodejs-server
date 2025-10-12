# template-nodejs-server
A template project for nodejs server using fastify. Has integrated linting, testing,
coverage, reporting, GitHub actions for publishing to npm repository, dependency updates and other goodies.

Easily use this template to quick start a production ready nodejs project template.

## Quick Start

```shell
# 1. Install dependencies
npm install

# 2. Create your configuration file
cp ./src/a.json ./src/app.json

# 3. Configure logging (REQUIRED)
# Edit src/app.json and set the "stage" field:
#   - "dev" or "development" for local development (pretty logs)
#   - "prod" or "production" for production (ECS JSON logs for Elasticsearch)
# See example configs: app.json.development.example and app.json.production.example

# 4. Start the server
npm run serve        # Production mode
npm run serve:dev    # Development mode with auto-reload

# 5. Test the endpoints
# Open browser: http://127.0.0.1:5000/hello?name=rambo
# Or use curl:
curl -X GET 'http://127.0.0.1:5000/helloAuth?name=rambo' \
  -H 'authorization: Basic 123' \
  -H 'Content-Type: application/json' -v
```

**⚠️ Note:** The `stage` field in `app.json` is required for proper logging configuration. See [Logging Configuration](#logging-configuration) section for details.
## Code Guardian

[![<app> build verification](https://github.com/aicore/template-nodejs/actions/workflows/build_verify.yml/badge.svg)](https://github.com/aicore/template-nodejs/actions/workflows/build_verify.yml)

<a href="https://sonarcloud.io/summary/new_code?id=aicore_template-nodejs">
  <img src="https://sonarcloud.io/api/project_badges/measure?project=aicore_template-nodejs&metric=alert_status" alt="Sonar code quality check" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=aicore_template-nodejs&metric=security_rating" alt="Security rating" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=aicore_template-nodejs&metric=vulnerabilities" alt="vulnerabilities" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=aicore_template-nodejs&metric=coverage" alt="Code Coverage" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=aicore_template-nodejs&metric=bugs" alt="Code Bugs" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=aicore_template-nodejs&metric=reliability_rating" alt="Reliability Rating" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=aicore_template-nodejs&metric=sqale_rating" alt="Maintainability Rating" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=aicore_template-nodejs&metric=ncloc" alt="Lines of Code" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=aicore_template-nodejs&metric=sqale_index" alt="Technical debt" />
</a>

# TODOs after template use

## !!!Please see all issues in the generated repository as an issue will be generated tracking the fix of each of the below items.

1. Update package.json with your app defaults
2. Check Build actions on pull requests.
3. create a home page in wiki by going to wiki link https://github.com/<your_org>/<your_repo>/wiki
4. Goto github `repository` > `settings`> and uncheck `Allow merge commits`. this is usually automatically done by code
   guardian bots in core.ai org. so you may just need to verify it.
5. In sonar cloud, enable Automatic analysis from `Administration
   Analysis Method` for the first time before a pull request is
   raised: ![image](https://user-images.githubusercontent.com/5336369/148695840-65585d04-5e59-450b-8794-54ca3c62b9fe.png)
6. Check codacy runs on pull requests, set codacy defaults. You may remove codacy if sonar cloud is only needed.
7. Update the above Code Guardian badges; change all `id=aicore_template-nodejs` to the sonar id of your project
   fields. see this PR: https://github.com/aicore/libcache/pull/13
8. Configure logging stage in app.json (see [Logging Configuration](#logging-configuration) section below)

# Commands available

## Building

Since this is a pure JS template project, build command just runs test with coverage.

```shell
> npm install   // do this only once.
> npm run build
```

## Linting

To lint the files in the project, run the following command:

```shell
> npm run lint
```

To Automatically fix lint errors:

```shell
> npm run lint:fix
```

## Testing

### Run unit tests
```shell
> npm run test:unit
```

### Running integration tests locally

```shell
> npm run test:integ
```
You can edit `src/testConfig.json` to change app config for tests after running the above command.

### Running integration tests in GitHub actions
You have to set a repository secret `APP_CONFIG_FOR_INTEG_TESTS` with
content of the text config.
* Goto your repository settings https://github.com/<your org>/<your repo>/settings/secrets/actions
* Create a new `Repository secret` with name `APP_CONFIG_FOR_INTEG_TESTS` and the secret as the config file contents.
* The build verify action should now be able to use the secret.
* Note that pull requests cannot read repository secrets and subsequently cannot run integration tests.

### To run all tests:

```shell
> npm run test
  Hello world Tests
    ✔ should return Hello World
    #indexOf()
      ✔ should return -1 when the value is not present
```

Additionally, to run unit/integration tests only, use the commands:

```shell
> npm run test:unit
> npm run test:integ
```

## Coverage Reports

To run all tests with coverage:

```shell
> npm run cover
  Hello world Tests
    ✔ should return Hello World
    #indexOf()
      ✔ should return -1 when the value is not present


  2 passing (6ms)

----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
----------|---------|----------|---------|---------|-------------------
All files |     100 |      100 |     100 |     100 |                   
 index.js |     100 |      100 |     100 |     100 |                   
----------|---------|----------|---------|---------|-------------------

=============================== Coverage summary ===============================
Statements   : 100% ( 5/5 )
Branches     : 100% ( 2/2 )
Functions    : 100% ( 1/1 )
Lines        : 100% ( 5/5 )
================================================================================
Detailed unit test coverage report: file:///template-nodejs/coverage-unit/index.html
Detailed integration test coverage report: file:///template-nodejs/coverage-integration/index.html
```

After running coverage, detailed reports can be found in the coverage folder listed in the output of coverage command.
Open the file in browser to view detailed reports.

To run unit/integration tests only with coverage

```shell
> npm run cover:unit
> npm run cover:integ
```

Sample coverage report:
![image](https://user-images.githubusercontent.com/5336369/148687351-6d6c12a2-a232-433d-ab62-2cf5d39c96bd.png)

### Unit and Integration coverage configs

Unit and integration test coverage settings can be updated by configs `.nycrc.unit.json` and `.nycrc.integration.json`.

See https://github.com/istanbuljs/nyc for config options.

# Publishing packages to NPM

## Preparing for release

Please run `npm run release` on the `main` branch and push the changes to main. The release command will bump the npm
version.

!NB: NPM publish will faill if there is another release with the same version.

## Publishing

To publish a package to npm, push contents to `npm` branch in
this repository.

## Publishing `@aicore/package*`

If you are looking to publish to package owned by core.ai, you will need access to the GitHub Organization
secret `NPM_TOKEN`.

For repos managed by [aicore](https://github.com/aicore) org in GitHub, Please contact your Admin to get access to
core.ai's NPM tokens.

## Publishing to your own npm account

Alternatively, if you want to publish the package to your own npm account, please follow these docs:

1. Create an automation access token by following
   this [link](https://docs.npmjs.com/creating-and-viewing-access-tokens).
2. Add NPM_TOKEN to your repository secret by following
   this [link](https://docs.npmjs.com/using-private-packages-in-a-ci-cd-workflow)

To edit the publishing workflow, please see file: `.github/workflows/npm-publish.yml`

# Dependency updates

We use Rennovate for dependency updates: https://blog.logrocket.com/renovate-dependency-updates-on-steroids/

* By default, dep updates happen on sunday every week.
* The status of dependency updates can be viewed here if you have this repo permissions in
  github: https://app.renovatebot.com/dashboard#github/aicore/template-nodejs
* To edit rennovate options, edit the rennovate.json file in root,
  see https://docs.renovatebot.com/configuration-options/
  Refer

# Code Guardian

Several automated workflows that check code integrity are integrated into this template.
These include:

1. GitHub actions that runs build/test/coverage flows when a contributor raises a pull request
2. [Sonar cloud](https://sonarcloud.io/) integration using `.sonarcloud.properties`
    1. In sonar cloud, enable Automatic analysis from `Administration
       Analysis Method` for the first
       time ![image](https://user-images.githubusercontent.com/5336369/148695840-65585d04-5e59-450b-8794-54ca3c62b9fe.png)

## IDE setup

SonarLint is currently available as a free plugin for jetbrains, eclipse, vscode and visual studio IDEs.
Use sonarLint plugin for webstorm or any of the available
IDEs from this link before raising a pull request: https://www.sonarlint.org/ .

SonarLint static code analysis checker is not yet available as a Brackets
extension.

## Internals

### Testing framework: Mocha , assertion style: chai

See https://mochajs.org/#getting-started on how to write tests
Use chai for BDD style assertions (expect, should etc..). See move here: https://www.chaijs.com/guide/styles/#expect

### Mocks and spies:

Since it is not that straight forward to mock es6 module imports, use the follow pull request as reference to mock
imported libs:

* sample pull request: https://github.com/aicore/libcache/pull/6/files
* [setting up mocks](https://github.com/aicore/libcache/blob/485b1b6244f7022eb0a83d9f72d897fe712badbe/test/unit/setup-mocks.js)
* [using the mocks](https://github.com/aicore/libcache/pull/6/files#diff-8ea7ccf28b28a0ae7b43e468abd3e9a8bb411bb329ad5cb45eb9a93709ed8dc5R2)
  ensure to import `setup-mocks.js` as the first import of all files in tests.

#### using sinon lib if the above method doesn't fit your case

if you want to mock/spy on fn() for unit tests, use sinon. refer docs: https://sinonjs.org/

### Note on coverage suite used here:

we use c8 for coverage https://github.com/bcoe/c8. Its reporting is based on nyc, so detailed docs can be found
here: https://github.com/istanbuljs/nyc ; We didn't use nyc as it do not yet have ES module support
see: https://github.com/digitalbazaar/bedrock-test/issues/16 . c8 is drop replacement for nyc coverage reporting tool

---

## Logging Configuration

This template uses a **stage-based logging system** that automatically adapts to your environment. Logs are beautiful and readable in development, while production logs are structured for Elasticsearch.

### How It Works

The logging system reads the `stage` field from `app.json` and configures logging accordingly:

- **Development** (`dev` or `development`): Pretty, colorized console logs with `pino-pretty`
- **Production** (`prod` or `production`): ECS JSON format for Elasticsearch with structured fields

### Configuration

Set the `stage` field in your `app.json`:

```json
{
  "stage": "dev",
  "authKey": "your-auth-key",
  "allowPublicAccess": false,
  "port": 5000
}
```

**Supported stage values:**
- `"dev"` or `"development"` → Pretty logs for development
- `"prod"` or `"production"` → ECS JSON logs for production

The `getStage()` function automatically sets `NODE_ENV` to either `"development"` or `"production"` based on your stage configuration.

### Development Logs

When `stage` is `"dev"` or `"development"`, you get beautiful, readable logs:

```
[14:23:45 INFO] Server started on port 5000
[14:23:47 INFO] Incoming request
    url: "/hello?name=world"
    method: "GET"
    reqId: "req-1"
[14:23:47 INFO] Request completed
    statusCode: 200
    duration: "142ms"
```

### Production Logs

When `stage` is `"prod"` or `"production"`, logs are in ECS JSON format:

```json
{
  "@timestamp": "2025-10-12T14:23:47.123Z",
  "log.level": "info",
  "message": "Request completed",
  "http.request.method": "GET",
  "url.full": "/hello?name=world",
  "http.response.status_code": 200,
  "event.duration": 142000000,
  "trace.id": "req-1"
}
```

### Elasticsearch Integration

Production logs are automatically shipped to Elasticsearch using **Filebeat** and **journald**:

**Architecture:**
```
Application (Pino ECS) → journald → Filebeat → Elasticsearch → Kibana
```

**How it works:**
1. Application outputs ECS JSON logs to stdout/stderr
2. systemd captures logs in journald
3. Filebeat reads from journald with ndjson parser
4. Logs are shipped to Elasticsearch with proper structure
5. Search and visualize in Kibana

**Query logs in Kibana:**
```
# Search for errors
log.level: "error"

# Search by request ID
trace.id: "req-12345"

# Search by HTTP status
http.response.status_code: 500

# Search slow requests
event.duration > 1000000000
```

### Configuration Examples

- **Development**: See [app.json.development.example](./app.json.development.example)
- **Production**: See [app.json.production.example](./app.json.production.example)

### Switching Between Modes

To switch between development and production logging, simply change the `stage` field in `app.json`:

```bash
# For local development
{
  "stage": "dev"
}

# For production deployment
{
  "stage": "prod"
}
```

Then restart the service:
```bash
npm run serve
```

### Troubleshooting

**Problem:** Logs not appearing in Elasticsearch
- Check Filebeat service: `sudo systemctl status filebeat`
- Test Elasticsearch connection: `sudo filebeat test output`
- View Filebeat logs: `sudo journalctl -u filebeat -n 50`

**Problem:** Development logs still showing as JSON
- Verify `stage` is set to `"dev"` or `"development"` in app.json
- Ensure pino-pretty is installed: `npm install --save-dev pino-pretty`
- Restart the service

**Problem:** Logs have 5-15 second delay in Elasticsearch
- This is normal! Filebeat batches logs for efficiency
- For real-time debugging, use `journalctl -f -u <serviceName>.service`

For more details, see the [LOGGING.md](./LOGGING.md) guide.
