import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ethers } from "ethers";
import MetaMaskSDK from "@metamask/sdk";
import votingArtifact from "../contract/Voting.json";
import toast from "react-hot-toast";

const WalletContext = createContext(null);

const CHAIN_NAMES = {
  1: "Ethereum Mainnet",
  11155111: "Sepolia",
  1337: "Local",
  5777: "Ganache",
};

function resolveContractAddress() {
  const env = import.meta.env.VITE_CONTRACT_ADDRESS;
  if (env && ethers.isAddress(env)) return env;
  return votingArtifact.address;
}

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [adminAddress, setAdminAddress] = useState(null);
  const [electionStart, setElectionStart] = useState(null);
  const [electionEnd, setElectionEnd] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const sdkRef = useRef(null);

  const initSdk = useCallback(() => {
    if (sdkRef.current) return sdkRef.current;
    const sdk = new MetaMaskSDK({
      dappMetadata: {
        name: "Blockchain E-Voting",
        url: typeof window !== "undefined" ? window.location.origin : "http://localhost:5173",
      },
      enableAnalytics: false,
    });
    sdkRef.current = sdk;
    return sdk;
  }, []);

  const loadChainContract = useCallback(async (ethereum, acct) => {
    const browserProvider = new ethers.BrowserProvider(ethereum);
    const net = await browserProvider.getNetwork();
    setChainId(Number(net.chainId));

    const sig = await browserProvider.getSigner();
    setSigner(sig);

    const addr = resolveContractAddress();
    if (!addr || addr === ethers.ZeroAddress) {
      setContract(null);
      setAdminAddress(null);
      setElectionStart(null);
      setElectionEnd(null);
      return;
    }

    const c = new ethers.Contract(addr, votingArtifact.abi, sig);
    setContract(c);
    try {
      const [adm, es, ee] = await Promise.all([c.admin(), c.electionStart(), c.electionEnd()]);
      setAdminAddress(adm);
      setElectionStart(Number(es));
      setElectionEnd(Number(ee));
    } catch {
      setAdminAddress(null);
      setElectionStart(null);
      setElectionEnd(null);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    const sdk = initSdk();
    const ethereum = sdk.getProvider();
    if (!ethereum) {
      toast.error("MetaMask not available");
      return;
    }
    setConnecting(true);
    try {
      await sdk.connect();
      const accounts = await ethereum.request({ method: "eth_accounts" });
      const acct = accounts?.[0] || null;
      setAccount(acct);
      if (acct) await loadChainContract(ethereum, acct);
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Could not connect wallet");
    } finally {
      setConnecting(false);
    }
  }, [initSdk, loadChainContract]);

  useEffect(() => {
    const sdk = initSdk();
    const ethereum = sdk.getProvider();
    if (!ethereum) return undefined;

    const onChain = async () => {
      try {
        const browserProvider = new ethers.BrowserProvider(ethereum);
        const net = await browserProvider.getNetwork();
        setChainId(Number(net.chainId));
        if (account) await loadChainContract(ethereum, account);
      } catch {
        /* ignore */
      }
    };

    const onAccounts = async (accs) => {
      const next = accs?.[0] || null;
      setAccount(next);
      if (next) await loadChainContract(ethereum, next);
      else {
        setSigner(null);
        setContract(null);
        setAdminAddress(null);
        setElectionStart(null);
        setElectionEnd(null);
      }
    };

    ethereum.on?.("chainChanged", onChain);
    ethereum.on?.("accountsChanged", onAccounts);

    (async () => {
      try {
        const accs = await ethereum.request({ method: "eth_accounts" });
        if (accs?.[0]) {
          setAccount(accs[0]);
          await loadChainContract(ethereum, accs[0]);
        }
      } catch {
        /* ignore */
      }
    })();

    return () => {
      ethereum.removeListener?.("chainChanged", onChain);
      ethereum.removeListener?.("accountsChanged", onAccounts);
    };
  }, [initSdk, loadChainContract]);

  const isAdmin = useMemo(() => {
    if (!account || !adminAddress) return false;
    return account.toLowerCase() === adminAddress.toLowerCase();
  }, [account, adminAddress]);

  const value = useMemo(
    () => ({
      account,
      chainId,
      chainName: chainId ? CHAIN_NAMES[chainId] || `Chain ${chainId}` : "—",
      signer,
      contract,
      adminAddress,
      electionStart,
      electionEnd,
      isAdmin,
      connecting,
      connectWallet,
      refreshContract: async () => {
        const sdk = sdkRef.current;
        const ethereum = sdk?.getProvider();
        if (ethereum && account) await loadChainContract(ethereum, account);
      },
    }),
    [
      account,
      adminAddress,
      chainId,
      connecting,
      contract,
      connectWallet,
      electionEnd,
      electionStart,
      isAdmin,
      loadChainContract,
      signer,
    ]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
