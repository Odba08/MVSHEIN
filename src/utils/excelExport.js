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

// EXPORTACIÓN DE TODOS LOS PEDIDOS A EXCEL
export const exportOrdersToExcel = (allOrders, fileName = 'MV_SHEIN_Todos_Los_Carritos.xlsx') => {
  if (!allOrders || allOrders.length === 0) {
    alert('No hay carritos registrados para exportar.');
    return;
  }

  const data = allOrders.map((o, idx) => {
    const subCarts = Array.isArray(o.subCarts) ? o.subCarts : [];
    const storePaid = subCarts.reduce((acc, c) => acc + Number(c.paidAmount || 0), 0);
    const net = Number(o.paidAmount || 0) - storePaid;
    const totalCarts = subCarts.length > 0 ? subCarts.length : (o.cartsCount || 1);
    const emailsList = subCarts.length > 0 ? subCarts.map(c => c.email).filter(Boolean).join(', ') : (o.email || '');

    return {
      '#': idx + 1,
      'Fecha': o.date || '',
      'Cliente': o.clientName || '',
      'Correos Utilizados': emailsList,
      'Monto Pagado Cliente ($)': Number(o.paidAmount || 0).toFixed(2),
      'Total Pagado SHEIN ($)': storePaid.toFixed(2),
      'Ganancia Neta ($)': net.toFixed(2),
      'Cantidad de Carritos': totalCarts,
      'Estado / Seguimiento': o.status || 'Pendiente',
      'Número de Guía': o.trackingNumber || '',
      'Registrado Por': o.operator || 'Francis',
      'Notas / Detalle': o.notes || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Todos_Los_Pedidos');

  worksheet['!cols'] = [
    { wch: 5 }, { wch: 12 }, { wch: 25 }, { wch: 32 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 20 }, { wch: 16 }, { wch: 30 }
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
      weekMap[wk] = { 
        week: wk, 
        income: 0, 
        storeExpenses: 0, 
        generalExpenses: 0, 
        carts: 0, 
        orders: [], 
        expList: [], 
        operators: { Francis: 0, Daily: 0, Ana: 0 } 
      };
    }
    weekMap[wk].orders.push(o);
    weekMap[wk].income += Number(o.paidAmount || 0);

    const subCarts = Array.isArray(o.subCarts) ? o.subCarts : [];
    if (subCarts.length > 0) {
      weekMap[wk].carts += subCarts.length;
      subCarts.forEach(sc => {
        const op = sc.operator || o.operator || 'Francis';
        if (weekMap[wk].operators[op] !== undefined) {
          weekMap[wk].operators[op] += 1;
        }
        weekMap[wk].storeExpenses += Number(sc.paidAmount || 0);
      });
    } else {
      const count = Number(o.cartsCount || 1);
      weekMap[wk].carts += count;
      if (o.operator && weekMap[wk].operators[o.operator] !== undefined) {
        weekMap[wk].operators[o.operator] += count;
      }
    }
  });

  allExpenses.forEach(e => {
    const wk = getISOWeekKey(e.date);
    if (!weekMap[wk]) {
      weekMap[wk] = { 
        week: wk, 
        income: 0, 
        storeExpenses: 0, 
        generalExpenses: 0, 
        carts: 0, 
        orders: [], 
        expList: [], 
        operators: { Francis: 0, Daily: 0, Ana: 0 } 
      };
    }
    weekMap[wk].expList.push(e);
    weekMap[wk].generalExpenses += Number(e.amount || 0);
  });

  // Hoja 1: Resumen Semanal
  const summaryRows = Object.values(weekMap).map((w, idx) => {
    const totalExp = w.storeExpenses + w.generalExpenses;
    const net = w.income - totalExp;
    const margin = w.income > 0 ? ((net / w.income) * 100).toFixed(1) + '%' : '0%';
    const perCart = w.carts > 0 ? (net / w.carts).toFixed(2) : '0.00';

    return {
      '#': idx + 1,
      'Semana': w.week,
      'Total Carritos': w.carts,
      'Carritos Francis': w.operators.Francis,
      'Carritos Daily': w.operators.Daily,
      'Carritos Ana': w.operators.Ana,
      'Ingresos Clientes ($)': `$${w.income.toFixed(2)}`,
      'Pagado SHEIN ($)': `-$${w.storeExpenses.toFixed(2)}`,
      'Otros Gastos ($)': `-$${w.generalExpenses.toFixed(2)}`,
      'Ganancia Neta ($)': `$${net.toFixed(2)}`,
      'Margen Ganancia': margin,
      'Ganancia / Carrito ($)': `$${perCart}`,
    };
  });

  const summaryWs = XLSX.utils.json_to_sheet(summaryRows.length > 0 ? summaryRows : [{ Mensaje: 'Sin registros' }]);
  summaryWs['!cols'] = [
    { wch: 5 }, { wch: 32 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 18 }
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

  // Hoja 3: Detalle de Pedidos
  const ordersRows = allOrders.map((o, idx) => {
    const subCarts = Array.isArray(o.subCarts) ? o.subCarts : [];
    const storePaid = subCarts.reduce((acc, c) => acc + Number(c.paidAmount || 0), 0);
    const net = Number(o.paidAmount || 0) - storePaid;

    return {
      '#': idx + 1,
      'Semana': getISOWeekKey(o.date),
      'Fecha': o.date || '',
      'Cliente': o.clientName || '',
      'Monto Cliente ($)': Number(o.paidAmount || 0).toFixed(2),
      'Total Pagado SHEIN ($)': storePaid.toFixed(2),
      'Ganancia Neta ($)': net.toFixed(2),
      'Carritos': subCarts.length > 0 ? subCarts.length : (o.cartsCount || 1),
      'Estado': o.status || 'Pendiente',
      'Guía': o.trackingNumber || '',
      'Registrado Por': o.operator || 'Francis',
      'Notas': o.notes || ''
    };
  });
  const ordersWs = XLSX.utils.json_to_sheet(ordersRows.length > 0 ? ordersRows : [{ Mensaje: 'Sin pedidos' }]);
  ordersWs['!cols'] = [
    { wch: 5 }, { wch: 28 }, { wch: 12 }, { wch: 24 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 10 }, { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 25 }
  ];
  XLSX.utils.book_append_sheet(workbook, ordersWs, 'Detalle_Pedidos');

  // Hoja 4: Desglose Individual de Carritos / Correos
  const individualCartsRows = [];
  allOrders.forEach(o => {
    const subCarts = Array.isArray(o.subCarts) ? o.subCarts : [];
    if (subCarts.length > 0) {
      subCarts.forEach((sc, idx) => {
        individualCartsRows.push({
          'ID Pedido': o.id,
          'Cliente': o.clientName || '',
          'Carrito #': idx + 1,
          'Operadora': sc.operator || o.operator || 'Francis',
          'Correo Utilizado': sc.email || '',
          'Clave / PIN': sc.password || '',
          'Monto Pagado SHEIN ($)': Number(sc.paidAmount || 0).toFixed(2),
          'Fecha': sc.date || o.date || '',
          'Notas / Cupón': sc.notes || ''
        });
      });
    } else {
      individualCartsRows.push({
        'ID Pedido': o.id,
        'Cliente': o.clientName || '',
        'Carrito #': 1,
        'Operadora': o.operator || 'Francis',
        'Correo Utilizado': o.email || '',
        'Clave / PIN': o.password || '',
        'Monto Pagado SHEIN ($)': '0.00',
        'Fecha': o.date || '',
        'Notas / Cupón': o.notes || ''
      });
    }
  });

  const indWs = XLSX.utils.json_to_sheet(individualCartsRows.length > 0 ? individualCartsRows : [{ Mensaje: 'Sin carritos' }]);
  indWs['!cols'] = [
    { wch: 20 }, { wch: 24 }, { wch: 10 }, { wch: 14 }, { wch: 28 }, { wch: 16 }, { wch: 20 }, { wch: 12 }, { wch: 25 }
  ];
  XLSX.utils.book_append_sheet(workbook, indWs, 'Desglose_Carritos_Correos');

  XLSX.writeFile(workbook, fileName);
};
