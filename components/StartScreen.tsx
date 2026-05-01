/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Play } from 'lucide-react';

interface StartScreenProps {
  onStart: (aiEnabled: boolean) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [aiEnabled, setAiEnabled] = useState(true);

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 bg-[#0c111d]/60 backdrop-blur-xl p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full p-6 md:p-12 text-center my-auto"
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
            SKY<span className="text-slate-500 text-3xl md:text-4xl block md:inline md:ml-2">METROPOLIS</span>
          </h1>
          <p className="text-slate-400 text-[10px] md:text-sm font-medium uppercase tracking-[0.3em] mb-8 md:mb-12">
            Atmospheric City Management
          </p>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-8"
        >
          <button
            onClick={() => setAiEnabled(!aiEnabled)}
            className={`
              w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300
              ${aiEnabled ? 'bg-white/5 border-white/20' : 'bg-transparent border-white/5'}
            `}
          >
            <div className="flex items-center gap-3 text-left">
              <div className={`p-2 rounded-lg ${aiEnabled ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className={`font-bold text-sm ${aiEnabled ? 'text-white' : 'text-slate-500'}`}>AI Advisor</div>
                <div className="text-[10px] text-slate-500">Gemini-powered dynamic quests</div>
              </div>
            </div>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${aiEnabled ? 'bg-cyan-600' : 'bg-slate-700'}`}>
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${aiEnabled ? 'right-1' : 'left-1'}`} />
            </div>
          </button>

          <button 
            onClick={() => onStart(aiEnabled)}
            className="group w-full py-5 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-all active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-current" />
            START BUILDING
          </button>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-[10px] text-slate-600 font-mono tracking-widest"
        >
          DESIGNED FOR SKY METROPOLIS V2
        </motion.p>
      </motion.div>
    </div>
  );
};

export default StartScreen;