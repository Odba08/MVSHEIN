import React, { useState } from 'react';
import { 
  Eye, EyeOff, Copy, Check, Calendar, 
  User, Mail, Key, DollarSign, ShoppingCart, 
  Truck, Tag, Edit, Trash2, ChevronDown, ChevronUp, 
  Clock, Plus, Sparkles, Heart, ArrowDownRight, ArrowUpRight 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
  'Pendiente': { color: 'badge-pending', label: 'Pendiente' },
  'En Revisión': { color: 'badge-review', label: 'En Revisión ⏳' },
  'Salió': { color: 'badge-shipped', label: 'Salió 🚚' },
  'Llegó': { color: 'badge-arrived', label: 'Llegó 📦' },
  'Entregado': { color: 'badge-delivered', label: 'Entregado ✨' },
};

export default function OrderCard({ 
  order, 
  onEdit, 
  onDelete, 
  onStatusChange, 
  onOpenQuickAddCart,
  onDeleteSubCart 
}) {
  const { currentUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [visibleSubCartPasswords, setVisibleSubCartPasswords] = useState({});

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

  const toggleSubCartPassword = (subId) => {
    setVisibleSubCartPasswords(prev => ({ ...prev, [subId]: !prev[subId] }));
  };

  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG['Pendiente'];

  // Calculations
  const subCarts = Array.isArray(order.subCarts) ? order.subCarts : [];
  const clientPaid = Number(order.paidAmount || 0);
  const storePaid = subCarts.reduce((acc, c) => acc + Number(c.paidAmount || 0), 0);
  const netProfit = clientPaid - storePaid;
  const totalCarts = subCarts.length > 0 ? subCarts.length : Number(order.cartsCount || 1);

  // Breakdown by operator
  const operatorBreakdown = subCarts.reduce((acc, c) => {
    const op = c.operator || 'Francis';
    acc[op] = (acc[op] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="glass-card flex flex-col justify-between hover:border-fuchsia-300 transition-all duration-300">
      <div>
        {/* Header with Client Name, Main Operator and Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
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

        {/* Resumen Financiero en Tarjeta */}
        <div className="mb-3 p-3 bg-gradient-to-r from-fuchsia-50/80 via-pink-50/80 to-purple-50/80 rounded-2xl border border-fuchsia-200/70">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Cliente Pagó</div>
              <div className="text-sm font-black text-fuchsia-700">${clientPaid.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Gastado SHEIN</div>
              <div className="text-sm font-extrabold text-rose-500">
                {storePaid > 0 ? `-$${storePaid.toFixed(2)}` : '$0.00'}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Ganancia Neta</div>
              <div className={`text-sm font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                ${netProfit.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Desglose de Operadoras en carritos */}
          {Object.keys(operatorBreakdown).length > 0 && (
            <div className="mt-2 pt-2 border-t border-fuchsia-100 flex items-center justify-between text-[11px] text-slate-600">
              <span className="font-semibold text-slate-500">Hechos por:</span>
              <div className="flex items-center gap-2">
                {Object.entries(operatorBreakdown).map(([op, cnt]) => (
                  <span key={op} className="px-2 py-0.5 rounded-full bg-white/90 border border-fuchsia-200 font-bold text-fuchsia-800 text-[10px]">
                    {op === 'Francis' ? '👑 Francis' : (op === 'Ana' ? '🌟 Ana' : '🌸 Daily')}: {cnt}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Button: Añadir Carrito Rápido + Toggle Detalle */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => onOpenQuickAddCart(order)}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-fuchsia-500/20 hover:opacity-95 transition-all"
          >
            <Plus size={14} />
            <span>➕ Registrar Carrito / Correo</span>
          </button>

          {subCarts.length > 0 && (
            <button
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
              className="py-2 px-3 rounded-xl border border-fuchsia-200 text-fuchsia-700 bg-white font-semibold text-xs flex items-center gap-1 hover:bg-fuchsia-50 transition-colors"
              title="Ver correos y detalle"
            >
              <span>{subCarts.length} {subCarts.length === 1 ? 'correo' : 'correos'}</span>
              {isDetailsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>

        {/* Lista Expandible de Sub-Carritos */}
        {isDetailsExpanded && subCarts.length > 0 && (
          <div className="mb-3 space-y-2 p-2.5 bg-fuchsia-50/40 rounded-2xl border border-fuchsia-200/80 animate-fade-in max-h-56 overflow-y-auto">
            <div className="text-[11px] font-extrabold text-fuchsia-800 flex items-center justify-between pb-1 border-b border-fuchsia-100">
              <span>Carritos / Cuentas Utilizadas</span>
              <span className="text-slate-500 font-medium">Total: {subCarts.length}</span>
            </div>

            {subCarts.map((sc, idx) => {
              const isPassVisible = visibleSubCartPasswords[sc.id];
              return (
                <div 
                  key={sc.id || idx} 
                  className="p-2 bg-white rounded-xl border border-fuchsia-100 shadow-2xs space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-fuchsia-600">#{idx + 1}</span>
                      <span className="px-1.5 py-0.2 rounded bg-fuchsia-100 text-fuchsia-700 font-bold text-[10px]">
                        {sc.operator || 'Francis'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-rose-600">
                        Pagó: ${Number(sc.paidAmount || 0).toFixed(2)}
                      </span>
                      {onDeleteSubCart && (
                        <button
                          onClick={() => onDeleteSubCart(order.id, sc.id)}
                          className="text-slate-300 hover:text-rose-600 p-0.5 rounded hover:bg-rose-50"
                          title="Eliminar este carrito"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Correo */}
                  <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded-lg">
                    <div className="flex items-center gap-1.5 truncate mr-2 font-mono text-[11px] text-slate-700">
                      <Mail size={12} className="text-fuchsia-500 shrink-0" />
                      <span className="truncate">{sc.email || 'Sin correo'}</span>
                    </div>
                    {sc.email && (
                      <button
                        onClick={() => copyToClipboard(sc.email, 'email')}
                        className="text-slate-400 hover:text-fuchsia-600 p-0.5"
                        title="Copiar correo"
                      >
                        <Copy size={11} />
                      </button>
                    )}
                  </div>

                  {/* Clave & Notas si existen */}
                  {(sc.password || sc.notes) && (
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                      {sc.password && (
                        <div className="flex items-center gap-1 font-mono">
                          <Key size={10} className="text-amber-500" />
                          <span>{isPassVisible ? sc.password : '••••••'}</span>
                          <button
                            onClick={() => toggleSubCartPassword(sc.id)}
                            className="text-slate-400 hover:text-fuchsia-600 ml-0.5"
                          >
                            {isPassVisible ? <EyeOff size={10} /> : <Eye size={10} />}
                          </button>
                        </div>
                      )}
                      {sc.notes && (
                        <span className="italic text-slate-400 truncate max-w-[140px]">
                          "{sc.notes}"
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Credentials and Details Section (Fallback para pedidos sin sub-carritos) */}
        {subCarts.length === 0 && (
          <div className="space-y-2 py-3 border-y border-fuchsia-100 text-sm">
            {/* Email */}
            <div className="flex items-center justify-between text-xs bg-fuchsia-50/40 p-2.5 rounded-xl border border-fuchsia-100">
              <div className="flex items-center gap-2 text-slate-700 truncate mr-2">
                <Mail size={14} className="text-fuchsia-500 shrink-0" />
                <span className="truncate font-mono">{order.email || 'Sin correo asignado'}</span>
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
            {order.password && (
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
                  <button
                    onClick={() => copyToClipboard(order.password, 'key')}
                    className="text-slate-400 hover:text-fuchsia-600 p-1 hover:bg-fuchsia-100 rounded-lg transition-colors"
                    title="Copiar contraseña"
                  >
                    {copiedKey ? <Check size={13} className="text-emerald-500 font-bold" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tracking Number and Notes */}
        <div className="space-y-1.5 py-2 text-xs text-slate-500">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Truck size={13} className="text-sky-500" />
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

      {/* Financial Info and Actions Footer */}
      <div className="pt-3 mt-2 border-t border-fuchsia-100/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Carritos Totales</div>
            <div className="text-sm font-bold text-purple-600 flex items-center gap-1">
              <ShoppingCart size={13} />
              <span>{totalCarts}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(order)}
            className="p-2 text-slate-400 hover:text-fuchsia-600 hover:bg-fuchsia-50 rounded-xl transition-colors"
            title="Editar pedido completo"
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
