import axios from 'axios';
import * as cheerio from 'cheerio';
import translate from 'google-translate-api-x';

const TIPO_CAMBIO_MERCARI = 0.113;
const MARGEN_FIJO = 55;

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

    if (url.includes('/item/')) {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9',
          'Referer': 'https://jp.mercari.com/',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 10000
      });

      const htmlContent = response.data;
      const $ = cheerio.load(htmlContent);

      let precioJpy = null;
      const metaPriceTag = $('meta[property="product:price:amount"]').attr('content');

      if (metaPriceTag) {
        precioJpy = parseInt(metaPriceTag, 10);
      } else {
        const priceMatch = htmlContent.match(/"price"\s*:\s*"?(\d+)"?/);
        if (priceMatch) {
          precioJpy = parseInt(priceMatch[1], 10);
        }
      }

      if (!precioJpy) {
        const dataMatch = htmlContent.match(/data-price="(\d+)"/);
        if (dataMatch) {
          precioJpy = parseInt(dataMatch[1], 10);
        }
      }

      if (!precioJpy) {
        const yenMatch = htmlContent.match(/([0-9]{3,5})\s*(?:円|¥)/);
        if (yenMatch) {
          precioJpy = parseInt(yenMatch[1], 10);
        }
      }

      if (!precioJpy || precioJpy < 100) {
        throw new Error('No se pudo extraer el precio del producto. Verifica que el enlace sea válido.');
      }

      let nombre = $('meta[property="og:title"]').attr('content') ||
                   $('meta[name="twitter:title"]').attr('content') ||
                   $('title').text();

      if (!nombre) {
        throw new Error('No se pudo extraer el nombre del producto');
      }

      nombre = nombre.split('|')[0].split('-')[0].trim();
      let nombreTraducido = await traducirAlEspanol(nombre);
      nombreTraducido = nombreTraducido.replace(/\s+/g, ' ').trim();

      let foto = $('meta[property="og:image"]').attr('content');

      return {
        precio_jpy: precioJpy,
        tipo_producto: 'item',
        nombre_producto: nombreTraducido,
        foto: foto
      };
    } else {
      throw new Error('URL de Mercari no válida. Use https://jp.mercari.com/item/[ID]');
    }
  } catch (error) {
    throw new Error(`Error al obtener precio: ${error.message}`);
  }
}

function calcularPrecioFinal(precioJpy) {
  const precioMxn = precioJpy * TIPO_CAMBIO_MERCARI;
  const precioFinal = Math.ceil(precioMxn + MARGEN_FIJO);
  return {
    precio_mxn: precioMxn.toFixed(2),
    precio_final: `$${precioFinal} MXN + EMS`,
    precio_jpy: precioJpy
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
    const precioInfo = calcularPrecioFinal(info.precio_jpy);

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
