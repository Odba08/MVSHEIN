import React, { useState } from 'react';
import { X, Save, ShoppingCart, DollarSign, Mail, Key, User, Sparkles, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function QuickAddSubCartModal({ isOpen, onClose, order, onAddSubCart }) {
  const { currentUser } = useAuth();
  const allowedOperators = currentUser?.allowedOperators || ['Daily'];

  const [operator, setOperator] = useState(currentUser?.name || 'Francis');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  if (!isOpen || !order) return null;

  const currentSubCarts = Array.isArray(order.subCarts) ? order.subCarts : [];
  const currentStoreTotal = currentSubCarts.reduce((acc, c) => acc + Number(c.paidAmount || 0), 0);
  const clientPaid = Number(order.paidAmount || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() && !paidAmount) {
      alert('Por favor ingresa al menos el correo o el monto pagado por el carrito.');
      return;
    }

    const newSubCart = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      operator: operator || currentUser?.name || 'Francis',
      email: email.trim(),
      password: password.trim(),
      paidAmount: Number(paidAmount || 0),
      date: date || new Date().toISOString().split('T')[0],
      notes: notes.trim(),
      createdAt: new Date().toISOString()
    };

    onAddSubCart(order.id, newSubCart);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fade-in">
      <div className="glass-modal w-full max-w-lg shadow-2xl border border-fuchsia-200 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-fuchsia-100 bg-fuchsia-50/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-fuchsia-600 text-white shadow-md shadow-fuchsia-500/20">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                <span>Registrar Carrito / Correo</span>
                <Heart size={14} className="text-fuchsia-500 fill-fuchsia-500" />
              </h2>
              <p className="text-xs text-slate-500">
                Pedido de: <strong className="text-fuchsia-600">{order.clientName}</strong> (Cobrado: ${clientPaid.toFixed(2)})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-fuchsia-600 p-2 rounded-xl hover:bg-fuchsia-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Resumen Actual */}
        <div className="mx-5 mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Cliente</div>
            <div className="font-extrabold text-slate-800">${clientPaid.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Carritos Actuales</div>
            <div className="font-extrabold text-purple-600">{currentSubCarts.length}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Gastado en Tienda</div>
            <div className="font-extrabold text-rose-500">${currentStoreTotal.toFixed(2)}</div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Sparkles size={13} className="text-fuchsia-500" />
                Operadora que hizo el carrito *
              </label>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="select-field font-semibold text-fuchsia-600 text-xs py-2"
              >
                {allowedOperators.map(op => (
                  <option key={op} value={op}>
                    {op === 'Francis' ? '👑 Francis' : (op === 'Ana' ? '🌟 Ana' : '🌸 Daily')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <DollarSign size={13} className="text-rose-500" />
                Monto pagado a SHEIN / Tienda ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="Ej. 10.50"
                className="input-field text-xs py-2 font-bold text-rose-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail size={13} className="text-fuchsia-500" />
                Correo que se utilizó *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="promo.cuenta1@shein.com"
                className="input-field text-xs py-2 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Key size={13} className="text-amber-500" />
                Clave / PIN que se utilizó
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña o PIN"
                className="input-field text-xs py-2 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notas / Detalle de este carrito (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Cupón $50 aplicado, 4 prendas"
              className="input-field text-xs py-2"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-fuchsia-100 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs py-2 px-3"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-fuchsia-500/25"
            >
              <Save size={14} />
              <span>Guardar Carrito</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
