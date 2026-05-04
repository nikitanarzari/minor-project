import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { JSONFilePreset } from "lowdb/node";
import { randomUUID } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, "../data/db.json");

const defaultData = { users: [] };

export const db = await JSONFilePreset(file, defaultData);

export function findUserByEmail(email) {
  return db.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserByWallet(walletAddress) {
  const w = walletAddress.toLowerCase();
  return db.data.users.find((u) => u.walletAddress.toLowerCase() === w);
}

export function createUser({ name, email, walletAddress }) {
  const user = {
    id: randomUUID(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    walletAddress: walletAddress.trim(),
    createdAt: new Date().toISOString(),
  };
  db.data.users.push(user);
  return user;
}

export async function persistDb() {
  await db.write();
}
