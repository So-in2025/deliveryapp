
import React from 'react';
import { useApp } from '../../context/AppContext';
import { Search, MapPin, ChevronDown, History, HelpCircle, Star } from 'lucide-react';

export const StoreList = () => {
    const { setShowLocationSelector, user, toggleSettings, setClientViewState, searchQuery, setSearchQuery } = useApp();
    const isMobile = window.innerWidth < 1024;

    return (
    <div className="space-y-4 animate-fade-in pt-0 bg-transparent">
      <div className="px-6 py-4 flex flex-col gap-4 relative z-20 bg-white dark:bg-stone-900/40 backdrop-blur-xl border-b border-stone-200/80 dark:border-white/[0.05] shadow-sm">
          <div className="flex justify-between items-center">
              <div id="location-selector" onClick={() => setShowLocationSelector(true)} className="cursor-pointer group flex-1 min-w-0">
                  <p className="text-stone-400 dark:text-stone-500 text-[8px] font-black uppercase tracking-[0.2em] mb-1 translate-x-1">Entregar en</p>
                  <div className="flex items-center gap-2 text-stone-950 dark:text-white font-black text-lg group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-all tracking-tighter italic lg:text-xl">
                      <div className="w-8 h-8 bg-brand-500 text-brand-950 rounded-xl flex items-center justify-center border border-brand-400 shadow-md group-hover:scale-110 transition-transform shrink-0">
                        <MapPin size={16} strokeWidth={3} />
                      </div>
                      <span className="truncate flex-1">
                        {user.addresses && user.addresses.length > 0 ? user.addresses[0].split('(')[0] : '¿A dónde enviamos?'}
                      </span>
                      <ChevronDown size={18} className="text-stone-300 dark:text-stone-600 group-hover:translate-y-1 transition-transform shrink-0" />
                  </div>
              </div>
              <div className="flex items-center gap-2">
                  <button 
                    id="history-button"
                    onClick={() => setClientViewState('HISTORY')}
                    className="flex items-center gap-2 bg-stone-50 dark:bg-stone-900 px-3 py-2 rounded-xl hover:bg-brand-500/10 hover:text-brand-600 transition-all border border-stone-200 dark:border-white/10 active:scale-95 whitespace-nowrap shrink-0"
                  >
                      <History size={16} className="text-stone-800 dark:text-white" />
                      <span className="font-black text-[9px] text-stone-900 dark:text-white hidden lg:block uppercase tracking-widest leading-none pt-0.5">Pedidos</span>
                  </button>
              </div>
          </div>

          <div className="relative group">
              <input 
                type="text" 
                placeholder="¿Qué vas a comer hoy?" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-white/10 focus:border-brand-500 py-3 pl-11 pr-4 rounded-2xl text-xs sm:text-sm font-bold text-stone-900 dark:text-white placeholder:text-stone-400 transition-all outline-none italic"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-brand-500 transition-colors" size={18} />
          </div>
      </div>
    </div>
    );
};
