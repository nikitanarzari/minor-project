import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../context/WalletContext.jsx";

function useNow(tick = 1000) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), tick);
    return () => clearInterval(id);
  }, [tick]);
  return now;
}

function formatCountdown(seconds) {
  if (seconds <= 0) return "0d 0h 0m 0s";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${d}d ${h}h ${m}m ${s}s`;
}

export default function HomePage() {
  const { account, connectWallet, connecting, electionStart, electionEnd, contract } = useWallet();
  const now = useNow();

  const phase = useMemo(() => {
    if (electionStart == null || electionEnd == null) return "unknown";
    if (now < electionStart) return "not_started";
    if (now <= electionEnd) return "active";
    return "ended";
  }, [electionEnd, electionStart, now]);

  const countdownLabel =
    phase === "not_started"
      ? "Election starts in"
      : phase === "active"
        ? "Election ends in"
        : "Election closed";

  const countdownSeconds =
    phase === "not_started"
      ? Math.max(0, electionStart - now)
      : phase === "active"
        ? Math.max(0, electionEnd - now)
        : 0;

  const badge =
    phase === "not_started"
      ? { text: "Not Started", cls: "bg-amber-500/20 text-amber-200 ring-amber-400/40" }
      : phase === "active"
        ? { text: "Active", cls: "bg-emerald-500/20 text-emerald-100 ring-emerald-400/40" }
        : phase === "ended"
          ? { text: "Ended", cls: "bg-slate-500/30 text-slate-200 ring-slate-400/30" }
          : { text: "Unknown", cls: "bg-ice/10 text-ice/80 ring-ice/20" };

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-ice/70">
            Decentralised · Transparent · Verifiable
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-white sm:text-5xl">
            Blockchain-based <span className="text-ice">E-Voting</span> for the modern republic
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ice/85">
            Connect MetaMask, complete email verification, and cast your vote on-chain. Results are
            tamper-evident and auditable by anyone.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {!account ? (
              <button
                type="button"
                onClick={connectWallet}
                disabled={connecting}
                className="rounded-xl bg-ice px-6 py-3 text-base font-semibold text-navy shadow-lg hover:bg-ice-muted disabled:opacity-60"
              >
                {connecting ? "Opening MetaMask…" : "Connect Wallet"}
              </button>
            ) : (
              <Link
                to="/vote"
                className="rounded-xl bg-ice px-6 py-3 text-base font-semibold text-navy shadow-lg hover:bg-ice-muted"
              >
                Go to Voting
              </Link>
            )}
            <Link
              to="/register"
              className="rounded-xl border border-ice/40 px-6 py-3 text-base font-semibold text-ice hover:bg-ice/10"
            >
              Register with OTP
            </Link>
          </div>
        </div>

        <div className="glass p-8 shadow-2xl">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">Election status</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badge.cls}`}>
              {badge.text}
            </span>
          </div>

          {!contract ? (
            <p className="mt-6 text-sm text-ice/75">
              Deploy the smart contract and refresh this app so the ABI and address are available in{" "}
              <code className="rounded bg-navy-light px-1 py-0.5 text-ice">src/contract/Voting.json</code>.
            </p>
          ) : (
            <>
              <p className="mt-6 text-sm text-ice/70">{countdownLabel}</p>
              <p className="mt-2 font-mono text-3xl font-bold tracking-tight text-ice">
                {phase === "ended" ? "—" : formatCountdown(countdownSeconds)}
              </p>
              <dl className="mt-8 grid gap-3 text-sm text-ice/80">
                <div className="flex justify-between border-b border-ice/10 pb-2">
                  <dt>Start (UTC)</dt>
                  <dd className="font-mono text-ice">
                    {electionStart ? new Date(electionStart * 1000).toISOString() : "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>End (UTC)</dt>
                  <dd className="font-mono text-ice">
                    {electionEnd ? new Date(electionEnd * 1000).toISOString() : "—"}
                  </dd>
                </div>
              </dl>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
