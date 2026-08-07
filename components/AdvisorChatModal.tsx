import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Send, 
  Brain, 
  MessageSquare, 
  Zap, 
  Sparkles, 
  Trash2, 
  Bot, 
  User, 
  ShieldAlert, 
  DollarSign, 
  Users, 
  Calendar, 
  CloudRain, 
  Activity,
  Award,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Scroll
} from 'lucide-react';
import { CityStats, Grid, WeatherState, WeatherAlert, MaterialRefinementState } from '../types';
import { sendAdvisorMessage, ADVISOR_ROLES, AdvisorRole, ChatMessage } from '../services/advisorChatService';
import { generateCityAnalysis, CityAnalysisResult } from '../services/geminiService';

interface AdvisorChatModalProps {
  stats: CityStats;
  grid: Grid;
  weather: WeatherState;
  weatherAlert: WeatherAlert | null;
  refinementState?: MaterialRefinementState;
  onClose: () => void;
}

const DEFAULT_PROMPTS: Record<AdvisorRole, string[]> = {
  planner: [
    "How can I maximize daily revenue with my current layout?",
    "What building type should I prioritize next?",
    "How do I structure resilience against severe weather?"
  ],
  liaison: [
    "How are citizens feeling about city growth?",
    "What parks or amenities should we build next?",
    "Give me an opinion poll report from local residents."
  ],
  emergency: [
    "Are our Atmospheric Shields protecting our high-value buildings?",
    "What is our immediate threat assessment for weather?",
    "How do I upgrade structural resilience against blizzards and monsoons?"
  ]
};

