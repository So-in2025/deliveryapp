
import React from 'react';
import { useApp } from '../../context/AppContext';
import { StoreCard } from '../ui/StoreCard'; // Assume we need to export StoreCard too
import { ArrowLeft, Heart } from 'lucide-react';
import { Button } from '../ui/Button';

export const FavoritesView: React.FC = () => {
    const { stores, favorites, toggleFavorite, setClientViewState, setSelectedStore, handleShareStore } = useApp();
    const favoriteStores = stores.filter(s => favorites.includes(s.id));

    return (
      <div className="h-full bg-stone-50 dark:bg-stone-950 animate-fade-in flex flex-col">
          <div className="flex items-center gap-4 bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl px-6 py-4 border-b border-black/[0.03] dark:border-white/[0.03] sticky top-0 z-10">
              <button onClick={() => setClientViewState('BROWSE')} className="p-2.5 -ml-2 text-stone-900 dark:text-white hover:bg-stone-100 dark:hover:bg-white/5 rounded-2xl transition-colors"><ArrowLeft size={24} /></button>
              <h2 className="text-2xl font-black dark:text-white tracking-tight">Mis Favoritos</h2>
          </div>
          
          <div className="p-6 space-y-6 flex-1 overflow-y-auto pb-24 lg:w-full">
              {favoriteStores.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                      <div className="w-24 h-24 bg-red-50 dark:bg-red-900/10 rounded-[2.5rem] flex items-center justify-center text-red-500 shadow-inner">
                          <Heart size={48} strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-stone-950 dark:text-white tracking-tight">Sin favoritos aún</h3>
                        <p className="text-stone-500 dark:text-stone-400 font-medium mt-2 max-w-[250px] mx-auto">Guarda tus tiendas preferidas para encontrarlas más rápido.</p>
                      </div>
                      <Button onClick={() => setClientViewState('BROWSE')} className="!rounded-2xl px-8 py-4 font-black tracking-widest bg-stone-950 dark:bg-white text-white dark:text-stone-950">EXPLORAR TIENDAS</Button>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {favoriteStores.map((store, idx) => (
                          <div key={store.id}>
                             {/* Assuming StoreCard is extracted to a common components folder */}
                             <StoreCard 
                                store={store} 
                                onClick={setSelectedStore} 
                                index={idx}
                                isFavorite={true}
                                onToggleFavorite={(e) => { e.stopPropagation(); toggleFavorite(store.id); }}
                                onShare={handleShareStore}
                            />
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </div>
    );
};
