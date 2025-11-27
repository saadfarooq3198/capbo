import { isPreview } from "@/components/preview";

const isProd = !isPreview;

function throwProdError() {
    if (isProd) {
        throw new Error('Local demo auth is retired. Use Base44 platform auth.');
    } else {
        console.warn('A retired local auth function was called in preview mode.');
    }
}

// --- Kept Functions ---

// Password hashing with PBKDF2
export async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const saltBuffer = encoder.encode(salt);
  
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    data,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const derived = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  return Array.from(new Uint8Array(derived))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPassword(password, hash, salt) {
  const computed = await hashPassword(password, salt);
  return computed === hash;
}

// Generate secure token
export function generateToken() {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// General purpose ID/role helpers
export function getUserId(user) {
  return user?.id ?? user?._id ?? user?.userId ?? user?.email;
}

export function isAdmin(user) {
  return user?.app_role === 'admin';
}

export function signOut() {
  // This is now handled by the /logout page and User.logout()
  window.location.replace('/home');
}

export function clearSessionAndGoHome() {
  signOut();
}


// --- All functions below are deprecated and will throw in production ---

export async function readUsers() { throwProdError(); }
export async function writeUsers(users) { throwProdError(); }
export function getSessionSafe() { throwProdError(); return null; }
export function getUsers() { throwProdError(); return []; }
export function saveUsers(users) { throwProdError(); }
export function findUserByEmail(email) { throwProdError(); return undefined; }
export function findUserById(id) { throwProdError(); return undefined; }
export async function createUser(userData) { throwProdError(); }
export function updateUser(id, updates) { throwProdError(); }
export function deleteUser(id) { throwProdError(); }
export function getSession() { throwProdError(); return null; }
export function setSession(userId, role) { throwProdError(); }
export function clearSession() { throwProdError(); }
export function getResetTokens() { throwProdError(); return []; }
export function saveResetTokens(tokens) { throwProdError(); }
export function createResetToken(userId) { throwProdError(); }
export function findResetToken(token) { throwProdError(); }
export function markTokenUsed(token) { throwProdError(); }
export function getAuthAttempts() { throwProdError(); return {}; }
export function recordFailedAttempt(email) { throwProdError(); }
export function isAccountLocked(email) { throwProdError(); return false; }
export function clearAuthAttempts(email) { throwProdError(); }