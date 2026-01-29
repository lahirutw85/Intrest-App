import React, { useState, useMemo } from 'react';
import { ArrowRight, Info, Zap, Cloud, CloudOff } from 'lucide-react';

// --- UPDATED DATA SOURCE (Softlogic + Previous Data) ---
const BANK_RATES = {
    maturity: [
        { name: "Softlogic Finance", rate: 10.02, tenure: "1 Year", type: "Finance Co", badge: "Market Leader 🚀", recommended: true, special: true }, // NEW LEADER
        { name: "People's Leasing (PLC)", rate: 9.50, tenure: "1 Year", type: "Finance Co", badge: "Solid High Yield" },
        { name: "MBSL Bank", rate: 8.75, tenure: "1 Year", type: "Finance Co", badge: "High Yield" },
        { name: "LB Finance", rate: 8.75, tenure: "1 Year", type: "Finance Co" },
        { name: "Vallibel Finance", rate: 8.50, tenure: "1 Year", type: "Finance Co" },
        { name: "NDB Bank", rate: 8.25, tenure: "1 Year", type: "Private Bank" },
        { name: "Cargills Bank", rate: 8.00, tenure: "1 Year", type: "Private Bank" },
        { name: "Union Bank", rate: 8.00, tenure: "1 Year", type: "Private Bank" },
        { name: "Commercial Bank", rate: 8.00, tenure: "1 Year", type: "Private Bank" },
        { name: "LOLC Finance", rate: 8.00, tenure: "1 Year", type: "Finance Co" },
        { name: "HNB", rate: 7.70, tenure: "1 Year", type: "Private Bank" },
        { name: "Seylan Bank", rate: 7.50, tenure: "1 Year", type: "Private Bank" },
        { name: "People's Bank", rate: 7.25, tenure: "1 Year", type: "State Bank", badge: "State Leader" },
        { name: "NSB", rate: 6.75, tenure: "1 Year", type: "State Bank" },
        { name: "BOC", rate: 6.75, tenure: "1 Year", type: "State Bank" },
    ],
    monthly: [
        { name: "Softlogic (Senior)", rate: 12.50, tenure: "5 Years", type: "Finance Co", badge: "Age 60+ Only", recommended: true, special: true },
        { name: "Softlogic Finance", rate: 12.00, tenure: "5 Years", type: "Finance Co", badge: "Max Monthly Yield", recommended: true },
        { name: "NSB (Senior Citizen)", rate: 11.32, tenure: "1 Year", type: "State Bank", badge: "Govt Backed (60+)", special: true },
        { name: "Softlogic Finance", rate: 9.54, tenure: "1 Year", type: "Finance Co", badge: "Best 1Y Monthly", recommended: true },
        { name: "LB Finance", rate: 10.25, tenure: "5 Years", type: "Finance Co", badge: "Long Term" },
        { name: "MBSL", rate: 10.00, tenure: "5 Years", type: "Finance Co", badge: "Long Term" },
        { name: "MBSL", rate: 8.25, tenure: "1 Year", type: "Finance Co", badge: "High Yield" },
        { name: "Seylan Bank", rate: 7.00, tenure: "1 Year", type: "Private Bank" },
        { name: "NSB", rate: 6.50, tenure: "1 Year", type: "State Bank" },
        { name: "People's Bank", rate: 6.50, tenure: "1 Year", type: "State Bank" },
    ]
};

// --- COMPONENTS ---

