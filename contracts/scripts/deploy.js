const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const now = Math.floor(Date.now() / 1000);
  const sevenDays = 7 * 24 * 60 * 60;
  const electionStart = now;
  const electionEnd = now + sevenDays;

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy(electionStart, electionEnd);
  await voting.waitForDeployment();
  const address = await voting.getAddress();
  console.log("Voting deployed to:", address);
  console.log("electionStart:", electionStart, "electionEnd:", electionEnd);

  const sample = [
    { name: "Rahul Sharma", party: "Bharatiya Janta Party" },
    { name: "Priya Mehta", party: "Indian National Congress" },
    { name: "Anil Kumar", party: "Aam Aadmi Party" },
  ];

  for (const c of sample) {
    const tx = await voting.addCandidate(c.name, c.party);
    await tx.wait();
    console.log("Added candidate:", c.name);
  }

  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "Voting.sol",
    "Voting.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const outDir = path.join(__dirname, "..", "..", "frontend", "src", "contract");
  const outFile = path.join(outDir, "Voting.json");
  fs.mkdirSync(outDir, { recursive: true });

  const payload = {
    address,
    abi: artifact.abi,
    network: hre.network.name,
    electionStart,
    electionEnd,
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));
  console.log("Wrote ABI + address to:", outFile);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
