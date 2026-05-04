import { useCallback, useEffect, useMemo, useState } from "react";

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
import toast from "react-hot-toast";
import { useWallet } from "../context/WalletContext.jsx";
import { api, getStoredToken } from "../lib/api.js";
import ProtectedRoute from "../components/ProtectedRoute.jsx";

function VotingInner() {
  const { account, contract, electionStart, electionEnd, refreshContract } = useWallet();
  const [candidates, setCandidates] = useState([]);
  const [status, setStatus] = useState({ isRegistered: false, hasVoted: false });
  const [loading, setLoading] = useState(true);
  const now = useNow();

  const phase = useMemo(() => {
    if (electionStart == null || electionEnd == null) return "unknown";
    if (now < electionStart) return "not_started";
    if (now <= electionEnd) return "active";
    return "ended";
  }, [electionEnd, electionStart, now]);

  const load = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        api("/api/candidates"),
        api(`/api/voter/status/${account}`),
      ]);
      setCandidates(cRes.candidates || []);
      setStatus({
        isRegistered: sRes.isRegistered,
        hasVoted: sRes.hasVoted,
      });
    } catch (e) {
      toast.error(e.message || "Failed to load voting data");
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    load();
  }, [load]);

  const vote = async (candidateId) => {
    if (!contract || !account) return;
    if (!status.isRegistered) {
      toast.error("Your wallet is not registered on-chain. Ask the election admin.");
      return;
    }
    if (status.hasVoted) {
      toast.error("You have already voted.");
      return;
    }
    if (phase !== "active") {
      toast.error("Voting is only allowed during the active election window.");
      return;
    }

    const t = toast.loading("Confirm the transaction in MetaMask…");
    try {
      const tx = await contract.castVote(candidateId);
      toast.loading(`Pending: ${tx.hash.slice(0, 10)}…`, { id: t });
      await tx.wait();
      toast.success("Vote recorded on-chain", { id: t });
      await refreshContract();
      await load();
    } catch (e) {
      console.error(e);
      const msg = e?.shortMessage || e?.reason || e?.message || "Transaction failed";
      toast.error(msg, { id: t });
    }
  };

  const token = getStoredToken();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">Cast your vote</h1>
          <p className="mt-2 text-ice/80">
            JWT session: {token ? "active" : "missing"} · On-chain registration:{" "}
            {status.isRegistered ? "yes" : "no"}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="self-start rounded-lg border border-ice/30 px-4 py-2 text-sm text-ice hover:bg-ice/10"
        >
          Refresh
        </button>
      </div>

      {!account ? (
        <p className="mt-8 text-ice/80">Connect your wallet from the navbar.</p>
      ) : loading ? (
        <p className="mt-8 text-ice/80">Loading candidates…</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {candidates.map((c) => (
            <div key={c.id} className="glass flex flex-col p-6">
              <h2 className="text-xl font-semibold text-white">{c.name}</h2>
              <p className="mt-1 text-sm text-ice/80">{c.party}</p>
              <p className="mt-4 text-sm text-ice/70">
                Votes: <span className="font-mono text-ice">{c.voteCount}</span>
                {phase === "ended" ? " (final)" : " (live)"}
              </p>
              <button
                type="button"
                disabled={
                  !contract ||
                  !status.isRegistered ||
                  status.hasVoted ||
                  phase !== "active"
                }
                onClick={() => vote(c.id)}
                className="mt-6 w-full rounded-lg bg-ice py-2.5 font-semibold text-navy hover:bg-ice-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                Vote
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function VotingPage() {
  return (
    <ProtectedRoute>
      <VotingInner />
    </ProtectedRoute>
  );
}
