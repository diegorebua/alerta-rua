/**
 * Mock de autenticação — sem Firebase Auth.
 * O estado do usuário e os usuários cadastrados ficam no localStorage.
 */

export interface MockUser {
  email: string;
  displayName: string;
  uid: string;
  photoURL?: string;
}

const SESSION_KEY = 'alerta_rua_session';
const USERS_KEY = 'alerta_rua_users';

// ─── Usuário pré-cadastrado ─────────────────────────────────────────────────
const DEFAULT_USERS: Array<MockUser & { password: string }> = [
  {
    email: 'diegorebua@gmail.com',
    password: '123456',
    displayName: 'Diego Rebua',
    uid: 'mock-user-001',
  },
];

// ─── Helpers internos ───────────────────────────────────────────────────────

function getStoredUsers(): Array<MockUser & { password: string }> {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const stored = raw ? JSON.parse(raw) : [];
    // Mescla com os defaults garantindo que o usuário demo sempre exista
    const merged = [...DEFAULT_USERS];
    for (const u of stored) {
      if (!merged.find(m => m.email.toLowerCase() === u.email.toLowerCase())) {
        merged.push(u);
      }
    }
    return merged;
  } catch {
    return [...DEFAULT_USERS];
  }
}

function saveUsers(users: Array<MockUser & { password: string }>) {
  // Não persiste o usuário default, só os cadastrados pelo usuário
  const extra = users.filter(
    u => !DEFAULT_USERS.find(d => d.email.toLowerCase() === u.email.toLowerCase())
  );
  localStorage.setItem(USERS_KEY, JSON.stringify(extra));
}

// ─── API pública ────────────────────────────────────────────────────────────

/** Login com email/senha. Retorna o usuário ou null se inválido. */
export function mockLogin(email: string, password: string): MockUser | null {
  const users = getStoredUsers();
  const found = users.find(
    u =>
      u.email.toLowerCase() === email.trim().toLowerCase() &&
      u.password === password
  );
  if (found) {
    const user: MockUser = {
      email: found.email,
      displayName: found.displayName,
      uid: found.uid,
      photoURL: found.photoURL,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }
  return null;
}

/** Cadastro com email/senha. Retorna erro string ou null se OK. */
export function mockRegister(
  email: string,
  password: string,
  displayName: string
): string | null {
  const users = getStoredUsers();
  const exists = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (exists) return 'Este email já está cadastrado.';
  if (password.length < 6) return 'A senha deve ter pelo menos 6 caracteres.';

  const newUser: MockUser & { password: string } = {
    email: email.trim(),
    password,
    displayName: displayName.trim() || email.split('@')[0],
    uid: `mock-user-${Date.now()}`,
  };
  users.push(newUser);
  saveUsers(users);

  const session: MockUser = {
    email: newUser.email,
    displayName: newUser.displayName,
    uid: newUser.uid,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return null;
}

/** Login simulado com Google — usa os dados do usuário pré-definido. */
export function mockGoogleLogin(): MockUser {
  const user: MockUser = {
    email: 'diegorebua@gmail.com',
    displayName: 'Diego Rebua',
    uid: 'mock-user-001',
    photoURL: 'https://ui-avatars.com/api/?name=Diego+Rebua&background=4285F4&color=fff',
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export function mockLogout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getMockUser(): MockUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as MockUser) : null;
  } catch {
    return null;
  }
}

export function isMockLoggedIn(): boolean {
  return getMockUser() !== null;
}
