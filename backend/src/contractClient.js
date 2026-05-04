import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { ethers } from "ethers";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadArtifact() {
  const abiPath =
    process.env.CONTRACT_ABI_PATH ||
    join(__dirname, "../../frontend/src/contract/Voting.json");
  const raw = readFileSync(abiPath, "utf8");
  return JSON.parse(raw);
}

export function getRpcUrl() {
  return (
    process.env.SEPOLIA_RPC_URL ||
    process.env.INFURA_URL ||
    process.env.LOCAL_RPC ||
    "http://127.0.0.1:7545"
  );
}

export function getVotingContract() {
  const { address, abi } = loadArtifact();
  const envAddr = process.env.CONTRACT_ADDRESS;
  const resolved =
    envAddr && envAddr.length > 0 && envAddr !== "0x0000000000000000000000000000000000000000"
      ? envAddr
      : address;
  const provider = new ethers.JsonRpcProvider(getRpcUrl());
  if (!resolved || resolved === ethers.ZeroAddress) {
    return { provider, contract: null, address: null, abi };
  }
  const contract = new ethers.Contract(resolved, abi, provider);
  return { provider, contract, address: resolved, abi };
}
