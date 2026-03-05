
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { OrderStatus, Order, PaymentMethod, OrderType, Product, ModifierGroup, Modifier, Store } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LazyImage } from '../components/ui/LazyImage';
import { CheckCircle, Clock, Bike, User, CreditCard, Banknote, StickyNote, Store as StoreIcon, ShoppingBag, Plus, Pencil, Trash2, X, UtensilsCrossed, LayoutDashboard, Ticket, ToggleLeft, ToggleRight } from 'lucide-react';
import { formatCurrency } from '../constants';

const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
  const { updateOrder, cancelOrder } = useApp();
  const { showToast } = useToast();

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
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-slide-up">
      <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">#{order.id.slice(-6)}</span>
          {order.type === OrderType.PICKUP ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-bold uppercase shadow-sm">
              <StoreIcon size={10} /> Retiro
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-brand-600 text-white text-[10px] font-bold uppercase shadow-sm">
              <Bike size={10} /> Delivery
            </span>
          )}
        </div>
        <Badge status={order.status} />
      </div>

      <div className="p-4">
        <div className="flex gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex-1">
            <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Cliente</p>
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <User size={16} className="text-slate-400 dark:text-slate-500" />
              {order.customerName}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Pago</p>
            <div className={`flex items-center gap-2 text-sm font-bold justify-end ${order.paymentMethod === PaymentMethod.CASH ? 'text-amber-600 dark:text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>
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
          {order.items.map((item, idx) => (
            <div key={idx} className="flex gap-3 text-sm">
              <div className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-900 dark:text-white font-bold text-xs h-fit border border-slate-200 dark:border-slate-600">
                {item.quantity}x
              </div>
              <div className="flex-1">
                <p className="text-slate-900 dark:text-white font-medium leading-tight">{item.product.name}</p>
                {item.selectedModifiers.length > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {item.selectedModifiers.map(m => m.name).join(', ')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center text-sm pt-2">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Total del pedido</span>
          <span className="font-bold text-xl text-slate-900 dark:text-white">{formatCurrency(order.total)}</span>
        </div>

        {order.type === OrderType.DELIVERY && order.status === OrderStatus.DRIVER_ASSIGNED && (
          <div className="mt-4 bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/30 p-2.5 rounded-lg flex items-center gap-3 text-sm text-brand-800 dark:text-brand-300">
            <div className="bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-sm">
              <Bike size={16} className="text-brand-600 dark:text-brand-400" />
            </div>
            <span className="font-medium">Repartidor en camino al local</span>
          </div>
        )}

        {order.type === OrderType.DELIVERY && order.status === OrderStatus.PICKED_UP && (
          <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 p-2.5 rounded-lg flex items-center gap-3 text-sm text-green-800 dark:text-green-300">
            <div className="bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-sm">
              <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
            </div>
            <span className="font-medium">Pedido retirado - En camino al cliente</span>
          </div>
        )}

        {order.type === OrderType.PICKUP && order.status === OrderStatus.READY && (
          <div className="mt-4 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 p-2.5 rounded-lg flex items-center gap-3 text-sm text-slate-800 dark:text-slate-200">
            <div className="bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-sm">
              <ShoppingBag size={16} className="text-slate-600 dark:text-slate-400" />
            </div>
            <span className="font-medium">Esperando retiro del cliente</span>
          </div>
        )}
      </div>

      {/* Logic Update: Only show button if action is available for Merchant */}
      {!(order.status === OrderStatus.READY && order.type === OrderType.DELIVERY) && order.status !== OrderStatus.PICKED_UP && order.status !== OrderStatus.DRIVER_ASSIGNED && order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.DISPUTED && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex gap-2">
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
            className={order.status === OrderStatus.PENDING ? 'bg-brand-600 hover:bg-brand-700 flex-1' : 'flex-1'}
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
    </div>
  );
};

const CouponManager: React.FC = () => {
    const { addCoupon, coupons, deleteCoupon, toggleCoupon } = useApp();
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
            description: newDesc
        });
        setNewCode('');
        setNewDiscount('');
        setNewDesc('');
        showToast('Cupón creado', 'success');
    };

    return (
        <div className="pb-24">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 mb-6">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4">Crear Nuevo Cupón</h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Código</label>
                        <input 
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 font-mono uppercase font-bold text-slate-900 dark:text-white"
                            placeholder="Ej: VERANO20"
                            value={newCode}
                            onChange={e => setNewCode(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3">
                        <div className="w-1/3">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Descuento %</label>
                            <input 
                                type="number"
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 font-bold text-slate-900 dark:text-white"
                                placeholder="20"
                                value={newDiscount}
                                onChange={e => setNewDiscount(e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Descripción</label>
                            <input 
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
                                placeholder="Para nuevos clientes"
                                value={newDesc}
                                onChange={e => setNewDesc(e.target.value)}
                            />
                        </div>
                    </div>
                    <Button fullWidth onClick={handleAdd} disabled={!newCode || !newDiscount}>Crear Cupón</Button>
                </div>
            </div>

            <h3 className="font-bold text-slate-900 dark:text-white mb-3 px-1">Cupones Activos</h3>
            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                {coupons.length === 0 && <p className="text-slate-400 dark:text-slate-500 text-center py-4 lg:col-span-2">No hay cupones creados.</p>}
                {coupons.map(coupon => (
                    <div key={coupon.id} className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border flex justify-between items-center ${coupon.active ? 'border-brand-200 dark:border-brand-900/30' : 'border-slate-200 dark:border-slate-700 opacity-60'}`}>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-lg text-slate-900 dark:text-white">{coupon.code}</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${coupon.active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                    {coupon.active ? 'ACTIVO' : 'INACTIVO'}
                                </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">{coupon.discountPct * 100}% OFF • {coupon.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => toggleCoupon(coupon.id)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400">
                                {coupon.active ? <ToggleRight size={24} className="text-brand-600 dark:text-brand-400" /> : <ToggleLeft size={24} />}
                            </button>
                            <button onClick={() => deleteCoupon(coupon.id)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400">
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
};

