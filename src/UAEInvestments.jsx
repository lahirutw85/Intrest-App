import React, { useState, useMemo, useEffect } from 'react';
import { TrendingUp, RefreshCcw } from 'lucide-react';

const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount || 0);
};

const GlowingCard = ({ children, className = "", special = false, specialColor = "emerald" }) => (
    <div className={`relative group ${className}`}>
        {special && (
            <div className={`absolute -inset-0.5 bg-gradient-to-r from-${specialColor}-500 to-${specialColor}-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse`}></div>
        )}
        <div className="relative bg-[#0f1221] ring-1 ring-white/10 rounded-2xl p-6 sm:p-8 h-full">
            {children}
        </div>
    </div>
);

export default function UAEInvestments() {
    // UAE State
    const [uaeData, setUaeData] = useState({ amount: 153000, rate: 4.85 });
    const [mashreqData, setMashreqData] = useState({ amount: 147000, rate: 4.5 });

    // Multi-year State
    const [withdrawals, setWithdrawals] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

    // Load state from localStorage on mount
    useEffect(() => {
        const uaeStr = localStorage.getItem('uae_data_v1');
        const mashreqStr = localStorage.getItem('mashreq_data_v1');
        const wStr = localStorage.getItem('uae_withdrawals_v1');

        if (uaeStr) setUaeData(JSON.parse(uaeStr));
        if (mashreqStr) setMashreqData(JSON.parse(mashreqStr));
        if (wStr) setWithdrawals(JSON.parse(wStr));
    }, []);

    // Save state to localStorage
    useEffect(() => {
        localStorage.setItem('uae_data_v1', JSON.stringify(uaeData));
        localStorage.setItem('mashreq_data_v1', JSON.stringify(mashreqData));
        localStorage.setItem('uae_withdrawals_v1', JSON.stringify(withdrawals));
    }, [uaeData, mashreqData, withdrawals]);


    // Combined calculations
    const combinedPrincipal = uaeData.amount + mashreqData.amount;
    const uaeAnnual = uaeData.amount * (uaeData.rate / 100);
    const mashreqAnnual = mashreqData.amount * (mashreqData.rate / 100);
    const combinedAnnual = uaeAnnual + mashreqAnnual;
    const averageYield = combinedPrincipal > 0 ? combinedAnnual / combinedPrincipal : 0;

    const fiveYearProjection = useMemo(() => {
        if (combinedPrincipal <= 0) return [];

        const projection = [];
        let currentPrincipal = combinedPrincipal;

        for (let year = 1; year <= 5; year++) {
            const profit = currentPrincipal * averageYield;
            
            // Tax free in UAE
            const wPercent = withdrawals[year] || 0;
            const withdrawnAmount = profit * (wPercent / 100);
            const reinvestedAmount = profit - withdrawnAmount;
            
            const endBalance = currentPrincipal + reinvestedAmount;

            projection.push({
                year,
                startBalance: currentPrincipal,
                profit,
                withdrawnAmount,
                reinvestedAmount,
                endBalance
            });
            
            currentPrincipal = endBalance; 
        }
        return projection;
    }, [combinedPrincipal, combinedAnnual, withdrawals]);

    return (
        <div className="min-h-screen bg-[#050816] text-white font-sans p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                <header className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600 tracking-tight">
                        UAE Portfolio Hub
                    </h1>
                    <p className="text-gray-400 text-lg md:text-xl font-medium tracking-wide">
                        Manage your AED investments, fixed deposits, and projections
                    </p>
                </header>

                <div className="mt-8">
                    <GlowingCard special specialColor="emerald">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-xs mb-6">
                            <TrendingUp className="w-4 h-4" /> UAE Bank Accounts & Fixed Deposits
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            
                            {/* UAE Bank Fixed Deposit */}
                            <div className="bg-[#1a1f35] p-6 rounded-2xl border border-[#2a2e45] space-y-4">
                                <h3 className="font-bold text-white text-lg">UAE Bank Fixed Deposit</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Amount (AED)</label>
                                        <input 
                                            type="number" 
                                            value={uaeData.amount} 
                                            onChange={(e) => setUaeData({...uaeData, amount: Number(e.target.value)})}
                                            className="w-full bg-[#0f1221] border border-[#2a2e45] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Rate (%)</label>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            value={uaeData.rate} 
                                            onChange={(e) => setUaeData({...uaeData, rate: Number(e.target.value)})}
                                            className="w-full bg-[#0f1221] border border-[#2a2e45] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                                        />
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-[#2a2e45] grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase mb-1 block">Annual Interest</span>
                                        <div className="text-lg font-black text-emerald-400">{formatMoney(uaeAnnual)} AED</div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase mb-1 block">Monthly Interest</span>
                                        <div className="text-lg font-black text-emerald-400">{formatMoney(uaeAnnual / 12)} AED</div>
                                    </div>
                                </div>
                            </div>

                            {/* Mashreq Neo Account */}
                            <div className="bg-[#1a1f35] p-6 rounded-2xl border border-[#2a2e45] space-y-4">
                                <h3 className="font-bold text-white text-lg">Mashreq Neo Account</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Amount (AED)</label>
                                        <input 
                                            type="number" 
                                            value={mashreqData.amount} 
                                            onChange={(e) => setMashreqData({...mashreqData, amount: Number(e.target.value)})}
                                            className="w-full bg-[#0f1221] border border-[#2a2e45] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Rate (%)</label>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            value={mashreqData.rate} 
                                            onChange={(e) => setMashreqData({...mashreqData, rate: Number(e.target.value)})}
                                            className="w-full bg-[#0f1221] border border-[#2a2e45] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                                        />
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-[#2a2e45] grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase mb-1 block">Annual Interest</span>
                                        <div className="text-lg font-black text-emerald-400">{formatMoney(mashreqAnnual)} AED</div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase mb-1 block">Monthly Interest</span>
                                        <div className="text-lg font-black text-emerald-400">{formatMoney(mashreqAnnual / 12)} AED</div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Combined UAE Summary */}
                        <div className="mt-8 bg-emerald-900/10 border border-emerald-500/20 p-6 rounded-2xl flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-emerald-500/20 p-3 rounded-xl">
                                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-widest">Total UAE Portfolio</h3>
                                    <div className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Combined Fixed Deposit & Neo Account</div>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                                <div className="bg-[#0f1221] p-4 rounded-xl border border-[#2a2e45] flex-1 text-center sm:text-right px-6">
                                    <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase block mb-1 whitespace-nowrap">Total Principal</span>
                                    <div className="text-xl font-black text-white whitespace-nowrap">{formatMoney(combinedPrincipal)} AED</div>
                                </div>
                                <div className="bg-[#0f1221] p-4 rounded-xl border border-emerald-500/20 flex-1 text-center sm:text-right px-6">
                                    <span className="text-[10px] text-emerald-600 font-black tracking-widest uppercase block mb-1 whitespace-nowrap">Total Annual</span>
                                    <div className="text-xl font-black text-emerald-500 whitespace-nowrap">+{formatMoney(combinedAnnual)} AED</div>
                                </div>
                                <div className="bg-[#0f1221] p-4 rounded-xl border border-emerald-500/40 flex-1 text-center sm:text-right px-6">
                                    <span className="text-[10px] text-emerald-400 font-black tracking-widest uppercase block mb-1 whitespace-nowrap">Total Monthly</span>
                                    <div className="text-xl font-black text-emerald-400 whitespace-nowrap">+{formatMoney(combinedAnnual / 12)} AED</div>
                                </div>
                            </div>
                        </div>
                    </GlowingCard>
                </div>

                {/* 5-Year Projection Section */}
                {fiveYearProjection.length > 0 && (
                    <div className="space-y-6 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl font-black uppercase text-white tracking-widest">Multi-Year Simulation Console</h2>
                                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-500/20">AED CUSTOM WITHDRAWALS</span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-6">
                            {fiveYearProjection.map((res) => (
                                <GlowingCard key={res.year} className="bg-gradient-to-r from-[#0f1221] to-[#12162b]" special={res.year === 5} specialColor="emerald">
                                    <div className="space-y-6">
                                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-[#2a2e45]/50">
                                            <div>
                                                <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Projection Phase</span>
                                                <h3 className="text-3xl font-black text-white">Year {res.year}</h3>
                                            </div>
                                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                                                <div className="bg-[#1a1f35] px-4 py-3 rounded-xl border border-[#2a2e45] flex items-center gap-4 w-full sm:w-auto">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Withdrawal</span>
                                                    <input 
                                                        type="range" 
                                                        min="0" 
                                                        max="100" 
                                                        step="5"
                                                        value={withdrawals[res.year]} 
                                                        onChange={(e) => setWithdrawals({...withdrawals, [res.year]: Number(e.target.value)})}
                                                        className="w-full sm:w-32 md:w-48 accent-emerald-500"
                                                    />
                                                    <span className="text-sm font-black text-emerald-400 w-12 text-right">{withdrawals[res.year]}%</span>
                                                </div>
                                                <div className="bg-white/5 px-6 py-3 rounded-xl border border-white/10 text-center w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:justify-center items-center">
                                                    <span className="text-[10px] text-gray-300 font-black uppercase sm:mb-1">Reinvested</span>
                                                    <div className="text-lg font-black text-white">+{formatMoney(res.reinvestedAmount)} AED</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 pt-2">
                                            <div className="space-y-2">
                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest whitespace-nowrap">Opening</span>
                                                <div className="text-base font-black text-white whitespace-nowrap">{formatMoney(res.startBalance)} AED</div>
                                            </div>
                                            <div className="space-y-2">
                                                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest whitespace-nowrap">Total Profit</span>
                                                <div className="text-base font-black text-emerald-400 whitespace-nowrap">+{formatMoney(res.profit)} AED</div>
                                            </div>
                                            <div className="space-y-2">
                                                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest whitespace-nowrap">Withdrawal</span>
                                                <div className="text-base font-black text-amber-400 whitespace-nowrap">-{formatMoney(res.withdrawnAmount)} AED</div>
                                            </div>
                                            <div className="space-y-2">
                                                <span className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest whitespace-nowrap">Closing</span>
                                                <div className="text-base font-black text-cyan-400 whitespace-nowrap">{formatMoney(res.endBalance)} AED</div>
                                            </div>
                                        </div>
                                    </div>
                                </GlowingCard>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
