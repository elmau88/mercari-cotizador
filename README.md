# 🛍️ KYEAN Cotizador Mercari v2.0 (Node.js)

Sistema automático de cotización de productos Mercari con **Node.js + Express**.

## 🚀 Instalación

```bash
npm install
```

## ▶️ Ejecución

```bash
npm start
```

Accede a: **http://localhost:5000**

## 📋 Características

✅ **Extracción automática de precios** desde Mercari  
✅ **Conversión JPY → MXN** en tiempo real (tipo fijo 0.113)  
✅ **Margen fijo $55 MXN** automático  
✅ **Información del producto**: nombre, categoría, condición, foto  
✅ **Interfaz KYEAN Design** (rosa, glassmorphism, animaciones)  
✅ **Rechazo inteligente** de Mercari Shops (instruye usuario a WhatsApp)  
✅ **API REST** para integración  

## 🔧 API Endpoints

### POST `/api/cotizar`
Cotiza un producto de Mercari.

**Request:**
```json
{
  "url": "https://jp.mercari.com/item/m46973798721"
}
```

**Response:**
```json
{
  "precio_jpy": 25000,
  "precio_mxn": 2825.00,
  "precio_final": 2880,
  "tipo_cambio": 0.113,
  "nombre_producto": "PeaceMinusONE ジードラゴンコラボ...",
  "categoria": "靴",
  "condicion": "新品、未使用",
  "estado": "on_sale",
  "foto": "https://..."
}
```

### GET `/health`
Verifica que el servidor está activo.

## 📦 Dependencias

- **express** - Servidor web
- **cors** - Control de CORS
- **axios** - HTTP client
- **cheerio** - Web scraping
- **mercapi** - API de Mercari (reverse-engineered)

## 🌐 Despliegue

### Render.com (Recomendado)
1. Push a GitHub
2. Conecta el repo en Render
3. Crear nuevo Web Service
4. Node.js + `npm start`
5. Deploy automático

### Heroku
```bash
npm install -g heroku
heroku login
heroku create tu-app
git push heroku main
```

### DigitalOcean / AWS
Usa `gunicorn` o `forever` para mantener el proceso activo.

## 📝 Licencia

MIT - Uso libre para propósitos educativos y comerciales.
# Mercari Cotizador

Cotizador automático de productos Mercari Japón con precio en MXN
