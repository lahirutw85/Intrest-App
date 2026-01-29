import React, { useState } from 'react'
import FluidoFDRates from './FDRateCalculator'
import UnitTrustCalculator from './UnitTrustCalculator'

function App() {
  const [currentTab, setCurrentTab] = useState('unittrust') // 'unittrust' or 'yield'

  return (
    <div className="min-h-screen bg-[#050816]">
      {/* Universal Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0f1221]/80 backdrop-blur-md border-b border-[#2a2e45] px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-12 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-black text-sm text-white shadow-lg">LT</div>
            <span className="font-bold text-white hidden sm:block">LT <span className="text-purple-400">Finance</span></span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentTab('unittrust')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${currentTab === 'unittrust' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              Unit Trust Investment
            </button>
            <button
              onClick={() => setCurrentTab('yield')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${currentTab === 'yield' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              Yield Calculator
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {currentTab === 'unittrust' && <UnitTrustCalculator />}
        {currentTab === 'yield' && <FluidoFDRates />}
      </main>
    </div>
  )
}

export default App

