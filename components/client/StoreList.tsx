
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
    <div className="sticky top-0 z-50 lg:relative lg:z-auto bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-3xl lg:bg-transparent lg:backdrop-blur-none border-b border-stone-200 dark:border-white/5 lg:border-none px-4 py-3 lg:p-0">
      <div className={`mx-auto max-w-lg lg:max-w-none w-full pointer-events-auto transition-all duration-500 ease-out ${isScrolled ? 'scale-95 lg:scale-100 translate-y-[-4px] lg:translate-y-0' : ''}`}>
        <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-3xl lg:bg-white lg:dark:bg-stone-900 border border-white/20 dark:border-white/[0.05] rounded-[2rem] lg:rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-2 lg:p-4 flex flex-col gap-2.5 lg:gap-3">
            <div className="flex justify-between items-center px-1 lg:px-2">
                <div id="location-selector" onClick={() => setShowLocationSelector(true)} className="cursor-pointer group flex-1 min-w-0 pr-4">
                    <p className="text-stone-400 dark:text-stone-500 text-[6px] lg:text-[7px] font-black uppercase tracking-[0.3em] mb-0.5">Entregar en</p>
                    <div className="flex items-center gap-1.5 lg:gap-2 text-stone-950 dark:text-white font-black text-xs lg:text-sm group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-all tracking-tighter truncate">
                        <MapPin size={12} className="text-brand-500 shrink-0 lg:w-3.5 lg:h-3.5" />
                        <span className="truncate">
                          {user.addresses && user.addresses.length > 0 ? user.addresses[0].split('(')[0] : '¿A dónde enviamos?'}
                        </span>
                        <ChevronDown size={12} className="text-stone-300 dark:text-stone-600 group-hover:translate-y-0.5 transition-transform shrink-0" />
                    </div>
                </div>
                
                <div className="flex items-center gap-1.5 lg:gap-2">
                    <button 
                      onClick={() => setClientViewState('HISTORY')}
                      className="w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center bg-stone-100/50 dark:bg-stone-800 rounded-xl lg:rounded-2xl hover:bg-brand-500/10 hover:text-brand-600 transition-all border border-transparent dark:border-white/5 active:scale-90"
                    >
                        <HistoryIcon size={16} className="text-stone-800 dark:text-white lg:w-4.5 lg:h-4.5" />
                    </button>
                    <button 
                      onClick={() => setClientViewState('FAVORITES')}
                      className="w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center bg-stone-100/50 dark:bg-stone-800 rounded-xl lg:rounded-2xl hover:bg-red-500/10 hover:text-red-500 transition-all border border-transparent dark:border-white/5 active:scale-90"
                    >
                        <Star size={16} className="text-stone-800 dark:text-white lg:w-4.5 lg:h-4.5" />
                    </button>
                </div>
            </div>

            <div className="relative group">
                <input type="text" 
                  placeholder="Busca comida, tiendas..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-white/5 border border-transparent dark:border-white/5 focus:border-brand-500/30 focus:bg-white dark:focus:bg-stone-950 py-2.5 lg:py-3 pl-10 lg:pl-11 pr-4 rounded-[1.25rem] lg:rounded-2xl text-[11px] lg:text-xs font-bold text-stone-900 dark:text-white placeholder:text-stone-400 transition-all outline-none"
                />
                <Search className="absolute left-3.5 lg:left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-brand-500 transition-colors" size={14} />
            </div>
        </div>
      </div>
    </div>
    );
};
