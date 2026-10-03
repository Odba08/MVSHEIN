import React, { useState, useEffect } from 'react';
import { 
  X, Save, DollarSign, ShoppingCart, User, Mail, Key, 
  Truck, Calendar, Sparkles, Heart, Plus, Trash2, ArrowRight 
} from 'lucide-react';
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
    subCarts: [],
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
        cartsCount: initialData.cartsCount ?? (initialData.subCarts?.length || 1),
        subCarts: Array.isArray(initialData.subCarts) ? initialData.subCarts : [],
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
        subCarts: [],
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
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // SubCarts Handlers
  const handleAddSubCart = () => {
    const newCart = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      operator: currentUser?.name || 'Francis',
      email: '',
      password: '',
      paidAmount: '',
      date: formData.date || new Date().toISOString().split('T')[0],
      notes: ''
    };
    setFormData(prev => ({
      ...prev,
      subCarts: [...prev.subCarts, newCart]
    }));
  };

  const handleUpdateSubCart = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.subCarts];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, subCarts: updated };
    });
  };

  const handleRemoveSubCart = (index) => {
    setFormData(prev => ({
      ...prev,
      subCarts: prev.subCarts.filter((_, i) => i !== index)
    }));
  };

  // Financial Calculations
  const clientPaid = Number(formData.paidAmount || 0);
  const totalStorePaid = formData.subCarts.reduce((acc, c) => acc + Number(c.paidAmount || 0), 0);
  const netProfit = clientPaid - totalStorePaid;
  const totalCartsCount = formData.subCarts.length > 0 ? formData.subCarts.length : Math.max(1, parseInt(formData.cartsCount || 1, 10));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.clientName.trim()) {
      alert('Por favor ingresa el nombre del cliente');
      return;
    }

    // Clean subCarts format
    const cleanedSubCarts = formData.subCarts.map(c => ({
      ...c,
      paidAmount: Number(c.paidAmount || 0),
      operator: c.operator || formData.operator || 'Francis'
    }));

    onSave({
      ...formData,
      paidAmount: clientPaid,
      cartsCount: totalCartsCount,
      subCarts: cleanedSubCarts,
      // If primary email is empty but we have subCarts, set primary to first email
      email: formData.email || (cleanedSubCarts[0]?.email ?? ''),
      password: formData.password || (cleanedSubCarts[0]?.password ?? '')
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fade-in">
      <div className="glass-modal w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl border border-fuchsia-200 bg-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-fuchsia-100 bg-fuchsia-50/50 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-fuchsia-600 text-white shadow-md shadow-fuchsia-500/20">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-1.5">
                <span>{initialData ? 'Editar Pedido y Carritos' : 'Nuevo Pedido MV SHEIN'}</span>
                <Heart size={15} className="text-fuchsia-500 fill-fuchsia-500" />
              </h2>
              <p className="text-xs text-slate-500">
                Registra el monto cobrado al cliente y el desglose de carritos/cuentas pagados
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Cliente y Operador Creador */}
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
                Registrado por (Responsable)
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

          {/* Monto Cobrado al Cliente y Resumen Financiero en Vivo */}
          <div className="p-4 bg-gradient-to-r from-fuchsia-50 via-pink-50 to-rose-50 rounded-2xl border border-fuchsia-200/80">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <DollarSign size={14} className="text-fuchsia-600" />
                  Monto que pagó el cliente ($) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-fuchsia-600">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.paidAmount}
                    onChange={(e) => handleChange('paidAmount', e.target.value)}
                    placeholder="0.00"
                    className="input-field pl-7 text-fuchsia-600 font-black text-lg"
                  />
                </div>
              </div>

              {/* Indicadores en Vivo */}
              <div className="grid grid-cols-3 gap-2 text-center bg-white/80 p-2.5 rounded-xl border border-fuchsia-100">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Carritos</div>
                  <div className="font-extrabold text-purple-600 text-sm">{totalCartsCount}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Gastado Tienda</div>
                  <div className="font-extrabold text-rose-500 text-sm">${totalStorePaid.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Ganancia Neta</div>
                  <div className={`font-black text-sm ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ${netProfit.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN DINÁMICA DE SUB-CARRITOS / CORREOS */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                  <ShoppingCart size={16} className="text-fuchsia-600" />
                  <span>Desglose de Carritos / Cuentas Utilizadas</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-700 font-bold">
                    {formData.subCarts.length}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Agrega cada correo usado, cuánto se pagó a SHEIN por ese carrito y qué operadora lo hizo
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddSubCart}
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-fuchsia-500/20"
              >
                <Plus size={14} />
                <span>Añadir Carrito</span>
              </button>
            </div>

            {formData.subCarts.length === 0 ? (
              <div className="p-4 rounded-2xl border-2 border-dashed border-fuchsia-200 bg-fuchsia-50/30 text-center space-y-2">
                <p className="text-xs text-slate-500">
                  No has desglosado carritos individuales aún. Puedes agregar los carritos ahora o registrarlo de forma general.
                </p>
                {/* Fallback de correo general si no hay subcarritos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2 max-w-lg mx-auto">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Correo de referencia (opcional)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="input-field text-xs py-1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Clave de referencia (opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="Clave"
                      className="input-field text-xs py-1.5"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {formData.subCarts.map((cart, idx) => (
                  <div 
                    key={cart.id || idx} 
                    className="p-3 bg-white rounded-2xl border border-fuchsia-200/90 shadow-sm hover:border-fuchsia-300 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs pb-1.5 border-b border-fuchsia-50">
                      <span className="font-extrabold text-fuchsia-600">
                        Carrito #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubCart(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Eliminar este carrito"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                          Operadora
                        </label>
                        <select
                          value={cart.operator || 'Francis'}
                          onChange={(e) => handleUpdateSubCart(idx, 'operator', e.target.value)}
                          className="select-field text-xs py-1 font-semibold text-fuchsia-600"
                        >
                          <option value="Francis">👑 Francis</option>
                          <option value="Daily">🌸 Daily</option>
                          <option value="Ana">🌟 Ana</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                          Correo utilizado
                        </label>
                        <input
                          type="email"
                          required
                          value={cart.email || ''}
                          onChange={(e) => handleUpdateSubCart(idx, 'email', e.target.value)}
                          placeholder="cuenta.promo@shein.com"
                          className="input-field text-xs py-1 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                          Pagado Tienda ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={cart.paidAmount}
                          onChange={(e) => handleUpdateSubCart(idx, 'paidAmount', e.target.value)}
                          placeholder="10.00"
                          className="input-field text-xs py-1 font-bold text-rose-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <input
                          type="text"
                          value={cart.password || ''}
                          onChange={(e) => handleUpdateSubCart(idx, 'password', e.target.value)}
                          placeholder="Clave / PIN (opcional)"
                          className="input-field text-xs py-1 font-mono"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={cart.notes || ''}
                          onChange={(e) => handleUpdateSubCart(idx, 'notes', e.target.value)}
                          placeholder="Detalle o cupón aplicado (opcional)"
                          className="input-field text-xs py-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seguimiento y Numero de Guia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
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
                Notas adicionales del pedido
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Detalle de ropa, cliente, etc."
                className="input-field"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-fuchsia-100 mt-6 sticky bottom-0 bg-white/90 backdrop-blur-sm py-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center gap-2 shadow-fuchsia-500/30"
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
