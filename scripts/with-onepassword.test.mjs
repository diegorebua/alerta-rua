import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';

const runner = fileURLToPath(new URL('./with-onepassword.mjs', import.meta.url));
const wsl = process.platform === 'linux' && /microsoft/i.test(readFileSync('/proc/sys/kernel/osrelease', 'utf8'));
const vault = 'a'.repeat(26);
const item = 'b'.repeat(26);
const reference = `SECRET=op://${vault}/${item}/environment/SECRET\n`;
const secret = 'quoted "value" with $dollars, #hash, backslash \\ and\na second line';

function fixture(callback) {
  const folder = mkdtempSync(join(tmpdir(), 'onepassword-runner-test-'));
  const profile = join(folder, 'profile.env');
  const cli = join(folder, 'native.mjs');
  const windows = join(folder, 'windows.mjs');
  writeFileSync(profile, reference);
  writeFileSync(cli, '#!/usr/bin/env node\nimport {spawnSync} from "node:child_process";const args=process.argv.slice(2);const separator=args.indexOf("--");if(args[0]!=="run"||separator<0)process.exit(90);const child=spawnSync(args[separator+1],args.slice(separator+2),{stdio:"inherit",env:process.env});process.exit(child.status??91);', { mode: 0o700 });
  writeFileSync(windows, '#!/usr/bin/env node\nprocess.stdout.write(' + JSON.stringify(JSON.stringify({ fields: [{ id: 'SECRET', label: 'SECRET', type: 'CONCEALED', section: { id: 'environment' }, value: secret }] })) + ');', { mode: 0o700 });
  const env = { ...process.env, OP_LINUX_CLI: cli, OP_WINDOWS_CLI: windows, ONEPASSWORD_AUTH: 'windows', SECRET: 'parent-value' };
  const run = (command = process.execPath, args = ['-e', 'process.exit(0)']) => spawnSync(process.execPath, [runner, profile, command, ...args], { env, encoding: 'utf8', timeout: 10_000 });
  try {
    callback({ run, profile, windows, env });
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
}

test('informa uso quando faltam argumentos', () => {
  const result = spawnSync(process.execPath, [runner], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Uso:/);
});

test('resolve campos preservando caracteres e substituindo valor herdado', { skip: !wsl }, () => fixture(({ run }) => {
  const result = run(process.execPath, ['-e', `if(process.env.SECRET!==${JSON.stringify(secret)}||process.env.ONEPASSWORD_ACTIVE!=='1')process.exit(2);`]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
}));

test('preserva o código de saída do comando', { skip: !wsl }, () => fixture(({ run }) => {
  assert.equal(run(process.execPath, ['-e', 'process.exit(7)']).status, 7);
}));

test('falha de autenticação não inicia o comando nem revela resposta do CLI', { skip: !wsl }, () => fixture(({ run, windows }) => {
  writeFileSync(windows, '#!/usr/bin/env node\nconsole.error("CLI_DETAIL_MUST_STAY_PRIVATE");process.exit(1);');
  const result = run();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Windows Hello/);
  assert.doesNotMatch(result.stderr, /CLI_DETAIL_MUST_STAY_PRIVATE/);
  assert.equal(result.stdout, '');
}));

test('campo ausente interrompe a inicialização', { skip: !wsl }, () => fixture(({ run, windows }) => {
  writeFileSync(windows, '#!/usr/bin/env node\nconsole.log(JSON.stringify({fields:[]}));');
  const result = run();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Campo ausente/);
}));

test('recusa referência inválida e variáveis de controle', { skip: !wsl }, () => fixture(({ run, profile }) => {
  for (const content of ['SECRET=plaintext\n', `NODE_OPTIONS=op://${vault}/${item}/environment/SECRET\n`]) {
    writeFileSync(profile, content);
    const result = run();
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
  }
}));

test('modo nativo encaminha o arquivo de referências ao CLI', () => fixture(({ run, env }) => {
  env.ONEPASSWORD_AUTH = 'native';
  const result = run(process.execPath, ['-e', 'if(process.env.ONEPASSWORD_ACTIVE!=="1")process.exit(2)']);
  assert.equal(result.status, 0, result.stderr);
}));
