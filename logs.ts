export const LOG_DATA = `
### ACTIVIDAD: 23/10/2025

[09:15:01] [INFO] PEDIDO #00120: Inicializado. Origen: Webhook Telegram.
[09:15:03] [API CALL] --> GET https://api.factusol.es/clientes/buscar?id=0127
[09:15:03] [API RESP] <-- 200 OK | Cliente 0301 (Carser, SL) encontrado.
[09:15:05] [INFO] DB: Borrador de Pedido #00120 creado. Estado: PENDIENTE FACTUSOL.
[10:30:15] [INFO] PEDIDO #00121: Inicializado. Origen: Voz (STT).
[10:30:16] [API CALL] --> POST https://api.stt.proveedor.com/v2/convert
[10:30:18] [API RESP] <-- 200 OK | Transcripción OK. Texto: "10 sierras SRA-050. Cliente 0230, descuento 10%".
[10:30:19] [API CALL] --> GET https://api.factusol.es/clientes/buscar?id=0230
[10:30:19] [API RESP] <-- 200 OK | Cliente 0230 (Carnicería El Buen Gusto) encontrado.
[10:30:20] [API CALL] --> GET https://api.factusol.es/articulos/precios?codigo=SRA-050
[10:30:20] [API RESP] <-- 200 OK | Precio SRA-050: 95.00 EUR.
[10:30:21] [INFO] DB: Borrador de Pedido #00121 creado. Estado: PENDIENTE FACTUSOL.
[10:35:05] [INFO] DASHBOARD: Solicitud de Exportación de Pedido #00121.
[10:35:07] [API CALL] --> POST https://api.factusol.es/albaranes/crear
[10:35:08] [API RESP] <-- 201 CREATED | Albarán Factusol ID: A2025/00135.
[10:35:08] [INFO] DB: Pedido #00121 Actualizado. Estado: COMPLETADO.
[10:35:09] [INFO] EMAIL: Albarán A2025/00135 enviado.
[12:00:10] [INFO] PEDIDO #00122: Inicializado. Origen: Webhook Telegram.
[12:00:11] [API CALL] --> GET https://api.factusol.es/clientes/buscar?id=0089
[12:00:11] [API RESP] <-- 200 OK | Cliente 0089 (Martín Garcia Miranda) encontrado.
[12:00:13] [ERROR] API Factusol: La búsqueda del artículo "Cuchillo de deshuesar" falló por código ambiguo.
[12:00:13] [INFO] DB: Borrador de Pedido #00122 creado. Estado: REVISIÓN MANUAL (Error de artículo).
[13:00:05] [INFO] DASHBOARD: Solicitud de Exportación de Pedido #00120.
[13:00:06] [API CALL] --> POST https://api.factusol.es/albaranes/crear
[13:00:07] [API RESP] <-- 201 CREATED | Albarán Factusol ID: A2025/00136.
[13:00:07] [INFO] DB: Pedido #00120 Actualizado. Estado: COMPLETADO.
[13:00:08] [INFO] EMAIL: Albarán A2025/00136 enviado.

---

### ACTIVIDAD: 22/10/2025

[09:05:01] [INFO] PEDIDO #00116: Inicializado. Origen: Voz (STT).
[09:05:03] [API CALL] --> POST https://api.stt.proveedor.com/v2/convert
[09:05:05] [API RESP] <-- 200 OK | Transcripción OK. Texto: "30 Navajas Plegables código NVJ-200. Cliente 0193."
[09:05:06] [API CALL] --> GET https://api.factusol.es/clientes/buscar?id=0193
[09:05:06] [API RESP] <-- 200 OK | Cliente 0193 (Manuel Moya Garcia) encontrado.
[09:05:07] [INFO] DB: Borrador de Pedido #00116 creado. Estado: REVISIÓN MANUAL (Descuento no especificado).
[10:15:15] [INFO] DASHBOARD: Usuario Admin Guardó la Revisión Manual de Pedido #00122.
[10:15:15] [INFO] DB: Pedido #00122 Actualizado. Artículo corregido. Estado: PENDIENTE FACTUSOL.
[10:15:20] [INFO] DASHBOARD: Solicitud de Exportación de Pedido #00122.
[10:15:21] [API CALL] --> POST https://api.factusol.es/albaranes/crear
[10:15:22] [API RESP] <-- 201 CREATED | Albarán Factusol ID: A2025/00133.
[10:15:22] [INFO] DB: Pedido #00122 Actualizado. Estado: COMPLETADO.
[10:15:23] [INFO] EMAIL: Albarán A2025/00133 enviado.
[11:40:00] [INFO] PEDIDO #00117: Inicializado. Origen: Webhook Telegram.
[11:40:01] [API CALL] --> GET https://api.factusol.es/clientes/buscar?id=0230
[11:40:01] [API RESP] <-- 200 OK | Cliente 0230 (Carnicería El Buen Gusto) encontrado.
[11:40:03] [INFO] DB: Borrador de Pedido #00117 creado. Estado: PENDIENTE FACTUSOL.
[14:30:10] [INFO] DASHBOARD: Usuario Admin Guardó la Revisión Manual de Pedido #00116.
[14:30:11] [INFO] DB: Pedido #00116 Actualizado. Descuento aplicado: 15% (Opción 3). Estado: PENDiente FACTUSOL.
[14:30:15] [INFO] DASHBOARD: Solicitud de Exportación de Pedido #00116.
[14:30:16] [API CALL] --> POST https://api.factusol.es/albaranes/crear
[14:30:17] [API RESP] <-- 201 CREATED | Albarán Factusol ID: A2025/00134.
[14:30:17] [INFO] DB: Pedido #00116 Actualizado. Estado: COMPLETADO.
[14:30:18] [INFO] EMAIL: Albarán A2025/00134 enviado.

---

### ACTIVIDAD: 21/10/2025

[10:00:00] [INFO] PEDIDO #00113: Inicializado. Origen: Voz (STT).
[10:00:02] [API CALL] --> POST https://api.stt.proveedor.com/v2/convert
[10:00:04] [API RESP] <-- 200 OK | Transcripción OK. Texto: "Pack cuchillería para hostelería. Cliente 0127. Aplicar 5%."
[10:00:05] [API CALL] --> GET https://api.factusol.es/clientes/buscar?id=0127
[10:00:05] [API RESP] <-- 200 OK | Cliente 0127 (Alberto Martinez Lazaro) encontrado.
[10:00:07] [INFO] DB: Borrador de Pedido #00113 creado. Estado: PENDIENTE FACTUSOL.
[11:05:00] [INFO] DASHBOARD: Solicitud de Exportación de Pedido #00113.
[11:05:01] [API CALL] --> POST https://api.factusol.es/albaranes/crear
[11:05:02] [API RESP] <-- 201 CREATED | Albarán Factusol ID: A2025/00130.
[11:05:02] [INFO] DB: Pedido #00113 Actualizado. Estado: COMPLETADO.
[11:05:03] [INFO] EMAIL: Albarán A2025/00130 enviado.
[14:30:15] [INFO] PEDIDO #00114: Inicializado. Origen: Webhook Telegram.
[14:30:16] [API CALL] --> GET https://api.factusol.es/clientes/buscar?id=0089
[14:30:16] [API RESP] <-- 200 OK | Cliente 0089 (Martín Garcia Miranda) encontrado.
[14:30:18] [ERROR] API Factusol: Cliente 0089 no tiene condiciones de pago configuradas.
[14:30:18] [INFO] DB: Borrador de Pedido #00114 creado. Estado: REVISIÓN MANUAL (Error de Cliente).
[16:45:00] [INFO] PEDIDO #00115: Inicializado. Origen: Voz (STT).
[16:45:01] [API CALL] --> GET https://api.factusol.es/clientes/buscar?id=0193
[16:45:01] [API RESP] <-- 200 OK | Cliente 0193 (Manuel Moya Garcia) encontrado.
[16:45:03] [INFO] DB: Borrador de Pedido #00115 creado. Estado: PENDIENTE FACTUSOL.
`;
