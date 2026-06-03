import React, { useState } from 'react' // Re-bundle trigger
import FluidoFDRates from './FDRateCalculator'
import UnitTrustCalculator from './UnitTrustCalculator'
import NDBWealthCalculator from './NDBWealthCalculator.jsx'
import SummaryDashboard from './SummaryDashboard.jsx'
import UAEInvestments from './UAEInvestments.jsx'
import { TrendingUp, PieChart, Calculator, LayoutDashboard, Globe } from 'lucide-react'

function App() {
  const [currentTab, setCurrentTab] = useState('unittrust') // 'unittrust', 'ndbwealth', or 'yield'

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      {/* Universal Navigation - Desktop Only */}
      <nav className="hidden md:block sticky top-0 z-50 bg-[#0f1221]/80 backdrop-blur-md border-b border-[#2a2e45] px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-12 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-black text-sm text-white shadow-lg">LT</div>
            <span className="font-bold text-white">LT <span className="text-purple-400">Finance</span></span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentTab('unittrust')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${currentTab === 'unittrust' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              Unit Trust Investment
            </button>
            <button
              onClick={() => setCurrentTab('ndbwealth')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${currentTab === 'ndbwealth' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              NDB Wealth Funds
            </button>
            <button
              onClick={() => setCurrentTab('yield')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${currentTab === 'yield' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              Yield Calculator
            </button>
            <button
              onClick={() => setCurrentTab('summary')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${currentTab === 'summary' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              All Summaries
            </button>
            <button
              onClick={() => setCurrentTab('uae')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${currentTab === 'uae' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              UAE Accounts
            </button>
          </div>
        </div>
      </nav>

      {/* Universal Navigation - Mobile Only Header */}
      <nav className="md:hidden sticky top-0 z-50 bg-[#0f1221]/90 backdrop-blur-lg border-b border-[#2a2e45]/50 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-black text-xs text-white shadow-md">LT</div>
          <span className="font-bold text-sm text-white">LT <span className="text-purple-400">Finance</span></span>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-black uppercase text-purple-400 tracking-wider">
          Mobile App
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pb-24 md:pb-0 animate-in fade-in duration-500">
        {currentTab === 'unittrust' && <UnitTrustCalculator />}
        {currentTab === 'ndbwealth' && <NDBWealthCalculator />}
        {currentTab === 'yield' && <FluidoFDRates />}
        {currentTab === 'summary' && <SummaryDashboard />}
        {currentTab === 'uae' && <UAEInvestments />}
      </main>

      {/* Universal Navigation - Mobile Only Fixed Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-5 pt-2 bg-gradient-to-t from-[#050816] via-[#050816]/95 to-transparent">
        <nav className="flex justify-around items-center bg-[#0f1221]/90 backdrop-blur-xl border border-[#2a2e45] rounded-2xl py-2 px-1 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <button
            onClick={() => setCurrentTab('unittrust')}
            className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-xl transition-all ${currentTab === 'unittrust' ? 'text-purple-400 scale-105' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-[9px] font-bold tracking-tight">Unit Trust</span>
          </button>
          
          <button
            onClick={() => setCurrentTab('ndbwealth')}
            className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-xl transition-all ${currentTab === 'ndbwealth' ? 'text-purple-400 scale-105' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <PieChart className="w-5 h-5" />
            <span className="text-[9px] font-bold tracking-tight">NDB Wealth</span>
          </button>
          
          <button
            onClick={() => setCurrentTab('yield')}
            className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-xl transition-all ${currentTab === 'yield' ? 'text-purple-400 scale-105' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <Calculator className="w-5 h-5" />
            <span className="text-[9px] font-bold tracking-tight">Yield</span>
          </button>
          
          <button
            onClick={() => setCurrentTab('summary')}
            className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-xl transition-all ${currentTab === 'summary' ? 'text-purple-400 scale-105' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[9px] font-bold tracking-tight">Summary</span>
          </button>
          
          <button
            onClick={() => setCurrentTab('uae')}
            className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-xl transition-all ${currentTab === 'uae' ? 'text-emerald-400 scale-105' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <Globe className="w-5 h-5" />
            <span className="text-[9px] font-bold tracking-tight">UAE</span>
          </button>
        </nav>
      </div>
    </div>
  )
}

export default App

