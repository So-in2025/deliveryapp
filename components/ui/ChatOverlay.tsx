import React, { useState, useEffect, useRef } from 'react';
import { Send, X, User, MessageSquare } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChatMessage, UserRole } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatOverlayProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({ orderId, isOpen, onClose, title }) => {
  const { sendMessage, subscribeToChat, user } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      const unsubscribe = subscribeToChat(orderId, (newMessages) => {
        setMessages(newMessages);
      });
      return () => unsubscribe();
    }
  }, [isOpen, orderId, subscribeToChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    await sendMessage(orderId, text);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-stone-950/60 backdrop-blur-md" 
            onClick={onClose}
          ></motion.div>
          
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[80vh] sm:h-[600px] border border-black/[0.03] dark:border-white/[0.03]"
          >
            {/* Header */}
            <div className="p-6 border-b border-black/[0.03] dark:border-white/[0.03] flex justify-between items-center bg-stone-50 dark:bg-stone-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-brand-950 shadow-lg shadow-brand-500/20">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="font-black text-stone-950 dark:text-white tracking-tight">{title}</h3>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 font-black uppercase tracking-widest">Chat en tiempo real</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-stone-50/50 dark:bg-stone-950/20">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <MessageSquare size={48} className="mb-4" />
                  <p className="text-sm font-bold">No hay mensajes aún.<br/>Inicia la conversación.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user.uid;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${isMe ? 'bg-stone-950 dark:bg-white text-white dark:text-stone-950 rounded-tr-none' : 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white rounded-tl-none border border-black/[0.03] dark:border-white/[0.03]'}`}>
                        {!isMe && <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-50">{msg.senderName} ({msg.senderRole})</p>}
                        <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                        <p className={`text-[9px] mt-1 opacity-40 font-bold ${isMe ? 'text-right' : 'text-left'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white dark:bg-stone-900 border-t border-black/[0.03] dark:border-white/[0.03]">
              <div className="flex gap-3">
                <input 
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-stone-100 dark:bg-white/5 border-none rounded-2xl px-5 py-4 text-sm font-bold text-stone-950 dark:text-white placeholder-stone-400 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
                <button 
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="w-14 h-14 bg-brand-500 text-brand-950 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  <Send size={20} strokeWidth={3} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
