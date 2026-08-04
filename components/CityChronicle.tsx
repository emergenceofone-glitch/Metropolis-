/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Trophy, 
  Target, 
  AlertTriangle, 
  Sparkles, 
  History, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Calendar, 
  Award, 
  Flame, 
  ShieldAlert, 
  Landmark, 
  Filter,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  FileText
} from 'lucide-react';
import { ChronicleEntry, ChronicleCategory } from '../types';

interface CityChronicleProps {
  chronicleEntries: ChronicleEntry[];
  currentDay: number;
  population: number;
  cityLevel: number;
  onClose: () => void;
  onAddCustomNote?: (title: string, description: string) => void;
}

export const CityChronicle: React.FC<CityChronicleProps> = ({
  chronicleEntries,
  currentDay,
  population,
  cityLevel,
  onClose,
  onAddCustomNote
}) => {
  const [activeCategory, setActiveCategory] = useState<ChronicleCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isNoteInputOpen, setIsNoteInputOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDesc, setNoteDesc] = useState('');

  // Category Configuration
  const categoryConfig: Record<ChronicleCategory, { label: string; icon: any; color: string; bg: string; border: string; text: string }> = {
    milestone: {
      label: 'Milestones',
      icon: Trophy,
      color: 'amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-300'
    },
    goal: {
      label: 'Completed Goals',
      icon: Target,
      color: 'emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-300'
    },
    disaster: {
      label: 'Historical Disasters',
      icon: AlertTriangle,
      color: 'rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      text: 'text-rose-300'
    },
    directive: {
      label: 'Ecosystem Directives',
      icon: Sparkles,
      color: 'purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      text: 'text-purple-300'
    },
    historical: {
      label: 'City Legacy',
      icon: Landmark,
      color: 'cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      text: 'text-cyan-300'
    }
  };

  // Filter & Search logic
  const filteredEntries = useMemo(() => {
    return chronicleEntries.filter(entry => {
      const matchesCategory = activeCategory === 'all' || entry.category === activeCategory;
      const matchesSearch = 
        searchQuery.trim() === '' || 
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.impact && entry.impact.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    }).sort((a, b) => b.day - a.day || b.timestamp - a.timestamp);
  }, [chronicleEntries, activeCategory, searchQuery]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  
  const paginatedEntries = useMemo(() => {
    const start = (validCurrentPage - 1) * itemsPerPage;
    return filteredEntries.slice(start, start + itemsPerPage);
  }, [filteredEntries, validCurrentPage, itemsPerPage]);

  // Statistics summaries
  const statsSummary = useMemo(() => {
    const milestones = chronicleEntries.filter(e => e.category === 'milestone').length;
    const goals = chronicleEntries.filter(e => e.category === 'goal').length;
    const disasters = chronicleEntries.filter(e => e.category === 'disaster').length;
    const directives = chronicleEntries.filter(e => e.category === 'directive').length;

    let era = 'Pioneer Founding Era';
    if (cityLevel >= 10 || population >= 2000) era = 'Golden Cyber-Metropolis Age';
    else if (cityLevel >= 5 || population >= 500) era = 'Rapid Urban Expansion Age';
    else if (cityLevel >= 2 || population >= 100) era = 'Industrial Growth Era';

    return { milestones, goals, disasters, directives, era, total: chronicleEntries.length };
  }, [chronicleEntries, cityLevel, population]);

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;
    if (onAddCustomNote) {
      onAddCustomNote(noteTitle.trim(), noteDesc.trim() || 'Logged as an official municipal archival record.');
    }
    setNoteTitle('');
    setNoteDesc('');
    setIsNoteInputOpen(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="fixed inset-x-4 inset-y-6 md:inset-x-auto md:right-8 md:top-8 md:bottom-8 w-full max-w-3xl bg-slate-950/92 backdrop-blur-2xl border border-amber-500/30 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.15)] z-50 flex flex-col overflow-hidden font-sans text-slate-100 pointer-events-auto"
    >
      {/* Top Header Bar */}
      <div className="p-5 border-b border-amber-500/20 bg-gradient-to-r from-amber-950/50 via-slate-900/80 to-slate-950/90 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-400/30 rounded-2xl text-amber-400 shadow-lg shadow-amber-500/10">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold tracking-wide text-white font-mono uppercase">
                City Chronicle & Legacy Archive
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-[10px] font-mono font-bold text-amber-300">
                {statsSummary.total} RECORDS LOGGED
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Historical timeline of municipal achievements, goals fulfilled, and disasters weathered.
            </p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-white transition-colors border border-white/10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Legacy Statistics Bar */}
      <div className="px-5 py-3 bg-slate-900/90 border-b border-white/10 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs font-mono">
        <div className="bg-slate-950/60 p-2 rounded-xl border border-white/5 flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
            <Trophy className="w-3 h-3 text-amber-400" /> Milestones
          </span>
          <span className="text-base font-extrabold text-amber-300">{statsSummary.milestones}</span>
        </div>

        <div className="bg-slate-950/60 p-2 rounded-xl border border-white/5 flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
            <Target className="w-3 h-3 text-emerald-400" /> Goals Met
          </span>
          <span className="text-base font-extrabold text-emerald-300">{statsSummary.goals}</span>
        </div>

        <div className="bg-slate-950/60 p-2 rounded-xl border border-white/5 flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-rose-400" /> Disasters
          </span>
          <span className="text-base font-extrabold text-rose-300">{statsSummary.disasters}</span>
        </div>

        <div className="bg-slate-950/60 p-2 rounded-xl border border-white/5 flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
            <Zap className="w-3 h-3 text-purple-400" /> Directives
          </span>
          <span className="text-base font-extrabold text-purple-300">{statsSummary.directives}</span>
        </div>

        <div className="col-span-2 md:col-span-1 bg-gradient-to-r from-amber-500/10 to-purple-500/10 p-2 rounded-xl border border-amber-500/20 flex flex-col justify-center">
          <span className="text-[9px] text-amber-400/90 font-bold uppercase tracking-wider">Current Era</span>
          <span className="text-xs font-bold text-slate-100 truncate">{statsSummary.era}</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-slate-900/50 border-b border-white/10 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none text-xs font-mono">
          <button
            onClick={() => { setActiveCategory('all'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === 'all'
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-200 font-bold shadow-md shadow-amber-500/10'
                : 'bg-slate-800/40 border-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({chronicleEntries.length})
          </button>

          {(['milestone', 'goal', 'disaster', 'directive', 'historical'] as ChronicleCategory[]).map(cat => {
            const cfg = categoryConfig[cat];
            const Icon = cfg.icon;
            const count = chronicleEntries.filter(e => e.category === cat).length;
            const isActive = activeCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? `${cfg.bg} ${cfg.border} ${cfg.text} font-bold shadow-md`
                    : 'bg-slate-800/40 border-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cfg.label} ({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search & Custom Entry Trigger */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search chronicle..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 font-mono"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ×
              </button>
            )}
          </div>

          {onAddCustomNote && (
            <button
              onClick={() => setIsNoteInputOpen(!isNoteInputOpen)}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-all shadow-md shadow-amber-500/10 whitespace-nowrap"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Log Entry</span>
            </button>
          )}
        </div>
      </div>

      {/* Custom Note Logging Form Dropdown */}
      <AnimatePresence>
        {isNoteInputOpen && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleAddNoteSubmit}
            className="p-4 bg-slate-900 border-b border-amber-500/30 overflow-hidden space-y-3"
          >
            <div className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Landmark className="w-4 h-4" /> Record Custom Municipal Archival Note
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Entry Title (e.g., Grand Central Station Opened)..."
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <input
                type="text"
                placeholder="Description / Historical Details..."
                value={noteDesc}
                onChange={(e) => setNoteDesc(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNoteInputOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-mono text-slate-400 hover:text-white bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-950 bg-amber-400 hover:bg-amber-300"
              >
                Save Record
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Main List Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {paginatedEntries.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/50 border border-white/10 flex items-center justify-center mx-auto text-slate-500">
              <History className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-400 font-mono">No chronicle records found matching filter.</p>
          </div>
        ) : (
          paginatedEntries.map((entry) => {
            const cfg = categoryConfig[entry.category] || categoryConfig.historical;
            const Icon = cfg.icon;

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-2xl border ${cfg.border} bg-slate-900/80 hover:bg-slate-900 transition-all space-y-2 shadow-lg relative overflow-hidden group`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${cfg.bg} border ${cfg.border} ${cfg.text}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                          {cfg.label}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-amber-300 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-400" />
                          Day {entry.day}
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-white mt-1 group-hover:text-amber-200 transition-colors">
                        {entry.title}
                      </h3>
                    </div>
                  </div>

                  {entry.impact && (
                    <span className="px-2.5 py-1 rounded-xl bg-black/40 border border-white/10 text-xs font-mono font-bold text-emerald-300 whitespace-nowrap">
                      {entry.impact}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pl-11">
                  {entry.description}
                </p>

                <div className="pl-11 pt-1 flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-white/5 mt-2">
                  <span>Timestamp: {new Date(entry.timestamp).toLocaleTimeString()}</span>
                  <span>Record ID: {entry.id.slice(-6)}</span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Pagination Footer Controls */}
      <div className="p-4 bg-slate-900/90 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-400">
          <span>Showing page {validCurrentPage} of {totalPages}</span>
          <span className="text-slate-600">•</span>
          <span>({filteredEntries.length} total entries)</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Items per page selector */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Per Page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          {/* Page Navigation Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={validCurrentPage === 1}
              className="p-1.5 rounded-xl bg-slate-800 border border-white/10 disabled:opacity-30 hover:bg-slate-700 text-white cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 rounded-xl bg-slate-800/80 border border-white/10 text-amber-300 font-bold">
              {validCurrentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={validCurrentPage === totalPages}
              className="p-1.5 rounded-xl bg-slate-800 border border-white/10 disabled:opacity-30 hover:bg-slate-700 text-white cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
