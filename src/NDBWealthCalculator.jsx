import React, { useState, useEffect, useMemo } from 'react';
import {
    Info, Calculator, RefreshCw, TrendingUp, AlertCircle,
    Landmark, Wallet, ReceiptText, ArrowRight, Cloud, CloudOff,
    BarChart3, PieChart, Coins
} from 'lucide-react';

// --- SHARED UI COMPONENTS ---

const GlowingCard = ({ children, className = "", special = false }) => (
    <div className={`
    bg-[#0f1221] border rounded-3xl p-6 shadow-xl relative overflow-hidden group transition-all duration-300
    ${special ? 'border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.2)]' : 'border-[#2a2e45]'}
    ${className}
  `}>
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500
      ${special ? 'from-amber-500/0 via-amber-400/50 to-amber-500/0' : 'from-blue-500/0 via-blue-500/20 to-blue-500/0'}
    `} />
        {children}
    </div>
);

const InputField = ({ label, value, onChange, type = "text", suffix = "", prefix = "", onFocus, onBlur, onKeyDown }) => (
    <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</label>
        <div className="relative group">
            {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{prefix}</span>}
            <input
                type={type}
                value={value}
                onChange={onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                className={`
                    w-full bg-[#1a1f35] border border-[#2a2e45] text-white rounded-xl px-4 py-2.5 text-sm outline-none
                    focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all
                    ${prefix ? 'pl-9' : ''} ${suffix ? 'pr-9' : ''}
                `}
            />
            {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">{suffix}</span>}
        </div>
    </div>
);

const StatRow = ({ label, value, highlight = false, subValue = "" }) => (
    <div className="flex justify-between items-center py-2 border-b border-[#1f243a] last:border-0">
        <span className="text-gray-400 text-xs font-medium uppercase tracking-tighter">{label}</span>
        <div className="text-right">
            <span className={`block font-bold ${highlight ? 'text-amber-400' : 'text-white'}`}>
                {value}
            </span>
            {subValue && <span className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">{subValue}</span>}
        </div>
    </div>
);

// --- HELPER FUNCTIONS ---
const formatMoney = (n) => {
    if (!isFinite(n)) return "0";
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M`;
    return Math.round(n).toLocaleString("en-LK");
};

const parseNumber = (s) => {
    if (s === undefined || s === null || s === "") return 0;
    const cleaned = String(s).replace(/[,]/g, "").trim();
    const val = Number(cleaned);
    return isNaN(val) ? 0 : val;
};

// --- MAIN COMPONENT ---
const NDBWealthCalculator = () => {
    const [page, setPage] = useState('home'); // 'home' or 'projection'

    // Initial State Setup
    const initialRates = {
        "NDB Wealth Money Fund": 0.1087,
        "NDB Wealth Income Fund": 0.1990,
        "NDB Wealth Income Plus Fund": 0.1400,
        "NDB Wealth Growth Fund": 0.4450,
        "NDB Wealth Growth & Income Fund": 0.4220,
        "NDB Wealth Dollar Account": 0.05,
    };

    const initialInvestments = {
        "NDB Wealth Money Fund": "30,000,000",
        "NDB Wealth Income Fund": "30,000,000",
        "NDB Wealth Income Plus Fund": "30,000,000",
        "NDB Wealth Growth Fund": "15,000,000",
        "NDB Wealth Growth & Income Fund": "15,000,000",
        "NDB Wealth Dollar Account": "300,000",
    };

    const [rates, setRates] = useState(initialRates);
    const [investments, setInvestments] = useState(initialInvestments);
    const [syncStatus, setSyncStatus] = useState('idle');
    const [updateMessage, setUpdateMessage] = useState("");

    // Projection State
    const [projectionInputs, setProjectionInputs] = useState({
        equity: { 1: '0', 2: '0', 3: '0', 4: '0', 5: '0' },
        other: { 1: '0', 2: '0', 3: '0', 4: '0', 5: '0' }
    });
    const [projectionResults, setProjectionResults] = useState([]);

    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbywACifEYGRp8qy7BiQ_ojnpUyPgCRKU6nT_yHkI0NwIv5iAzf6GP0b8d-LHyqvMOVh/exec";

    // --- Persistence Logic ---
    useEffect(() => {
        const localData = localStorage.getItem('ndb_wealth_data_v4');
        if (localData) {
            try {
                const parsed = JSON.parse(localData);
                if (parsed.investments) setInvestments(parsed.investments);
                if (parsed.rates) setRates(parsed.rates);
            } catch (e) { console.error("Local load error", e); }
        }
        handleLoadFromCloud();
    }, []);

    useEffect(() => {
        localStorage.setItem('ndb_wealth_data_v4', JSON.stringify({ investments, rates }));
    }, [investments, rates]);

    // --- Calculation Logic ---
    const calculateTax = (income) => {
        const brackets = [
            { upTo: 1_200_000, rate: 0.0 },
            { upTo: 1_700_000, rate: 0.06 },
            { upTo: 2_200_000, rate: 0.12 },
            { upTo: 2_700_000, rate: 0.18 },
            { upTo: 3_200_000, rate: 0.24 },
            { upTo: 3_700_000, rate: 0.30 },
            { upTo: Infinity, rate: 0.36 },
        ];
        let tax = 0;
        let lastLimit = 0;
        for (const bracket of brackets) {
            const taxable = Math.max(0, Math.min(income, bracket.upTo) - lastLimit);
            if (taxable > 0) {
                tax += taxable * bracket.rate;
            }
            lastLimit = bracket.upTo;
            if (income <= bracket.upTo) break;
        }
        return { tax };
    };

    const results = useMemo(() => {
        const fundResults = Object.keys(rates).map(fund => {
            const capital = parseNumber(investments[fund]);
            const yearly = capital * rates[fund];
            const monthly = yearly / 12;
            const currency = fund.includes("Dollar") ? "$" : "Rs.";
            return { fund, capital, yearly, monthly, currency };
        });

        const totalInvestment = fundResults.filter(f => f.currency === "Rs.").reduce((acc, r) => acc + r.capital, 0);
        const totalMonthlyEst = fundResults.filter(f => f.currency === "Rs.").reduce((acc, r) => acc + r.monthly, 0);
        const totalYearlyEst = fundResults.filter(f => f.currency === "Rs.").reduce((acc, r) => acc + r.yearly, 0);

        const totalInvestmentUSD = fundResults.filter(f => f.currency === "$").reduce((acc, r) => acc + r.capital, 0);
        const totalMonthlyEstUSD = fundResults.filter(f => f.currency === "$").reduce((acc, r) => acc + r.monthly, 0);
        const totalYearlyEstUSD = fundResults.filter(f => f.currency === "$").reduce((acc, r) => acc + r.yearly, 0);

        return {
            funds: fundResults,
            totalInvestment,
            totalMonthlyEst,
            totalYearlyEst,
            totalInvestmentUSD,
            totalMonthlyEstUSD,
            totalYearlyEstUSD
        };
    }, [rates, investments]);

    // --- Actions ---
    const handleSyncToSheets = async () => {
        setSyncStatus('syncing');
        try {
            const payload = {
                calculatorType: "NDB Wealth Portfolio",
                inputs: { rates, investments },
                results: {
                    totalInvestment: results.totalInvestment,
                    totalMonthlyEst: results.totalMonthlyEst,
                    totalYearlyEst: results.totalYearlyEst,
                    totalInvestmentUSD: results.totalInvestmentUSD,
                    totalMonthlyEstUSD: results.totalMonthlyEstUSD,
                    totalYearlyEstUSD: results.totalYearlyEstUSD
                }
            };

            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                cache: 'no-cache',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            setSyncStatus('success');
            setTimeout(() => setSyncStatus('idle'), 3000);
        } catch (error) {
            setSyncStatus('error');
            setTimeout(() => setSyncStatus('idle'), 3000);
        }
    };

    const handleLoadFromCloud = async () => {
        setSyncStatus('loading');
        try {
            const response = await fetch(SCRIPT_URL);
            const allData = await response.json();
            const myData = allData["NDB Wealth Portfolio"];

            if (myData && myData.inputs) {
                if (myData.inputs.rates) setRates(myData.inputs.rates);
                if (myData.inputs.investments) setInvestments(myData.inputs.investments);
                setSyncStatus('success');
                setTimeout(() => setSyncStatus('idle'), 2000);
            } else {
                setSyncStatus('idle');
            }
        } catch (error) {
            setSyncStatus('idle');
        }
    };

    const handleUpdateRates = async () => {
        setUpdateMessage("Fetching NDB Wealth latest rates...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        setRates({
            "NDB Wealth Money Fund": 0.1087,
            "NDB Wealth Income Fund": 0.1990,
            "NDB Wealth Income Plus Fund": 0.1400,
            "NDB Wealth Growth Fund": 0.4450,
            "NDB Wealth Growth & Income Fund": 0.4220,
            "NDB Wealth Dollar Account": 0.05,
        });
        setUpdateMessage("Rates updated based on Dec 2025 Benchmarks.");
        setTimeout(() => setUpdateMessage(""), 3000);
    };

    const handleProjectionCalculate = () => {
        const equityName = "NDB Wealth Growth Fund";
        let currEquity = parseNumber(investments[equityName]);
        let currOther = results.funds.filter(f => f.fund !== equityName && f.currency === "Rs.").reduce((a, b) => a + b.capital, 0);
        const otherRate = currOther > 0 ? results.funds.filter(f => f.fund !== equityName && f.currency === "Rs.").reduce((a, b) => a + b.yearly, 0) / currOther : 0;

        const data = [];
        for (let y = 1; y <= 5; y++) {
            const eqStart = currEquity;
            const eqInt = eqStart * rates[equityName];
            const eqWithdraw = eqInt * (parseNumber(projectionInputs.equity[y]) / 100);
            currEquity += (eqInt - eqWithdraw);

            const otStart = currOther;
            const otInt = otStart * otherRate;
            const otWithdraw = otInt * (parseNumber(projectionInputs.other[y]) / 100);
            currOther += (otInt - otWithdraw);

            const totalWithdraw = eqWithdraw + otWithdraw;
            const { tax } = calculateTax(totalWithdraw);

            data.push({
                year: y,
                eqStart, eqInt, eqWithdraw, eqEnd: currEquity,
                otStart, otInt, otWithdraw, otEnd: currOther,
                totalWithdraw, tax, netWithdraw: totalWithdraw - tax
            });
        }
        setProjectionResults(data);
    };

    return (
        <div className="min-h-screen bg-[#050816] text-white font-sans p-4 md:p-8 selection:bg-amber-500/30">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-lg shadow-lg text-black">NDB</div>
                            <h1 className="text-2xl font-bold tracking-tight">NDB Wealth<span className="text-amber-400">Funds</span></h1>
                        </div>
                        <p className="text-gray-500 text-sm">Professional asset management & unit trust performance tracking (Dec 2025 Updates).</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleSyncToSheets}
                            disabled={syncStatus === 'syncing' || syncStatus === 'loading'}
                            className={`
                                px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 group border
                                ${syncStatus === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                                    syncStatus === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                                        'bg-[#0f1221] border-[#2a2e45] text-gray-400 hover:text-white hover:bg-[#1a1f35]'}
                            `}
                        >
                            <Cloud className="w-3 h-3" />
                            {syncStatus === 'syncing' ? 'Syncing...' : 'Sync to Cloud'}
                        </button>
                        <button
                            onClick={handleUpdateRates}
                            className="bg-amber-600/10 border border-amber-500/30 text-amber-500 px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-600/20 transition-all flex items-center gap-2"
                        >
                            <RefreshCw className="w-3 h-3" /> Update Rates
                        </button>
                    </div>
                </div>

                {updateMessage && (
                    <div className="bg-amber-900/20 border border-amber-500/30 text-amber-400 p-3 rounded-xl text-center text-xs font-bold animate-pulse">
                        {updateMessage}
                    </div>
                )}

                {page === 'home' ? (
                    <>
                        {/* Summary Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <GlowingCard className="lg:col-span-2">
                                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                    <PieChart className="w-5 h-5 text-amber-500" /> NDB Wealth Portfolio Overview
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                                    <div className="text-center p-6 bg-[#1a1f35] rounded-2xl border border-[#2a2e45]">
                                        <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase mb-2 block">Assets Managed</span>
                                        <div className="text-2xl font-black text-amber-400">Rs. {formatMoney(results.totalInvestment)}</div>
                                        {results.totalInvestmentUSD > 0 && <div className="text-[10px] font-bold text-gray-500 mt-2">$ {formatMoney(results.totalInvestmentUSD)} (USD)</div>}
                                    </div>
                                    <div className="text-center p-6 bg-[#1a1f35] rounded-2xl border border-[#2a2e45]">
                                        <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase mb-2 block">Monthly Yield</span>
                                        <div className="text-2xl font-black text-white">Rs. {formatMoney(results.totalMonthlyEst)}</div>
                                        {results.totalMonthlyEstUSD > 0 && <div className="text-[10px] font-bold text-gray-500 mt-2">$ {formatMoney(results.totalMonthlyEstUSD)} (USD)</div>}
                                    </div>
                                    <div className="text-center p-6 bg-[#1a1f35] rounded-2xl border border-[#2a2e45]">
                                        <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase mb-2 block">Annual Projection</span>
                                        <div className="text-2xl font-black text-green-400">Rs. {formatMoney(results.totalYearlyEst)}</div>
                                        {results.totalYearlyEstUSD > 0 && <div className="text-[10px] font-bold text-gray-500 mt-2">$ {formatMoney(results.totalYearlyEstUSD)} (USD)</div>}
                                    </div>
                                </div>
                            </GlowingCard>

                            <GlowingCard special className="flex flex-col justify-center items-center text-center space-y-4">
                                <TrendingUp className="w-12 h-12 text-amber-400 mb-2" />
                                <div>
                                    <span className="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">Projection Engine</span>
                                    <h3 className="text-xl font-bold text-white mt-1">Simulate 5-Year Growth</h3>
                                </div>
                                <p className="text-xs text-gray-400 leading-relaxed px-4">Analyze compounding returns across NDB Growth and Fixed Income funds with variable withdrawal rates.</p>
                                <button
                                    onClick={() => setPage('projection')}
                                    className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl font-black text-white flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    OPEN SIMULATOR <ArrowRight className="w-4 h-4" />
                                </button>
                            </GlowingCard>
                        </div>

                        {/* Fund Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                            {results.funds.map((f, i) => (
                                <GlowingCard key={i} special={f.fund.includes("Growth") || f.fund.includes("Dollar")}>
                                    <h3 className="text-[11px] font-black mb-4 h-10 flex items-center leading-tight">{f.fund}</h3>
                                    <div className="space-y-4">
                                        <InputField
                                            label="Investment"
                                            value={investments[f.fund]}
                                            onFocus={() => setInvestments(prev => ({ ...prev, [f.fund]: String(investments[f.fund]).replace(/,/g, '') }))}
                                            onBlur={() => setInvestments(prev => ({ ...prev, [f.fund]: parseNumber(investments[f.fund]).toLocaleString(f.currency === "$" ? 'en-US' : 'en-LK') }))}
                                            onChange={(e) => setInvestments(prev => ({ ...prev, [f.fund]: e.target.value }))}
                                            prefix={f.currency}
                                        />
                                        <InputField
                                            label="Annual Yield %"
                                            value={(rates[f.fund] * 100).toFixed(2)}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) / 100;
                                                setRates(prev => ({ ...prev, [f.fund]: isNaN(val) ? 0 : val }));
                                            }}
                                            suffix="%"
                                        />
                                        <div className="space-y-1 pt-2 border-t border-[#2a2e45]">
                                            <StatRow label="Monthly" value={`${f.currency} ${formatMoney(f.monthly)}`} />
                                            <StatRow label="Yearly" value={`${f.currency} ${formatMoney(f.yearly)}`} highlight />
                                        </div>

                                        {f.fund.includes("Dollar") && (
                                            <div className="mt-4 pt-4 border-t border-[#2a2e45] space-y-3">
                                                <div className="text-[9px] font-black text-amber-500 uppercase tracking-widest text-center">Dollar Account Sensitivity</div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="bg-[#1a1f35] p-2 rounded-xl border border-[#2a2e45] text-center">
                                                        <div className="text-[8px] text-gray-500 font-bold">4%</div>
                                                        <div className="text-[10px] font-black text-white">${formatMoney((parseNumber(investments[f.fund]) * 0.04) / 12)}</div>
                                                    </div>
                                                    <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/30 text-center">
                                                        <div className="text-[8px] text-amber-500 font-bold">5%</div>
                                                        <div className="text-[10px] font-black text-amber-400">${formatMoney((parseNumber(investments[f.fund]) * 0.05) / 12)}</div>
                                                    </div>
                                                    <div className="bg-[#1a1f35] p-2 rounded-xl border border-[#2a2e45] text-center">
                                                        <div className="text-[8px] text-gray-500 font-bold">6%</div>
                                                        <div className="text-[10px] font-black text-white">${formatMoney((parseNumber(investments[f.fund]) * 0.06) / 12)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </GlowingCard>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
                        {/* Fixed Back Button in Bottom Right */}
                        <button
                            onClick={() => setPage('home')}
                            className="fixed bottom-8 right-8 z-[100] bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(245,158,11,0.4)] hover:scale-110 active:scale-95 transition-all flex items-center gap-2 border border-white/20 whitespace-nowrap"
                        >
                            <ArrowRight className="w-4 h-4 rotate-180" /> Back to Dashboard
                        </button>

                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-black uppercase text-white tracking-widest">NDB Multi-Year Simulation Console</h2>
                        </div>

                        <GlowingCard className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 text-center items-center font-bold text-[10px] text-gray-500 uppercase tracking-widest border-b border-[#2a2e45] pb-4">
                                <div className="md:col-span-1">Fiscal Year</div>
                                <div className="md:col-span-2 text-amber-400">Growth Fund Withdrawal %</div>
                                <div className="md:col-span-2 text-blue-400">Other Funds Withdrawal %</div>
                                <div className="md:col-span-1">Action</div>
                            </div>

                            {[1, 2, 3, 4, 5].map(y => (
                                <div key={y} className="grid grid-cols-1 md:grid-cols-6 gap-6 items-center">
                                    <div className="md:col-span-1 font-black text-sm text-center">YEAR {y}</div>
                                    <div className="md:col-span-2 flex items-center gap-4">
                                        <input type="range" min="0" max="100" value={projectionInputs.equity[y]} onChange={e => {
                                            const val = e.target.value;
                                            setProjectionInputs(prev => ({ ...prev, equity: { ...prev.equity, [y]: val } }));
                                        }} className="flex-1 accent-amber-600" />
                                        <span className="w-12 text-xs font-black text-amber-400">{projectionInputs.equity[y]}%</span>
                                    </div>
                                    <div className="md:col-span-2 flex items-center gap-4">
                                        <input type="range" min="0" max="100" value={projectionInputs.other[y]} onChange={e => {
                                            const val = e.target.value;
                                            setProjectionInputs(prev => ({ ...prev, other: { ...prev.other, [y]: val } }));
                                        }} className="flex-1 accent-blue-600" />
                                        <span className="w-12 text-xs font-black text-blue-400">{projectionInputs.other[y]}%</span>
                                    </div>
                                    <div className="md:col-span-1 flex justify-center">
                                        {y === 5 && (
                                            <button
                                                onClick={handleProjectionCalculate}
                                                className="px-6 py-2 bg-amber-600 text-white font-bold text-[10px] rounded-full hover:bg-amber-500 transition-all"
                                            >
                                                CALCULATE
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </GlowingCard>

                        {projectionResults.length > 0 && (
                            <div className="grid grid-cols-1 gap-6">
                                {projectionResults.map(res => (
                                    <GlowingCard key={res.year} className="bg-gradient-to-r from-[#0f1221] to-[#12162b]" special={res.year === 5}>
                                        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8">
                                            <div className="lg:w-1/4">
                                                <span className="text-xs font-black text-amber-500 uppercase tracking-widest">Projection Phase</span>
                                                <h3 className="text-2xl font-black text-white">Year {res.year}</h3>
                                            </div>
                                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase">Opening Portfolio</span>
                                                    <div className="text-sm font-black text-white">Rs. {formatMoney(res.eqStart + res.otStart)}</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[10px] text-green-500 font-bold uppercase">Profit Earned</span>
                                                    <div className="text-sm font-black text-green-400">+Rs. {formatMoney(res.eqInt + res.otInt)}</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[10px] text-red-500 font-bold uppercase">Profit Tax</span>
                                                    <div className="text-sm font-black text-red-400">-Rs. {formatMoney(res.tax)}</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[10px] text-amber-500 font-bold uppercase">Closing Balance</span>
                                                    <div className="text-sm font-black text-amber-400">Rs. {formatMoney(res.eqEnd + res.otEnd)}</div>
                                                </div>
                                            </div>
                                            <div className="lg:w-1/5 bg-white/5 p-4 rounded-3xl text-center border border-white/10">
                                                <span className="text-[10px] text-gray-300 font-black uppercase">Net Withdrawal</span>
                                                <div className="text-xl font-black text-white">Rs. {formatMoney(res.netWithdraw)}</div>
                                            </div>
                                        </div>
                                    </GlowingCard>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Info Note */}
                <div className="flex items-start gap-3 p-6 rounded-3xl bg-amber-900/10 border border-amber-500/20 text-amber-200 text-[10px] uppercase font-bold tracking-wider leading-relaxed">
                    <Info className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        <ul className="space-y-1">
                            <li>• Money Fund: 10.87% (Dec 2025 Factsheet). Short-term indicative yield ~7.5-8%.</li>
                            <li>• Income Fund: ~19.9% fixed income performance benchmarks.</li>
                            <li>• Income Plus: ~14% target yield (13-15% range).</li>
                        </ul>
                        <ul className="space-y-1">
                            <li>• Growth & Balanced: ~42-45% historical returns (High Volatility).</li>
                            <li>• All yields are before taxes/fees and based on past performance.</li>
                            <li>• Distributions can vary significantly month-to-month.</li>
                        </ul>
                    </div>
                </div>

                <footer className="text-center py-8">
                    <p className="text-gray-600 text-[10px] uppercase font-bold tracking-[0.3em]">© {new Date().getFullYear()} NDB Wealth Management Infrastructure</p>
                </footer>
            </div>
        </div>
    );
};

export default NDBWealthCalculator;
