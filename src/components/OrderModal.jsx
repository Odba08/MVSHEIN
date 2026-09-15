import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, ShoppingCart, User, Mail, Key, Truck, Calendar, Sparkles, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function OrderModal({ isOpen, onClose, onSave, initialData }) {
  const { currentUser } = useAuth();

  const allowedOperators = currentUser?.allowedOperators || ['Daily'];

  const [formData, setFormData] = useState({
    clientName: '',
    email: '',
    password: '',
    paidAmount: '',
    cartsCount: 1,
    status: 'Pendiente',
    trackingNumber: '',
    operator: currentUser?.name || 'Francis',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        paidAmount: initialData.paidAmount ?? '',
        cartsCount: initialData.cartsCount ?? 1,
        operator: initialData.operator || currentUser?.name || 'Francis',
        date: initialData.date || new Date().toISOString().split('T')[0]
      });
    } else {
      setFormData({
        clientName: '',
        email: '',
        password: '',
        paidAmount: '',
        cartsCount: 1,
        status: 'Pendiente',
        trackingNumber: '',
        operator: currentUser?.name || 'Francis',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
  }, [initialData, isOpen, currentUser]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'paidAmount' && Number(value) > 0 && !initialData) {
        const amount = Number(value);
        if (amount >= 50) {
          next.cartsCount = Math.max(1, Math.round(amount / 25));
        }
      }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.clientName.trim()) {
      alert('Por favor ingresa el nombre del cliente');
      return;
    }

    onSave({
      ...formData,
      paidAmount: Number(formData.paidAmount || 0),
      cartsCount: Math.max(1, parseInt(formData.cartsCount || 1, 10))
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fade-in">
      <div className="glass-modal w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-fuchsia-200 bg-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-fuchsia-100 bg-fuchsia-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-fuchsia-600 text-white shadow-md shadow-fuchsia-500/20">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-1.5">
                <span>{initialData ? 'Editar Pedido' : 'Nuevo Pedido MV SHEIN'}</span>
                <Heart size={15} className="text-fuchsia-500 fill-fuchsia-500" />
              </h2>
              <p className="text-xs text-slate-500">
                Se sincronizará en Google Sheets con el operador asignado
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-fuchsia-600 p-2 rounded-xl hover:bg-fuchsia-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Cliente y Operador */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User size={14} className="text-fuchsia-500" />
                Nombre del Cliente *
              </label>
              <input
                type="text"
                required
                value={formData.clientName}
                onChange={(e) => handleChange('clientName', e.target.value)}
                placeholder="Ej. Valeria Castillo"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Sparkles size={14} className="text-purple-500" />
                Realizado por (Operador)
              </label>
              <select
                value={formData.operator}
                onChange={(e) => handleChange('operator', e.target.value)}
                className="select-field font-semibold text-fuchsia-600"
              >
                {allowedOperators.map(op => (
                  <option key={op} value={op}>
                    {op === 'Francis' ? '👑 Francis' : (op === 'Ana' ? '🌟 Ana' : '🌸 Daily')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Correo y Clave */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Mail size={14} className="text-fuchsia-500" />
                Correo que se utilizó
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="cliente@ejemplo.com"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Key size={14} className="text-amber-500" />
                Clave que se utilizó
              </label>
              <input
                type="text"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Contraseña o PIN"
                className="input-field font-mono"
              />
            </div>
          </div>

          {/* Monto Pago y Cantidad de Carritos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-fuchsia-50/60 rounded-2xl border border-fuchsia-200/80">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <DollarSign size={14} className="text-fuchsia-600" />
                Monto que pagó la persona ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.paidAmount}
                onChange={(e) => handleChange('paidAmount', e.target.value)}
                placeholder="0.00"
                className="input-field text-fuchsia-600 font-extrabold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <ShoppingCart size={14} className="text-purple-500" />
                Cantidad de carritos
              </label>
              <input
                type="number"
                min="1"
                value={formData.cartsCount}
                onChange={(e) => handleChange('cartsCount', e.target.value)}
                className="input-field font-bold"
              />
            </div>
          </div>

          {/* Seguimiento y Numero de Guia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Truck size={14} className="text-sky-500" />
                Estado de Seguimiento
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="select-field font-semibold"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="En Revisión">En Revisión ⏳</option>
                <option value="Salió">Salió 🚚</option>
                <option value="Llegó">Llegó 📦</option>
                <option value="Entregado">Entregado ✨</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Truck size={14} className="text-slate-500" />
                Número de Guía
              </label>
              <input
                type="text"
                value={formData.trackingNumber}
                onChange={(e) => handleChange('trackingNumber', e.target.value)}
                placeholder="Ej. GUIA-SHEIN-983"
                className="input-field font-mono"
              />
            </div>
          </div>

          {/* Fecha Realizada y Notas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-500" />
                Fecha realizada
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Notas adicionales
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Detalle de ropa, entrega, etc."
                className="input-field"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-fuchsia-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
            >
              <Save size={16} />
              <span>{initialData ? 'Guardar Cambios' : 'Guardar e Inyectar en Sheet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
