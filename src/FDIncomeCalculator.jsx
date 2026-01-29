import React, { useState, useEffect, useMemo } from 'react';
import { Info, Calculator, RefreshCw, Landmark, Wallet, ReceiptText, TrendingUp, AlertCircle, Cloud, CloudOff } from 'lucide-react';

// --- SHARED UI COMPONENTS (Matching Yield Calculator) ---

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

const InputField = ({ label, value, onChange, type = "number", suffix = "", prefix = "" }) => (
    <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</label>
        <div className="relative group">
            {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{prefix}</span>}
            <input
                type={type}
                value={value}
                onChange={onChange}
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

const StatDisplay = ({ label, value, highlight = false, subValue = "" }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-[#1f243a] last:border-0">
        <span className="text-gray-400 text-sm font-medium">{label}</span>
        <div className="text-right">
            <span className={`block font-bold ${highlight ? 'text-cyan-400' : 'text-white'}`}>
                {value}
            </span>
            {subValue && <span className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">{subValue}</span>}
        </div>
    </div>
);

const FDIncomeCalculator = () => {
    // --- State Variables ---
    const [bank1, setBank1] = useState({ currency: 'AED', principal: 1000000, interestRate: 8.5 });
    const [bank2, setBank2] = useState({ currency: 'AED', principal: 1000000, interestRate: 9.5 });
    const [exchangeRate, setExchangeRate] = useState(82);
    const [savingsInterestRate, setSavingsInterestRate] = useState(4.5);
    const [monthlyExpenses, setMonthlyExpenses] = useState(32500);
    const [taxExemption, setTaxExemption] = useState(false);

    const [exchangeRateStatus, setExchangeRateStatus] = useState('');
    const [isCalculated, setIsCalculated] = useState(false);
    const [tableData, setTableData] = useState([]);
    const [syncStatus, setSyncStatus] = useState('idle');

    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbywACifEYGRp8qy7BiQ_ojnpUyPgCRKU6nT_yHkI0NwIv5iAzf6GP0b8d-LHyqvMOVh/exec";

    // --- API Interaction ---
    useEffect(() => {
        const fetchExchangeRate = async () => {
            if (bank1.currency !== 'AED' && bank2.currency !== 'AED') return;
            setExchangeRateStatus('FETCHING CURRENT AED RATE...');
            try {
                const response = await fetch('https://api.frankfurter.app/latest?from=AED&to=LKR');
                if (!response.ok) throw new Error(`API Error: ${response.status}`);
                const data = await response.json();
                if (data && data.rates && data.rates.LKR) {
                    const rate = data.rates.LKR;
                    setExchangeRate(rate);
                    setExchangeRateStatus(`Rate at ${data.date}: 1 AED = ${rate.toFixed(2)} LKR`);
                }
            } catch (error) {
                console.error('Exchange rate fetch error:', error);
                setExchangeRateStatus('FETCH FAILED. MANUAL ENTRY REQ.');
            }
        };
        fetchExchangeRate();
    }, [bank1.currency, bank2.currency]);

    // --- Helper Functions ---
    const formatCurrency = (value) => {
        if (isNaN(value)) return 'Error';
        const absValue = Math.abs(value);
        if (absValue >= 1000000) {
            const millions = value / 1000000;
            const formattedMillions = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(2);
            return formattedMillions + ' M';
        } else {
            return value.toLocaleString('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        }
    };

    const calculateBankDetails = (bank) => {
        let principalInLKR = bank.principal;
        if (bank.currency === 'AED') principalInLKR = bank.principal * exchangeRate;
        const grossMonthlyIncome = (principalInLKR * bank.interestRate / 100) / 12;
        const monthlyTax = taxExemption ? 0 : grossMonthlyIncome * 0.10;
        const netMonthlyIncome = grossMonthlyIncome - monthlyTax;
        return { grossMonthlyIncome, monthlyTax, netMonthlyIncome };
    };

    const bank1Details = useMemo(() => calculateBankDetails(bank1), [bank1, exchangeRate, taxExemption]);
    const bank2Details = useMemo(() => calculateBankDetails(bank2), [bank2, exchangeRate, taxExemption]);

    const handleCalculate = () => {
        const totalNetFDIncome = bank1Details.netMonthlyIncome + bank2Details.netMonthlyIncome;
        const monthlySavingsRate = (savingsInterestRate || 0) / 100 / 12;
        const currentDate = new Date();

        let currentOpeningBalance = 0;
        const newTableData = [];

        for (let i = 0; i < 12; i++) {
            const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
            const monthName = monthDate.toLocaleString('si-LK', { month: 'long', year: 'numeric' });
            const balanceBeforeSavingsInterest = currentOpeningBalance + totalNetFDIncome;
            const savingsInterest = balanceBeforeSavingsInterest > 0 ? balanceBeforeSavingsInterest * monthlySavingsRate : 0;
            const totalIncrease = totalNetFDIncome + savingsInterest;
            const totalCashAvailable = currentOpeningBalance + totalIncrease;
            const tithe = totalIncrease > 0 ? totalIncrease * 0.10 : 0;
            const remainingInHand = totalCashAvailable - monthlyExpenses - tithe;

            newTableData.push({ month: monthName, openingBalance: currentOpeningBalance, netFDIncome: totalNetFDIncome, savingsInterest, totalIncrease, totalCashAvailable, monthlyExpenses: monthlyExpenses, tithe, remainingInHand });
            currentOpeningBalance = remainingInHand;
        }
        setTableData(newTableData);
        setIsCalculated(true);
    };

    const handleSyncToSheets = async () => {
        setSyncStatus('syncing');
        try {
            const payload = {
                calculatorType: "FD Income Projection",
                inputs: {
                    bank1,
                    bank2,
                    exchangeRate,
                    savingsInterestRate,
                    monthlyExpenses,
                    taxExemption
                },
                results: {
                    bank1Net: bank1Details.netMonthlyIncome,
                    bank2Net: bank2Details.netMonthlyIncome,
                    annualSavings: annualTaxSummary?.finalSavings || 0
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

    const handleExpenseChange = (index, value) => {
        const newExpense = parseFloat(value) || 0;
        const updatedData = [...tableData];
        updatedData[index].monthlyExpenses = newExpense;
        let prevRemaining = index === 0 ? 0 : updatedData[index - 1].remainingInHand;
        for (let i = index; i < 12; i++) {
            updatedData[i].openingBalance = i === 0 ? 0 : prevRemaining;
            const monthlySavingsRate = (savingsInterestRate || 0) / 100 / 12;
            const balanceBeforeInterest = updatedData[i].openingBalance + updatedData[i].netFDIncome;
            updatedData[i].savingsInterest = balanceBeforeInterest > 0 ? balanceBeforeInterest * monthlySavingsRate : 0;
            updatedData[i].totalIncrease = updatedData[i].netFDIncome + updatedData[i].savingsInterest;
            updatedData[i].totalCashAvailable = updatedData[i].openingBalance + updatedData[i].totalIncrease;
            updatedData[i].tithe = updatedData[i].totalIncrease > 0 ? updatedData[i].totalIncrease * 0.10 : 0;
            updatedData[i].remainingInHand = updatedData[i].totalCashAvailable - updatedData[i].monthlyExpenses - updatedData[i].tithe;
            prevRemaining = updatedData[i].remainingInHand;
        }
        setTableData(updatedData);
    };

    const annualTaxSummary = useMemo(() => {
        if (tableData.length < 12) return null;
        const totalAnnualGrossFD = (bank1Details.grossMonthlyIncome + bank2Details.grossMonthlyIncome) * 12;
        const totalAnnualSavingsInterest = tableData.reduce((sum, row) => sum + row.savingsInterest, 0);
        const totalAssessableIncome = totalAnnualGrossFD + totalAnnualSavingsInterest;
        const personalRelief = 1800000;
        const taxableIncome = Math.max(0, totalAssessableIncome - personalRelief);
        let tax = 0;
        let remaining = taxableIncome;
        const slabs = [{ limit: 1000000, rate: 0.06 }, { limit: 500000, rate: 0.18 }, { limit: 500000, rate: 0.24 }, { limit: 500000, rate: 0.30 }, { limit: Infinity, rate: 0.36 }];
        for (const slab of slabs) { if (remaining <= 0) break; const amount = Math.min(remaining, slab.limit); tax += amount * slab.rate; remaining -= amount; }
        const totalAITPaid = (bank1Details.monthlyTax + bank2Details.monthlyTax) * 12;
        const netTaxPayable = tax - totalAITPaid;
        const finalSavings = tableData[11].remainingInHand - netTaxPayable;
        return { netTaxPayable, finalSavings };
    }, [tableData, bank1Details, bank2Details]);

    const handleReset = () => { setBank1({ currency: 'AED', principal: 1000000, interestRate: 8.5 }); setBank2({ currency: 'AED', principal: 1000000, interestRate: 9.5 }); setExchangeRate(82); setSavingsInterestRate(4.5); setMonthlyExpenses(32500); setTaxExemption(false); setIsCalculated(false); setTableData([]); };

    return (
        <div className="min-h-screen bg-[#050816] text-white font-sans p-4 md:p-8 selection:bg-purple-500/30">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center md:text-left">
                    <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg shadow-[0_0_20px_rgba(79,70,229,0.3)]">LT</div>
                        <h1 className="text-2xl font-bold tracking-tight">LT <span className="text-purple-400">Income</span> Calculator</h1>
                    </div>
                    <p className="text-gray-500 text-sm max-w-2xl">LKR income estimation after AIT Tax, Savings Interest, and Tithe deductions by LT Finance.</p>
                </div>

                {/* Configuration Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Bank 1 */}
                    <GlowingCard>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                                <Landmark className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-white leading-tight">Commercial Bank</h2>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">FD Vault Alpha</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Currency</label>
                                <select
                                    value={bank1.currency}
                                    onChange={(e) => setBank1({ ...bank1, currency: e.target.value })}
                                    className="w-full bg-[#1a1f35] border border-[#2a2e45] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500/50 transition-all cursor-pointer"
                                >
                                    <option value="LKR">Sri Lankan Rupee (LKR)</option>
                                    <option value="AED">UAE Dirham (AED)</option>
                                </select>
                            </div>
                            <InputField label={`Principal (${bank1.currency})`} value={bank1.principal} onChange={(e) => setBank1({ ...bank1, principal: parseFloat(e.target.value) || 0 })} />
                            <InputField label="Annual Interest Rate" value={bank1.interestRate} suffix="%" onChange={(e) => setBank1({ ...bank1, interestRate: parseFloat(e.target.value) || 0 })} />
                        </div>
                    </GlowingCard>

                    {/* Bank 2 */}
                    <GlowingCard>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20">
                                <Landmark className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-white leading-tight">Dialog Axiata</h2>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Finance Vault Beta</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Currency</label>
                                <select
                                    value={bank2.currency}
                                    onChange={(e) => setBank2({ ...bank2, currency: e.target.value })}
                                    className="w-full bg-[#1a1f35] border border-[#2a2e45] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500/50 transition-all cursor-pointer"
                                >
                                    <option value="LKR">Sri Lankan Rupee (LKR)</option>
                                    <option value="AED">UAE Dirham (AED)</option>
                                </select>
                            </div>
                            <InputField label={`Principal (${bank2.currency})`} value={bank2.principal} onChange={(e) => setBank2({ ...bank2, principal: parseFloat(e.target.value) || 0 })} />
                            <InputField label="Annual Interest Rate" value={bank2.interestRate} suffix="%" onChange={(e) => setBank2({ ...bank2, interestRate: parseFloat(e.target.value) || 0 })} />
                        </div>
                    </GlowingCard>

                    {/* Shared Adjustments */}
                    <GlowingCard className="border-purple-500/30 shadow-[0_0_30px_rgba(124,58,237,0.1)]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg">
                                <Wallet className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-white leading-tight">Adjustments</h2>
                                <span className="text-[10px] text-purple-400 uppercase tracking-widest font-bold">Global Variables</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {(bank1.currency === 'AED' || bank2.currency === 'AED') && (
                                <div className="space-y-1">
                                    <InputField label="AED/LKR Exchange Rate" value={exchangeRate} onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)} />
                                    <p className="text-[10px] text-cyan-400 font-bold tracking-tighter ml-1 uppercase">{exchangeRateStatus}</p>
                                </div>
                            )}
                            <InputField label="Savings APY" value={savingsInterestRate} suffix="%" onChange={(e) => setSavingsInterestRate(parseFloat(e.target.value) || 0)} />
                            <InputField label="Monthly Expense" value={monthlyExpenses} prefix="Rs." onChange={(e) => setMonthlyExpenses(parseFloat(e.target.value) || 0)} />

                            <label className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-all select-none">
                                <input
                                    type="checkbox"
                                    checked={taxExemption}
                                    onChange={(e) => setTaxExemption(e.target.checked)}
                                    className="w-4 h-4 mt-0.5 rounded border-[#2a2e45] bg-[#1a1f35] text-purple-600 focus:ring-purple-600 focus:ring-offset-0"
                                />
                                <span className="text-[10px] text-gray-300 leading-normal uppercase font-bold tracking-tight">Claim Tax Exemption (Income &lt; 1.8M/Year)</span>
                            </label>
                        </div>
                    </GlowingCard>
                </div>

                {/* Main Action Toggles */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handleCalculate}
                        className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl shadow-[0_10px_30px_rgba(79,70,229,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <Calculator className="w-5 h-5" /> ගණනය කරන්න
                    </button>
                    <button
                        onClick={handleSyncToSheets}
                        disabled={syncStatus === 'syncing'}
                        className={`
                            px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group border
                            ${syncStatus === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                                syncStatus === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                                    'bg-[#1a1f35] border-[#2a2e45] text-gray-400 hover:text-white hover:bg-[#252a40]'}
                        `}
                    >
                        {syncStatus === 'syncing' ? <Cloud className="w-5 h-5 animate-pulse" /> :
                            syncStatus === 'success' ? <Cloud className="w-5 h-5" /> :
                                syncStatus === 'error' ? <CloudOff className="w-5 h-5" /> :
                                    <Cloud className="w-5 h-5" />}
                        {syncStatus === 'syncing' ? 'Saving...' :
                            syncStatus === 'success' ? 'Saved' :
                                syncStatus === 'error' ? 'Error' : 'Sync Cloud'}
                    </button>
                    <button
                        onClick={handleReset}
                        className="py-4 px-8 bg-[#1a1f35] border border-[#2a2e45] text-gray-400 font-bold rounded-2xl hover:text-white hover:bg-[#252a40] transition-all flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-5 h-5" /> Reset
                    </button>
                </div>

                {isCalculated && (
                    <>
                        {/* Summary Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <GlowingCard>
                                <div className="text-center mb-6">
                                    <h3 className="text-xs font-bold text-gray-500 tracking-[0.2em] uppercase">Commercial Bank Yield</h3>
                                </div>
                                <div className="space-y-1">
                                    <StatDisplay label="Gross Monthly" value={formatCurrency(bank1Details.grossMonthlyIncome)} subValue="Pre-Tax LKR" />
                                    <StatDisplay label="AIT Deduction" value={`-${formatCurrency(bank1Details.monthlyTax)}`} highlight={bank1Details.monthlyTax > 0} subValue="Tax Liability" />
                                    <StatDisplay label="Net Monthly" value={formatCurrency(bank1Details.netMonthlyIncome)} highlight subValue="Take-Home Income" />
                                </div>
                            </GlowingCard>

                            <GlowingCard>
                                <div className="text-center mb-6">
                                    <h3 className="text-xs font-bold text-gray-500 tracking-[0.2em] uppercase">Dialog Axiata Yield</h3>
                                </div>
                                <div className="space-y-1">
                                    <StatDisplay label="Gross Monthly" value={formatCurrency(bank2Details.grossMonthlyIncome)} subValue="Pre-Tax LKR" />
                                    <StatDisplay label="AIT Deduction" value={`-${formatCurrency(bank2Details.monthlyTax)}`} highlight={bank2Details.monthlyTax > 0} subValue="Tax Liability" />
                                    <StatDisplay label="Net Monthly" value={formatCurrency(bank2Details.netMonthlyIncome)} highlight subValue="Take-Home Income" />
                                </div>
                            </GlowingCard>
                        </div>

                        {/* Projection Table */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="w-5 h-5 text-purple-400" />
                                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">12-Month Financial Projection</h2>
                            </div>
                            <div className="bg-[#0f1221] border border-[#2a2e45] rounded-3xl overflow-hidden shadow-2xl">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-[#1a1f35] border-b border-[#2a2e45]">
                                                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Month</th>
                                                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Opening Bal</th>
                                                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">FD Yield</th>
                                                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Savings Int</th>
                                                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Expense Adjustment</th>
                                                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Tithe (10%)</th>
                                                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Closing Bal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#1f243a]">
                                            {tableData.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                                    <td className="p-4 text-xs font-bold text-white whitespace-nowrap">{row.month}</td>
                                                    <td className="p-4 text-xs text-gray-500 font-medium">{formatCurrency(row.openingBalance)}</td>
                                                    <td className="p-4 text-xs text-green-400 font-bold">+{formatCurrency(row.netFDIncome)}</td>
                                                    <td className="p-4 text-xs text-blue-400 font-bold">+{formatCurrency(row.savingsInterest)}</td>
                                                    <td className="p-4">
                                                        <div className="relative w-28">
                                                            <input
                                                                type="number"
                                                                value={row.monthlyExpenses}
                                                                onChange={(e) => handleExpenseChange(idx, e.target.value)}
                                                                className="w-full bg-[#1a1f35] border border-[#2a2e45] text-white p-1.5 rounded-lg text-xs outline-none focus:border-purple-500/50"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-xs text-orange-400 font-medium">-{formatCurrency(row.tithe)}</td>
                                                    <td className={`p-4 text-xs font-black tracking-tight ${row.remainingInHand >= 0 ? 'text-cyan-400' : 'text-red-500 underline decoration-2'}`}>
                                                        {formatCurrency(row.remainingInHand)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Annual Summary */}
                        {annualTaxSummary && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <GlowingCard special className="flex flex-col justify-center items-center text-center">
                                    <ReceiptText className="w-8 h-8 text-cyan-400 mb-2" />
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1">Fiscal Liability</span>
                                    <h2 className={`text-2xl font-black ${annualTaxSummary.netTaxPayable > 0 ? 'text-red-500' : 'text-cyan-400'}`}>
                                        {formatCurrency(Math.abs(annualTaxSummary.netTaxPayable))}
                                        {annualTaxSummary.netTaxPayable < 0 && <span className="text-xs ml-2 opacity-50 uppercase tracking-tighter">(Refund)</span>}
                                    </h2>
                                    <p className="text-[9px] text-gray-600 mt-2 max-w-xs uppercase font-bold">Calculated based on SL Revenue Progressive Slabs after Personal Relief</p>
                                </GlowingCard>

                                <GlowingCard className="border-cyan-500/30 bg-gradient-to-br from-[#0f1221] to-[#1e1b4b] flex flex-col justify-center items-center text-center">
                                    <TrendingUp className="w-8 h-8 text-white mb-2" />
                                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em] mb-1">Year-End Portfolio</span>
                                    <h2 className="text-3xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                        {formatCurrency(annualTaxSummary.finalSavings)}
                                    </h2>
                                    <p className="text-[9px] text-gray-400 mt-2 max-w-xs uppercase font-bold">Adjusted for all taxes and deductions</p>
                                </GlowingCard>
                            </div>
                        )}
                    </>
                )}

                {/* Footer Notes */}
                <div className="flex items-start gap-3 p-6 rounded-3xl bg-blue-900/10 border border-blue-500/20 text-blue-200 text-[10px] uppercase font-bold tracking-wider leading-relaxed">
                    <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        <ul className="space-y-1">
                            <li>• Real-time AED rates sourced from Frankfurter API</li>
                            <li>• 10% AIT Tax applied to all FD income streams</li>
                            <li>• 10% Tithe deducted from Net Monthly Growth</li>
                        </ul>
                        <ul className="space-y-1">
                            <li>• SL Tax Brackets: 6%, 18%, 24%, 30%, 36%</li>
                            <li>• Personal Relief Threshold: LKR 1,800,000</li>
                            <li>• Estimates for illustration only; Consult an expert</li>
                        </ul>
                    </div>
                </div>

                <footer className="text-center py-8">
                    <p className="text-gray-600 text-[10px] uppercase font-bold tracking-[0.3em]">© {new Date().getFullYear()} LT Finance Infrastructure</p>
                </footer>
            </div>
        </div>
    );
};

export default FDIncomeCalculator;
