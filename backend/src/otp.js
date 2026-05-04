const store = new Map();
const TTL_MS = 10 * 60 * 1000;

export function setOtp(email, code) {
  const e = email.toLowerCase();
  store.set(e, { code: String(code), expiresAt: Date.now() + TTL_MS });
}

export function verifyAndConsumeOtp(email, otp) {
  const e = email.toLowerCase();
  const row = store.get(e);
  if (!row) return { ok: false, reason: "no_otp" };
  if (Date.now() > row.expiresAt) {
    store.delete(e);
    return { ok: false, reason: "expired" };
  }
  if (String(otp) !== row.code) return { ok: false, reason: "mismatch" };
  store.delete(e);
  return { ok: true };
}
