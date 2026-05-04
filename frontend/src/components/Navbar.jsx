import { Link, NavLink } from "react-router-dom";
import { useWallet } from "../context/WalletContext.jsx";

function truncate(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition ${
    isActive ? "bg-ice/20 text-ice" : "text-ice/80 hover:bg-ice/10 hover:text-ice"
  }`;

export default function Navbar() {
  const { account, chainName, connectWallet, connecting, isAdmin } = useWallet();

  return (
    <header className="sticky top-0 z-40 border-b border-ice/15 bg-navy/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-ice font-semibold tracking-tight">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-ice/10 text-ice ring-1 ring-ice/30">
            ✓
          </span>
          <span>SecureVote</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-1">
          <NavLink to="/" className={linkClass} end>
            Home
          </NavLink>
          <NavLink to="/register" className={linkClass}>
            Register
          </NavLink>
          <NavLink to="/vote" className={linkClass}>
            Vote
          </NavLink>
          <NavLink to="/results" className={linkClass}>
            Results
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {account ? (
            <div className="hidden text-right text-xs text-ice/80 sm:block">
              <div className="font-mono text-ice">{truncate(account)}</div>
              <div>{chainName}</div>
            </div>
          ) : null}
          <button
            type="button"
            onClick={connectWallet}
            disabled={connecting}
            className="rounded-lg bg-ice px-4 py-2 text-sm font-semibold text-navy shadow hover:bg-ice-muted disabled:opacity-60"
          >
            {account ? "Reconnect" : connecting ? "Connecting…" : "Connect Wallet"}
          </button>
        </div>
      </div>
    </header>
  );
}
