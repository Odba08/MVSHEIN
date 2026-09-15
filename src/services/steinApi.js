// Servicio de integración con SteinHQ y Almacenamiento Local Híbrido

const BASE_API_URL = "https://api.steinhq.com/v1/storages/6aa8b24192b1163e9743465f";
const STORAGE_KEY_ORDERS = "shein_orders_v3";
const STORAGE_KEY_EXPENSES = "shein_expenses_v3";
const STORAGE_KEY_SETTINGS = "shein_settings_v3";

export const getSteinConfig = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.warn("Error leyendo settings:", e);
  }
  return {
    sheetName: "Hoja 1",
    syncWithCloud: true,
  };
};

export const saveSteinConfig = (settings) => {
  const current = getSteinConfig();
  const updated = { ...current, ...settings };
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
  return updated;
};

export const testSteinConnection = async () => {
  const config = getSteinConfig();
  const sheet = config.sheetName || "Hoja 1";
  try {
    const url = `${BASE_API_URL}/${encodeURIComponent(sheet)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    const data = await response.json();
    
    if (response.ok && !data.error) {
      return {
        success: true,
        message: `¡Conexión exitosa a Google Sheets! Registros encontrados: ${Array.isArray(data) ? data.length : 0}`
      };
    } else {
      const errorDetail = data.error || `HTTP ${response.status}`;
      return {
        success: false,
        message: `Aviso SteinHQ: ${errorDetail}. Asegúrate de tener los encabezados en la Fila 1 de "${sheet}".`
      };
    }
  } catch (err) {
    return {
      success: false,
      message: `Error de conexión con SteinHQ: ${err.message}`
    };
  }
};

const formatOrderForStein = (o) => ({
  "id": o.id || `ord_${Date.now()}`,
  "Nombre cliente": o.clientName || "",
  "Correo que se utilizo": o.email || "",
  "Clave que se utilizo": o.password || "",
  "Monto que pago": Number(o.paidAmount || 0),
  "Cantidad de carritos": Number(o.cartsCount || 1),
  "Seguimiento": o.status || "Pendiente",
  "Numero de guia": o.trackingNumber || "",
  "Realizado por": o.operator || "Francis",
  "Fecha realizada": o.date || new Date().toISOString().split("T")[0],
  "Notas": o.notes || ""
});

// --- PEDIDOS (ORDERS) - SIN DATOS FALSOS / SEEDS ---

export const fetchOrdersFromStein = async () => {
  const config = getSteinConfig();
  const sheet = config.sheetName || "Hoja 1";
  
  let localOrders = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORDERS);
    if (raw) localOrders = JSON.parse(raw);
  } catch (e) {
    console.warn("Error leyendo localOrders:", e);
  }

  if (config.syncWithCloud) {
    try {
      const response = await fetch(`${BASE_API_URL}/${encodeURIComponent(sheet)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      if (response.ok) {
        const cloudData = await response.json();
        if (Array.isArray(cloudData)) {
          // Filtrar filas vacías
          const validRows = cloudData.filter(item => 
            item['Nombre cliente'] || item.clientName || item.cliente || item['Correo que se utilizo']
          );

          const normalized = validRows.map(item => ({
            id: item.id || `ord_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            clientName: item['Nombre cliente'] || item.clientName || item.cliente || "",
            email: item['Correo que se utilizo'] || item.email || item.emailUsed || item.correo || "",
            password: item['Clave que se utilizo'] || item.password || item.passwordUsed || item.clave || "",
            paidAmount: parseFloat(item['Monto que pago'] || item.paidAmount || item.amountPaid || item.monto || 0),
            cartsCount: parseInt(item['Cantidad de carritos'] || item.cartsCount || item.carritos || 1, 10),
            status: item['Seguimiento'] || item.status || item.seguimiento || "Pendiente",
            trackingNumber: item['Numero de guia'] || item.trackingNumber || item.guia || "",
            operator: item['Realizado por'] || item.operator || item.handledBy || item.realizadoPor || "Francis",
            date: item['Fecha realizada'] || item.date || item.fecha || new Date().toISOString().split("T")[0],
            notes: item['Notas'] || item.notes || item.notas || "",
            createdAt: item.createdAt || new Date().toISOString()
          }));

          localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(normalized));
          return normalized;
        }
      }
    } catch (err) {
      console.warn("No se pudo conectar a SteinHQ, usando datos locales:", err);
    }
  }

  // SI LA HOJA ESTÁ VACÍA, DEVOLVEMOS ARRAY VACÍO (SIN MOCK DATA)
  return localOrders || [];
};

export const syncOrderToStein = async (order) => {
  const config = getSteinConfig();
  const sheet = config.sheetName || "Hoja 1";
  
  let orders = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORDERS);
    if (raw) orders = JSON.parse(raw);
  } catch (e) {}

  const existingIdx = orders.findIndex(o => o.id === order.id);
  if (existingIdx >= 0) {
    orders[existingIdx] = order;
  } else {
    orders.unshift(order);
  }
  localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));

  if (config.syncWithCloud) {
    try {
      const payload = formatOrderForStein(order);
      if (existingIdx >= 0) {
        await fetch(`${BASE_API_URL}/${encodeURIComponent(sheet)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            condition: { id: order.id },
            set: payload
          })
        });
      } else {
        const res = await fetch(`${BASE_API_URL}/${encodeURIComponent(sheet)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([payload])
        });
        const json = await res.json();
        return { success: true, response: json };
      }
    } catch (e) {
      console.warn("Error sincronizando orden a SteinHQ:", e);
      return { success: false, error: e.message };
    }
  }

  return { success: true };
};

export const deleteOrderFromStein = async (id) => {
  const config = getSteinConfig();
  const sheet = config.sheetName || "Hoja 1";

  let orders = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORDERS);
    if (raw) orders = JSON.parse(raw);
  } catch (e) {}
  orders = orders.filter(o => o.id !== id);
  localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));

  if (config.syncWithCloud) {
    try {
      await fetch(`${BASE_API_URL}/${encodeURIComponent(sheet)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condition: { id: id }
        })
      });
    } catch (e) {
      console.warn("Error eliminando en SteinHQ:", e);
    }
  }
};

// --- GASTOS Y DEDUCCIONES SEMANALES ---

export const fetchExpensesFromStein = async () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXPENSES);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
};

export const syncExpenseToStein = async (expense) => {
  let list = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXPENSES);
    if (raw) list = JSON.parse(raw);
  } catch (e) {}

  const existingIdx = list.findIndex(e => e.id === expense.id);
  if (existingIdx >= 0) {
    list[existingIdx] = expense;
  } else {
    list.unshift(expense);
  }
  localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(list));
  return expense;
};

export const deleteExpenseFromStein = async (id) => {
  let list = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXPENSES);
    if (raw) list = JSON.parse(raw);
  } catch (e) {}
  list = list.filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(list));
};
