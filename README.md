# Cobre Payment Plug

**Cobre Payment Plug** es un módulo de Node.js diseñado para manejar pagos a través de la pasarela de pago Cobre. Utiliza Express.js para crear endpoints de API, Sequelize para interacciones con bases de datos PostgreSQL, Winston para el registro de logs, y Sendinblue (Brevo) para el envío de correos electrónicos transaccionales. Este módulo garantiza un procesamiento de pagos seguro y eficiente, gestión de transacciones y notificaciones a usuarios.

## Tabla de Contenidos

- [Características](#características)
- [Prerequisitos](#prerequisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Ejecutando la Aplicación](#ejecutando-la-aplicación)
- [Endpoints de la API](#endpoints-de-la-api)
- [Registro de Logs](#registro-de-logs)
- [Depuración](#depuración)
- [Pruebas](#pruebas)
- [Manejo de Errores](#manejo-de-errores)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Comunicación con APIs Externas](#comunicación-con-apis-externas)
- [Contribuciones](#contribuciones)
- [Licencia](#licencia)
- [Contacto](#contacto)

## Características

- **Procesamiento de Pagos:** Inicia y gestiona pagos a través de Cobre.
- **Manejo de Webhooks:** Recibe y procesa confirmaciones de pagos mediante webhooks.
- **Gestión de Base de Datos:** Utiliza Sequelize ORM para interacciones con PostgreSQL.
- **Correos Electrónicos Transaccionales:** Envía correos de confirmación y de lista de espera usando Sendinblue.
- **Registro de Logs:** Registro integral con Winston para monitoreo y depuración.
- **Limitación de Tasa:** Protege las APIs con limitación de tasa para prevenir abusos.
- **Manejo de Errores:** Mecanismos robustos para asegurar la fiabilidad.

## Prerequisitos

Antes de configurar el proyecto, asegúrate de tener instalados los siguientes componentes:

- **Node.js:** v14.x o superior
- **npm:** v6.x o superior
- **PostgreSQL:** v12.x o superior

## Instalación

1. **Clonar el Repositorio:**

   ```bash
   git clone https://github.com/tuusuario/cobre-payment-plug.git
   cd cobre-payment-plug
   ```

2. **Instalar Dependencias:**

   ```bash
   npm install
   ```

## Configuración

1. **Variables de Entorno:**

   Crea un archivo `.env` en el directorio raíz y complétalo con las variables de entorno necesarias:

   ```env
   # Configuración de la Base de Datos
   DB_NAME=tu_nombre_de_base_de_datos
   DB_USER=tu_usuario_de_base_de_datos
   DB_PASSWORD=tu_contraseña_de_base_de_datos
   DB_HOST=tu_host_de_base_de_datos
   DB_PORT=5432

   # Configuración del Servidor
   PORT=3000
   NODE_ENV=development
   ALLOWED_ORIGIN=http://localhost:3000,http://tudominio.com

   # Configuración de la API de Cobre
   COBRE_API_KEY=tu_api_key_de_cobre
   CLIENT_ID=tu_client_id
   CLIENT_SECRET=tu_client_secret
   COBRE_URL_TOKENS=https://api.cobre.com/token
   COBRE_URL_PAYMENTS=https://api.cobre.com/payments
   COBRE_URL_REGISTER_WEBHOOK=https://api.cobre.com/webhooks
   COBRE_URL_PAYMENT_LINK_INFO=https://api.cobre.com/payment-links
   REDIRECT_URL=https://tudominio.com/exito-pago

   # Configuración del Webhook
   WEBHOOK_SECRET=tu_webhook_secret
   WEBHOOK_URL=https://tu-dominio.com/api/pagos/cobre/webhook

   # Configuración de Sendinblue (Brevo)
   BREVO_API_KEY=tu_brevo_api_key

   # Registro de Logs
   SHOW_EXTRA_LOGS=true
   ```

   **Nota:** Reemplaza los valores de marcador de posición con tus credenciales y configuraciones reales.

2. **Configuración de la Base de Datos:**

   Asegúrate de que PostgreSQL esté en funcionamiento y crea una base de datos que coincida con `DB_NAME`. Sequelize se encargará de la creación y sincronización de las tablas.

   ```sql
   CREATE DATABASE tu_nombre_de_base_de_datos;
   ```

## Ejecutando la Aplicación

1. **Iniciar el Servidor:**
   - **En Modo Desarrollo (con Nodemon):**
     ```bash
     npm run dev
     ```
   - **En Modo Producción:**
     ```bash
     npm start
     ```

2. **Acceder a la Aplicación:**

   El servidor se iniciará en el puerto especificado en el archivo `.env` (por defecto es `3000`). Puedes verificar que está funcionando visitando:

   ```
   http://localhost:3000/
   ```

   Deberías ver:

   ```
   Cobre Payment Plug está funcionando correctamente.
   ```

## Endpoints de la API

### Procesar Pago

**Endpoint:** `POST /api/pagos/cobre/process-payment`

**Descripción:** Inicia un nuevo pago a través de Cobre.

**Limitación de Tasa:** Máximo de 20 solicitudes por IP cada 15 minutos.

**Cuerpo de la Solicitud:**
```json
{
  "product_reference": "string", // Requerido
  "amount": "number",            // Requerido
  "email": "string",             // Requerido
  "fullName": "string",          // Requerido
  "cellPhone": "string",         // Requerido
  "document": "string",          // Requerido
  "documentType": "string",      // Requerido
  "description": "string",       // Opcional
  "currency": "string"           // Opcional (por defecto: "COP")
}
```

### Manejar Webhook

**Endpoint:** `POST /api/pagos/cobre/webhook`

**Descripción:** Maneja las notificaciones de confirmación de pagos de Cobre.

**Cuerpo de la Solicitud:**
```json
{
  "noveltyUuid": "string",
  "noveltyDetailUuid": "string",
  "transactionResult": "PAID" | "EXPIRED" | "REJECTED",
  "checksum": "string"
}
```

## Registro de Logs

La aplicación utiliza **Winston** para el registro de logs, configurado para manejar diferentes niveles de log y salidas.

- **Niveles de Log:** `error`, `warn`, `info`, `debug`, `trace`
- **Transports:**
  - **Consola:** Muestra logs en la consola.
  - **Archivos:**
    - `error.log`: Registra solo mensajes de nivel `error`.
    - `combined.log`: Registra todos los niveles.

## Depuración

- **Habilitar Logs Adicionales:** Establece `SHOW_EXTRA_LOGS=true` en el archivo `.env` para habilitar logs adicionales en la consola para propósitos de depuración.
- **Excepciones No Capturadas y Rechazos No Manejados:** La aplicación escucha eventos `unhandledRejection` y `uncaughtException`, registrándolos apropiadamente antes de cerrar si es necesario.
- **Logs de Trazas:** Utiliza `logger.trace` dentro del código para registrar trazas de ejecución para obtener información más detallada durante la depuración.

## Pruebas

El proyecto utiliza **Jest** para pruebas. Aunque no se proporcionan pruebas en la configuración inicial, puedes agregar pruebas dentro del directorio `tests/`.

**Ejecutar Pruebas:**
```bash
npm test
```

## Manejo de Errores

- **Errores de CORS:** Orígenes no autorizados que intenten acceder a la API recibirán una respuesta `403 Forbidden` con un mensaje de error apropiado.
- **Errores Generales:** Todos los demás errores son capturados por el manejador de errores global, registrados y respondidos con un `500 Internal Server Error`.
- **Validación de Webhook:** Las solicitudes de webhook se validan usando un checksum para asegurar su autenticidad. Checksum inválidos resultan en un `400 Bad Request`.

## Estructura del Proyecto

```
cobre-payment-plug/
├── config/
│   ├── database.js
│   └── logger.js
├── controllers/
│   └── pagos/
│       └── cobrePaymentController.js
├── models/
│   ├── inventoryModel.js
│   ├── orderModel.js
│   └── transactionModel.js
├── routes/
│   └── pagos/
│       └── cobrePaymentRoutes.js
├── services/
│   └── pagos/
│       ├── cobrePaymentService.js
│       ├── emailService.js
│       ├── inventoryService.js
│       └── orderService.js
├── utils/
│   ├── cryptoUtils.js
│   └── helpers.js
├── app.js
├── package.json
└── .env
```

## Comunicación con APIs Externas

### API de Cobre

- **Autenticación:** Obtén un token de acceso usando credenciales de cliente (`CLIENT_ID` y `CLIENT_SECRET`).
- **Endpoints:**
  - **Endpoint de Token:** `COBRE_URL_TOKENS`
  - **Endpoint de Pagos:** `COBRE_URL_PAYMENTS`
  - **Registro de Webhook:** `COBRE_URL_REGISTER_WEBHOOK`
  - **Información del Enlace de Pago:** `COBRE_URL_PAYMENT_LINK_INFO`
- **Headers:**
  - `X-API-KEY`: Tu API key de Cobre.
  - `X-APIGW-AUTH`: Token Bearer para solicitudes autenticadas.
  - `X-CORRELATION-ID`: UUID único para cada solicitud.

### API de Sendinblue (Brevo)

- **Configuración:** Establece `BREVO_API_KEY` en el archivo `.env`.
- **Correos Enviados:**
  - **Correo de Confirmación de Producto:** Enviado tras un pago exitoso.
  - **Correo de Lista de Espera:** Enviado si el producto no está disponible o el precio no coincide.

## Contribuciones

¡Las contribuciones son bienvenidas! Por favor, sigue estos pasos:

1. **Fork del Repositorio**
2. **Crear una Rama de Feature**
   ```bash
   git checkout -b feature/TuFeature
   ```
3. **Commit de Tus Cambios**
   ```bash
   git commit -m "Agregar alguna feature"
   ```
4. **Push a la Rama**
   ```bash
   git push origin feature/TuFeature
   ```
5. **Abrir un Pull Request**


## Contacto

Para cualquier consulta o soporte, por favor contacta a:

- **Maximiliano Avendaño**
- **Email:** srmax.net@gmail.com