const GlowingCard = ({ children, className = "", special = false }) => (
    <div className={`
    bg-[#0f1221] border rounded-3xl p-6 shadow-xl relative overflow-hidden group transition-all duration-300
    ${special ? 'border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.2)]' : 'border-[#2a2e45]'}
    ${className}
  `}>
        {/* Subtle gradient glow effect on hover */}
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500
      ${special ? 'from-cyan-500/0 via-cyan-400/50 to-cyan-500/0' : 'from-blue-500/0 via-blue-500/20 to-blue-500/0'}
    `} />
        {children}
    </div>
);

const GradientButton = ({ children, onClick, active }) => (
    <button
        onClick={onClick}
        className={`
      px-6 py-2.5 rounded-full font-medium transition-all duration-300 text-sm tracking-wide
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

// --- MAIN APP ---

export default function FluidoFDRates() {
    const [amount, setAmount] = useState(1000000);
    const [mode, setMode] = useState("maturity"); // 'maturity' or 'monthly'
    const [syncStatus, setSyncStatus] = useState('idle');

    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbywACifEYGRp8qy7BiQ_ojnpUyPgCRKU6nT_yHkI0NwIv5iAzf6GP0b8d-LHyqvMOVh/exec";

    const formatCurrency = (val) =>
        new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(val);

    const results = useMemo(() => {
        const list = mode === 'maturity' ? BANK_RATES.maturity : BANK_RATES.monthly;
        return list.map(bank => {
            const interest = mode === 'maturity'
                ? amount * (bank.rate / 100)
                : (amount * (bank.rate / 100)) / 12;
            return { ...bank, returnVal: interest };
        }).sort((a, b) => b.returnVal - a.returnVal);
    }, [amount, mode]);

    const handleSyncToSheets = async () => {
        setSyncStatus('syncing');
        try {
            const payload = {
                calculatorType: "Yield Comparison",
                inputs: {
                    amount,
                    mode
                },
                results: results.slice(0, 5).map(b => ({ name: b.name, rate: b.rate, returns: b.returnVal }))
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
            console.error('Sync error:', error);
            setSyncStatus('error');
            setTimeout(() => setSyncStatus('idle'), 3000);
        }
    };

    return (
        <div className="min-h-screen bg-[#050816] text-white font-sans p-4 md:p-8 selection:bg-purple-500/30">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header / Top Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg shadow-lg">LT</div>
                        <h1 className="text-2xl font-bold tracking-tight">LT <span className="text-purple-400">Yield</span> Calculator</h1>
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
                        <button className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2 rounded-full font-semibold text-sm shadow-lg hover:shadow-purple-500/25 transition-all">
                            Calculate
                        </button>
                    </div>
                </div>

                {/* Filters / Vault Select */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span> Select Payout Mode
                        </h2>
                        {/* New Feature Highlight */}
                        <div className="flex items-center gap-2 text-xs text-cyan-400 bg-cyan-900/20 px-3 py-1 rounded-full border border-cyan-500/30">
                            <Zap className="w-3 h-3" />
                            <span>New: Softlogic Rates Added (Dec 2025)</span>
                        </div>
                    </div>

                    <div className="flex bg-[#0f1221] p-1.5 rounded-2xl border border-[#2a2e45] gap-2 items-center">
                        <div className="inline-flex gap-2">
                            <GradientButton
                                active={mode === 'maturity'}
                                onClick={() => setMode('maturity')}
                            >
                                Yearly (At Maturity)
                            </GradientButton>
                            <GradientButton
                                active={mode === 'monthly'}
                                onClick={() => setMode('monthly')}
                            >
                                Monthly Income
                            </GradientButton>
                        </div>
                        <div className="h-8 w-px bg-[#2a2e45] mx-2 hidden sm:block"></div>
                        <button
                            onClick={handleSyncToSheets}
                            disabled={syncStatus === 'syncing'}
                            className={`
                                px-4 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 group border
                                ${syncStatus === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                                    syncStatus === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                                        'bg-[#1a1f35] border-[#2a2e45] text-gray-400 hover:text-white hover:bg-[#252a40]'}
                            `}
                        >
                            {syncStatus === 'syncing' ? <Cloud className="w-3.5 h-3.5 animate-pulse" /> :
                                syncStatus === 'success' ? <Cloud className="w-3.5 h-3.5" /> :
                                    syncStatus === 'error' ? <CloudOff className="w-3.5 h-3.5" /> :
                                        <Cloud className="w-3.5 h-3.5" />}
                            {syncStatus === 'syncing' ? 'Saving...' :
                                syncStatus === 'success' ? 'Saved' :
                                    syncStatus === 'error' ? 'Error' : 'Sync Cloud'}
                        </button>
                    </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.map((bank, i) => (
                        <GlowingCard
                            key={i}
                            special={bank.special}
                            className={bank.recommended && !bank.special ? "border-purple-500/50 shadow-[0_0_30px_rgba(124,58,237,0.1)]" : ""}
                        >

                            {/* Card Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    {/* Icon Placeholder */}
                                    <div className="relative">
                                        <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold 
                      ${bank.special
                                                ? 'bg-gradient-to-br from-cyan-400 to-blue-600 text-black'
                                                : bank.recommended
                                                    ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                                                    : 'bg-[#1f243a] text-gray-400'}
                    `}>
                                            {bank.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        {bank.recommended && (
                                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0f1221] ${bank.special ? 'bg-white' : 'bg-yellow-400'}`} />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-lg leading-tight ${bank.special ? 'text-cyan-400' : 'text-white'}`}>
                                            {bank.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20">
                                                {bank.type}
                                            </span>
                                            {bank.badge && (
                                                <span className={`text-xs px-2 py-0.5 rounded border flex items-center gap-1
                           ${bank.special
                                                        ? 'text-cyan-300 bg-cyan-400/10 border-cyan-400/20'
                                                        : 'text-purple-300 bg-purple-500/10 border-purple-500/20'}
                         `}>
                                                    {bank.special ? '🚀 ' : '✨ '} {bank.badge}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Circular indicator */}
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${bank.recommended ? 'border-yellow-400 text-yellow-400' : 'border-gray-600 text-gray-600'}`}>
                                    <span className="text-[10px]">$</span>
                                </div>
                            </div>

                            {/* Stats Section */}
                            <div className="space-y-1 mb-6">
                                <StatRow label="Annual Rate" value={`${bank.rate.toFixed(2)}%`} highlight={bank.special} />
                                <StatRow label="Tenure Lock" value={bank.tenure} />
                                <StatRow
                                    label={mode === 'maturity' ? 'Total Return' : 'Monthly Income'}
                                    value={formatCurrency(bank.returnVal)}
                                    highlight
                                />
                                <StatRow label="Liquidation Threshold" value="92%" />
                            </div>

                            {/* Action Button */}
                            <button className={`
                w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 group border
                ${bank.special
                                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
                                    : 'bg-[#1a1f35] border-[#2a2e45] text-white hover:bg-[#252a40] hover:border-purple-500/30'}
              `}>
                                Create Position
                                <ArrowRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform ${bank.special ? 'text-cyan-400' : 'text-purple-400'}`} />
                            </button>

                        </GlowingCard>
                    ))}
                </div>

                {/* Footnote */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-900/20 border border-blue-500/20 text-blue-200 text-sm">
                    <Info className="w-5 h-5 text-blue-400 shrink-0" />
                    <p>
                        <strong>Updated Dec 2025:</strong>
                        {mode === 'maturity'
                            ? " Softlogic Finance has set a new benchmark with 10.02% for 1-Year deposits, surpassing People's Leasing (9.50%)."
                            : " Softlogic Finance now offers the highest monthly income rates: 9.54% for 1-Year and up to 12.00% for 5-Year tenures."
                        }
                    </p>
                </div>

            </div>
        </div>
    );
}
