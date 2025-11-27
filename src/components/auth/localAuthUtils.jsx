export function normEmail(e) { return (e || "").trim().toLowerCase(); }

export async function hashPassword(pw, email) {
  const enc = new TextEncoder();
  const salt = enc.encode(normEmail(email));
  const data = enc.encode(pw);
  const bytes = new Uint8Array(salt.length + data.length);
  bytes.set(salt, 0);
  bytes.set(data, salt.length);
  if (!crypto?.subtle) throw new Error("Local accounts require HTTPS (WebCrypto unavailable).");
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export const LOCAL_AUTH_MODE = "offline";
export const LS_KEY = "offlineLocalUsers";

export const readOffline = () => JSON.parse(localStorage.getItem(LS_KEY) || "[]");
export const writeOffline = (arr) => localStorage.setItem(LS_KEY, JSON.stringify(arr));

export function genTempPassword(len = 12) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const all = upper + lower + digits;
  const pick = (s) => s[Math.floor(Math.random() * s.length)];
  let pwd = pick(upper) + pick(lower) + pick(digits);
  for (let i = pwd.length; i < len; i++) pwd += pick(all);
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}