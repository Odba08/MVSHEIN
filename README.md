# MV SHEIN 🛍️ - Control de Carritos, Guías, Nómina y Google Sheets

Aplicación web creada con **React + Vite**, diseñada con paleta **Fucsia & Rosa Boutique**, control de accesos por roles, cálculo de nómina semanal y sincronización en tiempo real con Google Sheets mediante **SteinHQ**.

---

## 🔐 Credenciales de Acceso

| Usuaria | Correo | Contraseña | Nivel de Acceso y Visibilidad |
| :--- | :--- | :--- | :--- |
| **🌟 Ana** | `ana@shein.com` | `MiaMiHija123` | **Supervisora:** Acceso total a Ana, Francis y Daily. |
| **👑 Francis** | `francis@shein.com` | `OscarAmor08` | **Líder:** Ve a Francis y Daily. |
| **🌸 Daily** | `daily@shein.com` | `Agape0812.` | **Operadora:** Solo ve sus propios carritos y su salario. |

---

## 💰 Esquema de Salarios y Comisiones

- **Sueldo Base Semanal:** **$50.00** para todas.
- **Comisión por Carritos:** **$20 por cada 10 carritos realizados** ($2 por carrito) para *Francis* y *Ana*.
- **Daily:** Cobra únicamente su sueldo fijo de **$50.00**.

---

## 🚀 Características

- **Gestión de Carritos:** Nombre de cliente, correo, clave, monto pagado, carritos, guía, operador y notas.
- **Estados de Seguimiento:** `Pendiente`, `En Revisión ⏳`, `Salió 🚚`, `Llegó 📦` y `Entregado ✨`.
- **Integración SteinHQ:** Inyección en tiempo real a Google Sheets (*Hoja 1*).
- **Reportes Excel:** Exportación completa de todos los carritos y liquidaciones semanales.
