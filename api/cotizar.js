import puppeteer from 'puppeteer';
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
  let browser = null;
  try {
    if (url.includes('/shops/product/') || url.includes('/shops/')) {
      throw new Error(
        'No es posible cotizar enlaces de Mercari Shops automáticamente. Por favor, manda el enlace al grupo de WhatsApp y te lo cotizamos manualmente.'
      );
    }

    if (!url.includes('/item/')) {
      throw new Error('URL de Mercari no válida. Use https://jp.mercari.com/item/[ID]');
    }

    // Usar Puppeteer para cargar JavaScript
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: 'new'
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

    // Extraer datos con JavaScript
    const data = await page.evaluate(() => {
      let precio = null;
      let nombre = null;
      let foto = null;

      // Buscar precio
      const priceElement = document.querySelector('[data-testid="price"]');
      if (priceElement) {
        const priceText = priceElement.textContent.replace(/[^\d]/g, '');
        precio = parseInt(priceText);
      }

      if (!precio) {
        const allText = document.body.innerText;
        const priceMatch = allText.match(/¥\s*([0-9,]+)/);
        if (priceMatch) {
          precio = parseInt(priceMatch[1].replace(/,/g, ''));
        }
      }

      // Buscar nombre
      const titleElement = document.querySelector('h1');
      if (titleElement) {
        nombre = titleElement.textContent.trim();
      }

      if (!nombre) {
        const metaTitle = document.querySelector('meta[property="og:title"]');
        if (metaTitle) {
          nombre = metaTitle.getAttribute('content');
        }
      }

      // Buscar imagen
      const imgElement = document.querySelector('img[alt*="商品"]') || document.querySelector('[data-testid="image"] img');
      if (imgElement) {
        foto = imgElement.src;
      }

      if (!foto) {
        const metaImage = document.querySelector('meta[property="og:image"]');
        if (metaImage) {
          foto = metaImage.getAttribute('content');
        }
      }

      return { precio, nombre, foto };
    });

    await browser.close();

    if (!data.precio || data.precio < 100) {
      throw new Error('No se pudo extraer el precio del producto. Verifica que el enlace sea válido.');
    }

    let nombreTraducido = data.nombre || 'Producto sin nombre';
    nombreTraducido = nombreTraducido.split('|')[0].split('-')[0].trim();
    nombreTraducido = await traducirAlEspanol(nombreTraducido);
    nombreTraducido = nombreTraducido.replace(/\s+/g, ' ').trim();

    return {
      precio_jpy: data.precio,
      tipo_producto: 'item',
      nombre_producto: nombreTraducido,
      foto: data.foto
    };
  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }
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
