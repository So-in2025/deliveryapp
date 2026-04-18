import React from 'react';
import { OrderStatus } from '../../types';

interface BadgeProps {
  status: OrderStatus;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const styles: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'bg-amber-100 text-amber-700 border-amber-200',
    [OrderStatus.ACCEPTED]: 'bg-amber-100 text-amber-700 border-amber-200',
    [OrderStatus.PREPARING]: 'bg-orange-100 text-orange-700 border-orange-200',
    [OrderStatus.READY]: 'bg-brand-100 text-brand-950 border-brand-200',
    [OrderStatus.DRIVER_ASSIGNED]: 'bg-stone-100 text-stone-700 border-stone-200',
    [OrderStatus.PICKED_UP]: 'bg-stone-100 text-stone-700 border-stone-200',
    [OrderStatus.DELIVERED]: 'bg-brand-500 text-brand-950 border-brand-600',
    [OrderStatus.CANCELLED]: 'bg-red-100 text-red-700 border-red-200',
    [OrderStatus.DISPUTED]: 'bg-purple-100 text-purple-700 border-purple-200',
  };

  const labels: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'Pendiente',
    [OrderStatus.ACCEPTED]: 'Aceptado',
    [OrderStatus.PREPARING]: 'Preparando',
    [OrderStatus.READY]: 'Listo',
    [OrderStatus.DRIVER_ASSIGNED]: 'Asignado',
    [OrderStatus.PICKED_UP]: 'En Camino',
    [OrderStatus.DELIVERED]: 'Entregado',
    [OrderStatus.CANCELLED]: 'Cancelado',
    [OrderStatus.DISPUTED]: 'En Disputa',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

interface StoreBadgeProps {
  isActive: boolean;
}

export const StoreBadge: React.FC<StoreBadgeProps> = ({ isActive }) => {
    return (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${isActive ? 'bg-brand-500 text-brand-950 border-brand-600' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
            {isActive ? 'Activa' : 'Pendiente'}
        </span>
    );
};

interface PaymentBadgeProps {
  status?: 'PENDING' | 'PAID' | 'FAILED';
  method: string;
}

export const PaymentBadge: React.FC<PaymentBadgeProps> = ({ status, method }) => {
  if (method !== 'MERCADO_PAGO') return <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Efectivo/Tarjeta</span>;
  
  const isPaid = status === 'PAID';
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${isPaid ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
      {isPaid ? 'Pagado' : 'Pendiente Pago'}
    </span>
  );
};
