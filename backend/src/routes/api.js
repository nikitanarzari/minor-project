import { Router } from "express";
import { getVotingContract } from "../contractClient.js";

const router = Router();

router.get("/voter/status/:walletAddress", async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { contract } = getVotingContract();
    if (!contract) {
      return res.json({ isRegistered: false, hasVoted: false, contractReady: false });
    }
    const v = await contract.voters(walletAddress);
    return res.json({
      isRegistered: v.isRegistered,
      hasVoted: v.hasVoted,
      votedCandidateId: v.votedCandidateId.toString(),
      contractReady: true,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not read voter status" });
  }
});

router.get("/candidates", async (req, res) => {
  try {
    const { contract } = getVotingContract();
    if (!contract) return res.json({ candidates: [], contractReady: false });

    const count = Number(await contract.getCandidateCount());
    const candidates = [];
    for (let i = 0; i < count; i++) {
      const c = await contract.getCandidate(i);
      candidates.push({
        id: Number(c.id),
        name: c.name,
        party: c.party,
        voteCount: Number(c.voteCount),
      });
    }
    return res.json({ candidates, contractReady: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not load candidates" });
  }
});

router.get("/results", async (req, res) => {
  try {
    const { contract, provider } = getVotingContract();
    if (!contract) {
      return res.json({
        candidates: [],
        winner: null,
        electionEnded: false,
        electionEnd: null,
        contractReady: false,
      });
    }

    const [countBn, endBn, latest] = await Promise.all([
      contract.getCandidateCount(),
      contract.electionEnd(),
      provider.getBlock("latest"),
    ]);
    const nowBn = latest.timestamp;

    const count = Number(countBn);
    const electionEnd = Number(endBn);
    const now = Number(nowBn);
    const electionEnded = now > electionEnd;

    const candidates = [];
    for (let i = 0; i < count; i++) {
      const c = await contract.getCandidate(i);
      candidates.push({
        id: Number(c.id),
        name: c.name,
        party: c.party,
        voteCount: Number(c.voteCount),
      });
    }

    let winner = null;
    if (electionEnded && count > 0) {
      try {
        const w = await contract.getWinner();
        winner = {
          id: Number(w.id),
          name: w.name,
          party: w.party,
          voteCount: Number(w.voteCount),
        };
      } catch {
        winner = null;
      }
    }

    return res.json({
      candidates,
      winner,
      electionEnded,
      electionEnd,
      now,
      contractReady: true,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not load results" });
  }
});

export default router;