const ProductEditor: React.FC<{ store: Store }> = ({ store: myStore }) => {
  const { addProduct, updateProduct, deleteProduct } = useApp();
  const { showToast } = useToast();
  const [editingProduct, setEditingProduct] = useState<Product | 'NEW' | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', description: '', price: 0, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c', modifierGroups: []
  });

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
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-500 dark:text-slate-400 text-sm">Gestiona tu catálogo ({myStore.products.length} productos)</p>
        <Button size="sm" onClick={() => handleOpenEdit()}>
          <Plus size={16} className="mr-1" /> Nuevo
        </Button>
      </div>

      <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        {myStore.products.length === 0 && (
            <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl lg:col-span-2">
                <p className="text-slate-400 dark:text-slate-500 text-sm">Aún no tienes productos.</p>
            </div>
        )}
        {myStore.products.map((product: Product) => (
          <div key={product.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex gap-4 items-center">
            <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0">
              <LazyImage src={product.image} alt={product.name} className="w-full h-full" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">{product.name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{product.description}</p>
              <div className="flex items-center gap-2 mt-1">
                  <p className="font-bold text-brand-600 dark:text-brand-400 text-sm">{formatCurrency(product.price)}</p>
              </div>
            </div>
            <button onClick={() => handleOpenEdit(product)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400">
              <Pencil size={18} />
            </button>
          </div>
        ))}
      </div>

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
               <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                  <h3 className="font-bold dark:text-white">Editar Producto</h3>
                  <button onClick={() => setEditingProduct(null)} className="dark:text-white"><X size={20}/></button>
               </div>
               <div className="p-4 overflow-y-auto space-y-4 flex-1">
                   <input className="w-full border dark:border-slate-700 p-2 rounded dark:bg-slate-800 dark:text-white" placeholder="Nombre" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                   <input className="w-full border dark:border-slate-700 p-2 rounded dark:bg-slate-800 dark:text-white" placeholder="Precio" type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                   <textarea className="w-full border dark:border-slate-700 p-2 rounded dark:bg-slate-800 dark:text-white" placeholder="Descripción" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                   
                   <div className="border-t dark:border-slate-700 pt-4">
                       <div className="flex justify-between mb-2">
                           <h4 className="font-bold text-sm dark:text-white">Opciones (Modifiers)</h4>
                           <button onClick={_addModifierGroup} className="text-xs text-brand-600 dark:text-brand-400 font-bold">+ Grupo</button>
                       </div>
                       {formData.modifierGroups?.map(g => (
                           <div key={g.id} className="bg-slate-50 dark:bg-slate-800/50 p-2 mb-2 rounded border dark:border-slate-700">
                               <div className="flex justify-between mb-2">
                                   <input value={g.name} onChange={e => _updateGroup(g.id, 'name', e.target.value)} className="text-xs font-bold bg-transparent dark:text-white" />
                                   <button onClick={() => _removeModifierGroup(g.id)} className="dark:text-white"><Trash2 size={12} /></button>
                               </div>
                               <div className="pl-2 border-l-2 dark:border-slate-600">
                                   {g.options.map(o => (
                                       <div key={o.id} className="flex gap-2 mb-1">
                                           <input value={o.name} onChange={e => _updateOption(g.id, o.id, 'name', e.target.value)} className="text-xs border dark:border-slate-600 rounded p-1 flex-1 dark:bg-slate-700 dark:text-white" />
                                           <input type="number" value={o.price} onChange={e => _updateOption(g.id, o.id, 'price', Number(e.target.value))} className="text-xs border dark:border-slate-600 rounded p-1 w-12 dark:bg-slate-700 dark:text-white" />
                                           <button onClick={() => _removeOption(g.id, o.id)} className="dark:text-white"><X size={12}/></button>
                                       </div>
                                   ))}
                                   <button onClick={() => _addOptionToGroup(g.id)} className="text-[10px] text-brand-600 dark:text-brand-400 font-bold">+ Opción</button>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>
               <div className="p-4 border-t dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-2">
                   {editingProduct !== 'NEW' && <Button variant="danger" onClick={() => handleDelete((editingProduct as Product).id)}>Eliminar</Button>}
                   <Button fullWidth onClick={handleSave}>Guardar</Button>
               </div>
           </div>
        </div>
      )}
    </div>
  );
};

export const MerchantView: React.FC = () => {
  const { user, orders, stores, toggleSettings } = useApp();
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'MENU' | 'COUPONS' | 'HISTORY'>('ORDERS');

  // IDENTITY INTEGRATION:
  // If user owns a store, use it. If not, show "No Store" state.
  const myStore = stores.find(s => s.id === user.ownedStoreId);

  if (!myStore) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-900 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-full shadow-sm mb-6">
                  <StoreIcon size={48} className="text-slate-300 dark:text-slate-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No tienes una tienda asignada</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto">Contacta al administrador o crea tu tienda en el panel de desarrollador para comenzar a vender.</p>
              <Button onClick={() => toggleSettings()} variant="outline">Ir a Configuración</Button>
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
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 animate-fade-in">
      {/* Merchant Header with Tabs */}
      <div className="bg-white dark:bg-slate-800 shadow-sm z-10 sticky top-0">
        <div className="p-4 flex justify-between items-end border-b border-slate-50 dark:border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{myStore.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                ONLINE
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500">| {activeOrders.length} pedidos activos</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 overflow-hidden">
                <LazyImage src={myStore.image} alt="Logo" className="w-full h-full" />
              </div>
          </div>
        </div>

        <div className="flex p-1 mx-4 mb-2 mt-2 bg-slate-100 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto lg:overflow-visible lg:justify-center lg:max-w-2xl lg:mx-auto">
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'ORDERS' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <LayoutDashboard size={16} /> Pedidos
          </button>
          <button
            onClick={() => setActiveTab('MENU')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'MENU' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <UtensilsCrossed size={16} /> Mi Menú
          </button>
          <button
            onClick={() => setActiveTab('COUPONS')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'COUPONS' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Ticket size={16} /> Cupones
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'HISTORY' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Clock size={16} /> Historial
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto lg:max-w-7xl lg:mx-auto lg:w-full lg:p-8">
        {activeTab === 'ORDERS' ? (
          activeOrders.length === 0 ? (
            <div className="text-center py-20 text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              <Clock size={40} className="mx-auto mb-2 opacity-30" />
              <p>Sin pedidos pendientes</p>
            </div>
          ) : (
            <div className="space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:space-y-0">
                {activeOrders.map(order => <OrderCard key={order.id} order={order} />)}
            </div>
          )
        ) : activeTab === 'MENU' ? (
          <ProductEditor store={myStore} />
        ) : activeTab === 'COUPONS' ? (
          <CouponManager />
        ) : (
          <div className="space-y-4">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center lg:max-w-md lg:mx-auto lg:mb-8">
                  <div>
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Ventas Totales</p>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalRevenue)}</p>
                  </div>
                  <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Pedidos Completados</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">{historyOrders.filter(o => o.status === OrderStatus.DELIVERED).length}</p>
                  </div>
              </div>
              {historyOrders.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
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
    </div>
  );
};
