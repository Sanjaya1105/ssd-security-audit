// Isolated unit-test harness: executes actual source with explicit dependency doubles.
// No database, email, Stripe, Python process, HTTP listener, or cron job is started.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { isBuiltin } = require('node:module');
const backend = path.resolve(__dirname, '../../backend');
const logger = { logSecurityEvent() {}, noteFailedLogin() {} };

function load(file, mocks = {}, globals = {}) {
  const filename = path.join(backend, file);
  const module = { exports: {} };
  const isolatedRequire = name => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (isBuiltin(name)) return require(name);
    throw new Error(`Unmocked dependency ${name} in ${file}`);
  };
  const execute = vm.runInThisContext(
    `(function(require, module, exports, __filename, __dirname, process) {\n${fs.readFileSync(filename, 'utf8')}\n})`,
    { filename }
  );
  execute(isolatedRequire, module, module.exports, filename, path.dirname(filename), globals.process ?? process);
  return module.exports;
}

function response() {
  let finish;
  const done = new Promise(resolve => { finish = resolve; });
  return {
    statusCode: 200, headers: {}, body: undefined, done,
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name] = value; return this; },
    json(body) { this.body = body; finish(body); return this; },
    send(body) { this.body = body; finish(body); return this; }
  };
}

function auth(mocks = {}) {
  return load('middleware/AuthMiddleware.js', {
    jsonwebtoken: { verify() { throw new Error('Token verification must be explicitly mocked'); } },
    '../utils/securityLogger': logger,
    ...mocks
  });
}

function users(mocks = {}) {
  return load('controller/UserController.js', {
    bcryptjs: { hash: async () => 'test-only-hash' },
    jsonwebtoken: {},
    nodemailer: { createTransport: () => ({ sendMail: async () => ({}) }) },
    '../utils/emailService': { sendVerificationCode: async () => {} },
    '../utils/securityLogger': logger,
    dotenv: { config() {} },
    ...mocks
  });
}

function server(secret = 'test-only-secret-with-at-least-32-characters') {
  const state = { middleware: [], routes: {}, disabled: [], calls: [], schedules: [] };
  const app = {
    disable: name => state.disabled.push(name),
    use: (...args) => state.middleware.push(args),
    get: (url, ...handlers) => { state.routes[url] = handlers; },
    listen() {}
  };
  const passthrough = () => (req, res, next) => next();
  const express = Object.assign(() => app, { json: passthrough, urlencoded: passthrough });
  const mocks = {
    dotenv: { config() {} },
    mysql2: { createConnection: () => ({ connect() {}, end() {} }) },
    express,
    'cookie-parser': passthrough,
    cors: options => ({ corsOptions: options }),
    child_process: { execFile(...args) { state.calls.push(args.slice(0, 3)); args[3](null, '[]'); } },
    'node-cron': { schedule: (...args) => state.schedules.push(args) },
    './middleware/AuthMiddleware': auth(),
    './middleware/errorHandler': load('middleware/errorHandler.js', { '../utils/securityLogger': logger })
  };
  // Route modules are outside server-wiring tests; they are deliberately not executed.
  for (const name of fs.readdirSync(path.join(backend, 'route'))) {
    if (name.endsWith('.js')) mocks[`./route/${name.slice(0, -3)}`] = {};
  }
  load('server.js', mocks, {
    process: { env: { JWT_SECRET: secret }, on() {}, exit(code) { throw new Error(`EXIT:${code}`); } }
  });
  return state;
}

module.exports = { load, response, auth, users, server, logger };
