
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';
import { formatCurrency, APP_CONFIG } from '../../constants';
import { ArrowLeft, Settings, Camera, History, Heart, Ticket, Sparkles, Zap, Download, User, Mail, MapPin, Trash2, Check, WifiOff, ChevronRight, Plus } from 'lucide-react';
import { motion } from 'motion/react';

export const ProfileView: React.FC = () => {
    const { user, updateUser, setClientViewState, favorites, pastOrders, coupons, config, toggleSettings, setShowLocationSelector } = useApp();
    const { signOut } = useAuth();
    const { showToast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
        }
    }, [user]);

    const handleSave = () => {
        updateUser({ name, email });
        setIsEditing(false);
        showToast('Perfil actualizado', 'success');
    };

    if (!user) return null;

    return (
      <div className="h-full bg-stone-50 dark:bg-[#050505] animate-fade-in flex flex-col items-center">
          {/* Header Navigation */}
          <div className="w-full bg-white/90 dark:bg-stone-900/90 backdrop-blur-2xl px-6 lg:px-8 py-4 border-b border-black/[0.03] dark:border-white/[0.03] flex items-center justify-between z-50">
              <div className="flex items-center gap-4">
                  <button onClick={() => setClientViewState('BROWSE')} className="p-2 -ml-2 text-stone-900 dark:text-white hover:bg-stone-100 dark:hover:bg-white/5 rounded-xl transition-all active:scale-90"><ArrowLeft size={24}/></button>
                  <h2 className="text-xl font-black dark:text-white tracking-tighter">Mi Perfil</h2>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={toggleSettings} className="p-2.5 bg-stone-100 dark:bg-stone-800 rounded-xl text-stone-500 dark:text-stone-400 hover:text-brand-500 transition-colors shadow-sm"><Settings size={20} /></button>
              </div>
          </div>
          
          <div className="flex-1 w-full max-w-6xl mx-auto overflow-y-auto p-4 lg:p-8 scrollbar-hide pb-32">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* IDENTITY COLUMN */}
                  <div className="lg:col-span-4 space-y-4">
                      <div className="bg-white dark:bg-stone-900 p-6 lg:p-8 rounded-[2rem] border border-black/[0.02] dark:border-white/5 shadow-xl text-center relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-full h-1 bg-brand-500" />
                          <div className="relative inline-block mt-2">
                              <div className="w-24 h-24 bg-brand-500 rounded-3xl flex items-center justify-center text-brand-950 text-3xl font-black shadow-2xl shadow-brand-500/20 border-4 border-stone-50 dark:border-stone-800 transition-transform duration-1000 group-hover:rotate-6">
                                  {(user.name || '').split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
                              </div>
                              <button className="absolute -bottom-1 -right-1 bg-stone-950 dark:bg-white p-2 rounded-xl shadow-xl text-white dark:text-stone-950 hover:scale-110 active:scale-90 transition-all border-2 border-stone-50 dark:border-stone-800">
                                  <Camera size={16} strokeWidth={3} />
                              </button>
                          </div>
                          <div className="mt-6">
                              <h3 className="text-xl font-black text-stone-950 dark:text-white tracking-tighter leading-none truncate">{user.name}</h3>
                              <p className="mt-2 text-stone-400 text-[8px] font-black uppercase tracking-widest opacity-60 truncate">{user.email}</p>
                          </div>

                          <div className="w-full h-px bg-stone-100 dark:bg-white/5 my-6" />

                          <div className="grid grid-cols-3 gap-2">
                              {[
                                { label: 'PEDIDOS', value: pastOrders?.length || 0, icon: <History size={10} /> },
                                { label: 'FAV', value: favorites?.length || 0, icon: <Heart size={10} /> },
                                { label: 'CUPÓN', value: coupons?.length || 0, icon: <Ticket size={10} /> }
                              ].map((stat, i) => (
                                <div key={i} className="flex flex-col items-center gap-1 p-2 bg-stone-50 dark:bg-white/5 rounded-xl border border-black/[0.02] dark:border-white/5 transition-all hover:bg-white dark:hover:bg-white/10 shadow-sm">
                                    <div className="text-brand-500 opacity-50">{stat.icon}</div>
                                    <p className="text-sm font-black text-stone-950 dark:text-white leading-none tracking-tighter">{stat.value}</p>
                                    <p className="text-[6px] text-stone-400 uppercase font-black tracking-widest">{stat.label}</p>
                                </div>
                              ))}
                          </div>
                          
                          <div className="mt-6">
                              <span className="bg-brand-500/10 text-brand-600 dark:text-brand-400 px-4 py-1 rounded-full text-[7px] font-black tracking-widest uppercase border border-brand-500/20">MEMBRESIA ELITE</span>
                          </div>
                      </div>
                      
                      <button 
                        onClick={() => setClientViewState('HISTORY')}
                        className="w-full p-5 bg-stone-950 dark:bg-stone-900 rounded-[1.5rem] shadow-xl text-white flex items-center justify-between group overflow-hidden relative"
                      >
                         <div className="absolute inset-0 bg-gradient-to-r from-brand-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                         <div className="flex items-center gap-3 relative z-10">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
                                <History size={20} />
                            </div>
                            <div className="text-left font-black tracking-tighter">
                                <span className="text-base block leading-none">Mi Historial</span>
                                <span className="text-[8px] text-stone-400 uppercase tracking-widest mt-0.5 block">Compras pasadas</span>
                            </div>
                         </div>
                         <ChevronRight size={18} className="text-stone-500 group-hover:translate-x-1 transition-transform" />
                      </button>
                  </div>

                  {/* CONTENT GRID */}
                  <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* REFERRAL CARD */}
                      <div className="md:col-span-2 bg-brand-500 rounded-[2rem] p-8 shadow-xl relative overflow-hidden group flex items-center min-h-[220px]">
                          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-[3s] text-brand-950">
                              <Sparkles size={180} />
                          </div>
                          <div className="relative z-10 w-full px-2">
                              <div className="inline-flex items-center gap-2 bg-brand-950/10 px-3 py-1 rounded-full mb-4 border border-brand-950/10">
                                  <Zap size={12} fill="currentColor" className="text-brand-950" />
                                  <span className="text-[7px] font-black uppercase text-brand-950 tracking-widest">Referidos Gourmet</span>
                              </div>
                              <h4 className="font-black text-3xl tracking-tighter mb-2 leading-tight text-brand-950">Invita y Gana Crédito</h4>
                              <p className="text-brand-900/60 font-bold text-sm mb-6 leading-tight">Obtén {formatCurrency(config.referralRewardAmount)} por cada amigo.</p>
                              
                              <div className="flex flex-col sm:flex-row gap-2">
                                  <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-3 flex items-center justify-between border border-white/20">
                                      <div>
                                          <p className="text-[7px] font-black uppercase tracking-widest text-brand-950/40 mb-0.5">CÓDIGO</p>
                                          <p className="text-xl font-black tracking-tighter text-brand-950">{user.referralCode || 'ELITE...'}</p>
                                      </div>
                                      <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(user.referralCode || '');
                                            showToast('¡Código copiado!', 'success');
                                        }}
                                        className="w-10 h-10 bg-brand-950 text-white rounded-lg hover:scale-110 active:scale-90 transition-all shadow-lg flex items-center justify-center font-black"
                                      >
                                          <Download size={18} className="rotate-[-90deg]" strokeWidth={3} />
                                      </button>
                                  </div>
                                  <Button 
                                    className="px-6 !rounded-xl text-[10px] font-black tracking-widest !bg-brand-950 !text-white"
                                    onClick={() => {
                                        const text = `¡Usa mi código ${user.referralCode} en ${APP_CONFIG.appName} y obtén un descuento épico!`;
                                        if (navigator.share) {
                                            navigator.share({ title: APP_CONFIG.appName, text, url: window.location.origin });
                                        } else {
                                            navigator.clipboard.writeText(text);
                                            showToast('Invitación copiada', 'success');
                                        }
                                    }}
                                  >
                                      COMPARTIR
                                  </Button>
                              </div>
                          </div>
                      </div>

                      {/* DATA SECTIONS */}
                      <div className="bg-white dark:bg-stone-900 rounded-[2rem] p-6 shadow-xl border border-black/[0.02] dark:border-white/5 space-y-6">
                          <div className="flex justify-between items-center">
                            <h4 className="font-black text-lg text-stone-950 dark:text-white tracking-tighter">Mis Datos</h4>
                            {!isEditing && (
                                <button onClick={() => setIsEditing(true)} className="p-2.5 bg-stone-50 dark:bg-stone-800 rounded-xl text-brand-500 hover:rotate-90 transition-transform"><Plus size={18} /></button>
                            )}
                          </div>
                          
                          <div className="space-y-4">
                              <div className="space-y-1">
                                  <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5"><User size={9} /> Nombre</label>
                                  <input 
                                      type="text" 
                                      value={name} 
                                      onChange={(e) => setName(e.target.value)}
                                      disabled={!isEditing}
                                      className={`w-full bg-stone-50 dark:bg-stone-800 border-none rounded-xl px-4 py-3 text-base outline-none transition-all font-black tracking-tight ${isEditing ? 'ring-2 ring-brand-500/20' : ''} text-stone-950 dark:text-white`}
                                  />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5"><Mail size={9} /> Email</label>
                                  <input 
                                      type="email" 
                                      value={email} 
                                      onChange={(e) => setEmail(e.target.value)}
                                      disabled={true}
                                      className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-xl px-4 py-3 text-base outline-none transition-all font-black tracking-tight opacity-50 text-stone-950 dark:text-white"
                                  />
                              </div>
                          </div>

                          {isEditing && (
                              <div className="flex gap-2 pt-2">
                                  <Button variant="outline" fullWidth onClick={() => { setIsEditing(false); setName(user.name); setEmail(user.email); }} className="!rounded-lg py-3 text-[9px] font-black">DESCARTAR</Button>
                                  <Button fullWidth onClick={handleSave} className="!rounded-lg py-3 !bg-stone-950 !text-white dark:!bg-white dark:!text-stone-950 text-[9px] font-black">GUARDAR</Button>
                              </div>
                          )}
                      </div>

                      <div className="bg-white dark:bg-stone-900 rounded-[2rem] p-6 shadow-xl border border-black/[0.02] dark:border-white/5 space-y-6">
                          <div className="flex justify-between items-center">
                            <h4 className="font-black text-lg text-stone-950 dark:text-white tracking-tighter">Locación</h4>
                            <button onClick={() => setShowLocationSelector(true)} className="p-2.5 bg-brand-500 text-brand-950 rounded-xl shadow-lg hover:rotate-90 transition-transform">
                                <Plus size={18} />
                            </button>
                          </div>
                          
                          <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 scrollbar-hide">
                              {user.addresses?.map((addr, idx) => (
                                  <div key={idx} className="bg-stone-50 dark:bg-stone-800/30 p-4 rounded-xl border border-black/[0.02] dark:border-white/5 flex flex-col gap-3 hover:border-brand-500/20 transition-all group relative">
                                      <div className="flex items-center gap-3">
                                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${idx === 0 ? 'bg-brand-500 text-brand-950' : 'bg-white dark:bg-stone-900 text-stone-300'}`}>
                                              <MapPin size={16} />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                              <p className="text-sm font-black text-stone-950 dark:text-white truncate tracking-tight">{addr}</p>
                                          </div>
                                      </div>
                                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                          {idx !== 0 && (
                                              <button onClick={() => { updateUser({ addresses: [addr, ...user.addresses.filter(a => a !== addr)] }); showToast('Principal actualizado', 'success'); }} className="p-1.5 bg-white dark:bg-stone-700 rounded-lg text-brand-500 shadow-sm hover:scale-110 transition-all"><Check size={14} strokeWidth={4} /></button>
                                          )}
                                          <button onClick={() => { if (user.addresses.length <= 1) { showToast('Mínimo una dirección', 'error'); return; } updateUser({ addresses: user.addresses.filter(a => a !== addr) }); showToast('Eliminada', 'success'); }} className="p-1.5 bg-white dark:bg-stone-700 rounded-lg text-red-500 shadow-sm hover:scale-110 transition-all"><Trash2 size={14} strokeWidth={4} /></button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="md:col-span-2 pt-2">
                        <Button 
                          fullWidth 
                          variant="outline" 
                          className="!h-16 !rounded-[1.5rem] text-red-500 border-red-500/20 hover:bg-red-50 dark:hover:bg-red-950/20 font-black tracking-widest text-[10px] flex items-center justify-center gap-3" 
                          onClick={() => signOut()}
                        >
                            <WifiOff size={18} /> CERRAR SESIÓN
                        </Button>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    );
};
