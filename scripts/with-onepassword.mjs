import { execFileSync, spawn } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import console from 'node:console';

const root = fileURLToPath(new URL('../', import.meta.url));
const [profile, command, ...args] = process.argv.slice(2);
const isWsl = process.platform === 'linux' && /microsoft/i.test(readFileSync('/proc/sys/kernel/osrelease', 'utf8'));
const reserved = new Set(['PATH', 'HOME', 'NODE_OPTIONS', 'LD_PRELOAD', 'LD_LIBRARY_PATH', 'WSLENV']);

function windowsCli() {
  if (process.env.OP_WINDOWS_CLI) return process.env.OP_WINDOWS_CLI;
  const candidates = (process.env.PATH || '').split(':').map((directory) => join(directory, 'op.exe'));
  for (const user of readdirSync('/mnt/c/Users', { withFileTypes: true })) {
    if (!user.isDirectory()) continue;
    const winget = join('/mnt/c/Users', user.name, 'AppData/Local/Microsoft/WinGet');
    candidates.push(join(winget, 'Links/op.exe'));
    candidates.push(join(winget, 'Packages/AgileBits.1Password.CLI_Microsoft.Winget.Source_8wekyb3d8bbwe/op.exe'));
  }
  const found = [...new Set(candidates.filter(existsSync).map((path) => realpathSync(path)))];
  if (found.length !== 1) throw new Error('Defina OP_WINDOWS_CLI com o caminho do op.exe do Windows.');
  return found[0];
}

function resolveWindowsReferences(environmentFile) {
  const references = parseEnv(readFileSync(environmentFile, 'utf8'));
  if (!Object.keys(references).length) throw new Error('O perfil não contém referências.');
  const values = Object.create(null);
  const items = new Map();
  const cli = windowsCli();
  for (const [name, reference] of Object.entries(references)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || reserved.has(name) || name.startsWith('OP_') || name.startsWith('ONEPASSWORD_')) {
      throw new Error('Nome de variável de ambiente não permitido no perfil.');
    }
    const match = /^op:\/\/([a-z0-9]{26})\/([a-z0-9]{26})\/environment\/([A-Za-z_][A-Za-z0-9_]*)$/.exec(reference);
    if (!match) throw new Error('Referência inválida no perfil do 1Password.');
    const [, vault, id, fieldName] = match;
    const key = `${vault}/${id}`;
    if (!items.has(key)) {
      let item;
      try {
        item = JSON.parse(execFileSync(cli, ['item', 'get', id, '--vault', vault, '--format=json', '--reveal'], {
          encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 180_000, maxBuffer: 4 * 1024 * 1024,
        }));
      } catch {
        throw new Error('Não foi possível acessar o 1Password. Desbloqueie o aplicativo Windows e autorize pelo Windows Hello.');
      }
      if (!item || !Array.isArray(item.fields)) throw new Error('Resposta inválida do 1Password.');
      items.set(key, item.fields);
    }
    const fields = items.get(key).filter((field) => field?.section?.id === 'environment' && (field.id === fieldName || field.label === fieldName));
    if (fields.length !== 1 || (fields[0].value !== undefined && typeof fields[0].value !== 'string')) {
      throw new Error(`Campo ausente ou inválido no 1Password: ${name}.`);
    }
    const value = fields[0].value ?? '';
    if (value.includes('\0') || value.startsWith('op://')) throw new Error(`Valor incompatível com variável de ambiente: ${name}.`);
    values[name] = value;
  }
  return values;
}

try {
  if (!profile || !command) throw new Error('Uso: node scripts/with-onepassword.mjs perfil.env comando [argumentos]');
  const environmentFile = resolve(root, profile);
  const linuxCli = process.env.OP_LINUX_CLI || 'op';
  const env = { ...process.env, ONEPASSWORD_ACTIVE: '1' };
  let parameters;
  if (isWsl && process.env.ONEPASSWORD_AUTH !== 'native') {
    Object.assign(env, resolveWindowsReferences(environmentFile));
    // Authentication stays in Windows; the native CLI launches the Linux command.
    parameters = ['run', '--', command, ...args];
  } else {
    parameters = ['run', `--env-file=${environmentFile}`, '--', command, ...args];
  }
  const child = spawn(linuxCli, parameters, { env, stdio: 'inherit' });
  const interrupt = () => child.kill('SIGINT');
  const terminate = () => child.kill('SIGTERM');
  process.on('SIGINT', interrupt);
  process.on('SIGTERM', terminate);
  child.once('error', () => {
    console.error('Não foi possível iniciar o CLI nativo. Instale op ou configure OP_LINUX_CLI.');
    process.exitCode = 1;
  });
  child.once('exit', (code, signal) => {
    process.off('SIGINT', interrupt);
    process.off('SIGTERM', terminate);
    process.exitCode = code ?? (signal === 'SIGINT' ? 130 : signal === 'SIGTERM' ? 143 : 1);
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Falha ao carregar o ambiente do 1Password.');
  process.exitCode = 1;
}
