import React, { useState, useMemo } from 'react';
import { ArrowRight, Info, TrendingUp, ShieldCheck, Moon } from 'lucide-react';
import { FUNDS_DATA } from './fundsData';

const GlowingCard = ({ children, className = "", special = false }) => (
    <div className={`
    bg-[#0f1221] border rounded-3xl p-6 shadow-xl relative overflow-hidden group transition-all duration-300
    ${special ? 'border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.2)]' : 'border-[#2a2e45]'}
    ${className}
  `}>
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500
      ${special ? 'from-emerald-500/0 via-emerald-400/50 to-emerald-500/0' : 'from-blue-500/0 via-blue-500/20 to-blue-500/0'}
    `} />
        {children}
    </div>
);

const GradientButton = ({ children, onClick, active }) => (
    <button
        onClick={onClick}
        className={`
      px-6 py-2.5 rounded-full font-medium transition-all duration-300 text-sm tracking-wide flex items-center
      ${active
                ? 'bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white shadow-[0_0_20px_rgba(124,58,237,0.4)]'
                : 'bg-[#1a1f35] text-gray-400 border border-[#2a2e45] hover:bg-[#252a40] hover:text-white'}
    `}
    >
        {children}
    </button>
);

const StatRow = ({ label, value, highlight = false }) => (
    <div className="flex justify-between items-center py-2 border-b border-[#1f243a] last:border-0">
        <span className="text-gray-400 text-sm font-medium">{label}</span>
        <span className={`font-semibold ${highlight ? 'text-white' : 'text-gray-300'}`}>
            {value}
        </span>
    </div>
);

export default function FluidoFDRates() {
    const [amount, setAmount] = useState(10000000);
    const [selectedManager, setSelectedManager] = useState("All");

    const formatCurrency = (val) =>
        new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(val);

    const ALL_FUNDS = useMemo(() => {
        return [...(FUNDS_DATA.stable || []), ...(FUNDS_DATA.growth || []), ...(FUNDS_DATA.shariah || [])];
    }, []);

    const MANAGERS = useMemo(() => {
        return ["All", ...Array.from(new Set(ALL_FUNDS.map(f => f.manager))).sort()];
    }, [ALL_FUNDS]);

    // Filter by manager and sort primarily by rate
    const results = useMemo(() => {
        let filtered = ALL_FUNDS;
        if (selectedManager !== "All") {
            filtered = filtered.filter(f => f.manager === selectedManager);
        }
        return [...filtered].sort((a, b) => b.rate - a.rate);
    }, [ALL_FUNDS, selectedManager]);

    return (
        <div className="min-h-screen bg-[#050816] text-white font-sans p-4 md:p-8 selection:bg-purple-500/30">
            <div className="max-w-7xl mx-auto space-y-8">

                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center font-bold text-lg shadow-lg">📈</div>
                        <h1 className="text-2xl font-bold tracking-tight">LT <span className="text-emerald-400">Yield</span> Calculator</h1>
                    </div>

                    <div className="flex items-center gap-4 bg-[#0f1221] p-1.5 rounded-full border border-[#2a2e45]">
                        <div className="px-4 py-1 text-right">
                            <span className="block text-[10px] text-gray-500 uppercase tracking-wider font-bold">Invest Amount (LKR)</span>
                            <input
                                type="text"
                                value={amount.toLocaleString('en-LK')}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/,/g, '');
                                    if (!isNaN(val) && val !== '') {
                                        setAmount(Number(val));
                                    } else if (val === '') {
                                        setAmount(0);
                                    }
                                }}
                                className="bg-transparent text-white font-bold text-lg w-40 text-right outline-none placeholder-gray-600"
                            />
                        </div>
                        <button className="bg-gradient-to-r from-emerald-600 to-green-500 px-6 py-2 rounded-full font-semibold text-sm shadow-lg hover:shadow-emerald-500/25 transition-all">
                            Calculate
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Categorize by Manager
                        </h2>
                        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-900/20 px-3 py-1 rounded-full border border-amber-500/30">
                            <Info className="w-3 h-3" />
                            <span>Based on 2025 Historical Returns</span>
                        </div>
                    </div>

                    <div className="flex bg-[#0f1221] p-1.5 rounded-2xl border border-[#2a2e45] gap-2 items-center max-w-sm relative">
                         <select
                            value={selectedManager}
                            onChange={(e) => setSelectedManager(e.target.value)}
                            className="w-full bg-transparent text-white px-4 py-2 outline-none cursor-pointer appearance-none font-medium z-10"
                        >
                            {MANAGERS.map((manager, idx) => (
                                <option key={idx} value={manager} className="bg-[#0f1221] text-white py-1">
                                    {manager === "All" ? "🌍 All Fund Managers" : manager}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 text-gray-400 pointer-events-none">▼</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.map((fund, i) => {
                        const annualReturn = amount * (fund.rate / 100);
                        const monthlyReturn = annualReturn / 12;
                        const isTop = i === 0 && selectedManager === 'All';

                        return (
                        <GlowingCard
                            key={i}
                            special={isTop}
                            className={isTop ? "border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]" : ""}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold 
                      ${isTop
                                                ? 'bg-gradient-to-br from-emerald-400 to-green-600 text-black'
                                                : 'bg-[#1f243a] text-gray-400'}
                    `}>
                                            {fund.manager.substring(0, 2).toUpperCase()}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-lg leading-tight w-48 break-words ${isTop ? 'text-emerald-400' : 'text-white'}`}>
                                            {fund.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20 max-w-[120px] truncate" title={fund.manager}>
                                                {fund.manager}
                                            </span>
                                            <span className="text-xs text-purple-300 bg-purple-500/10 border-purple-500/20 px-2 py-0.5 rounded border">
                                                {fund.type}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1 mb-6">
                                <StatRow label="2025 Return" value={`${fund.rate.toFixed(2)}%`} highlight={isTop} />
                                <StatRow label="Est. Annual Income" value={formatCurrency(annualReturn)} highlight />
                                <StatRow label="Est. Monthly Income" value={formatCurrency(monthlyReturn)} highlight />
                            </div>

                        </GlowingCard>
                        )
                    })}
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-900/20 border border-blue-500/20 text-blue-200 text-sm">
                    <Info className="w-5 h-5 text-blue-400 shrink-0" />
                    <p>
                        <strong>Disclaimer:</strong> Returns are based on historical 2025 performance data. Past performance does not guarantee future results. High Growth funds' monthly income may vary significantly.
                    </p>
                </div>

            </div>
        </div>
    );
}

