import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  PlusCircle, 
  Settings, 
  DollarSign, 
  Package, 
  TrendingUp,
  Heart,
  LogOut
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onOpenNewOrder, 
  onOpenNewExpense, 
  onOpenSettings 
}) {
  const { currentUser, logout } = useAuth();

  return (
    <header className="border-b border-fuchsia-200 bg-white/95 backdrop-blur-xl sticky top-0 z-40 px-4 sm:px-8 py-3.5 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
        {/* LOGO & BRAND */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-fuchsia-500 via-pink-500 to-rose-500 flex items-center justify-center text-2xl shadow-md shadow-fuchsia-500/30 text-white">
            🛍️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                <span>MV</span>
                <span className="text-fuchsia-600">SHEIN</span>
                <Heart size={16} className="text-fuchsia-500 fill-fuchsia-500" />
              </h1>
              <span className="badge badge-operator text-[11px] py-0.5 font-bold">
                {currentUser?.role || 'Gestión'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Control de carritos, guías, nómina y Google Sheets
            </p>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex bg-fuchsia-50 p-1.5 rounded-2xl border border-fuchsia-200 gap-1.5">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'orders'
                ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-md shadow-fuchsia-400/40'
                : 'text-slate-600 hover:text-fuchsia-600 hover:bg-white/80'
            }`}
          >
            <Package size={15} />
            <span>Pedidos & Carritos</span>
          </button>

          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'weekly'
                ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-md shadow-fuchsia-400/40'
                : 'text-slate-600 hover:text-fuchsia-600 hover:bg-white/80'
            }`}
          >
            <TrendingUp size={15} />
            <span>Contabilidad & Nómina</span>
          </button>
        </div>

        {/* ACTIONS & USER PROFILE */}
        <div className="flex items-center gap-2.5">
          {/* BOTÓN NUEVO PEDIDO */}
          <button 
            className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-fuchsia-500/30"
            onClick={onOpenNewOrder}
          >
            <PlusCircle size={15} />
            <span>Nuevo Pedido</span>
          </button>

          {/* BOTÓN REGISTRAR GASTO */}
          {currentUser?.id !== 'daily' && (
            <button 
              className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 border-rose-300 text-rose-600 hover:bg-rose-50"
              onClick={onOpenNewExpense}
              title="Registrar deducción semanal (correos, muebles, terceros)"
            >
              <DollarSign size={15} className="text-rose-500" />
              <span className="hidden sm:inline">Gasto / Deducción</span>
            </button>
          )}

          {/* AJUSTES / STEINHQ */}
          {currentUser?.id !== 'daily' && (
            <button 
              className="btn-secondary p-2.5 text-slate-500 hover:text-fuchsia-600"
              onClick={onOpenSettings}
              title="Configuración de SteinHQ y Google Sheets"
            >
              <Settings size={16} />
            </button>
          )}

          {/* USUARIO ACTIVO */}
          <div className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-fuchsia-50 border border-fuchsia-200 shadow-sm">
            <div className="w-7 h-7 rounded-full bg-fuchsia-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {currentUser?.avatar || '👤'}
            </div>
            <div className="text-left">
              <div className="text-xs font-black text-slate-800">
                {currentUser?.name}
              </div>
              <div className="text-[10px] text-fuchsia-600 font-semibold">
                {currentUser?.id === 'ana' ? 'Acceso Total' : (currentUser?.id === 'francis' ? 'Fran + Daily' : 'Solo Daily')}
              </div>
            </div>

            <button
              onClick={logout}
              className="ml-1 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
