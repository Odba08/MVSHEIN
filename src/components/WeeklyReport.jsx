import React, { useState, useMemo } from 'react';
import { 
  Calendar, DollarSign, ShoppingCart, TrendingUp, 
  Download, Plus, Trash2, ArrowUpRight, ArrowDownRight, 
  Heart, Sparkles, HelpCircle, Award, BookOpen, CheckCircle2 
} from 'lucide-react';
import { useAuth, USERS_CONFIG } from '../context/AuthContext';
import { getISOWeekKey, exportFullAccountingExcel } from '../utils/excelExport';

export default function WeeklyReport({ orders, expenses, onAddExpense, onDeleteExpense }) {
  const { currentUser, canViewOperator } = useAuth();
  const [selectedOperator, setSelectedOperator] = useState('ALL');
  const [showExplanation, setShowExplanation] = useState(false);

  // Group all data by week keys
  const weeklyData = useMemo(() => {
    const map = {};

    // Process Orders (only those visible to current user)
    orders.forEach(ord => {
      if (!canViewOperator(ord.operator)) return;
      if (selectedOperator !== 'ALL' && ord.operator !== selectedOperator) return;
      const weekKey = getISOWeekKey(ord.date || new Date().toISOString().split('T')[0]);
      if (!map[weekKey]) {
        map[weekKey] = {
          weekKey,
          orders: [],
          expenses: [],
          totalIncome: 0,
          totalCarts: 0,
          totalExpenses: 0,
          netProfit: 0,
          operatorCarts: { Francis: 0, Daily: 0, Ana: 0 }
        };
      }
      map[weekKey].orders.push(ord);
      map[weekKey].totalIncome += Number(ord.paidAmount || 0);
      const count = Number(ord.cartsCount || 1);
      map[weekKey].totalCarts += count;
      if (ord.operator && map[weekKey].operatorCarts[ord.operator] !== undefined) {
        map[weekKey].operatorCarts[ord.operator] += count;
      }
    });

    // Process Expenses (only if user has permission and is not daily)
    if (currentUser?.id !== 'daily') {
      expenses.forEach(exp => {
        if (!canViewOperator(exp.operator)) return;
        if (selectedOperator !== 'ALL' && exp.operator !== selectedOperator) return;
        const weekKey = getISOWeekKey(exp.date || new Date().toISOString().split('T')[0]);
        if (!map[weekKey]) {
          map[weekKey] = {
            weekKey,
            orders: [],
            expenses: [],
            totalIncome: 0,
            totalCarts: 0,
            totalExpenses: 0,
            netProfit: 0,
            operatorCarts: { Francis: 0, Daily: 0, Ana: 0 }
          };
        }
        map[weekKey].expenses.push(exp);
        map[weekKey].totalExpenses += Number(exp.amount || 0);
      });
    }

    const list = Object.values(map).map(w => {
      w.netProfit = w.totalIncome - w.totalExpenses;
      w.profitPerCart = w.totalCarts > 0 ? (w.netProfit / w.totalCarts) : 0;
      w.profitMargin = w.totalIncome > 0 ? ((w.netProfit / w.totalIncome) * 100) : 0;
      return w;
    });

    return list.sort((a, b) => b.weekKey.localeCompare(a.weekKey));
  }, [orders, expenses, selectedOperator, currentUser, canViewOperator]);

  // Overall Totals
  const overall = useMemo(() => {
    const totalIncome = weeklyData.reduce((acc, w) => acc + w.totalIncome, 0);
    const totalExpenses = weeklyData.reduce((acc, w) => acc + w.totalExpenses, 0);
    const totalCarts = weeklyData.reduce((acc, w) => acc + w.totalCarts, 0);
    const netProfit = totalIncome - totalExpenses;
    const margin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
    const avgPerCart = totalCarts > 0 ? (netProfit / totalCarts) : 0;
    return { totalIncome, totalExpenses, totalCarts, netProfit, margin, avgPerCart };
  }, [weeklyData]);

  const [activeWeekKey, setActiveWeekKey] = useState(weeklyData[0]?.weekKey || null);
  const activeWeek = weeklyData.find(w => w.weekKey === activeWeekKey) || weeklyData[0];

  const allowedOperators = currentUser?.allowedOperators || ['Daily'];

  // Operators to display in the Liquidación cards:
  // If a specific operator is selected in the dropdown, only show that one!
  // If 'ALL' is selected, show only the operators allowed for current user (e.g. Daily only sees Daily).
  const displayedOperatorsInPayroll = useMemo(() => {
    if (selectedOperator !== 'ALL') {
      return allowedOperators.filter(op => op === selectedOperator);
    }
    return allowedOperators;
  }, [selectedOperator, allowedOperators]);

  // Helper to calculate salary and commission for an operator in a week ($50 base + $20 c/10)
  const calculatePayroll = (opName, cartsCount) => {
    const userCfg = USERS_CONFIG.find(u => u.name === opName);
    const baseSalary = userCfg?.baseSalary || 50;
    let commission = 0;
    if (userCfg?.hasCommissions) {
      commission = Math.floor(cartsCount / 10) * 20 + ((cartsCount % 10) * 2);
    }
    return {
      baseSalary,
      commission,
      total: baseSalary + commission,
      hasCommissions: userCfg?.hasCommissions ?? false
    };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Excel Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card border-fuchsia-200 bg-gradient-to-r from-fuchsia-50 via-white to-pink-50">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <TrendingUp className="text-fuchsia-600" />
            <span>Contabilidad, Nómina & Comisiones</span>
            <Sparkles size={18} className="text-amber-400" />
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {currentUser?.id === 'daily' 
              ? 'Visualiza tu salario semanal fijo ($50) y tus carritos realizados.' 
              : 'Cálculo de ingresos brutos, deducciones, salarios fijos ($50) y comisiones ($20 por cada 10 carritos).'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="btn-secondary text-xs py-2 px-3 border-fuchsia-200 text-fuchsia-600 hover:bg-fuchsia-100/60 flex items-center gap-1.5"
            title="Manual y explicación de cómo se usa la página"
          >
            <BookOpen size={14} />
            <span>¿Cómo se usa esta página?</span>
          </button>

          {allowedOperators.length > 1 && (
            <select
              value={selectedOperator}
              onChange={(e) => setSelectedOperator(e.target.value)}
              className="select-field text-xs py-2 w-auto font-semibold text-fuchsia-600"
            >
              <option value="ALL">👤 Todos los accesibles</option>
              {allowedOperators.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => exportFullAccountingExcel(orders, expenses)}
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-fuchsia-500/30"
          >
            <Download size={14} />
            <span>Descargar Excel Completo</span>
          </button>
        </div>
      </div>

      {/* Manual & Guide Box */}
      {showExplanation && (
        <div className="p-5 rounded-3xl bg-white border-2 border-fuchsia-300 shadow-xl text-xs space-y-4 animate-fade-in text-slate-700">
          <div className="flex items-center justify-between border-b border-fuchsia-100 pb-2">
            <div className="font-extrabold text-fuchsia-600 flex items-center gap-2 text-base">
              <BookOpen size={18} />
              <span>Guía de Uso & Funcionamiento del Sistema MV SHEIN</span>
            </div>
            <button
              onClick={() => setShowExplanation(false)}
              className="text-slate-400 hover:text-fuchsia-600 font-bold"
            >
              ✕ Cerrar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Columna 1: Pedidos y Seguimiento */}
            <div className="space-y-2 p-3.5 bg-fuchsia-50/50 rounded-2xl border border-fuchsia-100">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <span>1. Gestión de Pedidos & Estados</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                • <strong>Nuevo Pedido:</strong> Ingresa el nombre del cliente, correo, clave, monto que pagó, número de carritos, guía y operador.<br/>
                • <strong>Inyección Automática:</strong> Al guardar, se inyecta inmediatamente en la <em>Hoja 1</em> de Google Sheets mediante SteinHQ.<br/>
                • <strong>Estados de Seguimiento:</strong>
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
                <li><span className="font-semibold text-slate-700">Pendiente:</span> Pedido registrado en espera de compra.</li>
                <li><span className="font-semibold text-amber-700">En Revisión ⏳:</span> Carrito enviado pero esperando confirmación/aprobación de la tienda.</li>
                <li><span className="font-semibold text-sky-700">Salió 🚚:</span> Pedido despachado por la paquetería.</li>
                <li><span className="font-semibold text-amber-700">Llegó 📦:</span> Paquete recibido en almacén/destino.</li>
                <li><span className="font-semibold text-emerald-700">Entregado ✨:</span> Entregado 100% al cliente con confeti.</li>
              </ul>
            </div>

            {/* Columna 2: Salarios, Comisiones y Gastos */}
            <div className="space-y-2 p-3.5 bg-pink-50/50 rounded-2xl border border-pink-100">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <span>2. Nómina, Comisiones & Deducciones</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                • <strong>Sueldo Base Semanal:</strong> <strong>$50.00</strong> para cada una.<br/>
                • <strong>Comisión por Carritos:</strong> <strong>$20 por cada 10 carritos</strong> ($2 por carrito) para <em>Francis</em> y <em>Ana</em>.<br/>
                • <strong>Daily:</strong> Cobra únicamente su sueldo fijo de <strong>$50.00</strong>.<br/>
                • <strong>Deducciones / Gastos:</strong> Costos de cuentas/correos, insumos o pagos a terceros que se restan del ingreso bruto total para calcular la <strong>Ganancia Neta</strong>.
              </p>
              <div className="p-2.5 rounded-xl bg-white border border-fuchsia-200 text-[11px] text-fuchsia-900 font-semibold">
                🔒 <strong>Privacidad:</strong> Daily solo ve sus propios carritos y su salario. Francis ve a Francis y Daily. Ana (Supervisora) ve el consolidado de las 3.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Global Stat Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {currentUser?.id !== 'daily' ? (
          <>
            <div className="stat-card">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>Ingresos Totales</span>
                <ArrowUpRight size={16} className="text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                ${overall.totalIncome.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Suma de pagos de clientes</div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>Deducciones / Gastos</span>
                <ArrowDownRight size={16} className="text-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-500 mt-1">
                -${overall.totalExpenses.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Correos, muebles y comisiones</div>
            </div>

            <div className="stat-card border-fuchsia-300 bg-gradient-to-br from-fuchsia-50 to-white">
              <div className="flex items-center justify-between text-fuchsia-600 text-xs font-bold">
                <span>Ganancia Neta</span>
                <DollarSign size={16} className="text-fuchsia-500" />
              </div>
              <div className={`text-2xl font-black mt-1 ${overall.netProfit >= 0 ? 'text-fuchsia-600' : 'text-rose-600'}`}>
                ${overall.netProfit.toFixed(2)}
              </div>
              <div className="text-[11px] text-fuchsia-500 mt-1 font-semibold">
                Margen neto: {overall.margin.toFixed(1)}%
              </div>
            </div>
          </>
        ) : (
          <div className="stat-card border-fuchsia-300 bg-gradient-to-br from-fuchsia-50 to-white col-span-2">
            <div className="flex items-center justify-between text-fuchsia-600 text-xs font-bold">
              <span>Tu Salario Fijo Semanal</span>
              <DollarSign size={16} className="text-fuchsia-500" />
            </div>
            <div className="text-3xl font-black text-fuchsia-600 mt-1">
              $50.00
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Cobro semanal asignado
            </div>
          </div>
        )}

        <div className={`stat-card ${currentUser?.id === 'daily' ? 'col-span-2' : ''}`}>
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Total Carritos</span>
            <ShoppingCart size={16} className="text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 mt-1">
            {overall.totalCarts}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-semibold">
            {currentUser?.id === 'daily' ? 'Carritos realizados por ti' : 'Carritos en la vista'}
          </div>
        </div>
      </div>

      {/* Main Ledger Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Week List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Semanas Registradas
            </h3>
            <span className="text-xs text-fuchsia-600 font-bold">({weeklyData.length})</span>
          </div>

          {weeklyData.length === 0 ? (
            <div className="glass-card text-center py-8 text-slate-400 text-xs bg-white">
              No hay pedidos registrados en Google Sheets aún.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {weeklyData.map((w) => {
                const isSelected = activeWeek?.weekKey === w.weekKey;
                return (
                  <div
                    key={w.weekKey}
                    onClick={() => setActiveWeekKey(w.weekKey)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 border ${
                      isSelected
                        ? 'bg-fuchsia-600 text-white border-fuchsia-600 shadow-md shadow-fuchsia-400/30'
                        : 'bg-white border-fuchsia-200/80 hover:bg-fuchsia-50/60 hover:border-fuchsia-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm flex items-center gap-1.5">
                        <Calendar size={14} className={isSelected ? 'text-fuchsia-100' : 'text-fuchsia-500'} />
                        {w.weekKey}
                      </span>
                      {currentUser?.id !== 'daily' ? (
                        <span className={`text-sm font-black ${isSelected ? 'text-white' : (w.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600')}`}>
                          ${w.netProfit.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-sm font-black text-fuchsia-600">
                          {w.totalCarts} carritos
                        </span>
                      )}
                    </div>

                    <div className={`flex items-center justify-between text-xs mt-2 ${isSelected ? 'text-fuchsia-100' : 'text-slate-500'}`}>
                      <span className="flex items-center gap-1">
                        <ShoppingCart size={12} />
                        {w.totalCarts} carritos
                      </span>
                      {currentUser?.id !== 'daily' && (
                        <span className="font-semibold">
                          +{w.totalIncome}$ / -{w.totalExpenses}$
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Selected Week Detail and Payroll Breakdown */}
        <div className="lg:col-span-2 space-y-4">
          {activeWeek ? (
            <div className="glass-card space-y-5 bg-white border border-fuchsia-200">
              <div className="flex items-center justify-between pb-3 border-b border-fuchsia-100">
                <div>
                  <div className="text-xs text-fuchsia-600 font-bold uppercase tracking-wider">
                    Detalle Semanal
                  </div>
                  <h3 className="text-lg font-black text-slate-800">
                    {activeWeek.weekKey}
                  </h3>
                </div>

                {currentUser?.id !== 'daily' && (
                  <button
                    onClick={onAddExpense}
                    className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 border-rose-300 text-rose-600 hover:bg-rose-50"
                  >
                    <Plus size={14} />
                    <span>Registrar Gasto / Deducción</span>
                  </button>
                )}
              </div>

              {/* Liquidación Semanal: filtered strictly per active selection and user permissions */}
              <div className="space-y-2.5">
                <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Award size={15} className="text-fuchsia-600" />
                  <span>Liquidación Semanal ({displayedOperatorsInPayroll.join(', ')}):</span>
                </div>

                <div className={`grid gap-3 ${displayedOperatorsInPayroll.length === 1 ? 'grid-cols-1' : (displayedOperatorsInPayroll.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3')}`}>
                  {displayedOperatorsInPayroll.map(op => {
                    const cartsCount = activeWeek.operatorCarts[op] || 0;
                    const payroll = calculatePayroll(op, cartsCount);
                    return (
                      <div key={op} className="p-4 rounded-2xl bg-fuchsia-50/70 border border-fuchsia-200 text-xs space-y-2 shadow-sm">
                        <div className="flex items-center justify-between font-black text-sm text-slate-800 pb-1.5 border-b border-fuchsia-200/60">
                          <span>{op === 'Francis' ? '👑 Francis' : (op === 'Ana' ? '🌟 Ana' : '🌸 Daily')}</span>
                          <span className="text-fuchsia-600 font-extrabold text-base">${payroll.total.toFixed(2)}</span>
                        </div>
                        <div className="text-slate-500 text-xs flex justify-between">
                          <span>Carritos hechos:</span>
                          <strong className="text-purple-700 text-sm font-bold">{cartsCount}</strong>
                        </div>
                        <div className="text-slate-500 text-xs flex justify-between">
                          <span>Sueldo Fijo:</span>
                          <span className="font-semibold text-slate-700">${payroll.baseSalary.toFixed(2)}</span>
                        </div>
                        {payroll.hasCommissions ? (
                          <div className="text-emerald-600 font-bold text-xs flex justify-between pt-1 border-t border-fuchsia-200/60">
                            <span>Comisión ($20 c/10):</span>
                            <span>+${payroll.commission.toFixed(2)}</span>
                          </div>
                        ) : (
                          <div className="text-slate-400 italic text-[11px] pt-1 border-t border-fuchsia-200/60">
                            Solo sueldo fijo semanal ($50)
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Formula View for Admins */}
              {currentUser?.id !== 'daily' && (
                <div className="p-4 rounded-2xl bg-fuchsia-50/60 border border-fuchsia-200/80 font-mono text-xs space-y-2">
                  <div className="text-slate-500 font-bold uppercase text-[10px] tracking-wider mb-1">
                    Balance Global de Ganancias:
                  </div>
                  <div className="text-emerald-700 flex justify-between font-semibold">
                    <span>+ Ingreso total ({activeWeek.orders.length} pedidos / {activeWeek.totalCarts} carritos):</span>
                    <span className="font-bold">+${activeWeek.totalIncome.toFixed(2)}</span>
                  </div>

                  {activeWeek.expenses.map((exp, idx) => (
                    <div key={exp.id || idx} className="text-rose-600 flex justify-between items-center group pl-2 border-l-2 border-rose-400">
                      <span className="truncate pr-2">
                        - ${Number(exp.amount).toFixed(2)} {exp.concept} {exp.operator ? `(${exp.operator})` : ''}
                      </span>
                      <button
                        onClick={() => onDeleteExpense(exp.id)}
                        className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                        title="Eliminar gasto"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}

                  <div className="pt-2 border-t border-fuchsia-200 text-slate-800 font-bold text-sm flex justify-between">
                    <span>= Ganancia Neta de la Semana:</span>
                    <span className="text-fuchsia-600 text-base font-black">
                      ${activeWeek.netProfit.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Orders in Week */}
              <div className="space-y-3 pt-1">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Carritos en esta semana ({activeWeek.orders.length})
                </h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {activeWeek.orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3 rounded-xl bg-fuchsia-50/40 border border-fuchsia-100 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{ord.clientName}</span>
                        <span className="badge badge-operator text-[10px] ml-2">{ord.operator}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-purple-600 font-semibold">{ord.cartsCount || 1} carritos</span>
                        <span className="font-black text-fuchsia-600">${Number(ord.paidAmount || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card text-center py-16 text-slate-400 bg-white">
              Selecciona una semana para ver los detalles.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
