import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useWallet } from "../context/WalletContext.jsx";
import { api, setStoredToken } from "../lib/api.js";

export default function RegisterPage() {
  const { account, connectWallet } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/vote";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("form");
  const [loading, setLoading] = useState(false);

  const submitRegister = async (e) => {
    e.preventDefault();
    if (!account) {
      toast.error("Connect your wallet first");
      return;
    }
    setLoading(true);
    try {
      await api("/api/auth/register", {
        method: "POST",
        body: { name, email, walletAddress: account },
      });
      toast.success("OTP sent to your email (check console if SMTP is not configured)");
      setStep("otp");
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api("/api/auth/verify-otp", {
        method: "POST",
        body: { email, otp },
      });
      setStoredToken(data.token);
      toast.success("You are verified. JWT saved locally.");
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-3xl font-bold text-white">Voter registration</h1>
      <p className="mt-2 text-ice/80">
        Link your wallet and email. You will still need the election admin to register your wallet
        on-chain before you can vote.
      </p>

      {!account ? (
        <div className="mt-8 glass p-6">
          <p className="text-ice/90">Connect MetaMask to continue.</p>
          <button
            type="button"
            onClick={connectWallet}
            className="mt-4 w-full rounded-lg bg-ice py-3 font-semibold text-navy hover:bg-ice-muted"
          >
            Connect Wallet
          </button>
        </div>
      ) : step === "form" ? (
        <form onSubmit={submitRegister} className="mt-8 space-y-4 glass p-6">
          <div>
            <label className="block text-sm font-medium text-ice/90">Full name</label>
            <input
              className="mt-1 w-full rounded-lg border border-ice/20 bg-navy-dark px-3 py-2 text-white outline-none ring-ice/30 focus:ring-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ice/90">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-ice/20 bg-navy-dark px-3 py-2 text-white outline-none ring-ice/30 focus:ring-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <p className="text-xs text-ice/60">Wallet in use: {account}</p>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-ice py-3 font-semibold text-navy hover:bg-ice-muted disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send OTP"}
          </button>
        </form>
      ) : (
        <form onSubmit={submitOtp} className="mt-8 space-y-4 glass p-6">
          <div>
            <label className="block text-sm font-medium text-ice/90">Enter OTP</label>
            <input
              className="mt-1 w-full rounded-lg border border-ice/20 bg-navy-dark px-3 py-2 text-white outline-none ring-ice/30 focus:ring-2"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-ice py-3 font-semibold text-navy hover:bg-ice-muted disabled:opacity-60"
          >
            {loading ? "Verifying…" : "Verify & save session"}
          </button>
          <button
            type="button"
            className="w-full text-sm text-ice/70 underline"
            onClick={() => setStep("form")}
          >
            Back
          </button>
        </form>
      )}
    </div>
  );
}
