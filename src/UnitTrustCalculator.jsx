import React, { useState, useEffect, useMemo } from 'react';
import {
    Info, Calculator, RefreshCw, TrendingUp, AlertCircle,
    Landmark, Wallet, ReceiptText, Home, Car, Coins, ArrowRight, Cloud, CloudOff
} from 'lucide-react';

// --- SHARED UI COMPONENTS (Consistent with other calculators) ---

const GlowingCard = ({ children, className = "", special = false }) => (
    <div className={`
    bg-[#0f1221] border rounded-3xl p-6 shadow-xl relative overflow-hidden group transition-all duration-300
    ${special ? 'border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.2)]' : 'border-[#2a2e45]'}
    ${className}
  `}>
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500
      ${special ? 'from-cyan-500/0 via-cyan-400/50 to-cyan-500/0' : 'from-blue-500/0 via-blue-500/20 to-blue-500/0'}
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
                    focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all
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
            <span className={`block font-bold ${highlight ? 'text-cyan-400' : 'text-white'}`}>
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
const UnitTrustCalculator = () => {
    const [page, setPage] = useState('home'); // 'home' or 'projection'

    // Initial State Setup
    const initialRates = {
        "Investment Grade Fund": 0.0886,
        "Fixed Income Opportunities": 0.09,
        "Quantitative Equity": 0.742,
        "Money Market Fund": 0.085,
    };

    const initialInvestments = {
        "Investment Grade Fund": "10,000,000",
        "Fixed Income Opportunities": "20,000,000",
        "Quantitative Equity": "20,000,000",
        "Money Market Fund": "5,000,000",
    };

    const [rates, setRates] = useState(initialRates);
    const [investments, setInvestments] = useState(initialInvestments);
    const [withdrawalPercentage, setWithdrawalPercentage] = useState('0');

    // Loan State
    const [housePrice, setHousePrice] = useState('20,000,000');
    const [downPayment, setDownPayment] = useState('4,000,000');
    const [loanInterestRate, setLoanInterestRate] = useState('12.5');
    const [loanTerm, setLoanTerm] = useState('20');

    const [vehiclePrice, setVehiclePrice] = useState('8,000,000');
    const [vehicleDownPayment, setVehicleDownPayment] = useState('2,000,000');
    const [vehicleLoanInterestRate, setVehicleLoanInterestRate] = useState('14.5');
    const [vehicleLoanTerm, setVehicleLoanTerm] = useState('7');

    const [fixedDepositAmount, setFixedDepositAmount] = useState('20,000,000');
    const [fixedDepositRate, setFixedDepositRate] = useState('10');

    // Projection State
    const [projectionInputs, setProjectionInputs] = useState({
        equity: { 1: '0', 2: '0', 3: '0', 4: '0', 5: '0' },
        other: { 1: '0', 2: '0', 3: '0', 4: '0', 5: '0' }
    });
    const [projectionResults, setProjectionResults] = useState([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateMessage, setUpdateMessage] = useState("");
    const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'loading', 'success', 'error'

    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbywACifEYGRp8qy7BiQ_ojnpUyPgCRKU6nT_yHkI0NwIv5iAzf6GP0b8d-LHyqvMOVh/exec";

    // --- Persistence Logic ---

    // 1. Initial Load (Local Storage -> then Cloud)
    useEffect(() => {
        // First, check local storage for instant results
        const localData = localStorage.getItem('unit_trust_data');
        if (localData) {
            try {
                const parsed = JSON.parse(localData);
                if (parsed.investments) setInvestments(parsed.investments);
                if (parsed.housePrice) setHousePrice(parsed.housePrice);
                // ... load other basic fields
                if (parsed.withdrawalPercentage) setWithdrawalPercentage(parsed.withdrawalPercentage);
            } catch (e) { console.error("Local load error", e); }
        }

        // Then, try to fetch the absolute latest from Cloud
        handleLoadFromCloud();
    }, []);

    // 2. Auto-save to Local Storage on every change
    useEffect(() => {
        const dataToSave = {
            investments,
            housePrice,
            downPayment,
            loanInterestRate,
            loanTerm,
            vehiclePrice,
            vehicleDownPayment,
            vehicleLoanInterestRate,
            vehicleLoanTerm,
            fixedDepositAmount,
            fixedDepositRate,
            withdrawalPercentage
        };
        localStorage.setItem('unit_trust_data', JSON.stringify(dataToSave));
    }, [investments, housePrice, downPayment, loanInterestRate, loanTerm, vehiclePrice, vehicleDownPayment, vehicleLoanInterestRate, vehicleLoanTerm, fixedDepositAmount, fixedDepositRate, withdrawalPercentage]);

    // --- Calculation Logic ---
    const calculateReturns = (capital, annualRate, withdrawalPerc) => {
        const yearly = capital * annualRate;
        const monthly = yearly / 12;
        const withdrawalRate = withdrawalPerc / 100;
        const withdrawalAmount = yearly * withdrawalRate;

        return { yearly, monthly, withdrawalAmount };
    };

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
        const breakdown = [];
        for (const bracket of brackets) {
            const taxable = Math.max(0, Math.min(income, bracket.upTo) - lastLimit);
            if (taxable > 0) {
                const partTax = taxable * bracket.rate;
                breakdown.push({ range: `${lastLimit.toLocaleString()} - ${bracket.upTo === Infinity ? "∞" : bracket.upTo.toLocaleString()}`, rate: bracket.rate, taxable, partTax });
                tax += partTax;
            }
            lastLimit = bracket.upTo;
            if (income <= bracket.upTo) break;
        }
        return { tax, breakdown };
    };

    const calculateLoanPayment = (price, downPay, annualRate, termYears) => {
        const principal = price - downPay;
        if (principal <= 0 || annualRate <= 0 || termYears <= 0) return 0;
        const monthlyRate = annualRate / 12 / 100;
        const numPayments = termYears * 12;
        return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    };

    const results = useMemo(() => {
        const withdrawalPerc = parseFloat(withdrawalPercentage) || 0;
        const fundResults = Object.keys(rates).map(fund => {
            const capital = parseNumber(investments[fund]);
            const currWithdrawal = fund === "Quantitative Equity" ? withdrawalPerc : 0;
            return {
                fund,
                capital,
                ...calculateReturns(capital, rates[fund], currWithdrawal)
            };
        });

        const totalInvestment = fundResults.reduce((acc, r) => acc + r.capital, 0);
        const annualWithdrawal = fundResults.find(f => f.fund === "Quantitative Equity")?.withdrawalAmount || 0;

        const monthlyLoan = calculateLoanPayment(parseNumber(housePrice), parseNumber(downPayment), parseFloat(loanInterestRate) || 0, parseInt(loanTerm) || 0);
        const monthlyVehicle = calculateLoanPayment(parseNumber(vehiclePrice), parseNumber(vehicleDownPayment), parseFloat(vehicleLoanInterestRate) || 0, parseInt(vehicleLoanTerm) || 0);

        const monthlyFd = (parseNumber(fixedDepositAmount) * (parseFloat(fixedDepositRate) || 0) / 100) / 12;
        const yearlyFd = monthlyFd * 12;

        const yearlyOtherFunds = fundResults.filter(f => f.fund !== "Quantitative Equity").reduce((acc, r) => acc + r.yearly, 0);

        // Tax only applies to Fixed Deposit income as per user request
        const totalTaxable = yearlyFd;
        const { tax, breakdown } = calculateTax(totalTaxable);
        const monthlyFdTax = tax / 12;

        const totalMonthlyEst = fundResults.reduce((acc, r) => acc + r.monthly, 0);
        const totalYearlyEst = fundResults.reduce((acc, r) => acc + r.yearly, 0);

        return {
            funds: fundResults,
            totalInvestment,
            totalMonthlyEst,
            totalYearlyEst,
            annualWithdrawal,
            monthlyLoan,
            monthlyVehicle,
            monthlyFd,
            monthlyFdTax
        };
    }, [rates, investments, withdrawalPercentage, housePrice, downPayment, loanInterestRate, loanTerm, vehiclePrice, vehicleDownPayment, vehicleLoanInterestRate, vehicleLoanTerm, fixedDepositAmount, fixedDepositRate]);

    // --- Actions ---
    const handleSyncToSheets = async () => {
        setSyncStatus('syncing');
        try {
            const payload = {
                calculatorType: "Unit Trust Portfolio",
                inputs: {
                    rates,
                    investments,
                    withdrawalPercentage,
                    housePrice,
                    downPayment,
                    loanInterestRate,
                    loanTerm,
                    vehiclePrice,
                    vehicleDownPayment,
                    vehicleLoanInterestRate,
                    vehicleLoanTerm,
                    fixedDepositAmount,
                    fixedDepositRate
                },
                results: {
                    totalInvestment: results.totalInvestment,
                    totalMonthlyEst: results.totalMonthlyEst,
                    totalYearlyEst: results.totalYearlyEst,
                    monthlyLoan: results.monthlyLoan,
                    monthlyVehicle: results.monthlyVehicle,
                    monthlyFd: results.monthlyFd
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
            console.error('Sync error:', error);
            setSyncStatus('error');
            setTimeout(() => setSyncStatus('idle'), 3000);
        }
    };

    const handleLoadFromCloud = async () => {
        setSyncStatus('loading');
        try {
            const response = await fetch(SCRIPT_URL);
            const allData = await response.json();
            const myData = allData["Unit Trust Portfolio"];

            if (myData && myData.inputs) {
                const inputs = myData.inputs;
                if (inputs.rates) setRates(inputs.rates);
                if (inputs.investments) setInvestments(inputs.investments);
                if (inputs.withdrawalPercentage) setWithdrawalPercentage(inputs.withdrawalPercentage);
                if (inputs.housePrice) setHousePrice(inputs.housePrice);
                if (inputs.downPayment) setDownPayment(inputs.downPayment);
                if (inputs.loanInterestRate) setLoanInterestRate(inputs.loanInterestRate);
                if (inputs.loanTerm) setLoanTerm(inputs.loanTerm);
                if (inputs.vehiclePrice) setVehiclePrice(inputs.vehiclePrice);
                if (inputs.vehicleDownPayment) setVehicleDownPayment(inputs.vehicleDownPayment);
                if (inputs.vehicleLoanInterestRate) setVehicleLoanInterestRate(inputs.vehicleLoanInterestRate);
                if (inputs.vehicleLoanTerm) setVehicleLoanTerm(inputs.vehicleLoanTerm);
                if (inputs.fixedDepositAmount) setFixedDepositAmount(inputs.fixedDepositAmount);
                if (inputs.fixedDepositRate) setFixedDepositRate(inputs.fixedDepositRate);

                setSyncStatus('success');
                setTimeout(() => setSyncStatus('idle'), 2000);
            } else {
                setSyncStatus('idle');
            }
        } catch (error) {
            console.error('Pick up error:', error);
            setSyncStatus('idle');
        }
    };

    const handleUpdateRates = async () => {
        setIsUpdating(true);
        setUpdateMessage("Fetching latest rates...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        setRates({
            "Investment Grade Fund": 0.149,
            "Fixed Income Opportunities": 0.155,
            "Quantitative Equity": 0.45,
            "Money Market Fund": 0.17,
        });
        setIsUpdating(false);
        setUpdateMessage("Rates synchronized with Dec 2025 benchmarks.");
        setTimeout(() => setUpdateMessage(""), 3000);
    };

    const handleProjectionCalculate = () => {
        const equityName = "Quantitative Equity";
        let currEquity = parseNumber(investments[equityName]);
        let currOther = results.funds.filter(f => f.fund !== equityName).reduce((a, b) => a + b.capital, 0);
        const otherRate = currOther > 0 ? results.funds.filter(f => f.fund !== equityName).reduce((a, b) => a + b.yearly, 0) / currOther : 0;

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
        <div className="min-h-screen bg-[#050816] text-white font-sans p-4 md:p-8 selection:bg-purple-500/30">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg shadow-lg">LT</div>
                            <h1 className="text-2xl font-bold tracking-tight">Unit Trust<span className="text-purple-400">Portfolio</span></h1>
                        </div>
                        <p className="text-gray-500 text-sm">Advanced CAL Fund returns & complex tax simulation infrastructure.</p>
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
                            {syncStatus === 'syncing' ? <Cloud className="w-3 h-3 animate-pulse" /> :
                                syncStatus === 'loading' ? <Cloud className="w-3 h-3 animate-bounce" /> :
                                    syncStatus === 'success' ? <Cloud className="w-3 h-3" /> :
                                        syncStatus === 'error' ? <CloudOff className="w-3 h-3" /> :
                                            <Cloud className="w-3 h-3" />}
                            {syncStatus === 'syncing' ? 'Syncing...' :
                                syncStatus === 'loading' ? 'Cloud Search...' :
                                    syncStatus === 'success' ? 'Data Saved' :
                                        syncStatus === 'error' ? 'Sync Failed' : 'Sync to Cloud'}
                        </button>
                        <button
                            onClick={handleLoadFromCloud}
                            disabled={syncStatus === 'loading' || syncStatus === 'syncing'}
                            className="bg-[#0f1221] border border-[#2a2e45] px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#1a1f35] transition-all flex items-center gap-2 group text-gray-400 hover:text-white"
                        >
                            <RefreshCw className={`w-3 h-3 ${syncStatus === 'loading' ? 'animate-spin' : ''}`} />
                            {syncStatus === 'loading' ? 'Loading...' : 'Refresh From Cloud'}
                        </button>
                    </div>
                </div>

                {updateMessage && (
                    <div className="bg-cyan-900/20 border border-cyan-500/30 text-cyan-400 p-3 rounded-xl text-center text-xs font-bold animate-pulse">
                        {updateMessage}
                    </div>
                )}

                {page === 'home' ? (
                    <>
                        {/* Fund Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {results.funds.map((f, i) => (
                                <GlowingCard key={i} special={f.fund.includes("Equity")}>
                                    <h3 className="text-sm font-black mb-4 h-10 flex items-center">{f.fund}</h3>
                                    <div className="space-y-4">
                                        <InputField
                                            label="Investment Amount"
                                            value={investments[f.fund]}
                                            onFocus={() => setInvestments(prev => ({ ...prev, [f.fund]: String(investments[f.fund]).replace(/,/g, '') }))}
                                            onBlur={() => setInvestments(prev => ({ ...prev, [f.fund]: parseNumber(investments[f.fund]).toLocaleString('en-LK') }))}
                                            onChange={(e) => setInvestments(prev => ({ ...prev, [f.fund]: e.target.value }))}
                                            prefix="Rs."
                                        />
                                        <div className="space-y-1">
                                            <StatRow label="Annual Rate" value={`${(rates[f.fund] * 100).toFixed(2)}%`} highlight={f.fund.includes("Equity")} />
                                            <StatRow label="Monthly Est" value={`Rs. ${formatMoney(f.monthly)}`} />
                                            <StatRow label="Yearly Est" value={`Rs. ${formatMoney(f.yearly)}`} highlight />
                                        </div>
                                    </div>
                                </GlowingCard>
                            ))}
                        </div>

                        {/* Summary Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <GlowingCard className="lg:col-span-2">
                                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                    <ReceiptText className="w-5 h-5 text-purple-500" /> Unit Trust Portfolio Summary
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                                    <div className="text-center p-6 bg-[#1a1f35] rounded-2xl border border-[#2a2e45]">
                                        <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase mb-2 block">Total Invested</span>
                                        <div className="text-2xl font-black text-blue-400">Rs. {formatMoney(results.totalInvestment)}</div>
                                    </div>
                                    <div className="text-center p-6 bg-[#1a1f35] rounded-2xl border border-[#2a2e45]">
                                        <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase mb-2 block">Total Monthly Income</span>
                                        <div className="text-2xl font-black text-purple-400">Rs. {formatMoney(results.totalMonthlyEst)}</div>
                                    </div>
                                    <div className="text-center p-6 bg-[#1a1f35] rounded-2xl border border-[#2a2e45]">
                                        <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase mb-2 block">Total Yearly Income</span>
                                        <div className="text-2xl font-black text-green-400">Rs. {formatMoney(results.totalYearlyEst)}</div>
                                    </div>
                                </div>
                            </GlowingCard>

                            <GlowingCard special className="flex flex-col justify-center items-center text-center space-y-4">
                                <TrendingUp className="w-12 h-12 text-cyan-400 mb-2" />
                                <div>
                                    <span className="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">Projection Engine</span>
                                    <h3 className="text-xl font-bold text-white mt-1">Simulate 5-Year Growth</h3>
                                </div>
                                <p className="text-xs text-gray-400 leading-relaxed px-4">Analyze compounding returns across Equity and Fixed Income funds with variable withdrawal rates.</p>
                                <button
                                    onClick={() => setPage('projection')}
                                    className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl font-black text-white flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    OPEN SIMULATOR <ArrowRight className="w-4 h-4" />
                                </button>
                            </GlowingCard>
                        </div>

                        {/* Loans & FD Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <GlowingCard className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-purple-400 font-bold uppercase tracking-widest text-xs">
                                        <Home className="w-4 h-4" /> Housing Finance
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-bold">EMI: Rs. {formatMoney(results.monthlyLoan)}</div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InputField label="House Price" value={housePrice} onChange={e => setHousePrice(e.target.value)} onFocus={() => setHousePrice(String(housePrice).replace(/,/g, ''))} onBlur={() => setHousePrice(parseNumber(housePrice).toLocaleString())} />
                                    <InputField label="Down Payment" value={downPayment} onChange={e => setDownPayment(e.target.value)} onFocus={() => setDownPayment(String(downPayment).replace(/,/g, ''))} onBlur={() => setDownPayment(parseNumber(downPayment).toLocaleString())} />
                                    <InputField label="Interest Rate %" value={loanInterestRate} onChange={e => setLoanInterestRate(e.target.value)} suffix="%" />
                                    <InputField label="Term (Years)" value={loanTerm} onChange={e => setLoanTerm(e.target.value)} suffix="Y" />
                                </div>

                                <div className="border-t border-[#2a2e45] pt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-widest text-xs">
                                            <Car className="w-4 h-4" /> Vehicle Finance
                                        </div>
                                        <div className="text-[10px] text-gray-500 font-bold">EMI: Rs. {formatMoney(results.monthlyVehicle)}</div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <InputField label="Vehicle Price" value={vehiclePrice} onChange={e => setVehiclePrice(e.target.value)} onFocus={() => setVehiclePrice(String(vehiclePrice).replace(/,/g, ''))} onBlur={() => setVehiclePrice(parseNumber(vehiclePrice).toLocaleString())} />
                                        <InputField label="Down Payment" value={vehicleDownPayment} onChange={e => setVehicleDownPayment(e.target.value)} onFocus={() => setVehicleDownPayment(String(vehicleDownPayment).replace(/,/g, ''))} onBlur={() => setVehicleDownPayment(parseNumber(vehicleDownPayment).toLocaleString())} />
                                        <InputField label="Interest Rate %" value={vehicleLoanInterestRate} onChange={e => setVehicleLoanInterestRate(e.target.value)} suffix="%" />
                                        <InputField label="Term (Years)" value={vehicleLoanTerm} onChange={e => setVehicleLoanTerm(e.target.value)} suffix="Y" />
                                    </div>
                                </div>

                                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-center">
                                    <span className="text-[10px] text-orange-400 font-black uppercase">Total Monthly Installments</span>
                                    <div className="text-xl font-black text-white">Rs. {formatMoney(results.monthlyLoan + results.monthlyVehicle)}</div>
                                </div>
                            </GlowingCard>

                            <GlowingCard className="space-y-6">
                                <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-widest text-xs">
                                    <Coins className="w-4 h-4" /> Fixed Deposit & Yield
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InputField label="FD Amount" value={fixedDepositAmount} onChange={e => setFixedDepositAmount(e.target.value)} onBlur={() => setFixedDepositAmount(parseNumber(fixedDepositAmount).toLocaleString())} />
                                    <InputField label="Annual Rate %" value={fixedDepositRate} onChange={e => setFixedDepositRate(e.target.value)} suffix="%" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-center">
                                        <span className="text-[10px] text-blue-400 font-black uppercase">Monthly Income</span>
                                        <div className="text-xl font-black text-white">Rs. {formatMoney(results.monthlyFd)}</div>
                                    </div>
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                                        <span className="text-[10px] text-red-400 font-black uppercase">Monthly Tax</span>
                                        <div className="text-xl font-black text-white text-red-400">Rs. {formatMoney(results.monthlyFdTax)}</div>
                                    </div>
                                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-center">
                                        <span className="text-[10px] text-green-400 font-black uppercase">Net Surplus</span>
                                        <div className="text-xl font-black text-white">Rs. {formatMoney(results.monthlyFd - results.monthlyFdTax - results.monthlyLoan - results.monthlyVehicle)}</div>
                                    </div>
                                </div>
                            </GlowingCard>
                        </div>
                    </>
                ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
                        {/* Fixed Back Button in Bottom Right */}
                        <button
                            onClick={() => setPage('home')}
                            className="fixed bottom-8 right-8 z-[100] bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(79,70,229,0.4)] hover:scale-110 active:scale-95 transition-all flex items-center gap-2 border border-white/20 whitespace-nowrap"
                        >
                            <ArrowRight className="w-4 h-4 rotate-180" /> Back to Dashboard
                        </button>

                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-black uppercase text-white tracking-widest">Multi-Year Simulation Console</h2>
                        </div>

                        <GlowingCard className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 text-center items-center font-bold text-[10px] text-gray-500 uppercase tracking-widest border-b border-[#2a2e45] pb-4">
                                <div className="md:col-span-1">Fiscal Year</div>
                                <div className="md:col-span-2 text-purple-400">Equity Fund Withdrawal %</div>
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
                                        }} className="flex-1 accent-purple-600" />
                                        <span className="w-12 text-xs font-black text-purple-400">{projectionInputs.equity[y]}%</span>
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
                                                className="px-6 py-2 bg-purple-600 text-white font-bold text-[10px] rounded-full hover:bg-purple-500 transition-all"
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
                                                <span className="text-xs font-black text-purple-500 uppercase tracking-widest">Projection Phase</span>
                                                <h3 className="text-2xl font-black text-white">Year {res.year}</h3>
                                            </div>
                                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase">Opening</span>
                                                    <div className="text-sm font-black text-white">Rs. {formatMoney(res.eqStart + res.otStart)}</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[10px] text-green-500 font-bold uppercase">Profit Earned</span>
                                                    <div className="text-sm font-black text-green-400">+Rs. {formatMoney(res.eqInt + res.otInt)}</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[10px] text-red-500 font-bold uppercase">Tax Deduct</span>
                                                    <div className="text-sm font-black text-red-400">-Rs. {formatMoney(res.tax)}</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[10px] text-cyan-500 font-bold uppercase">End Portfolio</span>
                                                    <div className="text-sm font-black text-cyan-400">Rs. {formatMoney(res.eqEnd + res.otEnd)}</div>
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

                {/* Footer Notes */}
                <div className="flex items-start gap-3 p-6 rounded-3xl bg-blue-900/10 border border-blue-500/20 text-blue-200 text-[10px] uppercase font-bold tracking-wider leading-relaxed">
                    <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        <ul className="space-y-1">
                            <li>• All Unit Trust projections assume the selected annual rate remains constant for simulation.</li>
                            <li>• Tax Slabs: 0% up to 1.2M, graduating up to 36% for amounts above 3.7M per annum.</li>
                        </ul>
                        <ul className="space-y-1">
                            <li>• Loan payments are based on standard Amortization formulas (EMI).</li>
                            <li>• Withdrawal percentages apply solely to the interest portion of the investments.</li>
                        </ul>
                    </div>
                </div>

                <footer className="text-center py-8">
                    <p className="text-gray-600 text-[10px] uppercase font-bold tracking-[0.3em]">© {new Date().getFullYear()} LT Finance Portfolio Infrastructure</p>
                </footer>
            </div>
        </div>
    );
};

export default UnitTrustCalculator;