export const AdvisorChatModal: React.FC<AdvisorChatModalProps> = ({
  stats,
  grid,
  weather,
  weatherAlert,
  refinementState = {
    refinedAetheriumProduction: 0,
    refinedAetheriumDemand: 0,
    qualityOfLifeMultiplier: 1.0,
    industrialRefineryCount: 0,
    commercialHubCount: 0,
    purityTier: 'Standard',
    surgeActive: false,
    surgeDaysRemaining: 0,
    history: []
  },
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'audit'>('chat');
  const [activeRole, setActiveRole] = useState<AdvisorRole>('planner');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-planner',
      sender: 'advisor',
      role: 'planner',
      text: `Greetings Mayor! I am your **Chief City Strategist** powered by Gemini. Ask me anything about urban planning, revenue optimization, or structural layout strategy for Sky Metropolis.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Gemini Audit State
  const [auditResult, setAuditResult] = useState<CityAnalysisResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, isLoading, activeTab]);

  const handleRoleChange = (newRole: AdvisorRole) => {
    setActiveRole(newRole);
    const hasRoleMessage = messages.some(m => m.role === newRole);
    if (!hasRoleMessage) {
      const config = ADVISOR_ROLES[newRole];
      setMessages(prev => [
        ...prev,
        {
          id: `welcome-${newRole}-${Date.now()}`,
          sender: 'advisor',
          role: newRole,
          text: `Switching channel to **${config.name}**. How can I assist you with ${config.description.toLowerCase()}?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      role: activeRole,
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsLoading(true);

    try {
      const responseText = await sendAdvisorMessage(
        activeRole,
        query,
        messages.filter(m => m.role === activeRole),
        { stats, grid, weather, weatherAlert }
      );

      const advisorMsg: ChatMessage = {
        id: `advisor-${Date.now()}`,
        sender: 'advisor',
        role: activeRole,
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, advisorMsg]);
    } catch (err) {
      console.error("Failed to generate advisor response", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      const result = await generateCityAnalysis(stats, grid, refinementState);
      setAuditResult(result);
    } catch (err) {
      console.error("Failed to run Gemini audit:", err);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${activeRole}-${Date.now()}`,
        sender: 'advisor',
        role: activeRole,
        text: `Cleared conversation history. How can **${ADVISOR_ROLES[activeRole].name}** assist Sky Metropolis now?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const activeRoleConfig = ADVISOR_ROLES[activeRole];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xl pointer-events-auto"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-4xl h-[85vh] max-h-[750px] bg-slate-900/90 border border-cyan-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 relative"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 shrink-0">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-mono tracking-wide text-white">Gemini Intelligence Center</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  gemini-3.6-flash
                </span>
              </div>
              <p className="text-xs text-slate-400">AI Advisors & Mayoral Urban Planning Audit Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Mode Selector Tabs */}
            <div className="bg-slate-950 p-1 rounded-xl border border-white/10 flex items-center gap-1">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'chat'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>AI Advisors</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('audit');
                  if (!auditResult) handleRunAudit();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'audit'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Mayoral Audit</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close Gemini Center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live City Telemetry Ribbon */}
        <div className="bg-slate-950/90 border-b border-white/10 px-4 py-2 flex items-center justify-between text-xs font-mono text-slate-300 overflow-x-auto gap-4 scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>Day <strong className="text-white">{stats.day}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Treasury: <strong className="text-emerald-400">${stats.money}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Pop: <strong className="text-white">{stats.population}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <CloudRain className="w-3.5 h-3.5 text-sky-400" />
            <span>Weather: <strong className="text-sky-300 capitalize">{weather.condition}</strong></span>
          </div>
          {weatherAlert && (
            <div className="flex items-center gap-1.5 shrink-0 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              <ShieldAlert className="w-3.5 h-3.5 animate-bounce" />
              <span>{weatherAlert.title}</span>
            </div>
          )}
        </div>

        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Advisor Role Selection Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-2 border-b border-white/10">
              {(['planner', 'liaison', 'emergency'] as AdvisorRole[]).map(roleKey => {
                const config = ADVISOR_ROLES[roleKey];
                const isActive = activeRole === roleKey;
                const Icon = roleKey === 'planner' ? Brain : roleKey === 'liaison' ? MessageSquare : Zap;

                return (
                  <button
                    key={roleKey}
                    onClick={() => handleRoleChange(roleKey)}
                    className={`p-2.5 rounded-xl flex items-center justify-center sm:justify-start gap-2.5 transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border-cyan-400/80 text-white shadow-md shadow-cyan-500/10'
                        : 'bg-white/5 hover:bg-white/10 border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 ${
                      isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="hidden sm:block text-left overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold font-mono truncate">{config.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                          roleKey === 'planner' ? 'bg-purple-500/20 text-purple-300' :
                          roleKey === 'liaison' ? 'bg-emerald-500/20 text-emerald-300' :
                          'bg-amber-500/20 text-amber-300'
                        }`}>
                          {config.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{config.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Chat Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-900/60 custom-scrollbar">
              <AnimatePresence initial={false}>
                {messages.map(msg => {
                  const isUser = msg.sender === 'user';
                  const roleInfo = ADVISOR_ROLES[msg.role];

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex gap-3 max-w-[88%] sm:max-w-[80%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                        isUser 
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                          : msg.role === 'planner'
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                          : msg.role === 'liaison'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                      }`}>
                        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>

                      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-[11px] font-mono font-bold text-slate-400">
                            {isUser ? 'Mayor' : roleInfo.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">{msg.timestamp}</span>
                        </div>

                        <div className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed border shadow-lg whitespace-pre-wrap ${
                          isUser
                            ? 'bg-blue-600/90 text-white border-blue-400/50 rounded-tr-none'
                            : 'bg-slate-950/80 text-slate-100 border-white/10 rounded-tl-none'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 max-w-[80%] mr-auto"
                >
                  <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="p-3.5 rounded-2xl rounded-tl-none bg-slate-950/80 border border-white/10 text-xs text-cyan-300 flex items-center gap-2 font-mono">
                    <Activity className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span>{activeRoleConfig.name} is synthesizing telemetry & advice...</span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Prompt Chips */}
            <div className="px-4 py-2 bg-slate-950/80 border-t border-white/10 flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 shrink-0">Quick Queries:</span>
              {DEFAULT_PROMPTS[activeRole].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-cyan-500/20 hover:border-cyan-400/50 border border-white/10 text-[11px] text-slate-300 hover:text-cyan-200 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 bg-slate-950 border-t border-white/10 flex items-center gap-2">
              <button
                onClick={handleClearHistory}
                title="Clear Chat History"
                className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-white/10 transition-colors cursor-pointer shrink-0"
                aria-label="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={`Ask ${activeRoleConfig.name}...`}
                disabled={isLoading}
                className="flex-1 bg-slate-900 border border-white/15 focus:border-cyan-400/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all disabled:opacity-50 font-sans"
              />

              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isLoading}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900/60 custom-scrollbar">
            {/* Action Bar */}
            <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileCheck className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                    Mayoral Strategic Urban Layout Audit
                  </h3>
                  <p className="text-xs text-slate-400">
                    Gemini AI evaluates zoning efficiency, revenue health, and Refined Aetherium supply balance.
                  </p>
                </div>
              </div>

              <button
                onClick={handleRunAudit}
                disabled={isAuditing}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
                <span>{isAuditing ? 'Auditing...' : 'Re-Run Audit'}</span>
              </button>
            </div>

            {isAuditing ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mx-auto" />
                <p className="text-sm font-mono text-amber-300 animate-pulse">
                  Gemini 3.6 Flash is analyzing Sky Metropolis zoning telemetry...
                </p>
              </div>
            ) : auditResult ? (
              <div className="space-y-6">
                {/* Grade & Executive Summary Banner */}
                <div className="p-6 bg-slate-950 border border-amber-500/30 rounded-2xl flex flex-col md:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
                  <div className="shrink-0 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-4xl font-black font-mono text-slate-950 shadow-lg shadow-amber-500/30 border-2 border-white/30">
                      {auditResult.cityGrade}
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400 mt-2">
                      City Rating
                    </span>
                  </div>

                  <div className="space-y-2 flex-1 text-center md:text-left">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center justify-center md:justify-start gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Executive Assessment
                    </h4>
                    <p className="text-sm text-slate-200 leading-relaxed font-sans">
                      {auditResult.executiveSummary}
                    </p>
                  </div>
                </div>

                {/* Supply Chain Diagnosis */}
                <div className="p-5 bg-slate-950/80 border border-cyan-500/30 rounded-2xl space-y-2">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span>Refinement Supply Chain Diagnosis</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {auditResult.supplyChainDiagnosis}
                  </p>
                </div>

                {/* Key Actionable Directives */}
                <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Strategic Urban Recommendations</span>
                  </h4>
                  <ul className="space-y-2">
                    {auditResult.keyRecommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 font-sans">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mayoral Decree Card */}
                <div className="p-5 bg-gradient-to-br from-amber-950/50 to-slate-950 border border-amber-500/40 rounded-2xl space-y-2 relative">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                    <Scroll className="w-4 h-4 text-amber-400" />
                    <span>Suggested Mayoral Decree</span>
                  </div>
                  <p className="text-xs font-mono font-bold text-white">
                    "{auditResult.suggestedMayoralDecree}"
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
