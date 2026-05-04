import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import toast from "react-hot-toast";
import { api } from "../lib/api.js";

export default function ResultsPage() {
  const [data, setData] = useState({
    candidates: [],
    winner: null,
    electionEnded: false,
    contractReady: true,
  });

  const load = useCallback(async () => {
    try {
      const res = await api("/api/results");
      setData(res);
    } catch (e) {
      toast.error(e.message || "Could not load results");
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const chartData = (data.candidates || []).map((c) => ({
    name: c.name.split(" ")[0],
    full: c.name,
    votes: c.voteCount,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Live results</h1>
          <p className="mt-2 text-ice/80">Auto-refresh every 30 seconds.</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border border-ice/30 px-4 py-2 text-sm text-ice hover:bg-ice/10"
        >
          Refresh now
        </button>
      </div>

      {data.electionEnded && data.winner && (
        <div className="mt-8 rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-6">
          <h2 className="text-lg font-semibold text-emerald-100">Winner</h2>
          <p className="mt-2 text-2xl font-bold text-white">{data.winner.name}</p>
          <p className="text-ice/80">{data.winner.party}</p>
          <p className="mt-2 font-mono text-ice">Total votes: {data.winner.voteCount}</p>
        </div>
      )}

      {!data.contractReady ? (
        <p className="mt-8 text-ice/75">Contract not deployed or address missing.</p>
      ) : (
        <div className="mt-10 h-80 w-full glass p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#CADCFC22" />
              <XAxis dataKey="name" stroke="#CADCFCaa" />
              <YAxis allowDecimals={false} stroke="#CADCFCaa" />
              <Tooltip
                contentStyle={{
                  background: "#1E2761",
                  border: "1px solid rgba(202,220,252,0.3)",
                  borderRadius: 8,
                  color: "#CADCFC",
                }}
                formatter={(value) => [value, "Votes"]}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.full || ""}
              />
              <Bar dataKey="votes" fill="#CADCFC" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
