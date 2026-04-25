
import React from 'react';
import { useApp } from '../../context/AppContext';
import { Search, MapPin, ChevronDown, History, HelpCircle, Star } from 'lucide-react';

export const StoreList = () => {
    const { setShowLocationSelector, user, toggleSettings, setClientViewState, searchQuery, setSearchQuery } = useApp();
    const isMobile = window.innerWidth < 1024;

    return (
    <div className="space-y-6 animate-fade-in pt-2 bg-transparent">
      <div className="px-6 py-6 flex flex-col gap-6 sticky top-0 z-20 bg-white/70 dark:bg-stone-950/70 backdrop-blur-2xl border-b border-black/[0.03] dark:border-white/[0.03]">
          <div className="flex justify-between items-center">
              <div id="location-selector" onClick={() => setShowLocationSelector(true)} className="cursor-pointer group">
                  <p className="text-stone-400 dark:text-stone-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1.5">Entregar en</p>
                  <div className="flex items-center gap-2 text-stone-950 dark:text-white font-black text-lg group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors tracking-tight">
                      <div className="w-8 h-8 bg-brand-500/10 rounded-lg flex items-center justify-center">
                        <MapPin size={18} className="text-brand-500" />
                      </div>
                      <span className="truncate max-w-[150px] sm:max-w-[300px]">
                        {user.addresses && user.addresses.length > 0 ? user.addresses[0].split('(')[0] : 'Sin dirección'}
                      </span>
                      <ChevronDown size={18} className="text-stone-300 dark:text-stone-600 group-hover:translate-y-0.5 transition-transform" />
                  </div>
              </div>
              <div className="flex items-center gap-4">
                  <button 
                    onClick={() => {
                        window.dispatchEvent(new CustomEvent('open-help'));
                        toggleSettings();
                    }}
                    className="w-12 h-12 bg-stone-100 dark:bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-brand-500/10 hover:text-brand-600 transition-all border border-transparent hover:border-brand-500/20 dark:bg-stone-800"
                    title="Ayuda"
                  >
                      <HelpCircle size={20} className="text-stone-900 dark:text-white" />
                  </button>
                  <button 
                    id="history-button"
                    onClick={() => setClientViewState('HISTORY')}
                    className="flex items-center gap-2 bg-stone-100 dark:bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl hover:bg-brand-500/10 hover:text-brand-600 transition-all border border-transparent hover:border-brand-500/20 dark:bg-stone-800"
                  >
                      <History size={18} className="text-stone-900 dark:text-white" />
                      <span className="font-black text-xs text-stone-900 dark:text-white hidden sm:block uppercase tracking-widest">Pedidos</span>
                  </button>
                  <button 
                    id="profile-button"
                    onClick={toggleSettings}
                    className="w-12 h-12 bg-stone-950 dark:bg-white text-white dark:text-stone-950 rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl lg:hidden"
                  >
                      <span className="font-black text-sm uppercase tracking-tighter">
                          {user.name.split(' ').map(n => n[0]).join('').substring(0,2)}
                      </span>
                  </button>
              </div>
          </div>

          <div className="w-full">
             <div id="search-bar" className="bg-stone-100 dark:bg-stone-800 backdrop-blur-xl p-1.5 rounded-[2rem] flex items-center gap-3 transition-all focus-within:bg-white dark:focus-within:bg-stone-900 focus-within:ring-4 focus-within:ring-brand-500/10 border border-transparent focus-within:border-brand-500/20 shadow-inner group/search">
                 <div className="p-3.5 bg-white dark:bg-stone-800 rounded-[1.5rem] shadow-xl shadow-black/5 group-focus-within/search:bg-brand-500 group-focus-within/search:text-brand-950 transition-colors">
                     <Search size={20} className="text-stone-900 dark:text-white group-focus-within/search:text-inherit" />
                 </div>
                 <input 
                    placeholder="¿Qué vas a comer hoy?"
                    className="flex-1 outline-none text-lg p-2 bg-transparent text-stone-950 dark:text-white placeholder-stone-400 dark:placeholder-stone-500 font-black tracking-tight"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                 />
             </div>
          </div>
      </div>
    </div>
    );
};
