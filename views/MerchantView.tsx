
import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { OrderStatus, Order, PaymentMethod, OrderType, Product, ModifierGroup, Modifier, Store } from '../types';
import { Button } from '../components/ui/Button';
import { Badge, PaymentBadge } from '../components/ui/Badge';
import { LazyImage } from '../components/ui/LazyImage';
import { CheckCircle, Clock, Bike, User, CreditCard, Banknote, StickyNote, Store as StoreIcon, ShoppingBag, Plus, Pencil, Trash2, X, UtensilsCrossed, LayoutDashboard, Ticket, ToggleLeft, ToggleRight, Upload, Download, FileText, Image as ImageIcon } from 'lucide-react';
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

  const handleAction = () => {
    switch (order.status) {
      case OrderStatus.PENDING:
        updateOrder(order.id, OrderStatus.ACCEPTED);
        showToast('Pedido aceptado', 'success');
        break;
      case OrderStatus.ACCEPTED:
        updateOrder(order.id, OrderStatus.PREPARING);
        showToast('Pedido en preparación', 'info');
        break;
      case OrderStatus.PREPARING:
        updateOrder(order.id, OrderStatus.READY);
        showToast(order.type === OrderType.PICKUP ? 'Listo para retirar' : 'Drivers notificados', 'success');
        break;
      case OrderStatus.READY:
        if (order.type === OrderType.PICKUP) {
          updateOrder(order.id, OrderStatus.DELIVERED);
          showToast('Pedido entregado al cliente', 'success');
        }
        break;
    }
  };

  const handleCancel = () => {
      const reason = prompt('Motivo de la cancelación:');
      if (reason) {
          cancelOrder(order.id, reason);
      }
  };

  const getButtonText = () => {
    switch (order.status) {
      case OrderStatus.PENDING: return 'Aceptar Pedido';
      case OrderStatus.ACCEPTED: return 'Empezar Cocina';
      case OrderStatus.PREPARING: return order.type === OrderType.DELIVERY ? 'Listo (Llamar Driver)' : 'Marcar Listo';
      case OrderStatus.READY:
        return order.type === OrderType.PICKUP ? 'Entregar al Cliente' : 'Esperando Repartidor...';
      default: return 'Esperando Repartidor';
    }
  };

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 overflow-hidden animate-slide-up">
      <div className="p-4 border-b border-stone-100 dark:border-stone-700 flex justify-between items-center bg-stone-50/50 dark:bg-stone-800/50">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-stone-500 dark:text-stone-400">#{order.id.slice(-6)}</span>
          <PaymentBadge status={order.paymentStatus} method={order.paymentMethod} />
          {order.type === OrderType.PICKUP ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-stone-800 dark:bg-stone-700 text-white text-[10px] font-bold uppercase shadow-sm">
              <StoreIcon size={10} /> Retiro
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-brand-500 text-brand-950 text-[10px] font-bold uppercase shadow-sm">
              <Bike size={10} /> Delivery
            </span>
          )}
        </div>
        <Badge status={order.status} />
      </div>

      <div className="p-4">
        <div className="flex gap-4 mb-4 pb-4 border-b border-stone-100 dark:border-stone-700">
          <div className="flex-1">
            <p className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 mb-1">Cliente</p>
            <div className="flex items-center gap-2 text-stone-900 dark:text-white font-bold text-sm">
              <User size={16} className="text-stone-400 dark:text-stone-500" />
              {order.customerName}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 mb-1">Pago</p>
            <div className={`flex items-center gap-2 text-sm font-bold justify-end ${order.paymentMethod === PaymentMethod.CASH ? 'text-amber-600 dark:text-amber-500' : 'text-stone-700 dark:text-stone-300'}`}>
              {order.paymentMethod === PaymentMethod.CARD ? <CreditCard size={16} /> : <Banknote size={16} />}
              {order.paymentMethod === PaymentMethod.CARD ? 'Tarjeta' : 'Efectivo'}
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/30 p-3 rounded-lg flex gap-2 items-start text-xs text-yellow-800 dark:text-yellow-300">
            <StickyNote size={14} className="shrink-0 mt-0.5" />
            <span><span className="font-bold">Nota:</span> {order.notes}</span>
          </div>
        )}

        <div className="space-y-2 mb-4">
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex gap-3 text-sm">
              <div className="bg-stone-100 dark:bg-stone-700 px-2 py-0.5 rounded text-stone-900 dark:text-white font-bold text-xs h-fit border border-stone-200 dark:border-stone-600">
                {item.quantity}x
              </div>
              <div className="flex-1">
                <p className="text-stone-900 dark:text-white font-medium leading-tight">{item.product.name}</p>
                {item.selectedModifiers.length > 0 && (
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    {item.selectedModifiers?.map(m => m.name).join(', ')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center text-sm pt-2">
          <span className="text-stone-500 dark:text-stone-400 font-medium">Total del pedido</span>
          <span className="font-bold text-xl text-stone-900 dark:text-white">{formatCurrency(order.total)}</span>
        </div>

        {order.type === OrderType.DELIVERY && order.status === OrderStatus.DRIVER_ASSIGNED && (
          <div className="mt-4 bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/30 p-2.5 rounded-lg flex items-center gap-3 text-sm text-brand-950 dark:text-brand-300">
            <div className="bg-white dark:bg-stone-800 p-1.5 rounded-full shadow-sm">
              <Bike size={16} className="text-brand-800 dark:text-brand-400" />
            </div>
            <span className="font-medium">Repartidor en camino al local</span>
          </div>
        )}

        {order.type === OrderType.DELIVERY && order.status === OrderStatus.PICKED_UP && (
          <div className="mt-4 bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/30 p-2.5 rounded-lg flex items-center gap-3 text-sm text-brand-950 dark:text-brand-300">
            <div className="bg-white dark:bg-stone-800 p-1.5 rounded-full shadow-sm">
              <CheckCircle size={16} className="text-brand-800 dark:text-brand-400" />
            </div>
            <span className="font-medium">Pedido retirado - En camino al cliente</span>
          </div>
        )}

        {order.type === OrderType.PICKUP && order.status === OrderStatus.READY && (
          <div className="mt-4 bg-stone-100 dark:bg-stone-700/50 border border-stone-200 dark:border-stone-600 p-2.5 rounded-lg flex items-center gap-3 text-sm text-stone-800 dark:text-stone-200">
            <div className="bg-white dark:bg-stone-800 p-1.5 rounded-full shadow-sm">
              <ShoppingBag size={16} className="text-stone-600 dark:text-stone-400" />
            </div>
            <span className="font-medium">Esperando retiro del cliente</span>
          </div>
        )}
      </div>

      {/* Logic Update: Only show button if action is available for Merchant */}
      {!(order.status === OrderStatus.READY && order.type === OrderType.DELIVERY) && order.status !== OrderStatus.PICKED_UP && order.status !== OrderStatus.DRIVER_ASSIGNED && order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.DISPUTED && (
        <div className="p-3 bg-stone-50 dark:bg-stone-800/50 border-t border-stone-100 dark:border-stone-700 flex gap-2">
          <button 
            onClick={() => setShowChat(true)}
            className="p-2.5 bg-stone-100 dark:bg-stone-700 rounded-xl text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
          >
            <MessageSquare size={20} />
          </button>
          {order.status === OrderStatus.PENDING && (
              <button 
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-xl border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold text-sm bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                  Rechazar
              </button>
          )}
          <Button
            fullWidth
            variant={order.status === OrderStatus.PENDING ? 'primary' : 'secondary'}
            onClick={handleAction}
            className="flex-1"
          >
            {order.status === OrderStatus.PENDING && <CheckCircle size={18} className="mr-2" />}
            {getButtonText()}
          </Button>
        </div>
      )}
      
      {/* Audit Info */}
      {order.status === OrderStatus.CANCELLED && order.cancelledReason && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400 text-sm">
              <span className="font-bold">Cancelado:</span> {order.cancelledReason}
          </div>
      )}
      {order.status === OrderStatus.DISPUTED && order.claimReason && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 text-sm">
              <span className="font-bold">Reclamo ({order.claimStatus}):</span> {order.claimReason}
          </div>
      )}

      <ChatOverlay 
          orderId={order.id} 
          isOpen={showChat} 
          onClose={() => setShowChat(false)} 
          title={`Chat con ${order.customerName}`} 
      />
    </div>
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
            <div className="bg-white dark:bg-stone-800 p-4 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 mb-6">
                <h3 className="font-bold text-stone-900 dark:text-white mb-4">Crear Nuevo Cupón</h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase">Código</label>
                        <input 
                            className="w-full bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 font-mono uppercase font-bold text-stone-900 dark:text-white"
                            placeholder="Ej: VERANO20"
                            value={newCode}
                            onChange={e => setNewCode(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3">
                        <div className="w-1/3">
                            <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase">Descuento %</label>
                            <input 
                                type="number"
                                className="w-full bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 font-bold text-stone-900 dark:text-white"
                                placeholder="20"
                                value={newDiscount}
                                onChange={e => setNewDiscount(e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase">Descripción</label>
                            <input 
                                className="w-full bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-stone-900 dark:text-white"
                                placeholder="Para nuevos clientes"
                                value={newDesc}
                                onChange={e => setNewDesc(e.target.value)}
                            />
                        </div>
                    </div>
                    <Button fullWidth onClick={handleAdd} disabled={!newCode || !newDiscount}>Crear Cupón</Button>
                </div>
            </div>

            <h3 className="font-bold text-stone-900 dark:text-white mb-3 px-1">Cupones Activos</h3>
            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                {coupons.length === 0 && <p className="text-stone-400 dark:text-stone-500 text-center py-4 lg:col-span-2">No hay cupones creados.</p>}
                {coupons.map(coupon => (
                    <div key={coupon.id} className={`bg-white dark:bg-stone-800 p-4 rounded-xl shadow-sm border flex justify-between items-center ${coupon.active ? 'border-brand-200 dark:border-brand-900/30' : 'border-stone-200 dark:border-stone-700 opacity-60'}`}>
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { Nombre: 'Hamburguesa Clásica', Descripcion: 'Carne, queso, lechuga', Precio: 1200, ImagenURL: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd' },
      { Nombre: 'Papas Fritas', Descripcion: 'Porción grande', Precio: 600, ImagenURL: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Productos");
    XLSX.writeFile(wb, "plantilla_productos.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[];

        const newProducts: Product[] = [];
        data.forEach(item => {
          if (item.Nombre && item.Precio) {
            newProducts.push({
              id: `prod-bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: String(item.Nombre),
              description: String(item.Descripcion || ''),
              price: Number(item.Precio),
              image: String(item.ImagenURL || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'),
              modifierGroups: []
            });
          }
        });

        if (newProducts.length > 0) {
          bulkAddProducts(storeId, newProducts);
          showToast(`${newProducts.length} productos cargados con éxito`, 'success');
        }
      } catch (err) {
        console.error(err);
        showToast('Error al procesar el archivo', 'error');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleAIScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    showToast('Iniciando escaneo con IA...', 'info');

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;
      
      showToast('Analizando estructura del menú...', 'info');
      const products = await extractProductsFromMenu(base64Data);

      if (products && products.length > 0) {
        showToast('Integrando productos al catálogo...', 'info');
        bulkAddProducts(storeId, products);
        showToast(`${products.length} productos extraídos con IA con éxito`, 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Error al escanear el archivo. Verifica el formato.', 'error');
    } finally {
      setIsUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/30 p-4 rounded-xl mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-brand-900 dark:text-brand-100 flex items-center gap-2">
            <Upload size={18} /> Carga Automática
          </h3>
          <p className="text-xs text-brand-900 dark:text-brand-300 mt-1">Sube tu catálogo desde Excel o escanea un PDF/Foto del menú</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={downloadTemplate} className="bg-white dark:bg-stone-800">
            <Download size={14} className="mr-1" /> Plantilla
          </Button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
          />
          <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} isLoading={isUploading}>
            <FileText size={14} className="mr-1" /> Excel
          </Button>

          <input 
            type="file" 
            ref={imageInputRef} 
            onChange={handleAIScan} 
            accept="image/*, application/pdf" 
            className="hidden" 
          />
          <Button size="sm" onClick={() => imageInputRef.current?.click()} isLoading={isUploading}>
            <ImageIcon size={14} className="mr-1" /> Escanear PDF/Foto
          </Button>
        </div>
      </div>
    </div>
  );
};

const ProductEditor: React.FC<{ store: Store }> = ({ store: myStore }) => {
  const { addProduct, updateProduct, deleteProduct } = useApp();
  const { showToast } = useToast();
  const [editingProduct, setEditingProduct] = useState<Product | 'NEW' | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', description: '', price: 0, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c', modifierGroups: []
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleOpenEdit = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ ...product });
    } else {
      setEditingProduct('NEW');
      setFormData({ name: '', description: '', price: 0, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c', modifierGroups: [] });
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
    if (!formData.name || formData.price === undefined) {
      showToast('Nombre y precio son obligatorios', 'error');
      return;
    }
    const productData: Product = {
        id: editingProduct === 'NEW' ? `prod-${Date.now()}` : (editingProduct as Product).id,
        name: formData.name!,
        description: formData.description || '',
        price: Number(formData.price),
        image: formData.image || '',
        modifierGroups: formData.modifierGroups || []
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
      <div className="flex justify-between items-center mb-6">
        <p className="text-stone-500 dark:text-stone-400 text-sm">Gestiona tu catálogo ({myStore.products.length} productos)</p>
        <Button size="sm" onClick={() => handleOpenEdit()}>
          <Plus size={16} className="mr-1" /> Nuevo
        </Button>
      </div>

      <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        {myStore.products.length === 0 && (
            <div className="text-center py-8 bg-stone-50 dark:bg-stone-800/50 border border-dashed border-stone-200 dark:border-stone-700 rounded-xl lg:col-span-2">
                <p className="text-stone-400 dark:text-stone-500 text-sm">Aún no tienes productos.</p>
            </div>
        )}
        {myStore.products.map((product: Product) => (
          <div key={product.id} className="bg-white dark:bg-stone-800 p-3 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 flex gap-4 items-center">
            <div className="w-16 h-16 rounded-lg bg-stone-100 dark:bg-stone-700 overflow-hidden shrink-0">
              <LazyImage src={product.image} alt={product.name} className="w-full h-full" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-stone-900 dark:text-white text-sm">{product.name}</h4>
                {product.isAvailable === false && (
                    <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Agotado</span>
                )}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1">{product.description}</p>
              <div className="flex items-center gap-2 mt-1">
                  <p className="font-bold text-brand-800 dark:text-brand-400 text-sm">{formatCurrency(product.price)}</p>
              </div>
            </div>
            <button onClick={() => handleOpenEdit(product)} className="p-2 text-stone-400 dark:text-stone-500 hover:text-brand-800 dark:hover:text-brand-400">
              <Pencil size={18} />
            </button>
          </div>
        ))}
      </div>

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
           <div className="bg-white dark:bg-stone-900 w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
               <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-800/50">
                  <h3 className="font-bold dark:text-white">Editar Producto</h3>
                  <button onClick={() => setEditingProduct(null)} className="dark:text-white"><X size={20}/></button>
               </div>
               <div className="p-4 overflow-y-auto space-y-4 flex-1">
                   <input className="w-full border dark:border-stone-700 p-2 rounded dark:bg-stone-800 dark:text-white" placeholder="Nombre" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                   <input className="w-full border dark:border-stone-700 p-2 rounded dark:bg-stone-800 dark:text-white" placeholder="Precio" type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                   <textarea className="w-full border dark:border-stone-700 p-2 rounded dark:bg-stone-800 dark:text-white" placeholder="Descripción" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                   
                   <div className="flex items-center gap-2 py-2">
                        <input 
                            type="checkbox" 
                            id="isAvailable" 
                            checked={formData.isAvailable !== false} 
                            onChange={e => setFormData({...formData, isAvailable: e.target.checked})} 
                            className="w-4 h-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                        />
                        <label htmlFor="isAvailable" className="text-sm font-bold dark:text-white">Producto Disponible (en stock)</label>
                    </div>

                   <div className="flex flex-col gap-2">
                       <label className="text-sm font-bold dark:text-white">Imagen del Producto</label>
                       {formData.image && <img src={formData.image} alt="Preview" className="w-24 h-24 object-cover rounded-lg" />}
                       <input type="file" accept="image/*" onChange={async (e) => {
                           if (e.target.files && e.target.files[0]) {
                               try {
                                   setIsUploadingImage(true);
                                   showToast('Subiendo imagen...', 'info');
                                   const url = await uploadImageToCloudinary(e.target.files[0]);
                                   setFormData({...formData, image: url});
                                   showToast('Imagen subida', 'success');
                               } catch {
                                   showToast('Error al subir imagen', 'error');
                               } finally {
                                   setIsUploadingImage(false);
                               }
                           }
                       }} className="text-sm dark:text-white" disabled={isUploadingImage} />
                   </div>
                   
                   <div className="border-t dark:border-stone-700 pt-4">
                       <div className="flex justify-between mb-2">
                           <h4 className="font-bold text-sm dark:text-white">Opciones (Modifiers)</h4>
                           <button onClick={_addModifierGroup} className="text-xs text-brand-800 dark:text-brand-400 font-bold">+ Grupo</button>
                       </div>
                       {formData.modifierGroups?.map(g => (
                           <div key={g.id} className="bg-stone-50 dark:bg-stone-800/50 p-2 mb-2 rounded border dark:border-stone-700">
                               <div className="flex justify-between mb-2">
                                   <input value={g.name} onChange={e => _updateGroup(g.id, 'name', e.target.value)} className="text-xs font-bold bg-transparent dark:text-white" />
                                   <button onClick={() => _removeModifierGroup(g.id)} className="dark:text-white"><Trash2 size={12} /></button>
                               </div>
                               <div className="pl-2 border-l-2 dark:border-stone-600">
                                   {g.options?.map(o => (
                                       <div key={o.id} className="flex gap-2 mb-1">
                                           <input value={o.name} onChange={e => _updateOption(g.id, o.id, 'name', e.target.value)} className="text-xs border dark:border-stone-600 rounded p-1 flex-1 dark:bg-stone-700 dark:text-white" />
                                           <input type="number" value={o.price} onChange={e => _updateOption(g.id, o.id, 'price', Number(e.target.value))} className="text-xs border dark:border-stone-600 rounded p-1 w-12 dark:bg-stone-700 dark:text-white" />
                                           <button onClick={() => _removeOption(g.id, o.id)} className="dark:text-white"><X size={12}/></button>
                                       </div>
                                   ))}
                                   <button onClick={() => _addOptionToGroup(g.id)} className="text-[10px] text-brand-800 dark:text-brand-400 font-bold">+ Opción</button>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>
               <div className="p-4 border-t dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 flex gap-2">
                   {editingProduct !== 'NEW' && <Button variant="danger" onClick={() => handleDelete((editingProduct as Product).id)}>Eliminar</Button>}
                   <Button fullWidth onClick={handleSave}>Guardar</Button>
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
    const [font, setFont] = useState(store.customFont || 'Inter');
    const [color, setColor] = useState(store.customColor || '#FACC15'); // Default brand yellow
    const [mpToken, setMpToken] = useState(store.mpAccessToken || '');
    const [storeImage, setStoreImage] = useState(store.image || '');
    const [category, setCategory] = useState(store.category || '');
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const fonts = ['Inter', 'Roboto', 'Montserrat', 'Playfair Display', 'Courier New', 'Georgia'];

    const handleSave = () => {
        updateStore(store.id, { 
            customFont: font, 
            customColor: color, 
            mpAccessToken: mpToken, 
            image: storeImage,
            category: category
        });
        showToast('Configuración guardada', 'success');
    };

    return (
        <div className="bg-white dark:bg-stone-800 p-6 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-700 max-w-2xl mx-auto animate-slide-up">
            <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-6 flex items-center gap-2">
                <StoreIcon size={24} className="text-brand-800" /> Personalización de Tienda
            </h3>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2 uppercase tracking-wider">Categoría del Comercio</label>
                    <select 
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm"
                    >
                        {config.categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2 uppercase tracking-wider">Logo / Imagen de la Tienda</label>
                    <div className="flex items-center gap-4">
                        {storeImage && <img src={storeImage} alt="Store Logo" className="w-16 h-16 rounded-xl object-cover border border-stone-200 dark:border-stone-700" />}
                        <input type="file" accept="image/*" onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                                try {
                                    setIsUploadingImage(true);
                                    showToast('Subiendo imagen...', 'info');
                                    const url = await uploadImageToCloudinary(e.target.files[0]);
                                    setStoreImage(url);
                                    showToast('Imagen subida', 'success');
                                } catch {
                                    showToast('Error al subir imagen', 'error');
                                } finally {
                                    setIsUploadingImage(false);
                                }
                            }
                        }} className="text-sm dark:text-white" disabled={isUploadingImage} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2 uppercase tracking-wider">Fuente de la Tienda</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {fonts.map(f => (
                            <button 
                                key={f}
                                onClick={() => setFont(f)}
                                className={`p-3 rounded-xl border text-sm transition-all ${font === f ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20 text-brand-900 dark:text-brand-100 ring-2 ring-brand-500/20' : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-brand-300'}`}
                                style={{ fontFamily: f }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2 uppercase tracking-wider">Color de Marca</label>
                    <div className="flex items-center gap-4">
                        <input 
                            type="color" 
                            value={color}
                            onChange={e => setColor(e.target.value)}
                            className="w-16 h-16 rounded-xl cursor-pointer border-4 border-white dark:border-stone-700 shadow-lg"
                        />
                        <div className="flex-1">
                            <p className="text-sm text-stone-500 dark:text-stone-400">Este color se usará para botones y acentos cuando los clientes vean tu tienda.</p>
                            <p className="font-mono text-xs mt-1 font-bold text-stone-400 uppercase">{color}</p>
                        </div>
                    </div>
                </div>

                <div className="border-t dark:border-stone-700 pt-6">
                    <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <CreditCard size={16} className="text-brand-800" /> Mercado Pago Access Token
                    </label>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
                        Si la plataforma está en modo "Descentralizado", los pagos irán directamente a tu cuenta. 
                        Pega tu Access Token de producción aquí.
                    </p>
                    <input 
                        type="password" 
                        value={mpToken}
                        onChange={e => setMpToken(e.target.value)}
                        placeholder="APP_USR-..."
                        className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm"
                    />
                </div>

                <div className="pt-4">
                    <div className="p-4 rounded-xl border border-dashed border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50 mb-6">
                        <p className="text-xs font-bold text-stone-400 uppercase mb-3">Vista Previa</p>
                        <div className="p-4 bg-white dark:bg-stone-800 rounded-lg shadow-sm border border-stone-100 dark:border-stone-700" style={{ fontFamily: font }}>
                            <h4 className="font-bold text-lg mb-1" style={{ color }}>{store.name}</h4>
                            <p className="text-sm text-stone-500 mb-4">Ejemplo de descripción de tu tienda con la fuente seleccionada.</p>
                            <button className="px-4 py-2 rounded-lg text-white font-bold text-sm shadow-lg" style={{ backgroundColor: color }}>
                                Botón de Ejemplo
                            </button>
                        </div>
                    </div>
                    <Button fullWidth onClick={handleSave} size="lg">Guardar Cambios</Button>
                </div>
            </div>
        </div>
    );
};

export const MerchantView: React.FC = () => {
  const { user, orders, stores, merchantViewState, setMerchantViewState, updateStore, completeTour, setRole } = useApp();
  const { showToast } = useToast();
  const lastOrderCountRef = useRef(0);

  const isMobile = window.innerWidth < 1024;
  
  const merchantTourSteps: TourStep[] = [
    {
        targetId: 'store-status',
        title: 'Estado de tu Tienda',
        description: 'Cambia entre ONLINE y OFFLINE para controlar cuándo recibes pedidos. ¡Asegúrate de estar ONLINE para empezar a vender!',
        position: 'bottom'
    },
    {
        targetId: isMobile ? 'orders-tab-mobile' : 'orders-tab',
        title: 'Gestión de Pedidos',
        description: 'Aquí verás todos los pedidos entrantes. Podrás aceptarlos, marcarlos en preparación y listos para entregar.',
        position: isMobile ? 'top' : 'right'
    },
    {
        targetId: isMobile ? 'menu-tab-mobile' : 'menu-tab',
        title: 'Tu Menú Digital',
        description: 'Carga tus productos, añade fotos y descripciones. ¡Incluso puedes usar nuestra IA para escanear tu carta física!',
        position: isMobile ? 'top' : 'right'
    },
    {
        targetId: isMobile ? 'coupons-tab-mobile' : 'coupons-tab',
        title: 'Cupones de Descuento',
        description: 'Atrae más clientes creando cupones promocionales. Tú decides el descuento y las condiciones.',
        position: isMobile ? 'top' : 'right'
    },
    {
        targetId: isMobile ? 'history-tab-mobile' : 'history-tab',
        title: 'Historial de Ventas',
        description: 'Revisa tus ventas pasadas, analiza tus ingresos y mantén un control total de tu negocio.',
        position: isMobile ? 'top' : 'right'
    },
    {
        targetId: isMobile ? 'settings-tab-mobile' : 'settings-tab',
        title: 'Personalización',
        description: 'Ajusta los colores de tu marca, logo, horarios de atención y configuración de pagos.',
        position: isMobile ? 'top' : 'right'
    }
  ];

  const showTour = !user.completedTours?.includes('merchant-onboarding') && !!myStore?.isActive && merchantViewState === 'ORDERS';

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

  const [wasPending, setWasPending] = useState(myStore ? !myStore.isActive : false);

  React.useEffect(() => {
    if (myStore?.isActive && wasPending) {
        soundService.play('SUCCESS');
        showToast('¡Tu comercio ha sido aprobado! 🎉', 'success');
        setWasPending(false);
    }
  }, [myStore?.isActive, wasPending, showToast]);

  // IDENTITY INTEGRATION:
  // If user owns a store, use it. If not, show "No Store" state.
  // Use useMemo to avoid recalc on every render and ensure it picks up changes
  const myStore = React.useMemo(() => {
    return stores.find(s => s.id === user.ownedStoreId || s.ownerId === user.uid);
  }, [stores, user.ownedStoreId, user.uid]);

  // If we are definitely a merchant but store hasn't loaded yet, show loading
  // Check both app-level role and user-profile role for robustness
  if (!myStore && (user.ownedStoreId || user.role === UserRole.MERCHANT || role === UserRole.MERCHANT)) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-8 bg-stone-900">
               <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-500 border-t-transparent mx-auto mb-4 shadow-[0_0_15px_rgba(255,237,0,0.2)]" />
               <p className="text-stone-400 font-medium animate-pulse">Sincronizando los datos de tu comercio...</p>
               <p className="text-stone-600 text-[10px] uppercase tracking-widest mt-2 font-bold">Un momento por favor</p>
          </div>
      );
  }

  if (myStore && !myStore.isActive) {
      return (
        <div className="flex flex-col items-center justify-center p-10 text-center space-y-8 animate-fade-in py-20 min-h-screen bg-stone-50 dark:bg-stone-950">
            <div className="relative">
                <div className="absolute inset-0 bg-brand-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                <div className="w-32 h-32 bg-stone-900 border-4 border-white/10 rounded-[3rem] shadow-2xl flex items-center justify-center relative">
                    <Shield size={48} className="text-brand-500 animate-float" />
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center shadow-lg border-2 border-stone-900">
                        <Clock size={20} className="text-brand-950 animate-spin-slow" />
                    </div>
                </div>
            </div>
            
            <div className="space-y-4 max-w-sm">
                <h2 className="text-3xl font-black text-stone-900 dark:text-white tracking-tighter uppercase">Solicitud en Revisión</h2>
                <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">
                    Nuestros administradores están validando tu información comercial. Te notificaremos por WhatsApp cuando sea aprobada.
                </p>
            </div>

            <div className="bg-white dark:bg-stone-800 p-6 rounded-3xl border border-black/[0.03] dark:border-white/[0.03] shadow-xl w-full max-w-md text-left space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center">
                        <StoreIcon size={20} className="text-brand-600 dark:text-brand-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider">{myStore?.name}</h4>
                        <p className="text-[10px] text-stone-500 font-bold uppercase">Estado: Pendiente de Aprobación</p>
                    </div>
                </div>
                <div className="h-2 w-full bg-stone-100 dark:bg-stone-900 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 w-2/3 animate-shimmer" />
                </div>
                <p className="text-[10px] text-stone-400 italic text-center">Te notificaremos tan pronto seas activado.</p>
            </div>

            <Button 
                variant="outline" 
                onClick={() => {
                    updateUser({ role: UserRole.CLIENT });
                    setRole(UserRole.CLIENT);
                }}
                className="rounded-2xl border-stone-200 dark:border-stone-800 text-xs font-black uppercase tracking-widest px-8"
            >
                Volver al Inicio (Modo Cliente)
            </Button>
        </div>
      );
  }

  if (!myStore) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-stone-900 animate-fade-in">
              <div className="bg-brand-400/10 p-6 rounded-full shadow-inner mb-6">
                  <StoreIcon size={48} className="text-brand-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Registro Incompleto</h2>
              <p className="text-stone-400 mb-8 max-w-xs mx-auto text-sm">Parece que el registro de tu tienda no se completó o los datos (RFC, CLABE, etc) aún no han sido vinculados a tu cuenta.</p>
              
              <Button 
                  onClick={() => {
                    updateUser({ role: UserRole.NONE, ownedStoreId: undefined });
                    setRole(UserRole.NONE);
                  }}
                  variant="primary"
              >
                  Volver al Inicio para Registrar Tienda
              </Button>
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
      <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl shadow-sm z-10 sticky top-0 border-b border-black/[0.03] dark:border-white/[0.03]">
        <div className="lg:max-w-7xl lg:mx-auto lg:w-full">
            <div className="p-6 flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-black text-stone-950 dark:text-white tracking-tighter">{myStore.name}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <button 
                    id="store-status"
                    onClick={() => updateStore(myStore.id, { isOpen: !myStore.isOpen })}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-2 w-fit transition-all shadow-sm ${myStore.isOpen !== false ? 'bg-brand-500 text-brand-950' : 'bg-stone-200 dark:bg-stone-800 text-stone-500 dark:text-stone-400'}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${myStore.isOpen !== false ? 'bg-brand-950 animate-pulse' : 'bg-stone-400'}`}></span>
                    {myStore.isOpen !== false ? 'TIENDA ABIERTA' : 'TIENDA CERRADA'}
                  </button>
                  <span className="text-xs text-stone-400 dark:text-stone-500 font-bold uppercase tracking-widest">| {activeOrders.length} activos</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                  <div className="w-14 h-14 rounded-[1.5rem] bg-stone-100 dark:bg-stone-800 border-2 border-white dark:border-stone-700 overflow-hidden shadow-2xl">
                    <LazyImage src={myStore.image} alt="Logo" className="w-full h-full object-cover" />
                  </div>
              </div>
            </div>

            <div className="flex p-1.5 mx-6 mb-4 bg-stone-100 dark:bg-white/5 rounded-2xl border border-black/[0.03] dark:border-white/[0.03] overflow-x-auto lg:overflow-visible lg:justify-center lg:max-w-2xl lg:mx-auto">
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
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
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
                onClick={() => setMerchantViewState('COUPONS')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${merchantViewState === 'COUPONS' ? 'bg-white dark:bg-stone-800 shadow-xl text-stone-950 dark:text-white' : 'text-stone-500 dark:text-stone-400 hover:text-stone-950 dark:hover:text-white'}`}
              >
                <Ticket size={16} /> Cupones
              </button>
              <button
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

      <div className="p-6 space-y-6 flex-1 overflow-y-auto pb-24 lg:max-w-7xl lg:mx-auto lg:w-full lg:p-10">

        {merchantViewState === 'ORDERS' ? (
          activeOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center bg-white dark:bg-stone-900 border border-black/[0.03] dark:border-white/5 rounded-3xl shadow-sm relative overflow-hidden group">
               {/* Decorative background element */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-brand-500/20 transition-all duration-700" />
               
               <div className="w-20 h-20 bg-stone-100 dark:bg-stone-800 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-black/5 dark:shadow-black/20 group-hover:scale-110 transition-transform duration-500">
                  <ShoppingBag size={32} className="text-stone-300 dark:text-stone-600" />
               </div>
               
               <h3 className="text-xl font-black text-stone-900 dark:text-white mb-2 tracking-tight">¡Bienvenido a tu Panel de Control!</h3>
               <p className="text-stone-500 dark:text-stone-400 text-sm max-w-xs leading-relaxed mb-8">
                 Tu tienda ya está activa. Aquí aparecerán los pedidos de tus clientes en tiempo real.
               </p>
               
               <button 
                  onClick={() => setMerchantViewState('MENU')}
                  className="bg-brand-500 hover:bg-brand-600 text-brand-950 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-500/20 transition-all active:scale-95 flex items-center gap-2"
               >
                  <Plus size={16} />
                  Cargar tus productos
               </button>
            </div>
          ) : (
            <div className="space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:space-y-0">
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
          <div className="space-y-4">
              <div className="bg-white dark:bg-stone-800 p-4 rounded-xl border border-stone-200 dark:border-stone-700 shadow-sm flex justify-between items-center lg:max-w-md lg:mx-auto lg:mb-8">
                  <div>
                      <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase">Ventas Totales</p>
                      <p className="text-2xl font-bold text-brand-950 dark:text-brand-400">{formatCurrency(totalRevenue)}</p>
                  </div>
                  <div className="text-right">
                      <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase">Pedidos Completados</p>
                      <p className="text-xl font-bold text-stone-900 dark:text-white">{historyOrders.filter(o => o.status === OrderStatus.DELIVERED).length}</p>
                  </div>
              </div>
              {historyOrders.length === 0 ? (
                  <div className="text-center py-20 text-stone-400 dark:text-stone-500 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-xl">
                      <p>No hay historial de pedidos</p>
                  </div>
              ) : (
                  <div className="space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:space-y-0">
                      {historyOrders.map(order => <OrderCard key={order.id} order={order} />)}
                  </div>
              )}
          </div>
        )}
      </div>
      {showTour && (
          <OnboardingTour 
              tourId="merchant-onboarding" 
              steps={merchantTourSteps} 
              onComplete={() => completeTour('merchant-onboarding')} 
          />
      )}
    </div>
  );
};
