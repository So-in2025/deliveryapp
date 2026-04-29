
import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { OrderStatus, Order, PaymentMethod, OrderType, Product, ModifierGroup, Modifier, Store, UserRole } from '../types';
import { Button } from '../components/ui/Button';
import { Badge, PaymentBadge } from '../components/ui/Badge';
import { LazyImage } from '../components/ui/LazyImage';
import { MapPin, CheckCircle, Clock, Bike, User, CreditCard, Banknote, StickyNote, Store as StoreIcon, ShoppingBag, Plus, Pencil, Trash2, X, UtensilsCrossed, LayoutDashboard, Ticket, ToggleLeft, ToggleRight, Upload, Download, FileText, Image as ImageIcon, MessageSquare, History as HistoryIcon } from 'lucide-react';
import { formatCurrency } from '../constants';
import { extractProductsFromMenu } from '../services/geminiService';
import * as XLSX from 'xlsx';
import { uploadImageToCloudinary } from '../services/cloudinaryService';
import { soundService } from '../services/soundService';
import { ChatOverlay } from '../components/ui/ChatOverlay';

import { OnboardingTour, TourStep } from '../components/ui/OnboardingTour';

 const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
  const { updateOrder, cancelOrder } = useApp();
  const { showToast } = useToast();
  const [showChat, setShowChat] = useState(false);

  const getNextStatus = () => {
    switch (order.status) {
      case OrderStatus.PENDING: return OrderStatus.ACCEPTED;
      case OrderStatus.ACCEPTED: return OrderStatus.PREPARING;
      case OrderStatus.PREPARING: return OrderStatus.READY; 
      case OrderStatus.READY: return order.type === OrderType.PICKUP ? OrderStatus.DELIVERED : null;
      default: return null;
    }
  };

  const getActionLabel = () => {
    switch (order.status) {
      case OrderStatus.PENDING: return 'Aceptar';
      case OrderStatus.ACCEPTED: return 'Preparar';
      case OrderStatus.PREPARING: return order.type === OrderType.PICKUP ? 'Pedido Listo' : 'Listo para Envío';
      case OrderStatus.READY: return order.type === OrderType.PICKUP ? 'Entregar Pago' : 'Esperando Repartidor';
      default: return '';
    }
  };

  const handleAction = () => {
    const nextStatus = getNextStatus();
    if (nextStatus) {
      updateOrder(order.id, nextStatus);
      showToast(`Estado actualizado: ${nextStatus}`, 'success');
    }
  };

  const handleCancel = () => {
    const reason = window.confirm('¿Confirmas la cancelación de este pedido?');
    if (reason) {
      cancelOrder(order.id, 'Cancelado por el comercio');
      showToast('Pedido rechazado', 'info');
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200 dark:border-white/5 overflow-hidden transition-all hover:border-brand-500/30 group p-2">
        <div className="bg-stone-50 dark:bg-black/20 rounded-[1.5rem] p-5">
            {/* Header: ID, Type & Status */}
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em]">#{order.id.slice(-6).toUpperCase()}</span>
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                    order.type === OrderType.PICKUP ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-brand-500 text-brand-950'
                }`}>
                    {order.type === OrderType.PICKUP ? <StoreIcon size={12} /> : <Bike size={12} />}
                    {order.type === OrderType.PICKUP ? 'Retiro' : 'Delivery'}
                </div>
              </div>
              <Badge status={order.status} />
            </div>

            {/* Customer & Address */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-3">
              <div className="flex-1 min-w-0 w-full">
                <div className="flex items-center gap-2 text-stone-950 dark:text-white">
                    <User size={14} className="text-stone-400 shrink-0" />
                    <h4 className="text-xl font-black uppercase tracking-tight truncate leading-none">{order.customerName}</h4>
                </div>
                {order.type === OrderType.DELIVERY && (
                    <div className="flex items-center gap-1 text-[10px] text-stone-400 font-bold mt-1.5">
                        <MapPin size={12} className="text-brand-500 shrink-0" />
                        <span className="truncate">{order.customerAddress ? order.customerAddress.split(',')[0] : 'Sin dirección'}</span>
                    </div>
                )}
              </div>
              <div className="text-left sm:text-right shrink-0">
                 <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">Total</p>
                 <p className="text-2xl font-black text-stone-950 dark:text-brand-500 tracking-tighter leading-none">{formatCurrency(order.total)}</p>
              </div>
            </div>

            {/* Items List - Ultra Clean */}
            <div className="bg-white dark:bg-stone-950 border border-stone-100 dark:border-white/5 rounded-2xl p-4 mb-5 shadow-sm">
                <div className="space-y-2.5">
                    {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-3">
                                <span className="w-6 h-6 flex items-center justify-center bg-stone-100 dark:bg-stone-800 rounded-lg font-black text-stone-950 dark:text-white text-[10px]">{item.quantity}</span>
                                <span className="font-bold text-stone-700 dark:text-stone-300 uppercase tracking-tight">{item.product.name}</span>
                            </div>
                            <span className="text-stone-400 font-mono text-[10px]">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Zone */}
            <div className="flex gap-2.5">
                <button 
                  onClick={() => setShowChat(true)}
                  className="w-14 h-14 flex items-center justify-center rounded-2xl bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-brand-500 hover:bg-brand-500/10 transition-all active:scale-95 border border-transparent dark:border-white/5"
                >
                  <MessageSquare size={22} />
                </button>

                {getNextStatus() ? (
                  <button 
                    onClick={handleAction}
                    className="flex-1 h-14 bg-brand-500 hover:bg-brand-600 text-brand-950 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg shadow-brand-500/20 active:translate-y-0.5"
                  >
                    {getActionLabel()}
                    <CheckCircle size={18} strokeWidth={3} />
                  </button>
                ) : (
                  <div className="flex-1 h-14 bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center">
                     En Proceso...
                  </div>
                )}

                {['PENDING', 'ACCEPTED'].includes(order.status) && (
                   <button 
                      onClick={handleCancel}
                      className="w-14 h-14 flex items-center justify-center rounded-2xl bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95 border border-red-500/10"
                   >
                      <X size={22} />
                   </button>
                )}
            </div>
        </div>
      </div>

      <ChatOverlay 
          orderId={order.id} 
          isOpen={showChat} 
          onClose={() => setShowChat(false)} 
          title={`Chat con ${order.customerName}`} 
      />
    </>
  );
};

const CouponManager: React.FC = () => {
    const { addCoupon, coupons, deleteCoupon, toggleCoupon, user } = useApp();
    const { showToast } = useToast();
    const [newCode, setNewCode] = useState('');
    const [newDiscount, setNewDiscount] = useState('');
    const [newDesc, setNewDesc] = useState('');

    const handleAdd = () => {
        if(!newCode || !newDiscount) return;
        addCoupon({
            id: `cpn-${Date.now()}`,
            code: newCode.toUpperCase(),
            discountPct: Number(newDiscount) / 100,
            active: true,
            description: newDesc,
            storeId: user.ownedStoreId
        });
        setNewCode('');
        setNewDiscount('');
        setNewDesc('');
        showToast('Cupón creado', 'success');
    };

    return (
        <div className="pb-24">
            <div className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] border border-stone-200/80 dark:border-white/10 mb-8 space-y-6">
                <h3 className="font-black text-2xl text-stone-950 dark:text-white tracking-tighter uppercase flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center text-brand-500 border border-brand-500/20">
                        <Ticket size={22} />
                    </div>
                    Crear Nuevo Cupón
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase">Código</label>
                        <input 
                            className="w-full bg-stone-50 dark:bg-stone-900/50 border border-stone-100 dark:border-white/5 rounded-lg px-3 py-2 font-mono uppercase font-black text-stone-900 dark:text-white"
                            placeholder="Ej: VERANO20"
                            value={newCode}
                            onChange={e => setNewCode(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="w-1/3">
                            <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase">Descuento %</label>
                            <input 
                                type="number"
                                className="w-full bg-stone-50 dark:bg-stone-900/50 border border-stone-100 dark:border-white/5 rounded-lg px-3 py-2 font-black text-stone-900 dark:text-white"
                                placeholder="20"
                                value={newDiscount}
                                onChange={e => setNewDiscount(e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase">Descripción</label>
                            <input 
                                className="w-full bg-stone-50 dark:bg-stone-900/50 border border-stone-100 dark:border-white/5 rounded-lg px-3 py-2 text-stone-900 dark:text-white"
                                placeholder="Para nuevos clientes"
                                value={newDesc}
                                onChange={e => setNewDesc(e.target.value)}
                            />
                        </div>
                    </div>
                    <Button fullWidth onClick={handleAdd} disabled={!newCode || !newDiscount}>Crear Cupón</Button>
                </div>
            </div>

            <h3 className="font-black text-xl text-stone-950 dark:text-white mb-6 uppercase tracking-tighter px-2">Cupones de la Casa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {coupons.length === 0 && <p className="text-stone-400 dark:text-stone-500 text-center py-4 lg:col-span-2">No hay cupones creados.</p>}
                {coupons.map(coupon => (
                    <div key={coupon.id} className={`bg-white dark:bg-stone-800 p-4 rounded-xl shadow-sm border flex justify-between items-center ${coupon.active ? 'border-brand-200 dark:border-brand-900/30' : 'border-amber-300 dark:border-stone-700 opacity-60'}`}>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-lg text-stone-900 dark:text-white">{coupon.code}</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${coupon.active ? 'bg-brand-500 text-brand-950' : 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400'}`}>
                                    {coupon.active ? 'ACTIVO' : 'INACTIVO'}
                                </span>
                            </div>
                            <p className="text-stone-500 dark:text-stone-400 text-sm">{coupon.discountPct * 100}% OFF • {coupon.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => toggleCoupon(coupon.id)} className="p-2 text-stone-400 dark:text-stone-500 hover:text-brand-800 dark:hover:text-brand-400">
                                {coupon.active ? <ToggleRight size={24} className="text-brand-800 dark:text-brand-400" /> : <ToggleLeft size={24} />}
                            </button>
                            <button onClick={() => deleteCoupon(coupon.id)} className="p-2 text-stone-400 dark:text-stone-500 hover:text-red-500 dark:hover:text-red-400">
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
};

