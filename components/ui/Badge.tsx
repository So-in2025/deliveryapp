import React from 'react';
import { OrderStatus } from '../../types';

interface BadgeProps {
  status: OrderStatus;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const styles: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'bg-amber-100 text-amber-700 border-amber-200',
    [OrderStatus.ACCEPTED]: 'bg-blue-100 text-blue-700 border-blue-200',
    [OrderStatus.PREPARING]: 'bg-purple-100 text-purple-700 border-purple-200',
    [OrderStatus.READY]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    [OrderStatus.DRIVER_ASSIGNED]: 'bg-pink-100 text-pink-700 border-pink-200',
    [OrderStatus.PICKED_UP]: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    [OrderStatus.DELIVERED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [OrderStatus.CANCELLED]: 'bg-red-100 text-red-700 border-red-200',
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
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};