import React, { useState } from 'react';
import { 
  Eye, EyeOff, Copy, Check, Calendar, 
  User, Mail, Key, DollarSign, ShoppingCart, 
  Truck, Tag, Edit, Trash2, ChevronDown, Clock 
} from 'lucide-react';

const STATUS_CONFIG = {
  'Pendiente': { color: 'badge-pending', label: 'Pendiente' },
  'En Revisión': { color: 'badge-review', label: 'En Revisión ⏳' },
  'Salió': { color: 'badge-shipped', label: 'Salió 🚚' },
  'Llegó': { color: 'badge-arrived', label: 'Llegó 📦' },
  'Entregado': { color: 'badge-delivered', label: 'Entregado ✨' },
};

export default function OrderCard({ order, onEdit, onDelete, onStatusChange }) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG['Pendiente'];

  return (
    <div className="glass-card flex flex-col justify-between hover:border-fuchsia-300 transition-all duration-300">
      {/* Header with Client Name, Operator and Status */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-slate-800 tracking-tight">
                {order.clientName || 'Cliente sin nombre'}
              </h3>
              <span className="badge badge-operator text-xs">
                {order.operator}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
              <Calendar size={13} className="text-fuchsia-400" />
              <span>{order.date || 'Sin fecha'}</span>
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <button
              onClick={() => setStatusMenuOpen(!statusMenuOpen)}
              className={`badge ${statusInfo.color} cursor-pointer flex items-center gap-1.5 hover:opacity-90 transition-opacity shadow-sm`}
              title="Cambiar estado"
            >
              <span>{statusInfo.label}</span>
              <ChevronDown size={13} />
            </button>

            {statusMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setStatusMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-44 glass-modal z-30 p-1.5 shadow-xl animate-fade-in bg-white border border-fuchsia-200">
                  {Object.keys(STATUS_CONFIG).map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        onStatusChange(order.id, st);
                        setStatusMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between hover:bg-fuchsia-50 transition-colors ${
                        order.status === st ? 'text-fuchsia-600 font-bold bg-fuchsia-50/80' : 'text-slate-600'
                      }`}
                    >
                      <span>{STATUS_CONFIG[st].label}</span>
                      {order.status === st && <Check size={13} className="text-fuchsia-600" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Credentials and Details Section */}
        <div className="space-y-2 py-3 border-y border-fuchsia-100 text-sm">
          {/* Email */}
          <div className="flex items-center justify-between text-xs bg-fuchsia-50/40 p-2.5 rounded-xl border border-fuchsia-100">
            <div className="flex items-center gap-2 text-slate-700 truncate mr-2">
              <Mail size={14} className="text-fuchsia-500 shrink-0" />
              <span className="truncate font-mono">{order.email || 'Sin correo'}</span>
            </div>
            {order.email && (
              <button
                onClick={() => copyToClipboard(order.email, 'email')}
                className="text-slate-400 hover:text-fuchsia-600 p-1 hover:bg-fuchsia-100 rounded-lg transition-colors"
                title="Copiar correo"
              >
                {copiedEmail ? <Check size={13} className="text-emerald-500 font-bold" /> : <Copy size={13} />}
              </button>
            )}
          </div>

          {/* Password */}
          <div className="flex items-center justify-between text-xs bg-fuchsia-50/40 p-2.5 rounded-xl border border-fuchsia-100">
            <div className="flex items-center gap-2 text-slate-700 truncate mr-2">
              <Key size={14} className="text-amber-500 shrink-0" />
              <span className="font-mono">
                {showPassword ? (order.password || 'Sin clave') : '••••••••••••'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-fuchsia-600 p-1 hover:bg-fuchsia-100 rounded-lg transition-colors"
                title={showPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              {order.password && (
                <button
                  onClick={() => copyToClipboard(order.password, 'key')}
                  className="text-slate-400 hover:text-fuchsia-600 p-1 hover:bg-fuchsia-100 rounded-lg transition-colors"
                  title="Copiar contraseña"
                >
                  {copiedKey ? <Check size={13} className="text-emerald-500 font-bold" /> : <Copy size={13} />}
                </button>
              )}
            </div>
          </div>

          {/* Tracking Number */}
          <div className="flex items-center justify-between text-xs px-1 text-slate-500">
            <div className="flex items-center gap-1.5">
              <Truck size={14} className="text-sky-500" />
              <span className="font-semibold">Nº de Guía:</span>
            </div>
            <span className="font-mono text-slate-700 font-bold">
              {order.trackingNumber || 'N/A'}
            </span>
          </div>

          {order.notes && (
            <div className="text-xs text-slate-500 italic bg-fuchsia-50/30 p-2 rounded-lg border border-fuchsia-100/60">
              "{order.notes}"
            </div>
          )}
        </div>
      </div>

      {/* Financial Info and Actions */}
      <div className="pt-3 mt-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Monto Pago</div>
            <div className="text-lg font-black text-fuchsia-600 flex items-center">
              <span>${Number(order.paidAmount || 0).toFixed(2)}</span>
            </div>
          </div>
          <div className="h-7 w-px bg-fuchsia-200" />
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Carritos</div>
            <div className="text-sm font-bold text-purple-600 flex items-center gap-1">
              <ShoppingCart size={13} />
              <span>{order.cartsCount || 1}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(order)}
            className="p-2 text-slate-400 hover:text-fuchsia-600 hover:bg-fuchsia-50 rounded-xl transition-colors"
            title="Editar pedido"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDelete(order.id)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            title="Eliminar pedido"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
