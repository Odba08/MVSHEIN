import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  Search, Plus, Filter, Calendar, User, Truck, 
  ShoppingCart, RefreshCw, Download, Layers, 
  CheckCircle2, AlertCircle, TrendingUp, Sparkles, SlidersHorizontal, X, Heart, Clock 
} from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';
import { 
  fetchOrdersFromStein, 
  syncOrderToStein, 
  deleteOrderFromStein, 
  fetchExpensesFromStein, 
  syncExpenseToStein, 
  deleteExpenseFromStein 
} from './services/steinApi';
import { exportOrdersToExcel, exportFullAccountingExcel } from './utils/excelExport';

import Navbar from './components/Navbar';
import OrderCard from './components/OrderCard';
import OrderModal from './components/OrderModal';
import ExpenseModal from './components/ExpenseModal';
import WeeklyReport from './components/WeeklyReport';
import SettingsModal from './components/SettingsModal';
import LoginPage from './components/LoginPage';

function MainDashboard() {
  const { currentUser, canViewOperator } = useAuth();

  if (!currentUser) {
    return <LoginPage />;
  }

  // Navigation & Modals state
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'weekly'
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Data state (pure live data from SteinHQ)
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ state: 'idle', message: '' });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOperator, setFilterOperator] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Load initial data
  const loadData = async () => {
    setIsLoading(true);
    setSyncStatus({ state: 'syncing', message: 'Sincronizando con Google Sheets (SteinHQ)...' });
    try {
      const [fetchedOrders, fetchedExpenses] = await Promise.all([
        fetchOrdersFromStein(),
        fetchExpensesFromStein()
      ]);
      setOrders(fetchedOrders);
      setExpenses(fetchedExpenses);
      setSyncStatus({ state: 'synced', message: '✨ Sincronizado con Google Sheets' });
    } catch (err) {
      console.warn('Error loading from SteinHQ, using local storage:', err);
      setSyncStatus({ state: 'error', message: 'Modo local activo' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setSyncStatus({ state: 'idle', message: '' }), 3500);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save or Update Order
  const handleSaveOrder = async (orderData) => {
    let updated;
    const isNew = !orderData.id;
    const itemToSave = {
      ...orderData,
      id: orderData.id || `ord_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      operator: orderData.operator || currentUser.name,
      createdAt: orderData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isNew) {
      updated = [itemToSave, ...orders];
    } else {
      updated = orders.map(o => o.id === itemToSave.id ? itemToSave : o);
    }

    setOrders(updated);
    setEditingOrder(null);

    // Celebration if marked as Entregado
    if (itemToSave.status === 'Entregado') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e879f9', '#d946ef', '#ec4899', '#f43f5e']
      });
    }

    setSyncStatus({ state: 'syncing', message: `Inyectando fila en Google Sheet (${itemToSave.clientName})...` });
    await syncOrderToStein(itemToSave);
    setSyncStatus({ state: 'synced', message: `✅ Inyectado en Google Sheet exitosamente (Por ${itemToSave.operator})` });
    setTimeout(() => setSyncStatus({ state: 'idle', message: '' }), 3500);
  };

  // Delete Order
  const handleDeleteOrder = async (id) => {
    if (!window.confirm('¿Estás segura de eliminar este pedido?')) return;
    const updated = orders.filter(o => o.id !== id);
    setOrders(updated);
    await deleteOrderFromStein(id);
  };

  // Quick Status Change on Card
  const handleStatusChange = async (id, newStatus) => {
    const updated = orders.map(o => {
      if (o.id === id) {
        return { ...o, status: newStatus, updatedAt: new Date().toISOString() };
      }
      return o;
    });
    setOrders(updated);

    const changedOrder = updated.find(o => o.id === id);
    if (newStatus === 'Entregado') {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 }, colors: ['#d946ef', '#ec4899'] });
    }
    if (changedOrder) {
      await syncOrderToStein(changedOrder);
    }
  };

  // Save Expense
  const handleSaveExpense = async (expenseData) => {
    const itemToSave = {
      ...expenseData,
      id: expenseData.id || `exp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      operator: expenseData.operator || currentUser.name,
      createdAt: new Date().toISOString()
    };
    const updated = [itemToSave, ...expenses];
    setExpenses(updated);
    await syncExpenseToStein(itemToSave);
  };

  // Delete Expense
  const handleDeleteExpense = async (id) => {
    if (!window.confirm('¿Eliminar este registro de gasto o deducción?')) return;
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    await deleteExpenseFromStein(id);
  };

  // Filtered Orders Logic with Strict Role-Based Visibility
  const visibleOrders = useMemo(() => {
    return orders.filter(ord => canViewOperator(ord.operator));
  }, [orders, canViewOperator]);

  const filteredOrders = useMemo(() => {
    return visibleOrders.filter(ord => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesClient = ord.clientName?.toLowerCase().includes(q);
        const matchesEmail = ord.email?.toLowerCase().includes(q);
        const matchesGuide = ord.trackingNumber?.toLowerCase().includes(q);
        const matchesOperator = ord.operator?.toLowerCase().includes(q);
        const matchesNotes = ord.notes?.toLowerCase().includes(q);
        if (!matchesClient && !matchesEmail && !matchesGuide && !matchesOperator && !matchesNotes) {
          return false;
        }
      }

      if (filterOperator !== 'ALL' && ord.operator !== filterOperator) {
        return false;
      }

      if (filterStatus !== 'ALL' && ord.status !== filterStatus) {
        return false;
      }

      if (filterStartDate && ord.date && ord.date < filterStartDate) {
        return false;
      }
      if (filterEndDate && ord.date && ord.date > filterEndDate) {
        return false;
      }

      return true;
    });
  }, [visibleOrders, searchQuery, filterOperator, filterStatus, filterStartDate, filterEndDate]);

  // Fast Metrics for Top Bar
  const stats = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalCarts = filteredOrders.reduce((sum, o) => sum + Number(o.cartsCount || 1), 0);
    const totalPaid = filteredOrders.reduce((sum, o) => sum + Number(o.paidAmount || 0), 0);
    const deliveredCount = filteredOrders.filter(o => o.status === 'Entregado').length;
    return { totalOrders, totalCarts, totalPaid, deliveredCount };
  }, [filteredOrders]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterOperator('ALL');
    setFilterStatus('ALL');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const hasActiveFilters = searchQuery || filterOperator !== 'ALL' || filterStatus !== 'ALL' || filterStartDate || filterEndDate;
  const allowedOperators = currentUser.allowedOperators || ['Daily'];

  return (
    <div className="min-h-screen flex flex-col bg-[#FDF2F8] text-slate-800">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewOrder={() => {
          setEditingOrder(null);
          setIsOrderModalOpen(true);
        }}
        onOpenNewExpense={() => setIsExpenseModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Sync Status Banner */}
      {syncStatus.message && (
        <div className="bg-fuchsia-100/90 border-b border-fuchsia-200 text-xs py-2 px-4 flex items-center justify-center gap-2 text-fuchsia-800 font-semibold shadow-inner">
          <RefreshCw size={13} className={syncStatus.state === 'syncing' ? 'animate-spin text-fuchsia-600' : 'text-emerald-600'} />
          <span>{syncStatus.message}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'orders' ? (
          <div className="space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
              <div className="stat-card">
                <div className="text-[11px] text-slate-500 font-bold uppercase">Carritos en Lista</div>
                <div className="text-2xl font-black text-slate-800 mt-1">{stats.totalOrders}</div>
                <div className="text-[10px] text-fuchsia-600 mt-0.5 font-semibold">En la vista actual</div>
              </div>

              <div className="stat-card">
                <div className="text-[11px] text-slate-500 font-bold uppercase">Total Carritos</div>
                <div className="text-2xl font-black text-purple-600 mt-1 flex items-center gap-1.5">
                  <ShoppingCart size={18} />
                  <span>{stats.totalCarts}</span>
                </div>
                <div className="text-[10px] text-purple-500 mt-0.5 font-semibold">Carritos procesados</div>
              </div>

              <div className="stat-card">
                <div className="text-[11px] text-slate-500 font-bold uppercase">Monto Total Pagado</div>
                <div className="text-2xl font-black text-fuchsia-600 mt-1">
                  ${stats.totalPaid.toFixed(2)}
                </div>
                <div className="text-[10px] text-fuchsia-500 mt-0.5 font-semibold">Ingreso bruto de pedidos</div>
              </div>

              <div className="stat-card">
                <div className="text-[11px] text-slate-500 font-bold uppercase">Entregados</div>
                <div className="text-2xl font-black text-emerald-600 mt-1 flex items-center gap-1.5">
                  <Truck size={18} />
                  <span>{stats.deliveredCount}</span>
                </div>
                <div className="text-[10px] text-emerald-500 mt-0.5 font-semibold">Completados al 100%</div>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="glass-card space-y-3 bg-white/95">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fuchsia-400" size={16} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por cliente, correo, guía, operador..."
                    className="input-field pl-10 text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-fuchsia-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Operator Selector (only allowed ones) */}
                {allowedOperators.length > 1 && (
                  <div className="w-full md:w-44">
                    <select
                      value={filterOperator}
                      onChange={(e) => setFilterOperator(e.target.value)}
                      className="select-field text-xs py-2.5 font-semibold text-fuchsia-600"
                    >
                      <option value="ALL">👤 Operador (Todos)</option>
                      {allowedOperators.map(op => (
                        <option key={op} value={op}>
                          {op === 'Francis' ? '👑 Francis' : (op === 'Ana' ? '🌟 Ana' : '🌸 Daily')}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Status Selector with En Revisión */}
                <div className="w-full md:w-44">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="select-field text-xs py-2.5 font-semibold"
                  >
                    <option value="ALL">📦 Estados (Todos)</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="En Revisión">En Revisión ⏳</option>
                    <option value="Salió">Salió 🚚</option>
                    <option value="Llegó">Llegó 📦</option>
                    <option value="Entregado">Entregado ✨</option>
                  </select>
                </div>

                {/* Advanced Filters and Excel Export Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`btn-secondary text-xs py-2.5 flex items-center gap-1.5 ${showAdvancedFilters ? 'border-fuchsia-500 text-fuchsia-600 bg-fuchsia-50' : ''}`}
                    title="Filtro por fechas"
                  >
                    <SlidersHorizontal size={14} />
                    <span>Fechas</span>
                  </button>

                  <button
                    onClick={() => exportOrdersToExcel(visibleOrders)}
                    className="btn-secondary text-xs py-2.5 flex items-center gap-1.5 hover:text-emerald-600 hover:border-emerald-300"
                    title="Descargar TODOS los carritos a Excel"
                  >
                    <Download size={14} />
                    <span>Descargar Todo Excel</span>
                  </button>
                </div>
              </div>

              {/* Advanced Date Range Filter Collapsible */}
              {showAdvancedFilters && (
                <div className="pt-3 border-t border-fuchsia-100 flex flex-wrap items-center gap-4 text-xs animate-fade-in">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-bold">Desde:</span>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="input-field py-1 text-xs w-auto"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-bold">Hasta:</span>
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="input-field py-1 text-xs w-auto"
                    />
                  </div>

                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-rose-500 font-bold hover:underline flex items-center gap-1 ml-auto"
                    >
                      <X size={12} />
                      <span>Limpiar Filtros</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Order Grid (Empty State if no carts in Google Sheet) */}
            {filteredOrders.length === 0 ? (
              <div className="glass-card text-center py-16 space-y-4 bg-white/95">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-fuchsia-50 flex items-center justify-center text-fuchsia-400 shadow-sm border border-fuchsia-100">
                  <ShoppingCart size={30} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {hasActiveFilters ? 'No hay pedidos con esos filtros' : 'No hay carritos registrados en Google Sheets'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {hasActiveFilters ? 'Prueba ajustando los filtros.' : 'Haz clic en "Nuevo Pedido" para registrar el primer carrito y guardarlo en el Sheet.'}
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => {
                      setEditingOrder(null);
                      setIsOrderModalOpen(true);
                    }}
                    className="btn-primary text-xs inline-flex items-center gap-2"
                  >
                    <Plus size={14} />
                    <span>Crear Nuevo Pedido</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onEdit={(ord) => {
                      setEditingOrder(ord);
                      setIsOrderModalOpen(true);
                    }}
                    onDelete={handleDeleteOrder}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Weekly Accounting & Payroll Tab */
          <WeeklyReport
            orders={orders}
            expenses={expenses}
            onAddExpense={() => setIsExpenseModalOpen(true)}
            onDeleteExpense={handleDeleteExpense}
          />
        )}
      </main>

      {/* Modals */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => {
          setIsOrderModalOpen(false);
          setEditingOrder(null);
        }}
        onSave={handleSaveOrder}
        initialData={editingOrder}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onConfigSaved={loadData}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainDashboard />
    </AuthProvider>
  );
}
