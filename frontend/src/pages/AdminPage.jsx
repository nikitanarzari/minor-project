import { useState } from "react";
import toast from "react-hot-toast";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext.jsx";

export default function AdminPage() {
  const { isAdmin, contract, refreshContract, account } = useWallet();

  const [cName, setCName] = useState("");
  const [cParty, setCParty] = useState("");
  const [voterAddr, setVoterAddr] = useState("");
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");

  const txToast = async (promise, messages) => {
    const t = toast.loading(messages.pending);
    try {
      const tx = await promise;
      toast.loading(`Pending: ${tx.hash.slice(0, 10)}…`, { id: t });
      await tx.wait();
      toast.success(messages.success, { id: t });
      await refreshContract();
    } catch (e) {
      console.error(e);
      toast.error(e?.shortMessage || e?.message || "Transaction failed", { id: t });
    }
  };

  const addCandidate = (e) => {
    e.preventDefault();
    if (!contract) return;
    txToast(contract.addCandidate(cName.trim(), cParty.trim()), {
      pending: "Confirm add candidate in MetaMask…",
      success: "Candidate added",
    });
    setCName("");
    setCParty("");
  };

  const registerVoter = (e) => {
    e.preventDefault();
    if (!contract) return;
    if (!ethers.isAddress(voterAddr)) {
      toast.error("Invalid address");
      return;
    }
    txToast(contract.registerVoter(ethers.getAddress(voterAddr)), {
      pending: "Confirm register voter…",
      success: "Voter registered on-chain",
    });
    setVoterAddr("");
  };

  const setTimes = (e) => {
    e.preventDefault();
    if (!contract || !startLocal || !endLocal) return;
    const start = Math.floor(new Date(startLocal).getTime() / 1000);
    const end = Math.floor(new Date(endLocal).getTime() / 1000);
    if (!(start < end)) {
      toast.error("Start must be before end");
      return;
    }
    txToast(contract.setElectionTimes(start, end), {
      pending: "Confirm election window update…",
      success: "Election times updated",
    });
  };

  if (!account) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-ice/80">
        Connect the admin wallet to use this page.
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-ice/80">
        This wallet is not the on-chain election admin.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-12">
      <h1 className="text-3xl font-bold text-white">Election admin</h1>

      <form onSubmit={addCandidate} className="glass space-y-4 p-6">
        <h2 className="text-lg font-semibold text-ice">Add candidate</h2>
        <input
          placeholder="Name"
          className="w-full rounded-lg border border-ice/20 bg-navy-dark px-3 py-2 text-white"
          value={cName}
          onChange={(e) => setCName(e.target.value)}
          required
        />
        <input
          placeholder="Party"
          className="w-full rounded-lg border border-ice/20 bg-navy-dark px-3 py-2 text-white"
          value={cParty}
          onChange={(e) => setCParty(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-ice py-2.5 font-semibold text-navy hover:bg-ice-muted"
        >
          Add candidate (on-chain)
        </button>
      </form>

      <form onSubmit={registerVoter} className="glass space-y-4 p-6">
        <h2 className="text-lg font-semibold text-ice">Register voter wallet</h2>
        <input
          placeholder="0x voter address"
          className="w-full rounded-lg border border-ice/20 bg-navy-dark px-3 py-2 font-mono text-sm text-white"
          value={voterAddr}
          onChange={(e) => setVoterAddr(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-ice py-2.5 font-semibold text-navy hover:bg-ice-muted"
        >
          Register voter
        </button>
      </form>

      <form onSubmit={setTimes} className="glass space-y-4 p-6">
        <h2 className="text-lg font-semibold text-ice">Election window</h2>
        <p className="text-sm text-ice/70">
          Times use your browser&apos;s local timezone and are stored as Unix timestamps on-chain.
        </p>
        <label className="block text-sm text-ice/80">
          Start
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-lg border border-ice/20 bg-navy-dark px-3 py-2 text-white"
            value={startLocal}
            onChange={(e) => setStartLocal(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm text-ice/80">
          End
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-lg border border-ice/20 bg-navy-dark px-3 py-2 text-white"
            value={endLocal}
            onChange={(e) => setEndLocal(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-lg border border-ice/40 py-2.5 font-semibold text-ice hover:bg-ice/10"
        >
          Update election start / end
        </button>
      </form>
    </div>
  );
}
