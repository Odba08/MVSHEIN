import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Calendar, Tag, User, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ExpenseModal({ isOpen, onClose, onSave, initialData }) {
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    concept: '',
    amount: '',
    category: 'Correos',
    operator: currentUser?.name || 'Francis',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        amount: initialData.amount ?? '',
        operator: initialData.operator || currentUser?.name || 'Francis',
        date: initialData.date || new Date().toISOString().split('T')[0]
      });
    } else {
      setFormData({
        concept: '',
        amount: '',
        category: 'Correos',
        operator: currentUser?.name || 'Francis',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
  }, [initialData, isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.concept.trim()) {
      alert('Por favor indica el concepto o descripción del gasto/deducción');
      return;
    }

    onSave({
      ...formData,
      amount: Number(formData.amount || 0)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fade-in">
      <div className="glass-modal w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-pink-200 bg-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-pink-100 bg-pink-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500 text-white shadow-md shadow-rose-500/20">
              <DollarSign size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-1.5">
                <span>{initialData ? 'Editar Gasto / Deducción' : 'Registrar Gasto o Deducción'}</span>
                <Heart size={15} className="text-rose-500 fill-rose-500" />
              </h2>
              <p className="text-xs text-slate-500">
                Egresos semanales (correos, muebles, comisión de terceros, etc.)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-pink-600 p-2 rounded-xl hover:bg-pink-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Tag size={14} className="text-rose-500" />
              Concepto / Detalle *
            </label>
            <input
              type="text"
              required
              value={formData.concept}
              onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
              placeholder="Ej. Correos, Muebles, Carrito Oscar, Sabrina..."
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <DollarSign size={14} className="text-rose-500" />
                Monto del Gasto ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="input-field text-rose-600 font-extrabold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Categoría
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="select-field"
              >
                <option value="Correos">Correos / Cuentas</option>
                <option value="Muebles">Muebles / Materiales</option>
                <option value="Terceros">Comisión Terceros (Oscar, Sabrina)</option>
                <option value="Envíos">Envíos y Logística</option>
                <option value="Otros">Otros Gastos</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User size={14} className="text-pink-500" />
                Registrado por
              </label>
              <select
                value={formData.operator}
                onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                className="select-field font-semibold text-pink-600"
              >
                <option value="Francis">👑 Francis</option>
                <option value="Daily">🌸 Daily</option>
                <option value="Ana">🌟 Ana</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-500" />
                Fecha del Gasto
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Notas / Comentarios
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ej. Pago por Zelle o deducción acordada"
              className="input-field"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-pink-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary bg-gradient-to-r from-rose-500 to-pink-500 flex items-center gap-2"
            >
              <Save size={16} />
              <span>{initialData ? 'Guardar Gasto' : 'Registrar Gasto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
