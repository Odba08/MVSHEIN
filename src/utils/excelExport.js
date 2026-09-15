import * as XLSX from 'xlsx';

export const getISOWeekKey = (dateString) => {
  if (!dateString) return 'Semana Sin Fecha';
  const d = new Date(dateString + 'T12:00:00');
  if (isNaN(d.getTime())) return 'Semana Sin Fecha';

  const day = d.getDay();
  const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatShort = (dt) => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${dt.getDate()} ${months[dt.getMonth()]}`;
  };

  return `Semana del ${formatShort(monday)} al ${formatShort(sunday)}`;
};

// EXPORTACIÓN DE TODOS LOS CARRITOS A EXCEL (SIN FILTRAR POR PERSONA)
export const exportOrdersToExcel = (allOrders, fileName = 'MV_SHEIN_Todos_Los_Carritos.xlsx') => {
  if (!allOrders || allOrders.length === 0) {
    alert('No hay carritos registrados para exportar.');
    return;
  }

  const data = allOrders.map((o, idx) => ({
    '#': idx + 1,
    'Fecha': o.date || '',
    'Cliente': o.clientName || '',
    'Correo que se utilizó': o.email || '',
    'Clave que se utilizó': o.password || '',
    'Monto Pagado ($)': Number(o.paidAmount || 0).toFixed(2),
    'Cantidad de Carritos': o.cartsCount || 1,
    'Estado / Seguimiento': o.status || 'Pendiente',
    'Número de Guía': o.trackingNumber || '',
    'Realizado Por': o.operator || 'Francis',
    'Notas / Detalle': o.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Todos_Los_Carritos');

  worksheet['!cols'] = [
    { wch: 5 }, { wch: 12 }, { wch: 25 }, { wch: 28 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 20 }, { wch: 16 }, { wch: 30 }
  ];

  XLSX.writeFile(workbook, fileName);
};

export const exportFullAccountingExcel = (allOrders, allExpenses, fileName = 'MV_SHEIN_Contabilidad_Nomina.xlsx') => {
  const workbook = XLSX.utils.book_new();

  // 1. Group by weeks
  const weekMap = {};
  allOrders.forEach(o => {
    const wk = getISOWeekKey(o.date);
    if (!weekMap[wk]) {
      weekMap[wk] = { week: wk, income: 0, carts: 0, expenses: 0, orders: [], expList: [], operators: { Francis: 0, Daily: 0, Ana: 0 } };
    }
    weekMap[wk].orders.push(o);
    weekMap[wk].income += Number(o.paidAmount || 0);
    const count = Number(o.cartsCount || 1);
    weekMap[wk].carts += count;
    if (o.operator && weekMap[wk].operators[o.operator] !== undefined) {
      weekMap[wk].operators[o.operator] += count;
    }
  });

  allExpenses.forEach(e => {
    const wk = getISOWeekKey(e.date);
    if (!weekMap[wk]) {
      weekMap[wk] = { week: wk, income: 0, carts: 0, expenses: 0, orders: [], expList: [], operators: { Francis: 0, Daily: 0, Ana: 0 } };
    }
    weekMap[wk].expList.push(e);
    weekMap[wk].expenses += Number(e.amount || 0);
  });

  // Hoja 1: Resumen Semanal
  const summaryRows = Object.values(weekMap).map((w, idx) => {
    const net = w.income - w.expenses;
    const margin = w.income > 0 ? ((net / w.income) * 100).toFixed(1) + '%' : '0%';
    const perCart = w.carts > 0 ? (net / w.carts).toFixed(2) : '0.00';

    return {
      '#': idx + 1,
      'Semana': w.week,
      'Total Carritos': w.carts,
      'Carritos Francis': w.operators.Francis,
      'Carritos Daily': w.operators.Daily,
      'Carritos Ana': w.operators.Ana,
      'Ingresos Brutos ($)': `$${w.income.toFixed(2)}`,
      'Gastos / Deducciones ($)': `-$${w.expenses.toFixed(2)}`,
      'Ganancia Neta ($)': `$${net.toFixed(2)}`,
      'Margen Ganancia': margin,
      'Ganancia / Carrito ($)': `$${perCart}`,
    };
  });

  const summaryWs = XLSX.utils.json_to_sheet(summaryRows.length > 0 ? summaryRows : [{ Mensaje: 'Sin registros' }]);
  summaryWs['!cols'] = [
    { wch: 5 }, { wch: 32 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(workbook, summaryWs, 'Resumen_Semanas');

  // Hoja 2: Nómina & Comisiones ($50 salario base + $20 por cada 10 carritos para Francis y Ana; solo $50 para Daily)
  const payrollRows = [];
  Object.values(weekMap).forEach(w => {
    // Francis
    const franCarts = w.operators.Francis;
    const franCommission = Math.floor(franCarts / 10) * 20 + ((franCarts % 10) * 2);
    payrollRows.push({
      'Semana': w.week,
      'Colaboradora': 'Francis',
      'Tipo de Cobro': 'Sueldo Base ($50) + Comisión ($20 c/10)',
      'Carritos Realizados': franCarts,
      'Sueldo Base ($)': '$50.00',
      'Comisión Generada ($)': `$${franCommission.toFixed(2)}`,
      'Total a Pagar ($)': `$${(50 + franCommission).toFixed(2)}`
    });

    // Ana
    const anaCarts = w.operators.Ana;
    const anaCommission = Math.floor(anaCarts / 10) * 20 + ((anaCarts % 10) * 2);
    payrollRows.push({
      'Semana': w.week,
      'Colaboradora': 'Ana',
      'Tipo de Cobro': 'Sueldo Base ($50) + Comisión ($20 c/10)',
      'Carritos Realizados': anaCarts,
      'Sueldo Base ($)': '$50.00',
      'Comisión Generada ($)': `$${anaCommission.toFixed(2)}`,
      'Total a Pagar ($)': `$${(50 + anaCommission).toFixed(2)}`
    });

    // Daily
    const dailyCarts = w.operators.Daily;
    payrollRows.push({
      'Semana': w.week,
      'Colaboradora': 'Daily',
      'Tipo de Cobro': 'Solo Sueldo Fijo ($50)',
      'Carritos Realizados': dailyCarts,
      'Sueldo Base ($)': '$50.00',
      'Comisión Generada ($)': '$0.00 (Sin comisión)',
      'Total a Pagar ($)': '$50.00'
    });
  });

  const payrollWs = XLSX.utils.json_to_sheet(payrollRows.length > 0 ? payrollRows : [{ Mensaje: 'Sin datos' }]);
  payrollWs['!cols'] = [
    { wch: 30 }, { wch: 15 }, { wch: 35 }, { wch: 18 }, { wch: 16 }, { wch: 22 }, { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(workbook, payrollWs, 'Nomina_Y_Comisiones');

  // Hoja 3: Detalle de todos los carritos
  const ordersRows = allOrders.map((o, idx) => ({
    '#': idx + 1,
    'Semana': getISOWeekKey(o.date),
    'Fecha': o.date || '',
    'Cliente': o.clientName || '',
    'Correo': o.email || '',
    'Clave': o.password || '',
    'Monto Pagado ($)': Number(o.paidAmount || 0).toFixed(2),
    'Carritos': o.cartsCount || 1,
    'Estado': o.status || 'Pendiente',
    'Guía': o.trackingNumber || '',
    'Realizado Por': o.operator || 'Francis',
  }));
  const ordersWs = XLSX.utils.json_to_sheet(ordersRows.length > 0 ? ordersRows : [{ Mensaje: 'Sin pedidos' }]);
  ordersWs['!cols'] = [
    { wch: 5 }, { wch: 28 }, { wch: 12 }, { wch: 24 }, { wch: 26 }, { wch: 16 }, { wch: 16 }, { wch: 10 }, { wch: 14 }, { wch: 18 }, { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(workbook, ordersWs, 'Detalle_Todos_Los_Carritos');

  XLSX.writeFile(workbook, fileName);
};
