import nodemailer from "nodemailer";

export function createTransportFromEnv() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function sendOtpEmail(to, code) {
  const transport = createTransportFromEnv();
  const text = `Your E-Voting verification code is: ${code}\n\nThis code expires in 10 minutes.`;
  if (!transport) {
    console.warn("[mail] EMAIL_USER/EMAIL_PASS not set — OTP (dev):", code, "for", to);
    return { dev: true };
  }
  await transport.sendMail({
    from: `"E-Voting" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your E-Voting verification code",
    text,
  });
  return { dev: false };
}
