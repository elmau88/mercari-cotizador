import axios from 'axios';
import * as cheerio from 'cheerio';
import translate from 'google-translate-api-x';

const TIPO_CAMBIO_FALLBACK = 0.1174;
const MARGEN_FIJO = 55;
const CACHE_DURACION_MS = 60 * 60 * 1000; // 1 hora

// Mercari usa una tasa interna más alta que la tasa de mercado pura
// (compensa spread/comisión de conversión). Este factor ajusta la tasa
// de mercado en vivo para acercarla a lo que Mercari realmente cobra.
const FACTOR_AJUSTE_MERCARI = 1.059;

let tasaCache = { valor: null, timestamp: 0 };

async function obtenerTasaCambio() {
  const ahora = Date.now();

  if (tasaCache.valor && (ahora - tasaCache.timestamp) < CACHE_DURACION_MS) {
    return tasaCache.valor;
  }

  try {
    const response = await axios.get('https://open.er-api.com/v6/latest/JPY', { timeout: 5000 });
    const tasaMercado = response.data?.rates?.MXN;

    if (tasaMercado && tasaMercado > 0) {
      const tasaAjustada = tasaMercado * FACTOR_AJUSTE_MERCARI;
      tasaCache = { valor: tasaAjustada, timestamp: ahora };
      return tasaAjustada;
    }
  } catch (error) {
    // Si la API externa falla, usamos el fallback fijo
  }

  return TIPO_CAMBIO_FALLBACK;
}

async function traducirAlEspanol(texto) {
  try {
    if (!/[぀-ゟ゠-ヿ一-鿿]/.test(texto)) {
      return texto;
    }
    const result = await translate(texto, { to: 'es' });
    return result.text;
  } catch (error) {
    return texto;
  }
}

async function obtenerPrecioProducto(url) {
  try {
    if (url.includes('/shops/product/') || url.includes('/shops/')) {
      throw new Error(
        'No es posible cotizar enlaces de Mercari Shops automáticamente. Por favor, manda el enlace al grupo de WhatsApp y te lo cotizamos manualmente.'
      );
    }

    if (!url.includes('/item/')) {
      throw new Error('URL de Mercari no válida. Use https://jp.mercari.com/item/[ID]');
    }

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);

    // El precio viene en un meta tag con atributo "name", no "property"
    const precioTag = $('meta[name="product:price:amount"]').attr('content');
    const precioJpy = precioTag ? parseInt(precioTag, 10) : null;

    if (!precioJpy || precioJpy < 1) {
      throw new Error('No se pudo extraer el precio del producto. Verifica que el enlace sea válido.');
    }

    let nombre = $('meta[property="og:title"]').attr('content') ||
                 $('title').first().text();

    if (!nombre) {
      throw new Error('No se pudo extraer el nombre del producto');
    }

    // Quitar sufijo "by メルカリ" / "by Mercari" y separadores tipo " - メルカリ"
    nombre = nombre
      .replace(/\s*by\s*(?:Mercari|メルカリ)\s*$/i, '')
      .split(' - メルカリ')[0]
      .split('|')[0]
      .trim();

    let nombreTraducido = await traducirAlEspanol(nombre);
    nombreTraducido = nombreTraducido.replace(/\s+/g, ' ').trim();

    const foto = $('meta[property="og:image"]').attr('content') ||
                 $('meta[name="twitter:image"]').attr('content');

    return {
      precio_jpy: precioJpy,
      tipo_producto: 'item',
      nombre_producto: nombreTraducido,
      foto: foto
    };
  } catch (error) {
    throw new Error(`Error al obtener precio: ${error.message}`);
  }
}

async function calcularPrecioFinal(precioJpy) {
  const tipoCambio = await obtenerTasaCambio();
  const precioMxn = precioJpy * tipoCambio;
  const precioFinal = Math.ceil(precioMxn + MARGEN_FIJO);
  return {
    precio_mxn: precioMxn.toFixed(2),
    precio_final: `$${precioFinal} MXN + EMS`,
    precio_jpy: precioJpy,
    tipo_cambio: tipoCambio
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL es requerida' });
    }

    if (!url.includes('jp.mercari.com')) {
      return res.status(400).json({
        error: 'Lo siento, solo cotizo Mercari Japón. Usa enlaces de https://jp.mercari.com/item/m...'
      });
    }

    if (!url.includes('/item/')) {
      return res.status(400).json({
        error: 'Este enlace no es compatible. Solo funciona con https://jp.mercari.com/item/m...'
      });
    }

    const info = await obtenerPrecioProducto(url);
    const precioInfo = await calcularPrecioFinal(info.precio_jpy);

    return res.status(200).json({
      nombre_producto: info.nombre_producto,
      foto: info.foto,
      precio_final: precioInfo.precio_final,
      precio_jpy: precioInfo.precio_jpy,
      precio_mxn: precioInfo.precio_mxn
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
