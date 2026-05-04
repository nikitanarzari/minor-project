import { Router } from "express";
import jwt from "jsonwebtoken";
import { ethers } from "ethers";
import { createUser, findUserByEmail, findUserByWallet, persistDb, db } from "../db.js";
import { setOtp, verifyAndConsumeOtp } from "../otp.js";
import { sendOtpEmail } from "../mail.js";
import { verifyJWT } from "../middleware/verifyJWT.js";

const router = Router();

function randomSixDigit() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, walletAddress } = req.body || {};
    if (!name || !email || !walletAddress) {
      return res.status(400).json({ error: "name, email, and walletAddress are required" });
    }
    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({ error: "Invalid walletAddress" });
    }

    const checksummed = ethers.getAddress(walletAddress);
    if (findUserByEmail(email)) {
      return res.status(409).json({ error: "Email already registered" });
    }
    if (findUserByWallet(checksummed)) {
      return res.status(409).json({ error: "Wallet already registered" });
    }

    const user = createUser({ name, email, walletAddress: checksummed });
    await persistDb();

    const code = randomSixDigit();
    setOtp(user.email, code);
    await sendOtpEmail(user.email, code);

    return res.json({ message: "OTP sent to your email", email: user.email });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ error: "email and otp are required" });
    }

    const user = findUserByEmail(email);
    if (!user) return res.status(404).json({ error: "User not found" });

    const v = verifyAndConsumeOtp(email, otp);
    if (!v.ok) {
      const map = { no_otp: "Request a new code", expired: "Code expired", mismatch: "Invalid code" };
      return res.status(400).json({ error: map[v.reason] || "Verification failed" });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, walletAddress: user.walletAddress },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: { name: user.name, email: user.email, walletAddress: user.walletAddress },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Verification failed" });
  }
});

router.get("/me", verifyJWT, (req, res) => {
  const u = db.data.users.find((x) => x.id === req.user.sub);
  if (!u) return res.status(404).json({ error: "User not found" });
  return res.json({
    name: u.name,
    email: u.email,
    walletAddress: u.walletAddress,
  });
});

export default router;
