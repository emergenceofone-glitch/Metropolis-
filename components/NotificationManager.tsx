import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';

export type NotificationType = 'info' | 'warning' | 'alert' | 'success';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isModal?: boolean;
  icon?: React.ElementType;
  duration?: number; 
  onAcknowledge?: () => void;
  metadata?: any;
  customRender?: (notification: AppNotification, onDismiss: () => void) => React.ReactNode;
}

interface NotificationManagerProps {
  notifications: AppNotification[];
  removeNotification: (id: string) => void;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({ notifications, removeNotification }) => {
  const toasts = notifications.filter(n => !n.isModal);
  const modals = notifications.filter(n => n.isModal);

  // Auto-dismiss toasts
  useEffect(() => {
    toasts.forEach(toast => {
      if (toast.duration && toast.duration > 0) {
        const timer = setTimeout(() => {
          removeNotification(toast.id);
        }, toast.duration);
        return () => clearTimeout(timer);
      }
    });
  }, [toasts, removeNotification]);

  const getDefaultIcon = (type: NotificationType) => {
    switch (type) {
      case 'info': return Info;
      case 'warning': return AlertTriangle;
      case 'alert': return AlertTriangle;
      case 'success': return CheckCircle;
      default: return Info;
    }
  };

  const getEmblemStyle = (type: NotificationType) => {
    switch (type) {
      case 'info': return 'bg-blue-900/50 text-blue-300 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]';
      case 'warning': return 'bg-amber-900/50 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
      case 'alert': return 'bg-rose-900/50 text-rose-300 border-rose-500/50 shadow-[0_0_15px_rgba(225,29,72,0.3)]';
      case 'success': return 'bg-emerald-900/50 text-emerald-300 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
      default: return 'bg-slate-900/50 text-slate-300 border-slate-500/50 shadow-[0_0_15px_rgba(100,116,139,0.3)]';
    }
  };

  const getColors = (type: NotificationType) => {
    switch (type) {
      case 'info': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'warning': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'alert': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'success': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <>
      {/* Toast Container - Emblems with visual breather animation */}
      <div className="fixed bottom-24 left-4 z-50 flex flex-col-reverse gap-3 max-w-sm pointer-events-none items-start">
        <AnimatePresence>
          {toasts.map(toast => {
            const Icon = toast.icon || getDefaultIcon(toast.type);
            const style = getEmblemStyle(toast.type);
            
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -20 }}
                layout
                className={`pointer-events-auto group relative flex items-center justify-center w-12 h-12 rounded-full border backdrop-blur-md cursor-pointer transition-colors hover:bg-opacity-80 ${style}`}
                onClick={() => removeNotification(toast.id)}
              >
                {/* Pulsing ring for visual breather animation */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-current opacity-50"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />
                
                <Icon className="w-5 h-5 z-10" />
                
                {/* Tooltip on hover/focus */}
                <div className="absolute left-full ml-4 px-4 py-3 bg-slate-900/95 border border-slate-700 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0 z-50 pointer-events-none text-left min-w-[240px] max-w-[320px] backdrop-blur-md">
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 border-y-8 border-y-transparent border-r-8 border-r-slate-700" />
                  <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 border-y-[7px] border-y-transparent border-r-[7px] border-r-slate-900" />
                  <h4 className="text-sm font-bold text-slate-100 mb-1 leading-tight">{toast.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{toast.message}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Modal Container */}
      <AnimatePresence>
        {modals.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-sky-950/80 backdrop-blur-sm p-4 pointer-events-auto"
          >
            {modals.map((modal, index) => {
              // Only show the top modal if there are multiple
              if (index !== modals.length - 1) return null;
              
              const handleDismiss = () => {
                if (modal.onAcknowledge) modal.onAcknowledge();
                removeNotification(modal.id);
              };

              if (modal.customRender) {
                return (
                  <motion.div
                    key={modal.id}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  >
                    {modal.customRender(modal, handleDismiss)}
                  </motion.div>
                );
              }

              const Icon = modal.icon || getDefaultIcon(modal.type);
              const colors = getColors(modal.type);

              return (
                <motion.div
                  key={modal.id}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl max-w-md w-full"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-full ${colors}`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-white uppercase tracking-wider">{modal.title}</h2>
                      </div>
                    </div>
                  </div>
                  <div className="mb-6">
                    <p className="text-slate-300 text-sm leading-relaxed">{modal.message}</p>
                  </div>
                  <button 
                    onClick={handleDismiss}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  >
                    Acknowledge
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