const BulkProductUpload: React.FC<{ storeId: string }> = ({ storeId }) => {
  const { bulkAddProducts } = useApp();
  const { showToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [reviewProducts, setReviewProducts] = useState<Product[] | null>(null);
  const smartInputRef = useRef<HTMLInputElement>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { Nombre: 'Hamburguesa Clásica', Descripcion: 'Carne, queso, lechuga', Precio: 1200, Categoria: 'Hamburguesas', ImagenURL: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd' },
      { Nombre: 'Papas Fritas', Descripcion: 'Porción grande', Precio: 600, Categoria: 'Acompañamientos', ImagenURL: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Productos");
    XLSX.writeFile(wb, "plantilla_productos.xlsx");
  };

  const smartMapExcel = (data: any[]): Product[] => {
    // Mapeo inteligente de encabezados
    const mappings = {
      name: ['nombre', 'name', 'producto', 'item', 'artículo', 'product', 'designacion'],
      description: ['descripcion', 'description', 'detalle', 'pormenores', 'info'],
      price: ['precio', 'price', 'costo', 'valor', 'amount', 'p.unitario', 'prec'],
      category: ['categoria', 'category', 'rubro', 'grupo', 'seccion', 'tipo'],
      image: ['imagen', 'image', 'imagenurl', 'url', 'foto', 'pic']
    };

    return data.map(item => {
      const keys = Object.keys(item).map(k => k.toLowerCase().trim());
      const findVal = (list: string[]) => {
        const key = Object.keys(item).find(k => list.includes(k.toLowerCase().trim()));
        return key ? item[key] : null;
      };

      const name = findVal(mappings.name);
      const price = findVal(mappings.price);
      
      if (!name || isNaN(Number(price))) return null;

      return {
        id: `prod-bulk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: String(name),
        description: String(findVal(mappings.description) || ''),
        price: Number(price),
        category: String(findVal(mappings.category) || 'General'),
        image: String(findVal(mappings.image) || `https://images.unsplash.com/featured/?${encodeURIComponent(String(name))}`),
        modifierGroups: [],
        isAvailable: true
      };
    }).filter(Boolean) as Product[];
  };

  const handleSmartFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    setIsUploading(true);
    
    try {
      if (['xlsx', 'xls', 'csv'].includes(extension || '')) {
        const reader = new FileReader();
        reader.onload = async (evt) => {
          try {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws);
            const products = smartMapExcel(data);
            
            if (products.length > 0) {
              setReviewProducts(products);
            } else {
              showToast('No se encontraron productos válidos en el archivo', 'error');
            }
          } catch (err) {
            showToast('Error al procesar el Excel', 'error');
          } finally {
            setIsUploading(false);
          }
        };
        reader.readAsBinaryString(file);
      } else if (['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(extension || '')) {
        showToast('Iniciando escaneo con IA de alto nivel...', 'info');
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        const base64Data = await base64Promise;
        const products = await extractProductsFromMenu(base64Data);

        if (products && products.length > 0) {
          setReviewProducts(products);
        } else {
          showToast('La IA no pudo identificar productos claros', 'warning');
        }
      } else {
        showToast('Formato no soportado (Usa Excel, PDF o Imagen)', 'error');
      }
    } catch (err) {
      showToast('Error de procesamiento crítico', 'error');
    } finally {
      setIsUploading(false);
      if (smartInputRef.current) smartInputRef.current.value = '';
      if (aiInputRef.current) aiInputRef.current.value = '';
    }
  };

  const handleConfirmImport = async (products: Product[]) => {
    try {
      setIsUploading(true);
      await bulkAddProducts(storeId, products);
      showToast(`${products.length} productos integrados exitosamente`, 'success');
      setReviewProducts(null);
    } catch (err) {
      showToast('Error al guardar en el servidor', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-stone-900 border border-white/10 p-8 rounded-[2.5rem] mb-12 shadow-2xl relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-white font-black text-2xl mb-1 flex items-center gap-3 tracking-tighter uppercase">
              <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-brand-950 shadow-lg shadow-brand-500/20">
                <Upload size={20} strokeWidth={3} />
              </div>
              Importación Inteligente
            </h3>
            <p className="text-stone-400 text-sm font-medium">Escanea menús físicos o importa inventarios digitales en segundos.</p>
          </div>
          <button 
            onClick={downloadTemplate}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-stone-300 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-white/5"
          >
            <Download size={14} /> Plantilla
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            type="file" 
            ref={smartInputRef} 
            onChange={handleSmartFile} 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
          />
          <input 
            type="file" 
            ref={aiInputRef} 
            onChange={handleSmartFile} 
            accept="image/*, application/pdf" 
            className="hidden" 
          />
          
          <button 
            onClick={() => smartInputRef.current?.click()}
            disabled={isUploading}
            className="group h-24 bg-stone-800/50 hover:bg-stone-800 rounded-3xl flex items-center px-6 gap-5 transition-all border border-white/5 disabled:opacity-50"
          >
            <div className="w-12 h-12 bg-stone-700 rounded-2xl flex items-center justify-center text-stone-400 group-hover:text-white transition-colors">
              <FileText size={24} />
            </div>
            <div className="text-left">
              <span className="block text-white font-black text-base leading-none">Excel / CSV</span>
              <span className="block text-[10px] text-stone-500 uppercase tracking-widest mt-2">Mapeo Automático de Columnas</span>
            </div>
          </button>

          <button 
            onClick={() => aiInputRef.current?.click()}
            disabled={isUploading}
            className="group h-24 bg-brand-500 rounded-3xl flex items-center px-6 gap-5 transition-all shadow-xl shadow-brand-500/10 hover:translate-y-[-2px] disabled:opacity-50"
          >
            <div className="w-12 h-12 bg-brand-600/50 rounded-2xl flex items-center justify-center text-brand-950">
              <ImageIcon size={24} />
            </div>
            <div className="text-left text-brand-950">
              <span className="block font-black text-base leading-none">Escanear con IA</span>
              <span className="block text-[10px] text-brand-900/60 uppercase tracking-widest mt-2 font-bold italic">Sube Foto de tu Menú</span>
            </div>
          </button>
        </div>

        {/* Demo Assets Helper */}
        <div className="mt-8 pt-8 border-t border-white/5 flex flex-wrap gap-6 items-center">
            <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.3em]">Kit de Media para Demo:</span>
            <a href="/demo_productos.csv" download className="text-[11px] font-bold text-stone-400 hover:text-white transition-colors flex items-center gap-2">
                <Download size={14} /> CSV de Prueba
            </a>
            <a href="/menu_demo_ia.txt" target="_blank" className="text-[11px] font-bold text-stone-400 hover:text-white transition-colors flex items-center gap-2">
                <FileText size={14} /> Menú para IA (.txt)
            </a>
        </div>
      </div>

      {isUploading && (
        <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white font-black uppercase tracking-[0.3em] text-xs">Analizando Datos...</p>
        </div>
      )}

      {reviewProducts && (
        <ImportReviewModal 
          products={reviewProducts} 
          onCancel={() => setReviewProducts(null)} 
          onConfirm={handleConfirmImport} 
        />
      )}
    </div>
  );
};

const ImportReviewModal: React.FC<{ 
  products: Product[], 
  onCancel: () => void, 
  onConfirm: (products: Product[]) => void 
}> = ({ products, onCancel, onConfirm }) => {
  const [data, setData] = useState<Product[]>(products);

  const handleDelete = (id: string) => {
    setData(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdate = (id: string, field: keyof Product, value: any) => {
    setData(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-stone-950/90 backdrop-blur-2xl flex items-center justify-center p-4 lg:p-12">
      <div className="w-full max-w-5xl bg-white dark:bg-stone-900 rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white/10">
        <div className="p-8 border-b border-stone-100 dark:border-white/5 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-stone-900 dark:text-white tracking-tighter uppercase">Revisar Importación</h2>
            <p className="text-stone-400 font-bold uppercase text-[10px] tracking-widest mt-1">Verifica y edita los productos antes de integrarlos</p>
          </div>
          <button onClick={onCancel} className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500 tracking-widest font-black text-[10px] hover:bg-stone-200 transition-colors">CERRAR</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
          {data.map((prod, idx) => (
            <div key={prod.id} className="group bg-stone-50 dark:bg-black/20 p-5 rounded-[2rem] border border-transparent hover:border-brand-500/20 transition-all flex flex-col md:flex-row gap-6 items-center">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg shrink-0 border-2 border-white dark:border-stone-700">
                <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                <div className="md:col-span-1">
                  <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-1">Nombre</label>
                  <input 
                    value={prod.name} 
                    onChange={e => handleUpdate(prod.id, 'name', e.target.value)}
                    className="w-full bg-white dark:bg-stone-800 border-none rounded-xl px-4 py-2 font-bold text-stone-900 dark:text-white focus:ring-2 ring-brand-500/50"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-1">Precio</label>
                  <input 
                    type="number"
                    value={prod.price} 
                    onChange={e => handleUpdate(prod.id, 'price', Number(e.target.value))}
                    className="w-full bg-white dark:bg-stone-800 border-none rounded-xl px-4 py-2 font-black text-brand-600 dark:text-brand-500 focus:ring-2 ring-brand-500/50"
                  />
                </div>
                <div className="md:col-span-1">
                   <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-1">Categoría</label>
                   <input 
                    value={prod.category || 'General'} 
                    onChange={e => handleUpdate(prod.id, 'category', e.target.value)}
                    className="w-full bg-white dark:bg-stone-800 border-none rounded-xl px-4 py-2 font-bold text-stone-500 focus:ring-2 ring-brand-500/50"
                  />
                </div>
              </div>
              <button 
                onClick={() => handleDelete(prod.id)}
                className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shrink-0"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-8 border-t border-stone-100 dark:border-white/5 bg-stone-50 dark:bg-stone-800/30">
          <div className="flex gap-4">
            <button 
              onClick={onCancel}
              className="px-8 h-14 rounded-2xl border border-stone-200 dark:border-white/10 text-stone-500 font-black uppercase tracking-widest text-xs hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
            >
              Descartar Todo
            </button>
            <button 
              onClick={() => onConfirm(data)}
              className="flex-1 h-14 bg-brand-500 text-brand-950 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-brand-500/20 hover:scale-[1.01] transition-all"
            >
              Confirmar e Integrar {data.length} Productos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductEditor: React.FC<{ store: Store }> = ({ store: myStore }) => {
  const { addProduct, updateProduct, deleteProduct } = useApp();
  const { showToast } = useToast();
  const [editingProduct, setEditingProduct] = useState<Product | 'NEW' | null>(null);
  
  // Use string states for numbers to allow clearing the input
  const [formData, setFormData] = useState({
    name: '', 
    description: '', 
    price: '', 
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c', 
    modifierGroups: [] as ModifierGroup[],
    isAvailable: true
  });
  
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenEdit = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ 
        name: product.name,
        description: product.description || '',
        price: String(product.price),
        image: product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
        modifierGroups: JSON.parse(JSON.stringify(product.modifierGroups || [])),
        isAvailable: product.isAvailable !== false
      });
    } else {
      setEditingProduct('NEW');
      setFormData({ 
        name: '', 
        description: '', 
        price: '', 
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c', 
        modifierGroups: [],
        isAvailable: true
      });
    }
  };

  // Helper logic for modifiers
  const _addModifierGroup = () => {
      const newGroup: ModifierGroup = { id: `mg-${Date.now()}`, name: 'Nuevo Grupo', min: 0, max: 1, options: [] };
      setFormData(prev => ({ ...prev, modifierGroups: [...(prev.modifierGroups || []), newGroup] }));
  };
  const _removeModifierGroup = (groupId: string) => {
      setFormData(prev => ({ ...prev, modifierGroups: prev.modifierGroups?.filter(g => g.id !== groupId) }));
  };
  const _updateGroup = (groupId: string, field: keyof ModifierGroup, value: string | number) => {
      setFormData(prev => ({ ...prev, modifierGroups: prev.modifierGroups?.map(g => g.id === groupId ? { ...g, [field]: value } : g) }));
  };
  const _addOptionToGroup = (groupId: string) => {
      setFormData(prev => ({ ...prev, modifierGroups: prev.modifierGroups?.map(g => g.id !== groupId ? g : { ...g, options: [...g.options, { id: `opt-${Date.now()}`, name: 'Opción', price: 0 }] }) }));
  };
  const _removeOption = (groupId: string, optionId: string) => {
      setFormData(prev => ({ ...prev, modifierGroups: prev.modifierGroups?.map(g => g.id !== groupId ? g : { ...g, options: g.options.filter(o => o.id !== optionId) }) }));
  };
  const _updateOption = (groupId: string, optionId: string, field: keyof Modifier, value: string | number) => {
      setFormData(prev => ({ ...prev, modifierGroups: prev.modifierGroups?.map(g => g.id !== groupId ? g : { ...g, options: g.options.map(o => o.id === optionId ? { ...o, [field]: value } : o) }) }));
  };


  const handleSave = () => {
    if (!formData.name || formData.price === '') {
      showToast('Nombre y precio son obligatorios', 'error');
      return;
    }
    const productData: Product = {
        id: editingProduct === 'NEW' ? `prod-${Date.now()}` : (editingProduct as Product).id,
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        image: formData.image,
        modifierGroups: formData.modifierGroups,
        isAvailable: formData.isAvailable
    };

    if (editingProduct === 'NEW') {
      addProduct(myStore.id, productData);
      showToast('Producto creado', 'success');
    } else {
      updateProduct(myStore.id, productData);
      showToast('Producto actualizado', 'success');
    }
    setEditingProduct(null);
  };

  const handleDelete = (id: string) => {
    deleteProduct(myStore.id, id);
    showToast('Producto eliminado', 'success');
    setEditingProduct(null);
  };

  return (
    <div className="pb-24">
      <BulkProductUpload storeId={myStore.id} />
      <div className="flex justify-between items-center mb-8 px-2">
        <div className="text-stone-400 dark:text-stone-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            Catálogo: {myStore.products.length} productos
        </div>
        <Button id="btn-new-product" size="sm" onClick={() => handleOpenEdit()} className="!rounded-xl px-6 font-black tracking-widest text-[10px]">
          <Plus size={16} className="mr-1.5" /> AÑADIR PRODUCTO
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 xl:gap-8">
        {myStore.products.length === 0 && (
            <div className="text-center py-16 bg-stone-50 dark:bg-stone-900/50 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-[2.5rem] md:col-span-2 lg:col-span-2 xl:col-span-3 2xl:col-span-4">
                <p className="text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest text-xs">Crea tu primer producto para empezar a vender</p>
            </div>
        )}
        {myStore.products.map((product: Product) => (
          <div key={product.id} className="bg-white dark:bg-stone-900 p-5 rounded-[2rem] shadow-[0_15px_40px_-12px_rgba(0,0,0,0.05)] border border-stone-200/80 dark:border-white/5 flex gap-5 items-center group hover:border-brand-500/30 transition-all active:scale-98">
            <div className="w-20 h-20 rounded-2xl bg-stone-50 dark:bg-stone-800 overflow-hidden shrink-0 border border-stone-100 dark:border-white/5 shadow-inner">
              <LazyImage src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-black text-stone-950 dark:text-white text-base tracking-tighter uppercase truncate leading-none pt-1">{product.name}</h4>
                {product.isAvailable === false && (
                    <span className="text-[7px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-lg font-black uppercase tracking-widest">AGOTADO</span>
                )}
              </div>
              <p className="text-[10px] text-stone-400 dark:text-stone-500 font-bold line-clamp-1 mb-2">{product.description}</p>
              <div className="flex items-center gap-2">
                  <p className="font-black text-brand-700 dark:text-brand-500 text-lg tracking-tighter leading-none">{formatCurrency(product.price)}</p>
              </div>
            </div>
            <button onClick={() => handleOpenEdit(product)} className="w-12 h-12 flex items-center justify-center bg-stone-50 dark:bg-stone-800 rounded-2xl text-stone-400 hover:text-brand-500 hover:bg-brand-500/10 transition-all border border-stone-100 dark:border-white/5 shadow-sm">
              <Pencil size={20} />
            </button>
          </div>
        ))}
      </div>

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
           <div className="bg-white dark:bg-stone-900 w-full max-w-lg max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-white/10">
               <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-white dark:bg-stone-900">
                  <h3 className="text-xl font-black text-stone-950 dark:text-white uppercase tracking-tight">Editar Producto</h3>
                  <button 
                    onClick={() => setEditingProduct(null)} 
                    className="w-10 h-10 flex border dark:border-stone-800 items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  >
                    <X size={20} className="dark:text-white" />
                  </button>
               </div>
               
               <div className="p-8 overflow-y-auto space-y-8 flex-1 scrollbar-hide">
                   <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Información General</label>
                        <input 
                            className="w-full bg-stone-50 dark:bg-stone-800 border-none p-4 rounded-2xl dark:text-white font-bold ring-2 ring-transparent focus:ring-brand-500 transition-all outline-none" 
                            placeholder="Nombre del producto" 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                        />
                        <div className="relative group/price">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-2xl group-focus-within/price:text-brand-500 transition-colors">$</span>
                            <input 
                                className="w-full bg-stone-100 dark:bg-stone-800 border-none p-6 pl-12 rounded-[2rem] dark:text-white font-black text-4xl ring-4 ring-transparent focus:ring-brand-500/20 transition-all outline-none placeholder:text-stone-300" 
                                placeholder="0" 
                                type="text"
                                inputMode="decimal"
                                value={formData.price} 
                                onFocus={(e) => e.target.select()}
                                onChange={e => {
                                    const val = e.target.value.replace(/[^0-9.]/g, '');
                                    // Allow empty for deleting, but save handles it
                                    setFormData({...formData, price: val});
                                }} 
                            />
                        </div>
                        <textarea 
                            className="w-full bg-stone-50 dark:bg-stone-800 border-none p-4 rounded-2xl dark:text-white font-medium min-h-[100px] ring-2 ring-transparent focus:ring-brand-500 transition-all outline-none" 
                            placeholder="Descripción detallada..." 
                            value={formData.description} 
                            onChange={e => setFormData({...formData, description: e.target.value})} 
                        />
                           <div className="space-y-4">
                        <div className="flex justify-between items-center px-2">
                             <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Imagen Premium</label>
                             {isUploadingImage && <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />}
                        </div>
                        
                        <div 
                            onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                            className="relative aspect-video rounded-[3rem] bg-stone-100 dark:bg-stone-800 overflow-hidden cursor-pointer group border-4 border-dashed border-stone-200 dark:border-stone-700 hover:border-brand-500 transition-all shadow-inner"
                        >
                            {formData.image ? (
                                <>
                                    <LazyImage src={formData.image} alt="Preview" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-stone-950/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md">
                                        <div className="bg-brand-500 p-5 rounded-[1.5rem] shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                            <Upload className="text-brand-950" size={32} />
                                        </div>
                                        <p className="text-white font-black uppercase tracking-[0.2em] text-xs mt-6">Cambiar Foto</p>
                                    </div>
                                    {/* Edit Badge */}
                                    <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-xl px-4 py-2 rounded-xl text-[10px] font-black text-white uppercase tracking-widest border border-white/20">
                                        Editar
                                    </div>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-stone-50 dark:bg-stone-900/50">
                                    <div className="w-20 h-20 bg-white dark:bg-stone-800 rounded-[2rem] shadow-xl flex items-center justify-center">
                                        <ImageIcon size={40} className="text-brand-500" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-[0.1em]">Subir Imagen</p>
                                        <p className="text-[10px] text-stone-400 font-bold mt-1">Formatos: JPG, PNG, WEBP</p>
                                    </div>
                                </div>
                            )}
                        </div>              </div>
                        
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            accept="image/*" 
                            className="hidden"
                            onChange={async (e) => {
                                if (e.target.files && e.target.files[0]) {
                                    try {
                                        setIsUploadingImage(true);
                                        const url = await uploadImageToCloudinary(e.target.files[0]);
                                        setFormData({...formData, image: url});
                                        showToast('Imagen actualizada', 'success');
                                    } catch (error: any) {
                                        console.error('Image upload error:', error);
                                        showToast(error.message || 'Error al subir imagen', 'error');
                                    } finally {
                                        setIsUploadingImage(false);
                                    }
                                }
                            }} 
                            disabled={isUploadingImage} 
                        />
                   </div>
                   
                   <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${formData.isAvailable ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                <CheckCircle size={18} />
                            </div>
                            <span className="text-sm font-bold dark:text-white uppercase tracking-tight">Venta habilitada</span>
                        </div>
                        <button 
                            onClick={() => setFormData({...formData, isAvailable: !formData.isAvailable})}
                            className={`w-12 h-6 rounded-full relative transition-colors ${formData.isAvailable ? 'bg-brand-500' : 'bg-stone-300 dark:bg-stone-600'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isAvailable ? 'right-1' : 'left-1'}`} />
                        </button>
                    </div>

                   <div className="space-y-4">
                       <div className="flex justify-between items-center">
                           <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Personalización (Modificadores)</label>
                           <button 
                                onClick={_addModifierGroup} 
                                className="w-10 h-10 flex items-center justify-center bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-xl"
                            >
                                <Plus size={20} />
                            </button>
                       </div>
                       
                       <div className="space-y-4">
                            {formData.modifierGroups?.map(g => (
                                <div key={g.id} className="bg-stone-50 dark:bg-stone-800 p-6 rounded-[2rem] border border-black/5 dark:border-white/5 relative group/group">
                                    <button 
                                        onClick={() => _removeModifierGroup(g.id)} 
                                        className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center bg-white dark:bg-stone-900 rounded-full shadow-xl border border-black/5 dark:border-white/5 text-red-500 opacity-0 group-hover/group:opacity-100 transition-opacity"
                                    >
                                        <X size={14}/>
                                    </button>

                                    <div className="flex gap-4 mb-6">
                                        <div className="flex-1">
                                            <p className="text-[8px] font-black uppercase text-stone-400 mb-1 ml-1">Título del Grupo</p>
                                            <input 
                                                value={g.name} 
                                                onChange={e => _updateGroup(g.id, 'name', e.target.value)} 
                                                className="w-full bg-white dark:bg-stone-900 p-3 rounded-xl border-none font-bold text-sm dark:text-white outline-none ring-2 ring-transparent focus:ring-brand-500" 
                                            />
                                        </div>
                                        <div className="w-20">
                                            <p className="text-[8px] font-black uppercase text-stone-400 mb-1 ml-1">Máx.</p>
                                            <input 
                                                type="number" 
                                                value={g.max} 
                                                onChange={e => _updateGroup(g.id, 'max', Number(e.target.value))} 
                                                className="w-full bg-white dark:bg-stone-900 p-3 rounded-xl border-none font-bold text-sm dark:text-white text-center outline-none ring-2 ring-transparent focus:ring-brand-500" 
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {g.options?.map(o => (
                                            <div key={o.id} className="flex gap-2 items-center bg-white dark:bg-stone-900 p-2 rounded-xl border border-black/5 dark:border-white/5 shadow-sm group/opt">
                                                <input 
                                                    value={o.name} 
                                                    onChange={e => _updateOption(g.id, o.id, 'name', e.target.value)} 
                                                    className="flex-1 bg-transparent border-none p-1 font-bold text-xs dark:text-white outline-none" 
                                                    placeholder="Nombre opción"
                                                />
                                                <div className="flex items-center gap-1 bg-stone-50 dark:bg-stone-800 px-3 py-1 rounded-lg">
                                                    <span className="text-[10px] text-stone-400 font-bold">$</span>
                                                    <input 
                                                        type="number" 
                                                        value={o.price} 
                                                        onChange={e => _updateOption(g.id, o.id, 'price', Number(e.target.value))} 
                                                        className="w-12 bg-transparent border-none font-bold text-xs dark:text-white text-right outline-none" 
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => _removeOption(g.id, o.id)} 
                                                    className="p-2 text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover/opt:opacity-100"
                                                >
                                                    <X size={14}/>
                                                </button>
                                            </div>
                                        ))}
                                        <button 
                                            onClick={() => _addOptionToGroup(g.id)} 
                                            className="w-full h-10 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-xl text-[10px] font-black uppercase text-stone-400 hover:text-brand-500 hover:border-brand-500 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus size={12} /> Añadir Opción
                                        </button>
                                    </div>
                                </div>
                            ))}
                       </div>
                   </div>
               </div>

               <div className="p-8 border-t dark:border-stone-800 bg-white dark:bg-stone-900 flex gap-4">
                   {editingProduct !== 'NEW' && (
                        <button 
                            onClick={() => handleDelete((editingProduct as Product).id)}
                            className="px-6 h-14 border border-red-200 text-red-500 rounded-2xl hover:bg-red-50 transition-colors flex items-center justify-center"
                        >
                            <Trash2 size={20} />
                        </button>
                   )}
                   <Button fullWidth size="lg" onClick={handleSave} className="h-14 !rounded-2xl text-lg font-black uppercase tracking-widest shadow-2xl shadow-brand-500/20">
                        {editingProduct === 'NEW' ? 'Crear Producto' : 'Actualizar Cambios'}
                   </Button>
               </div>
           </div>
        </div>
      )}
    </div>
  );
};

const StoreSettings: React.FC<{ store: Store }> = ({ store }) => {
    const { updateStore, config } = useApp();
    const { showToast } = useToast();
    const [name, setName] = useState(store.name);
    const [font, setFont] = useState(store.customFont || 'Inter');
    const [color, setColor] = useState(store.customColor || '#FACC15'); // Default brand yellow
    const [mpToken, setMpToken] = useState(store.mpAccessToken || '');
    const [mpPk, setMpPk] = useState(store.mpPublicKey || '');
    const [storeImage, setStoreImage] = useState(store.image || '');
    const [category, setCategory] = useState(store.category || '');
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [autoSchedule, setAutoSchedule] = useState(store.autoSchedule || false);
    const [schedules, setSchedules] = useState(store.schedules || {
        0: { open: '09:00', close: '22:00', active: false },
        1: { open: '09:00', close: '22:00', active: true },
        2: { open: '09:00', close: '22:00', active: true },
        3: { open: '09:00', close: '22:00', active: true },
        4: { open: '09:00', close: '22:00', active: true },
        5: { open: '09:00', close: '22:00', active: true },
        6: { open: '09:00', close: '22:00', active: true },
    });
    const logoInputRef = useRef<HTMLInputElement>(null);

    const fonts = ['Inter', 'Roboto', 'Montserrat', 'Playfair Display', 'Courier New', 'Georgia'];
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const handleSave = async () => {
        try {
            const updates: any = { 
                customFont: font, 
                customColor: color, 
                mpPublicKey: mpPk, 
                image: storeImage,
                category: category,
                autoSchedule,
                schedules: schedules || {}
            };

            // Name change requires admin approval
            if (name !== store.name) {
                updates.pendingName = name;
                showToast('Solicitud de cambio de nombre enviada al Admin', 'info');
            }

            // Save main updates
            await updateStore(store.id, updates);
            
            // Save MP Access Token to a private subcollection
            if (mpToken) {
                await setDoc(doc(db, 'stores', store.id, 'private', 'payment'), {
                    mpAccessToken: mpToken,
                    updatedAt: serverTimestamp()
                }, { merge: true });
            }
            
            if (name === store.name) {
                showToast('Perfil actualizado con éxito', 'success');
            }
        } catch (err) {
            console.error('Error saving store profile:', err);
            showToast('Error al actualizar el perfil', 'error');
        }
    };

    return (
        <div className="bg-white dark:bg-stone-800 p-8 rounded-3xl shadow-xl border border-black/[0.03] dark:border-stone-700 max-w-2xl mx-auto animate-slide-up pb-24">
            <h3 className="text-2xl font-black text-stone-950 dark:text-white mb-8 tracking-tighter flex items-center gap-3">
                <StoreIcon size={28} className="text-brand-500" /> Perfil del Comercio
            </h3>

            <div className="space-y-8">
                {/* Logo Section - Clickable UI */}
                <div className="flex flex-col items-center gap-4 mb-8">
                    <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Logo de Marca</label>
                    <div 
                        onClick={() => !isUploadingImage && logoInputRef.current?.click()}
                        className="relative w-32 h-32 rounded-[2.5rem] bg-stone-100 dark:bg-stone-900 border-4 border-dashed border-stone-200 dark:border-stone-700 overflow-hidden cursor-pointer group hover:border-brand-500 transition-all shadow-inner"
                    >
                        {storeImage ? (
                            <>
                                <img src={storeImage} alt="Store Logo" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                <div className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all backdrop-blur-sm">
                                    <Upload size={24} className="text-white mb-2" />
                                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Cambiar</span>
                                </div>
                            </>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                <ImageIcon size={32} className="text-stone-300 dark:text-stone-600" />
                                <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Subir Logo</span>
                            </div>
                        )}
                        {isUploadingImage && (
                            <div className="absolute inset-0 bg-white/80 dark:bg-stone-900/80 flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                    <input 
                        type="file" 
                        ref={logoInputRef}
                        accept="image/*" 
                        className="hidden" 
                        onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                                try {
                                    setIsUploadingImage(true);
                                    const url = await uploadImageToCloudinary(e.target.files[0]);
                                    setStoreImage(url);
                                    showToast('Logo actualizado', 'success');
                                } catch (error: any) {
                                    console.error('Image upload failed:', error);
                                    showToast(error.message || 'Error al subir logo', 'error');
                                } finally {
                                    setIsUploadingImage(false);
                                }
                            }
                        }}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[10px] font-black text-stone-400 mb-2 uppercase tracking-widest">Nombre Comercial</label>
                        <input 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-stone-50 dark:bg-stone-900 border-none p-4 rounded-2xl dark:text-white font-bold ring-2 ring-transparent focus:ring-brand-500 transition-all outline-none" 
                            placeholder="Nombre de tu tienda"
                        />
                        {store.pendingName && (
                            <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-900/30">
                                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                <p className="text-[8px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-widest">Cambio a "{store.pendingName}" pendiente de aprobación</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-stone-400 mb-2 uppercase tracking-widest">Categoría</label>
                        <select 
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full bg-stone-50 dark:bg-stone-900 border-none p-4 rounded-2xl dark:text-white font-bold ring-2 ring-transparent focus:ring-brand-500 transition-all outline-none appearance-none"
                        >
                            {config.categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest">Estética de Marca</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {fonts.map(f => (
                            <button 
                                key={f}
                                onClick={() => setFont(f)}
                                className={`p-4 rounded-2xl border-2 transition-all ${font === f ? 'border-brand-500 bg-brand-500/5 text-stone-950 dark:text-white shadow-lg' : 'border-black/5 dark:border-white/5 text-stone-400 hover:border-brand-500/30'}`}
                                style={{ fontFamily: f }}
                            >
                                <span className="text-xs font-bold">{f}</span>
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex items-center gap-6 p-6 bg-stone-50 dark:bg-stone-900 rounded-3xl border border-black/5 dark:border-white/5">
                        <div className="relative">
                            <input 
                                type="color" 
                                value={color}
                                onChange={e => setColor(e.target.value)}
                                className="w-16 h-16 rounded-2xl cursor-pointer bg-transparent"
                            />
                            <div className="absolute inset-0 pointer-events-none rounded-2xl border-4 border-white dark:border-stone-800 shadow-xl" style={{ backgroundColor: color }} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Color Identitario</p>
                            <p className="text-xs text-stone-500 dark:text-stone-400 leading-tight">Define la personalidad visual de tu tienda en la app.</p>
                            <span className="inline-block mt-2 font-mono text-[9px] font-black text-brand-500 uppercase">{color}</span>
                        </div>
                    </div>
                </div>

                <div className="border-t dark:border-stone-700 pt-8">
                    <label className="block text-[10px] font-black text-stone-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={14} className="text-brand-500" /> Horarios de Atención
                    </label>
                    <div className="bg-stone-50 dark:bg-stone-900 rounded-[2rem] p-6 border border-black/5 dark:border-white/5">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/[0.03] dark:border-white/[0.03]">
                            <div>
                                <h4 className="text-sm font-black text-stone-900 dark:text-white">Apertura Automática</h4>
                                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-1">Tu tienda se abrirá y cerrará sola según los horarios</p>
                            </div>
                            <button 
                                onClick={() => setAutoSchedule(!autoSchedule)}
                                className={`w-12 h-6 rounded-full transition-all relative ${autoSchedule ? 'bg-brand-500' : 'bg-stone-300 dark:bg-stone-700'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${autoSchedule ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                        {autoSchedule && (
                            <div className="space-y-3">
                                {Object.keys(schedules).map((key) => {
                                    const dayIdx = Number(key);
                                    const sched = schedules[dayIdx];
                                    return (
                                        <div key={dayIdx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-white dark:bg-stone-800 rounded-xl border border-black/5 dark:border-white/5">
                                            <div className="flex items-center gap-3">
                                                <button 
                                                    onClick={() => setSchedules({...schedules, [dayIdx]: {...sched, active: !sched.active}})}
                                                    className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${sched.active ? 'bg-brand-500 text-brand-950' : 'bg-stone-200 dark:bg-stone-700 text-stone-400'}`}
                                                >
                                                    {sched.active && <span className="font-black text-xs">✓</span>}
                                                </button>
                                                <span className={`w-12 font-black text-xs uppercase tracking-widest ${sched.active ? 'text-stone-900 dark:text-white' : 'text-stone-400'}`}>{days[dayIdx]}</span>
                                            </div>
                                            {sched.active ? (
                                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                                    <input 
                                                        type="time" 
                                                        value={sched.open}
                                                        onChange={(e) => setSchedules({...schedules, [dayIdx]: {...sched, open: e.target.value}})}
                                                        className="flex-1 sm:w-28 bg-stone-50 dark:bg-stone-950 border-none p-2 rounded-lg text-xs font-bold text-center dark:text-white outline-none focus:ring-2 ring-brand-500"
                                                    />
                                                    <span className="text-stone-400 font-bold">-</span>
                                                    <input 
                                                        type="time" 
                                                        value={sched.close}
                                                        onChange={(e) => setSchedules({...schedules, [dayIdx]: {...sched, close: e.target.value}})}
                                                        className="flex-1 sm:w-28 bg-stone-50 dark:bg-stone-950 border-none p-2 rounded-lg text-xs font-bold text-center dark:text-white outline-none focus:ring-2 ring-brand-500"
                                                    />
                                                </div>
                                            ) : (
                                                <span className="text-xs text-stone-400 font-bold flex-1 text-center sm:text-right">Cerrado</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-t dark:border-stone-700 pt-8 space-y-4">
                    <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                        <CreditCard size={14} className="text-brand-500" /> Mercado Pago (Modo Descentralizado)
                    </label>
                    <div className="space-y-4">
                        <div>
                            <p className="text-[9px] font-bold text-stone-500 uppercase mb-1 ml-1">Access Token (Producción)</p>
                            <input 
                                type="password" 
                                value={mpToken}
                                onChange={e => setMpToken(e.target.value)}
                                placeholder="APP_USR-..."
                                className="w-full bg-stone-50 dark:bg-stone-900 border-none p-4 rounded-2xl dark:text-white font-mono text-xs ring-2 ring-transparent focus:ring-brand-500 transition-all outline-none"
                            />
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-stone-500 uppercase mb-1 ml-1">Public Key (Producción)</p>
                            <input 
                                type="text" 
                                value={mpPk}
                                onChange={e => setMpPk(e.target.value)}
                                placeholder="APP_USR-..."
                                className="w-full bg-stone-50 dark:bg-stone-900 border-none p-4 rounded-2xl dark:text-white font-mono text-xs ring-2 ring-transparent focus:ring-brand-500 transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <div className="p-6 rounded-[2rem] bg-stone-900 dark:bg-black shadow-2xl mb-8 border border-white/5 overflow-hidden group">
                        <div className="flex justify-between items-center mb-6">
                             <p className="text-[9px] font-black text-stone-500 uppercase tracking-[0.3em]">Vista Previa Real</p>
                             <div className="flex gap-1">
                                <div className="w-1 h-1 rounded-full bg-stone-700" />
                                <div className="w-1 h-1 rounded-full bg-stone-700" />
                                <div className="w-1 h-1 rounded-full bg-stone-700" />
                             </div>
                        </div>
                        <div className="space-y-4" style={{ fontFamily: font }}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-stone-800 overflow-hidden">
                                     <img src={storeImage} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h4 className="font-black text-xl text-white tracking-tighter" style={{ color }}>{name}</h4>
                                    <p className="text-[8px] text-stone-500 font-black uppercase tracking-widest">{category || 'Categoría'}</p>
                                </div>
                            </div>
                            <button className="w-full py-4 rounded-xl text-brand-950 font-black text-xs uppercase tracking-widest shadow-xl transition-transform active:scale-95" style={{ backgroundColor: color }}>
                                Explorar Menú
                            </button>
                        </div>
                    </div>
                    <Button fullWidth onClick={handleSave} size="lg" className="h-16 !rounded-2xl text-base font-black tracking-widest uppercase">Guardar Perfil</Button>
                </div>
            </div>
        </div>
    );
};

export const MerchantView: React.FC = () => {
  const { role, user, orders, stores, merchantViewState, setMerchantViewState, updateStore, completeTour, setRole } = useApp();
  const { showToast } = useToast();
  const lastOrderCountRef = useRef(0);

  const isMobile = window.innerWidth < 1024;

  // IDENTITY INTEGRATION:
  // If user owns a store, use it. If not, show "No Store" state.
  // Use useMemo to avoid recalc on every render and ensure it picks up changes
  const myStore = React.useMemo(() => {
    return stores.find(s => s.id === user.ownedStoreId || s.ownerId === user.uid);
  }, [stores, user.ownedStoreId, user.uid]);

  const [wasPending, setWasPending] = useState(myStore ? !myStore.isActive : false);

  const merchantTourSteps: TourStep[] = [
    {
        targetId: 'store-status',
        title: 'Estado de tu Tienda',
        description: 'Cambia entre ONLINE y OFFLINE para controlar cuándo recibes pedidos. ¡Asegúrate de estar ONLINE para empezar a vender!',
        position: 'bottom'
    },
    {
        targetId: 'orders-tab',
        title: 'Gestión de Pedidos',
        description: 'Aquí verás todos los pedidos entrantes. Podrás aceptarlos, marcarlos en preparación y listos para entregar.',
        position: 'bottom'
    },
    {
        targetId: 'menu-tab',
        title: 'Tu Menú Digital',
        description: 'Carga tus productos, añade fotos y descripciones. ¡Incluso puedes usar nuestra IA para escanear tu carta física!',
        position: 'bottom'
    },
    {
        targetId: 'coupons-tab',
        title: 'Cupones de Descuento',
        description: 'Atrae más clientes creando cupones promocionales. Tú decides el descuento y las condiciones.',
        position: 'bottom'
    },
    {
        targetId: 'history-tab',
        title: 'Historial de Ventas',
        description: 'Revisa tus ventas pasadas, analiza tus ingresos y mantén un control total de tu negocio.',
        position: 'bottom'
    },
    {
        targetId: isMobile ? 'settings-tab-mobile' : 'settings-tab',
        title: 'Personalización',
        description: 'Ajusta los colores de tu marca, logo, horarios de atención y configuración de pagos.',
        position: isMobile ? 'top' : 'right'
    }
  ];

  const menuTourSteps: TourStep[] = [
    {
        targetId: 'bulk-upload-section',
        title: 'Carga Automática',
        description: 'Aquí puedes usar nuestras herramientas inteligentes para ahorrar tiempo. No necesitas cargar todo a mano.',
        position: 'bottom'
    },
    {
        targetId: 'btn-excel-template',
        title: 'Plantilla de Excel',
        description: 'Descarga nuestra plantilla, rellénala con tus productos y súbela de nuevo. ¡Es la forma más rápida de migrar catálogos grandes!',
        position: 'bottom'
    },
    {
        targetId: 'btn-ai-scan',
        title: 'Escaneo con IA (Beta)',
        description: '¿Tienes un menú físico? Sube una foto o un PDF y nuestra IA extraerá nombres, precios y descripciones automáticamente.',
        position: 'bottom'
    },
    {
        targetId: 'btn-new-product',
        title: 'Carga Manual',
        description: 'Usa este botón para añadir productos específicos o ediciones rápidas a tu catálogo.',
        position: 'left'
    }
  ];

  const showTour = !user.completedTours?.includes('merchant-onboarding') && !!myStore?.isActive && merchantViewState === 'ORDERS';
  const showMenuTour = !user.completedTours?.includes('merchant-menu-onboarding') && !!myStore?.isActive && merchantViewState === 'MENU';

  // Sound alert for new orders
  React.useEffect(() => {
    if (!myStore?.isActive) return;
    const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING && o.storeId === user.ownedStoreId);
    if (pendingOrders.length > lastOrderCountRef.current) {
        soundService.playNewOrder();
        showToast('¡Nuevo pedido recibido!', 'info');
    }
    lastOrderCountRef.current = pendingOrders.length;
  }, [orders, user.ownedStoreId, showToast, myStore?.isActive]);

  React.useEffect(() => {
    if (myStore?.isActive && wasPending) {
        soundService.play('SUCCESS');
        showToast('¡Tu comercio ha sido aprobado! 🎉', 'success');
        setWasPending(false);
    }
  }, [myStore?.isActive, wasPending, showToast]);

  // If we are definitely a merchant but store hasn't loaded yet, show loading
  // Check both app-level role and user-profile role for robustness
  if (!myStore && (user.ownedStoreId || user.role === UserRole.MERCHANT || role === UserRole.MERCHANT)) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-8 bg-stone-900">
               <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-500 border-t-transparent mx-auto mb-4 shadow-[0_0_15px_rgba(255,237,0,0.2)]" />
               <p className="text-stone-400 font-medium animate-pulse">Sincronizando los datos de tu comercio...</p>
               <p className="text-stone-600 text-[10px] uppercase tracking-widest mt-2 font-bold dark:text-stone-400">Un momento por favor</p>
          </div>
      );
  }

  // Filter only active orders for the merchant view
  const activeOrders = orders.filter(o =>
    o.storeId === myStore.id && // Only show orders for this store
    o.status !== OrderStatus.DELIVERED &&
    o.status !== OrderStatus.CANCELLED &&
    o.status !== OrderStatus.DISPUTED
  );

  // History orders: Delivered, Cancelled, Disputed
  const historyOrders = orders.filter(o => 
    o.storeId === myStore.id &&
    (o.status === OrderStatus.DELIVERED || 
    o.status === OrderStatus.CANCELLED ||
    o.status === OrderStatus.DISPUTED)
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Metrics
  const totalRevenue = historyOrders.filter(o => o.status === OrderStatus.DELIVERED).reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-950 animate-fade-in">
      {/* Merchant Header with Tabs */}
      <div className="bg-white/90 dark:bg-stone-900/95 sticky top-0 z-10 border-b border-stone-100 dark:border-white/5 backdrop-blur-md">
        <div className="w-full">
            {!myStore.isActive && !myStore.pendingName && (
                <div className="bg-amber-50 dark:bg-amber-900/20 mx-4 lg:mx-12 mt-4 p-4 rounded-2xl border border-amber-200 dark:border-amber-700/30 flex items-start gap-4 shadow-sm animate-fade-in text-left">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full shrink-0">
                        <Clock className="text-amber-600 dark:text-amber-400" size={20} />
                    </div>
                    <div>
                        <p className="text-amber-900 dark:text-amber-100 font-bold text-sm">Comercio en revisión</p>
                        <p className="text-amber-700 dark:text-amber-300/80 text-xs mt-1 leading-relaxed">Tu tienda está siendo revisada por un administrador. Los clientes no podrán verla hasta que sea aprobada. Mientras tanto, puedes configurar tu menú.</p>
                    </div>
                </div>
            )}
            <div className="px-4 py-4 lg:px-12 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-white/10 overflow-hidden shadow-sm shrink-0">
                  <LazyImage src={myStore.image} alt="Logo" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-stone-900 dark:text-white tracking-tight leading-none truncate max-w-[180px] sm:max-w-none">{myStore.name}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <button 
                      id="store-status"
                      onClick={() => updateStore(myStore.id, { isOpen: !myStore.isOpen })}
                      className={`px-2 py-1 rounded-lg text-[9px] font-black flex items-center gap-1.5 transition-all ${myStore.isOpen !== false ? 'bg-emerald-500 text-white' : 'bg-stone-200 dark:bg-stone-800 text-stone-500'}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${myStore.isOpen !== false ? 'bg-white animate-pulse' : 'bg-stone-400'}`}></div>
                      {myStore.isOpen !== false ? 'ABIERTO' : 'CERRADO'}
                    </button>
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest leading-none">| {activeOrders.length} ACTIVOS</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex lg:hidden p-1.5 mx-6 mb-4 bg-stone-100 dark:bg-white/5 rounded-2xl border border-black/[0.03] dark:border-white/[0.03] overflow-x-auto dark:bg-stone-800">
              <button
                id="orders-tab"
                onClick={() => setMerchantViewState('ORDERS')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap relative ${merchantViewState === 'ORDERS' ? 'bg-white dark:bg-stone-800 shadow-xl text-stone-950 dark:text-white' : 'text-stone-500 dark:text-stone-400 hover:text-stone-950 dark:hover:text-white'}`}
              >
                <LayoutDashboard size={16} /> 
                Pedidos
                {activeOrders.some(o => o.status === OrderStatus.PENDING) && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-50 dark:bg-red-900/200"></span>
                  </span>
                )}
              </button>
              <button
                id="menu-tab"
                onClick={() => setMerchantViewState('MENU')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${merchantViewState === 'MENU' ? 'bg-white dark:bg-stone-800 shadow-xl text-stone-950 dark:text-white' : 'text-stone-500 dark:text-stone-400 hover:text-stone-950 dark:hover:text-white'}`}
              >
                <UtensilsCrossed size={16} /> Menú
              </button>
              <button
                id="coupons-tab"
                onClick={() => setMerchantViewState('COUPONS')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${merchantViewState === 'COUPONS' ? 'bg-white dark:bg-stone-800 shadow-xl text-stone-950 dark:text-white' : 'text-stone-500 dark:text-stone-400 hover:text-stone-950 dark:hover:text-white'}`}
              >
                <Ticket size={16} /> Cupones
              </button>
              <button
                id="history-tab"
                onClick={() => setMerchantViewState('HISTORY')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${merchantViewState === 'HISTORY' ? 'bg-white dark:bg-stone-800 shadow-xl text-stone-950 dark:text-white' : 'text-stone-500 dark:text-stone-400 hover:text-stone-950 dark:hover:text-white'}`}
              >
                <Clock size={16} /> Historial
              </button>
              <button
                id="settings-tab"
                onClick={() => setMerchantViewState('SETTINGS')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${merchantViewState === 'SETTINGS' ? 'bg-white dark:bg-stone-800 shadow-xl text-stone-950 dark:text-white' : 'text-stone-500 dark:text-stone-400 hover:text-stone-950 dark:hover:text-white'}`}
              >
                <Pencil size={16} /> Ajustes
              </button>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32 custom-scrollbar">
        <div className="p-6 space-y-8 lg:w-full lg:p-12 h-full">

        {merchantViewState === 'ORDERS' ? (
          activeOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 px-12 text-center bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-white/5 rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] relative overflow-hidden group">
               {/* Decorative background element */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:bg-brand-500/20 transition-all duration-1000" />
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-500/5 blur-[100px] rounded-full -ml-32 -mb-32 transition-all duration-1000" />
               
               <div className="w-24 h-24 bg-stone-50 dark:bg-stone-800 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl border border-stone-100 dark:border-white/5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                  <ShoppingBag size={40} className="text-brand-500" />
               </div>
               
               <h3 className="text-3xl font-black text-stone-950 dark:text-white mb-3 tracking-tighter uppercase">Sin pedidos por ahora</h3>
               <p className="text-stone-400 dark:text-stone-500 text-sm max-w-sm font-bold leading-relaxed mb-10 tracking-tight">
                 Tu tienda está en línea. Cuando un cliente realice un pedido, aparecerá mágicamente aquí con una alerta sonora.
               </p>
               
               <div className="flex gap-4">
                   <button 
                      onClick={() => setMerchantViewState('MENU')}
                      className="bg-stone-950 dark:bg-white text-white dark:text-stone-950 px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center gap-3 border border-white/10"
                   >
                      <Plus size={16} strokeWidth={3} />
                      Gestionar Menú
                   </button>
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {activeOrders.map(order => <OrderCard key={order.id} order={order} />)}
            </div>
          )
        ) : merchantViewState === 'MENU' ? (
          <ProductEditor store={myStore} />
        ) : merchantViewState === 'COUPONS' ? (
          <CouponManager />
        ) : merchantViewState === 'SETTINGS' ? (
          <StoreSettings store={myStore} />
        ) : (
          <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] border border-stone-200/80 dark:border-white/5 shadow-xl flex items-center justify-between group hover:border-brand-500/30 transition-all">
                      <div>
                          <p className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-1">Ventas Brutas</p>
                          <p className="text-3xl font-black text-stone-950 dark:text-brand-500 tracking-tighter">{formatCurrency(totalRevenue)}</p>
                      </div>
                      <div className="w-14 h-14 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-500 border border-brand-500/20 group-hover:scale-110 transition-transform">
                          <Banknote size={28} />
                      </div>
                  </div>
                  <div className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] border border-stone-200/80 dark:border-white/5 shadow-xl flex items-center justify-between group hover:border-brand-500/30 transition-all">
                      <div>
                          <p className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-1">Pedidos Éxito</p>
                          <p className="text-3xl font-black text-stone-950 dark:text-white tracking-tighter">{historyOrders.filter(o => o.status === OrderStatus.DELIVERED).length}</p>
                      </div>
                      <div className="w-14 h-14 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center text-stone-900 dark:text-white border border-stone-200 dark:border-white/5 group-hover:scale-110 transition-transform">
                          <CheckCircle size={28} />
                      </div>
                  </div>
                  <div className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] border border-stone-200/80 dark:border-white/5 shadow-xl flex items-center justify-between group hover:border-brand-500/30 transition-all flex-none">
                      <div>
                          <p className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-1">Tickets Promedio</p>
                          <p className="text-3xl font-black text-stone-950 dark:text-white tracking-tighter">{formatCurrency(totalRevenue / (historyOrders.filter(o => o.status === OrderStatus.DELIVERED).length || 1))}</p>
                      </div>
                      <div className="w-14 h-14 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center text-stone-900 dark:text-white border border-stone-200 dark:border-white/5 group-hover:scale-110 transition-transform">
                          <ShoppingBag size={28} />
                      </div>
                  </div>
              </div>

              <div className="space-y-6">
                  <h4 className="font-black text-2xl text-stone-950 dark:text-white tracking-tighter uppercase px-2 flex items-center gap-3">
                      <HistoryIcon className="text-stone-400" size={24} /> Historial de Operaciones
                  </h4>
                  {historyOrders.length === 0 ? (
                      <div className="text-center py-24 bg-stone-50 dark:bg-stone-900/50 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-[3rem]">
                          <p className="font-black text-stone-400 uppercase tracking-widest text-[10px]">Aún no hay historial disponible</p>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                          {historyOrders.map(order => <OrderCard key={order.id} order={order} />)}
                      </div>
                  )}
              </div>
          </div>
        )}
      </div>
      </div>
      {showTour && (
          <OnboardingTour 
              tourId="merchant-onboarding" 
              steps={merchantTourSteps} 
              onComplete={() => completeTour('merchant-onboarding')} 
          />
      )}
      {showMenuTour && (
        <OnboardingTour 
            tourId="merchant-menu-onboarding" 
            steps={menuTourSteps} 
            onComplete={() => completeTour('merchant-menu-onboarding')} 
        />
      )}
    </div>
  );
};
