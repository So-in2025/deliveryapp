
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';
import { formatCurrency, APP_CONFIG } from '../../constants';
import { ArrowLeft, Settings, Camera, History as HistoryIcon, Heart, Ticket, Zap, Copy, User, Mail, MapPin, Trash2, Check, WifiOff, ChevronRight, Plus, Award } from 'lucide-react';
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
                  {/* Duplicate settings button removed, using TopBar settings instead */}
              </div>
          </div>
          
          <div className="flex-1 w-full max-w-6xl mx-auto overflow-y-auto p-4 lg:p-8 scrollbar-hide pb-32">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* IDENTITY COLUMN */}
                  <div className="lg:col-span-4 space-y-6">
                      <div className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] border border-stone-200/80 dark:border-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] text-center relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-500 shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                          <div className="relative inline-block mt-4">
                              <div className="w-28 h-28 bg-brand-500 rounded-[2.5rem] flex items-center justify-center text-brand-950 text-4xl font-black shadow-2xl shadow-brand-500/30 border-4 border-white dark:border-stone-800 transition-transform duration-1000 group-hover:rotate-6">
                                  {(user.name || '').split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
                              </div>
                              <button className="absolute -bottom-2 -right-2 bg-stone-950 dark:bg-white p-3 rounded-2xl shadow-2xl text-white dark:text-stone-950 hover:scale-110 active:scale-90 transition-all border-4 border-white dark:border-stone-800">
                                  <Camera size={18} strokeWidth={3} />
                              </button>
                          </div>
                          <div className="mt-8">
                              <h3 className="text-2xl font-black text-stone-950 dark:text-white tracking-tighter leading-none truncate uppercase">{user.name}</h3>
                              <p className="mt-3 text-stone-400 text-[9px] font-black uppercase tracking-widest opacity-60 truncate bg-stone-50 dark:bg-white/5 py-1.5 px-4 rounded-full inline-block border border-stone-100 dark:border-white/5">{user.email}</p>
                          </div>

                          <div className="w-full h-px bg-stone-100 dark:bg-white/5 my-8" />

                          <div className="grid grid-cols-3 gap-3">
                              {[
                                { label: 'PEDIDOS', value: pastOrders?.length || 0, icon: <HistoryIcon size={12} /> },
                                { label: 'FAV', value: favorites?.length || 0, icon: <Heart size={12} /> },
                                { label: 'CUPÓN', value: coupons?.length || 0, icon: <Ticket size={12} /> }
                              ].map((stat, i) => (
                                <div key={i} className="flex flex-col items-center gap-1.5 p-3 bg-stone-50 dark:bg-white/5 rounded-2xl border border-stone-100 dark:border-white/10 transition-all hover:bg-white dark:hover:bg-white/10 shadow-sm hover:shadow-md hover:-translate-y-1">
                                    <div className="text-brand-500">{stat.icon}</div>
                                    <p className="text-base font-black text-stone-950 dark:text-white leading-none tracking-tighter">{stat.value}</p>
                                    <p className="text-[7px] text-stone-400 uppercase font-black tracking-widest leading-none">{stat.label}</p>
                                </div>
                              ))}
                          </div>
                          
                          <div className="mt-8">
                              <span className="bg-brand-500/10 text-brand-600 dark:text-brand-400 px-6 py-2 rounded-full text-[8px] font-black tracking-[0.2em] uppercase border border-brand-500/20 shadow-sm">CLIENTE FAVORITO</span>
                          </div>
                      </div>
                      
                      <button 
                        onClick={() => setClientViewState('HISTORY')}
                        className="w-full p-6 bg-stone-950 dark:bg-stone-900 rounded-[2rem] shadow-2xl text-white flex items-center justify-between group overflow-hidden relative border border-white/5"
                      >
                         <div className="absolute inset-0 bg-gradient-to-r from-brand-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                         <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white shadow-inner">
                                <HistoryIcon size={24} />
                            </div>
                            <div className="text-left font-black tracking-tighter">
                                <span className="text-lg block leading-none">Mi Historial</span>
                                <span className="text-[9px] text-stone-500 uppercase tracking-widest mt-1 block">Todas tus compras pasadas</span>
                            </div>
                         </div>
                         <div className="bg-white/10 p-2 rounded-xl group-hover:translate-x-2 transition-all">
                             <ChevronRight size={20} className="text-white" />
                         </div>
                      </button>
                  </div>

                  {/* CONTENT GRID */}
                  <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* REFERRAL CARD */}
                      <div className="md:col-span-2 bg-brand-500 rounded-[2rem] p-8 shadow-xl relative overflow-hidden group flex items-center min-h-[220px]">
                          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-[3s] text-brand-950">
                              <Award size={180} />
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
                                          <p className="text-xl font-black tracking-tighter text-brand-950">{user.referralCode || 'AMIGO...'}</p>
                                      </div>
                                      <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(user.referralCode || '');
                                            showToast('¡Código copiado!', 'success');
                                        }}
                                        className="w-10 h-10 bg-brand-950 text-white rounded-lg hover:scale-110 active:scale-90 transition-all shadow-lg flex items-center justify-center font-black"
                                      >
                                          <Copy size={18} strokeWidth={2.5} />
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
                      <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] border border-stone-200/80 dark:border-white/10 space-y-8 h-full">
                          <div className="flex justify-between items-center px-2">
                             <h4 className="font-black text-2xl text-stone-950 dark:text-white tracking-tighter flex items-center gap-3"><User className="text-brand-500" size={24} /> Mis Datos</h4>
                             {!isEditing && (
                                 <button onClick={() => setIsEditing(true)} className="p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-white/10 rounded-2xl text-stone-900 dark:text-white hover:bg-brand-500 hover:text-brand-950 transition-all shadow-sm"><Plus size={20} /></button>
                             )}
                          </div>
                          
                          <div className="space-y-6">
                              <div className="space-y-2 group">
                                  <label className="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] flex items-center gap-1.5 ml-2"><User size={10} /> Nombre Completo</label>
                                  <div className="relative">
                                    <input 
                                        type="text" 
                                        value={name} 
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={!isEditing}
                                        className={`w-full bg-stone-50 dark:bg-stone-900/50 border-2 rounded-[1.5rem] px-6 py-4 text-base outline-none transition-all font-black tracking-tight ${isEditing ? 'border-brand-500 bg-white ring-8 ring-brand-500/5 shadow-xl' : 'border-transparent text-stone-950 dark:text-white opacity-80'}`}
                                    />
                                    {!isEditing && <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20"><Check size={20} /></div>}
                                  </div>
                              </div>
                              <div className="space-y-2 opacity-60">
                                  <label className="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] flex items-center gap-1.5 ml-2"><Mail size={10} /> Correo Electrónico</label>
                                  <div className="relative">
                                    <input 
                                        type="email" 
                                        value={email} 
                                        disabled={true}
                                        className="w-full bg-stone-50 dark:bg-stone-900/50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-base outline-none font-black tracking-tight text-stone-500"
                                    />
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20"><Zap size={20} /></div>
                                  </div>
                              </div>
                          </div>

                          {isEditing && (
                              <div className="flex gap-3 pt-4 px-2">
                                  <Button variant="outline" fullWidth onClick={() => { setIsEditing(false); setName(user.name); setEmail(user.email); }} className="!rounded-2xl py-4 text-[10px] font-black tracking-widest border-stone-200">CANCELAR</Button>
                                  <Button fullWidth onClick={handleSave} className="!rounded-2xl py-4 !bg-stone-950 !text-white dark:!bg-brand-500 dark:!text-stone-950 text-[10px] font-black tracking-widest shadow-xl shadow-brand-500/20">GUARDAR CAMBIOS</Button>
                              </div>
                          )}
                      </div>

                      <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] border border-stone-200/80 dark:border-white/10 space-y-8 h-full">
                          <div className="flex justify-between items-center px-2">
                             <h4 className="font-black text-2xl text-stone-950 dark:text-white tracking-tighter flex items-center gap-3"><MapPin className="text-brand-500" size={24} /> Locación</h4>
                             <button onClick={() => setShowLocationSelector(true)} className="p-3 bg-brand-500 text-brand-950 rounded-2xl shadow-xl shadow-brand-500/20 hover:rotate-90 transition-all border border-brand-400/30">
                                 <Plus size={20} />
                             </button>
                          </div>
                          
                          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                              {user.addresses?.map((addr, idx) => (
                                  <div key={idx} className={`p-5 rounded-[1.8rem] border-2 transition-all group relative flex flex-col gap-4 ${idx === 0 ? 'bg-brand-500/5 border-brand-500 shadow-lg shadow-brand-500/5' : 'bg-stone-50 dark:bg-stone-800/30 border-stone-100 dark:border-white/5 hover:border-brand-500/40'}`}>
                                      <div className="flex items-center gap-4">
                                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${idx === 0 ? 'bg-brand-500 text-brand-950' : 'bg-white dark:bg-stone-900 text-stone-400 border border-stone-100 dark:border-white/10'}`}>
                                              <MapPin size={18} />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                              <p className={`text-sm font-black truncate tracking-tight uppercase ${idx === 0 ? 'text-stone-950 dark:text-brand-500' : 'text-stone-800 dark:text-white'}`}>{addr}</p>
                                              {idx === 0 && <p className="text-[8px] font-black text-brand-600 dark:text-brand-500 tracking-[0.2em] uppercase mt-1">Dirección Principal</p>}
                                          </div>
                                      </div>
                                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all">
                                          {idx !== 0 && (
                                              <button onClick={() => { updateUser({ addresses: [addr, ...user.addresses.filter(a => a !== addr)] }); showToast('Principal actualizado', 'success'); }} className="p-2 bg-white dark:bg-stone-700 rounded-xl text-emerald-500 shadow-xl hover:scale-110 active:scale-95 border border-stone-100 dark:border-white/10"><Check size={16} strokeWidth={4} /></button>
                                          )}
                                          <button onClick={() => { if (user.addresses.length <= 1) { showToast('Mínimo una dirección', 'error'); return; } updateUser({ addresses: user.addresses.filter(a => a !== addr) }); showToast('Eliminada', 'success'); }} className="p-2 bg-white dark:bg-stone-700 rounded-xl text-red-500 shadow-xl hover:scale-110 active:scale-95 border border-stone-100 dark:border-white/10"><Trash2 size={16} strokeWidth={4} /></button>
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
