
import React from 'react';
import { useApp } from '../../context/AppContext';
import { Search, MapPin, ChevronDown, History as HistoryIcon, HelpCircle, Star } from 'lucide-react';

export const StoreList = () => {
    const { setShowLocationSelector, user, toggleSettings, setClientViewState, searchQuery, setSearchQuery } = useApp();
    const [isScrolled, setIsScrolled] = React.useState(false);

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
    <div className="relative z-10 p-0 lg:z-auto">
      <div className={`mx-auto max-w-lg lg:max-w-none w-full pointer-events-auto transition-all duration-500 ease-out ${isScrolled ? 'scale-95 translate-y-[-4px]' : ''}`}>
        <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-3xl border border-white/20 dark:border-white/[0.05] rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-3 lg:p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center px-2">
                <div id="location-selector" onClick={() => setShowLocationSelector(true)} className="cursor-pointer group flex-1 min-w-0 pr-4">
                    <p className="text-stone-400 dark:text-stone-500 text-[7px] font-black uppercase tracking-[0.3em] mb-0.5">Entregar en</p>
                    <div className="flex items-center gap-2 text-stone-950 dark:text-white font-black text-sm group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-all tracking-tighter truncate">
                        <MapPin size={14} className="text-brand-500 shrink-0" />
                        <span className="truncate">
                          {user.addresses && user.addresses.length > 0 ? user.addresses[0].split('(')[0] : '¿A dónde enviamos?'}
                        </span>
                        <ChevronDown size={14} className="text-stone-300 dark:text-stone-600 group-hover:translate-y-0.5 transition-transform shrink-0" />
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setClientViewState('HISTORY')}
                      className="w-10 h-10 flex items-center justify-center bg-stone-100 dark:bg-stone-800 rounded-2xl hover:bg-brand-500/10 hover:text-brand-600 transition-all border border-transparent dark:border-white/5 active:scale-90"
                    >
                        <HistoryIcon size={18} className="text-stone-800 dark:text-white" />
                    </button>
                </div>
            </div>

            <div className="relative group">
                <input 
                  type="text" 
                  placeholder="Busca comida, tiendas..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-white/5 border border-transparent dark:border-white/5 focus:border-brand-500/30 focus:bg-white dark:focus:bg-stone-950 py-3 pl-11 pr-4 rounded-2xl text-xs font-bold text-stone-900 dark:text-white placeholder:text-stone-400 transition-all outline-none"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-brand-500 transition-colors" size={16} />
            </div>
        </div>
      </div>
    </div>
    );
};
