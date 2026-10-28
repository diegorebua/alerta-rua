import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { parseEnv } from 'node:util';
import process from 'node:process';
import { test } from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const profile = /\.1password\/[\w-]+\.env/.exec(manifest.scripts.compose)?.[0];
assert.ok(profile, 'O script compose deve selecionar um perfil do 1Password.');
const references = parseEnv(readFileSync(new URL(`../${profile}`, import.meta.url), 'utf8'));
const cli = process.env.COMPOSE_TEST_CLI || 'docker';
const prefix = process.env.COMPOSE_TEST_CLI ? [] : ['compose'];
const probe = spawnSync(cli, [...prefix, 'version'], { encoding: 'utf8' });
const available = probe.status === 0;
const service = manifest.name === 'react-example' ? 'app' : 'backend';
const fixture = 'compose-fixture$with"quotes#hash\\slash\nand-newline';
// config escapes dollars so its output can be loaded again as a Compose file.
const renderedFixture = fixture.replaceAll('$', () => '$$');
const keys = Object.keys(references);
const fixedKeys = new Set(['NODE_ENV', 'PORT']);

function compose(environment) {
  return spawnSync(cli, [...prefix, '--env-file', '/dev/null', 'config', '--format=json'], {
    cwd: root, env: environment, encoding: 'utf8', timeout: 30_000,
  });
}

function fixtureEnvironment() {
  const env = { ...process.env };
  for (const key of keys) env[key] = fixture;
  return env;
}

test('o comando Compose desativa o carregamento automático de .env', () => {
  assert.match(manifest.scripts.compose, /with-onepassword\.mjs .* docker compose --env-file \/dev\/null$/);
});

test('Compose recebe os valores completos, sem env_file e sem vazamento ao frontend', { skip: !available }, () => {
  const result = compose(fixtureEnvironment());
  assert.equal(result.status, 0, 'A configuração Compose deve ser válida.');
  const model = JSON.parse(result.stdout);
  const environment = model.services[service].environment;
  assert.equal(environment.ONEPASSWORD_ACTIVE, '1');
  for (const key of keys.filter((name) => !fixedKeys.has(name))) {
    assert.equal(environment[key], renderedFixture, `A variável ${key} deve preservar todos os caracteres na representação do Compose.`);
  }
  for (const [name, configuration] of Object.entries(model.services)) {
    assert.equal(configuration.env_file, undefined);
    if (name !== service) assert.ok(!Object.values(configuration.environment || {}).some((value) => value === fixture || value === renderedFixture));
  }
});

test('Compose rejeita credencial obrigatória ausente, mesmo com .env local existente', { skip: !available }, () => {
  const required = service === 'app' ? 'VITE_GOOGLE_MAPS_API_KEY' : 'DATABASE_URL';
  const env = fixtureEnvironment();
  delete env[required];
  const result = compose(env);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, new RegExp(required));
  assert.equal(result.stdout, '');
});

test('as portas e os modos do container mantêm os valores do Compose', { skip: !available }, () => {
  const result = compose(fixtureEnvironment());
  assert.equal(result.status, 0);
  const model = JSON.parse(result.stdout);
  const environment = model.services[service].environment;
  assert.equal(environment.NODE_ENV, manifest.name === 'nozzle' ? 'production' : 'development');
  if (service === 'backend') assert.equal(environment.PORT, manifest.name === 'nozzle' ? '3000' : '3002');
  if (manifest.name === 'nozzle') {
    assert.equal(model.services.frontend.build.target, 'development');
    assert.equal(model.services.frontend.environment.API_PROXY_TARGET, 'http://backend:3000');
  }
});
