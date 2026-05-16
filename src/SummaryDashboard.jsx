import React, { useState, useEffect, useMemo } from 'react';
import { 
    ReceiptText, TrendingUp, PieChart, Coins, Info 
} from 'lucide-react';

const GlowingCard = ({ children, className = "", special = false, specialColor = "blue" }) => {
    let borderColor = 'border-[#2a2e45]';
    let shadow = '';
    let gradient = 'from-blue-500/0 via-blue-500/20 to-blue-500/0';

    if (special) {
        if (specialColor === 'cyan') {
            borderColor = 'border-cyan-500/50';
            shadow = 'shadow-[0_0_40px_rgba(6,182,212,0.2)]';
            gradient = 'from-cyan-500/0 via-cyan-400/50 to-cyan-500/0';
        } else if (specialColor === 'amber') {
            borderColor = 'border-amber-500/50';
            shadow = 'shadow-[0_0_40px_rgba(245,158,11,0.2)]';
            gradient = 'from-amber-500/0 via-amber-400/50 to-amber-500/0';
        } else if (specialColor === 'emerald') {
            borderColor = 'border-emerald-500/50';
            shadow = 'shadow-[0_0_40px_rgba(16,185,129,0.2)]';
            gradient = 'from-emerald-500/0 via-emerald-400/50 to-emerald-500/0';
        } else if (specialColor === 'purple') {
            borderColor = 'border-purple-500/50';
            shadow = 'shadow-[0_0_40px_rgba(168,85,247,0.2)]';
            gradient = 'from-purple-500/0 via-purple-400/50 to-purple-500/0';
        } else {
            borderColor = 'border-blue-500/50';
            shadow = 'shadow-[0_0_40px_rgba(59,130,246,0.2)]';
        }
    }

    return (
        <div className={`bg-[#0f1221] border rounded-3xl p-6 shadow-xl relative overflow-hidden group transition-all duration-300 ${borderColor} ${shadow} ${className}`}>
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient}`} />
            {children}
        </div>
    );
};

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

const calculateTax = (income) => {
    const brackets = [
        { upTo: 1_800_000, rate: 0.0 },
        { upTo: 2_300_000, rate: 0.06 },
        { upTo: 2_800_000, rate: 0.12 },
        { upTo: 3_300_000, rate: 0.18 },
        { upTo: 3_800_000, rate: 0.24 },
        { upTo: 4_300_000, rate: 0.30 },
        { upTo: Infinity, rate: 0.36 },
    ];
    let tax = 0;
    let lastLimit = 0;
    for (const bracket of brackets) {
        const taxable = Math.max(0, Math.min(income, bracket.upTo) - lastLimit);
        if (taxable > 0) tax += taxable * bracket.rate;
        lastLimit = bracket.upTo;
        if (income <= bracket.upTo) break;
    }
    return tax;
};

export default function SummaryDashboard() {
    const [utData, setUtData] = useState(null);
    const [ndbData, setNdbData] = useState(null);

    const [uaeData, setUaeData] = useState({
        amount: 2000000,
        rate: 5.5
    });
    const [mashreqData, setMashreqData] = useState({
        amount: 5000000,
        rate: 6.25
    });

    const [selectedTotals, setSelectedTotals] = useState({
        unitTrust: true,
        ndbWealth: true,
        fixedDeposit: true,
    });
    const [withdrawalPercentage, setWithdrawalPercentage] = useState(0);

    useEffect(() => {
        const ut = localStorage.getItem('unit_trust_data_v3');
        if (ut) setUtData(JSON.parse(ut));
        
        const ndb = localStorage.getItem('ndb_wealth_data_v6');
        if (ndb) setNdbData(JSON.parse(ndb));
    }, []);

    // Helper calculation for UT
    const utResults = useMemo(() => {
        if (!utData) return null;
        const { rates = {}, investments = {}, withdrawalPercentage = '0', housePrice = '0', downPayment = '0', loanInterestRate = '0', loanTerm = '0', vehiclePrice = '0', vehicleDownPayment = '0', vehicleLoanInterestRate = '0', vehicleLoanTerm = '0', fixedDepositAmount = '0', fixedDepositRate = '0' } = utData;

        const withdrawalPerc = parseFloat(withdrawalPercentage) || 0;
        const fundResults = Object.keys(rates).map(fund => {
            const capital = parseNumber(investments[fund] || "0");
            const currWithdrawal = fund === "Quantitative Equity" ? withdrawalPerc : 0;
            const yearly = capital * rates[fund];
            const monthly = yearly / 12;
            const withdrawalAmount = yearly * (currWithdrawal / 100);
            return { fund, capital, yearly, monthly, withdrawalAmount };
        });

        const totalInvestment = fundResults.reduce((acc, r) => acc + r.capital, 0);
        const totalMonthlyEst = fundResults.reduce((acc, r) => acc + r.monthly, 0);
        const totalYearlyEst = fundResults.reduce((acc, r) => acc + r.yearly, 0);

        const monthlyFd = (parseNumber(fixedDepositAmount) * (parseFloat(fixedDepositRate) || 0) / 100) / 12;
        const yearlyFd = monthlyFd * 12;
        const fdPrincipal = parseNumber(fixedDepositAmount);

        const monthlyFdTax = calculateTax(yearlyFd) / 12;

        const calculateLoanPayment = (price, downPay, annualRate, termYears) => {
            const principal = price - downPay;
            if (principal <= 0 || annualRate <= 0 || termYears <= 0) return 0;
            const monthlyRate = annualRate / 12 / 100;
            const numPayments = termYears * 12;
            return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
        };

        const monthlyLoan = calculateLoanPayment(parseNumber(housePrice), parseNumber(downPayment), parseFloat(loanInterestRate) || 0, parseInt(loanTerm) || 0);
        const monthlyVehicle = calculateLoanPayment(parseNumber(vehiclePrice), parseNumber(vehicleDownPayment), parseFloat(vehicleLoanInterestRate) || 0, parseInt(vehicleLoanTerm) || 0);

        return {
            totalInvestment, totalMonthlyEst, totalYearlyEst,
            fdPrincipal, monthlyFd, monthlyFdTax,
            monthlyLoan, monthlyVehicle
        };
    }, [utData]);

    // Helper calculation for NDB
    const ndbResults = useMemo(() => {
        if (!ndbData) return null;
        const { rates = {}, investments = {} } = ndbData;

        const fundResults = Object.keys(rates).map(fund => {
            const capital = parseNumber(investments[fund] || "0");
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
            totalInvestment, totalMonthlyEst, totalYearlyEst,
            totalInvestmentUSD, totalMonthlyEstUSD, totalYearlyEstUSD
        };
    }, [ndbData]);

    const grandTotalMonthly = useMemo(() => {
        let total = 0;
        if (selectedTotals.unitTrust && utResults) total += utResults.totalMonthlyEst;
        if (selectedTotals.ndbWealth && ndbResults) total += ndbResults.totalMonthlyEst;
        if (selectedTotals.fixedDeposit && utResults) total += utResults.monthlyFd;
        return total;
    }, [selectedTotals, utResults, ndbResults]);

    const grandTotalYearly = useMemo(() => {
        let total = 0;
        if (selectedTotals.unitTrust && utResults) total += utResults.totalYearlyEst;
        if (selectedTotals.ndbWealth && ndbResults) total += ndbResults.totalYearlyEst;
        if (selectedTotals.fixedDeposit && utResults) total += (utResults.monthlyFd * 12);
        return total;
    }, [selectedTotals, utResults, ndbResults]);

    const grandTotalPrincipal = useMemo(() => {
        let total = 0;
        if (selectedTotals.unitTrust && utResults) total += utResults.totalInvestment;
        if (selectedTotals.ndbWealth && ndbResults) total += ndbResults.totalInvestment;
        if (selectedTotals.fixedDeposit && utResults) total += utResults.fdPrincipal;
        return total;
    }, [selectedTotals, utResults, ndbResults]);

    const fiveYearProjection = useMemo(() => {
        if (grandTotalPrincipal <= 0) return [];
        const averageYield = grandTotalYearly / grandTotalPrincipal;
        let currentPrincipal = grandTotalPrincipal;
        const projection = [];
        
        for (let year = 1; year <= 5; year++) {
            const profit = currentPrincipal * averageYield;
            
            // Tax is only calculated on the portion that is withdrawn
            const grossWithdrawn = profit * (withdrawalPercentage / 100);
            const tax = calculateTax(grossWithdrawn);
            
            // Net withdrawn amount (in pocket)
            const withdrawnAmount = grossWithdrawn - tax;
            
            // The remainder of the profit is reinvested
            const reinvestedAmount = profit - grossWithdrawn;
            
            const endBalance = currentPrincipal + reinvestedAmount;
            
            projection.push({
                year,
                startBalance: currentPrincipal,
                profit,
                grossWithdrawn,
                tax,
                withdrawnAmount,
                reinvestedAmount,
                endBalance
            });
            currentPrincipal = endBalance; // Reinvesting the remaining net profit
        }
        return projection;
    }, [grandTotalPrincipal, grandTotalYearly, withdrawalPercentage]);

    return (
        <div className="min-h-screen bg-[#050816] text-white font-sans p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg shadow-lg">📊</div>
                    <h1 className="text-2xl font-bold tracking-tight">Consolidated <span className="text-purple-400">Summaries</span></h1>
                </div>

                <div className="mb-8">
                    <GlowingCard special specialColor="purple">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="space-y-4 flex-1 w-full">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <TrendingUp className="w-6 h-6 text-purple-500" /> Customizable Grand Total (LKR)
                                </h2>
                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer bg-[#1a1f35] px-4 py-2 rounded-xl border border-[#2a2e45] hover:bg-[#202640] transition-colors">
                                        <input type="checkbox" checked={selectedTotals.unitTrust} onChange={(e) => setSelectedTotals(prev => ({ ...prev, unitTrust: e.target.checked }))} className="w-4 h-4 accent-purple-500" />
                                        <span className="text-sm font-semibold text-gray-300">Unit Trust Portfolio</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer bg-[#1a1f35] px-4 py-2 rounded-xl border border-[#2a2e45] hover:bg-[#202640] transition-colors">
                                        <input type="checkbox" checked={selectedTotals.ndbWealth} onChange={(e) => setSelectedTotals(prev => ({ ...prev, ndbWealth: e.target.checked }))} className="w-4 h-4 accent-purple-500" />
                                        <span className="text-sm font-semibold text-gray-300">NDB Wealth</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer bg-[#1a1f35] px-4 py-2 rounded-xl border border-[#2a2e45] hover:bg-[#202640] transition-colors">
                                        <input type="checkbox" checked={selectedTotals.fixedDeposit} onChange={(e) => setSelectedTotals(prev => ({ ...prev, fixedDeposit: e.target.checked }))} className="w-4 h-4 accent-purple-500" />
                                        <span className="text-sm font-semibold text-gray-300">Fixed Deposit Income</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div className="flex gap-6 w-full md:w-auto">
                                <div className="text-center p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 flex-1 md:flex-none md:min-w-[180px]">
                                    <span className="text-[10px] text-purple-400 font-black tracking-widest uppercase mb-1 block">Total Monthly</span>
                                    <div className="text-2xl font-black text-white">Rs. {formatMoney(grandTotalMonthly)}</div>
                                </div>
                                <div className="text-center p-4 bg-green-500/10 rounded-2xl border border-green-500/20 flex-1 md:flex-none md:min-w-[180px]">
                                    <span className="text-[10px] text-green-400 font-black tracking-widest uppercase mb-1 block">Total Annual</span>
                                    <div className="text-2xl font-black text-white">Rs. {formatMoney(grandTotalYearly)}</div>
                                </div>
                            </div>
                        </div>
                    </GlowingCard>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Unit Trust Portfolio Summary */}
                    {utResults && (
                        <GlowingCard special specialColor="cyan" className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <ReceiptText className="w-5 h-5 text-purple-500" /> Unit Trust Portfolio Summary
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-[#1a1f35] rounded-2xl border border-[#2a2e45]">
                                        <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase mb-2 block">Total Invested</span>
                                        <div className="text-xl font-black text-blue-400">Rs. {formatMoney(utResults.totalInvestment)}</div>
                                    </div>
                                    <div className="text-center p-4 bg-[#1a1f35] rounded-2xl border border-[#2a2e45]">
                                        <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase mb-2 block">Monthly Income</span>
                                        <div className="text-xl font-black text-purple-400">Rs. {formatMoney(utResults.totalMonthlyEst)}</div>
                                    </div>
                                    <div className="text-center p-4 bg-[#1a1f35] rounded-2xl border border-[#2a2e45]">
                                        <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase mb-2 block">Yearly Income</span>
                                        <div className="text-xl font-black text-green-400">Rs. {formatMoney(utResults.totalYearlyEst)}</div>
                                    </div>
                                </div>
                            </div>
                        </GlowingCard>
                    )}

                    <div className="space-y-8">
                        {/* NDB Wealth Summary */}
                        {ndbResults && (
                            <GlowingCard special specialColor="amber">
                                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                    <PieChart className="w-5 h-5 text-amber-500" /> NDB Wealth Portfolio Overview
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div className="text-center p-4 bg-[#1a1f35] rounded-2xl border border-[#2a2e45]">
                                        <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase mb-2 block">Assets Managed</span>
                                        <div className="text-xl font-black text-amber-400">Rs. {formatMoney(ndbResults.totalInvestment)}</div>
                                        {ndbResults.totalInvestmentUSD > 0 && <div className="text-[10px] font-bold text-gray-500 mt-1">$ {formatMoney(ndbResults.totalInvestmentUSD)}</div>}
                                    </div>
                                    <div className="text-center p-4 bg-[#1a1f35] rounded-2xl border border-[#2a2e45]">
                                        <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase mb-2 block">Monthly Yield</span>
                                        <div className="text-xl font-black text-white">Rs. {formatMoney(ndbResults.totalMonthlyEst)}</div>
                                        {ndbResults.totalMonthlyEstUSD > 0 && <div className="text-[10px] font-bold text-gray-500 mt-1">$ {formatMoney(ndbResults.totalMonthlyEstUSD)}</div>}
                                    </div>
                                    <div className="text-center p-4 bg-[#1a1f35] rounded-2xl border border-[#2a2e45]">
                                        <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase mb-2 block">Annual Proj.</span>
                                        <div className="text-xl font-black text-green-400">Rs. {formatMoney(ndbResults.totalYearlyEst)}</div>
                                        {ndbResults.totalYearlyEstUSD > 0 && <div className="text-[10px] font-bold text-gray-500 mt-1">$ {formatMoney(ndbResults.totalYearlyEstUSD)}</div>}
                                    </div>
                                </div>
                            </GlowingCard>
                        )}

                        {/* Fixed Deposit Summary */}
                        {utResults && (
                            <GlowingCard>
                                <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-widest text-xs mb-6">
                                    <Coins className="w-4 h-4" /> Fixed Deposit & Yield Summary
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-center">
                                        <span className="text-[10px] text-blue-400 font-black uppercase">Monthly Income</span>
                                        <div className="text-xl font-black text-white">Rs. {formatMoney(utResults.monthlyFd)}</div>
                                    </div>
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                                        <span className="text-[10px] text-red-400 font-black uppercase">Monthly Tax</span>
                                        <div className="text-xl font-black text-white text-red-400">Rs. {formatMoney(utResults.monthlyFdTax)}</div>
                                    </div>
                                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-center">
                                        <span className="text-[10px] text-green-400 font-black uppercase">Net Surplus</span>
                                        <div className="text-xl font-black text-white">Rs. {formatMoney(utResults.monthlyFd - utResults.monthlyFdTax - utResults.monthlyLoan - utResults.monthlyVehicle)}</div>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-start gap-3 p-3 rounded-xl bg-[#1a1f35] border border-[#2a2e45] text-gray-400 text-[10px] font-bold">
                                    <Info className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                                    <span>Net Surplus takes into account monthly tax as well as Housing and Vehicle EMI deductions from the Fixed Deposit income.</span>
                                </div>
                            </GlowingCard>
                        )}
                    </div>
                </div>

                {(!utData && !ndbData) && (
                    <div className="text-center p-12 text-gray-500 font-medium">
                        No saved data found. Please visit the individual calculators to generate summaries.
                    </div>
                )}

                {/* UAE Investments Section */}
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
                                        <div className="text-lg font-black text-emerald-400">{formatMoney(uaeData.amount * (uaeData.rate / 100))} AED</div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase mb-1 block">Monthly Interest</span>
                                        <div className="text-lg font-black text-emerald-400">{formatMoney((uaeData.amount * (uaeData.rate / 100)) / 12)} AED</div>
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
                                        <div className="text-lg font-black text-emerald-400">{formatMoney(mashreqData.amount * (mashreqData.rate / 100))} AED</div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase mb-1 block">Monthly Interest</span>
                                        <div className="text-lg font-black text-emerald-400">{formatMoney((mashreqData.amount * (mashreqData.rate / 100)) / 12)} AED</div>
                                    </div>
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
                                <span className="bg-cyan-500/10 text-cyan-400 text-[10px] font-bold px-3 py-1 rounded-full border border-cyan-500/20">{100 - withdrawalPercentage}% REINVESTED</span>
                            </div>
                            
                            <div className="bg-[#1a1f35] p-3 rounded-2xl border border-[#2a2e45] flex items-center gap-4 w-full md:w-auto">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Net Profit Withdrawal</span>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    step="5"
                                    value={withdrawalPercentage} 
                                    onChange={(e) => setWithdrawalPercentage(Number(e.target.value))}
                                    className="w-32 md:w-48 accent-amber-500"
                                />
                                <span className="text-sm font-black text-amber-400 w-12 text-right">{withdrawalPercentage}%</span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-6">
                            {fiveYearProjection.map((res) => (
                                <GlowingCard key={res.year} className="bg-gradient-to-r from-[#0f1221] to-[#12162b]" special={res.year === 5} specialColor="cyan">
                                    <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8">
                                        <div className="lg:w-1/4">
                                            <span className="text-xs font-black text-cyan-500 uppercase tracking-widest">Projection Phase</span>
                                            <h3 className="text-2xl font-black text-white">Year {res.year}</h3>
                                        </div>
                                        <div className="flex-1 grid grid-cols-2 md:grid-cols-6 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-gray-500 font-bold uppercase">Opening</span>
                                                <div className="text-sm font-black text-white">Rs. {formatMoney(res.startBalance)}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-green-500 font-bold uppercase">Total Profit</span>
                                                <div className="text-sm font-black text-green-400">+Rs. {formatMoney(res.profit)}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-purple-500 font-bold uppercase">Taxable Withdraw</span>
                                                <div className="text-sm font-black text-purple-400">Rs. {formatMoney(res.grossWithdrawn)}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-red-500 font-bold uppercase">Tax</span>
                                                <div className="text-sm font-black text-red-400">-Rs. {formatMoney(res.tax)}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-amber-500 font-bold uppercase">Net Withdrawn</span>
                                                <div className="text-sm font-black text-amber-400">-Rs. {formatMoney(res.withdrawnAmount)}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-cyan-500 font-bold uppercase">Closing</span>
                                                <div className="text-sm font-black text-cyan-400">Rs. {formatMoney(res.endBalance)}</div>
                                            </div>
                                        </div>
                                        <div className="lg:w-1/5 bg-white/5 p-4 rounded-3xl text-center border border-white/10">
                                            <span className="text-[10px] text-gray-300 font-black uppercase">Reinvested</span>
                                            <div className="text-xl font-black text-white">+Rs. {formatMoney(res.reinvestedAmount)}</div>
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
