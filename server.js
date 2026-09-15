import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import translate from 'google-translate-api-x';

const app = express();
const PORT = process.env.PORT || 5000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Configuración
const TIPO_CAMBIO_MERCARI = 0.113;
const MARGEN_FIJO = 55;

// Función para traducir texto al español
async function traducirAlEspanol(texto) {
  try {
    // Si el texto contiene principalmente caracteres ASCII, no traducir
    if (!/[぀-ゟ゠-ヿ一-鿿]/.test(texto)) {
      return texto;
    }

    const result = await translate(texto, { to: 'es' });
    return result.text;
  } catch (error) {
    // Si hay error en la traducción, retornar el texto original
    return texto;
  }
}

// Función para obtener precio del producto
async function obtenerPrecioProducto(url) {
  try {
    // Rechazar Shops
    if (url.includes('/shops/product/') || url.includes('/shops/')) {
      throw new Error(
        'No es posible cotizar enlaces de Mercari Shops automáticamente. Por favor, manda el enlace al grupo de WhatsApp y te lo cotizamos manualmente.'
      );
    }

    if (url.includes('/item/')) {
      // Descargar HTML
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      };

      const response = await axios.get(url, {
        headers,
        timeout: 10000,
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);

      // Extraer precio del meta tag
      let precioJpy = null;

      // Intentar obtener el precio de varios meta tags
      precioJpy = $('meta[property="product:price:amount"]').attr('content');
      if (!precioJpy) {
        precioJpy = $('meta[name="product:price:amount"]').attr('content');
      }
      if (!precioJpy) {
        // Fallback: buscar en el contenido del script o atributos data
        const scriptContent = $('script').text();
        const priceMatch = scriptContent.match(/"price"\s*:\s*(\d+)/);
        if (priceMatch) {
          precioJpy = priceMatch[1];
        }
      }

      if (!precioJpy) {
        throw new Error('No se pudo extraer el precio del producto. Verifica que el URL sea válido.');
      }

      precioJpy = parseInt(precioJpy, 10);

      // Extraer información básica del HTML
      let nombre = $('meta[property="og:title"]').attr('content') ||
                   $('meta[name="twitter:title"]').attr('content') ||
                   $('title').text() ||
                   'N/A';

      nombre = nombre.split('|')[0].split('-')[0].trim();

      // Remover " by Mercari" en todas sus formas (solo si está al final)
      nombre = nombre.replace(/\s*by\s*(?:Mercari|メルカリ|mercari)\s*$/i, '').trim();

      // Extraer foto (imagen principal)
      let foto = $('meta[property="og:image"]').attr('content') || null;

      // Valores predeterminados
      let condicion = 'N/A';
      let categoria = 'N/A';
      let estado = 'on_sale';

      const htmlContent = response.data;

      // Buscar en scripts JSON-LD
      const jsonLdMatch = htmlContent.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
      if (jsonLdMatch) {
        try {
          const jsonLd = JSON.parse(jsonLdMatch[1]);
          if (jsonLd.name) nombre = jsonLd.name;
          if (jsonLd.image) foto = jsonLd.image;
        } catch (e) {
          // JSON inválido, continuar
        }
      }

      // Buscar condición (en japonés) - más específico primero
      // Usar regex para buscar en contexto más específico (evitar falsos positivos)
      let conditionMatch = htmlContent.match(/"itemCondition"\s*[:"]*([^"<]*(?:新品|未使用|傷|汚れ)[^"<]*)/);

      if (!conditionMatch) {
        // Búsquedas específicas (en orden de especificidad decreciente)
        if (htmlContent.match(/未使用に近い/)) {
          condicion = '未使用に近い (Casi nuevo)';
        } else if (htmlContent.match(/新品、未使用/)) {
          condicion = '新品、未使用 (Nuevo, sin usar)';
        } else if (htmlContent.match(/新品未使用/)) {
          condicion = '新品未使用 (Nuevo, sin usar)';
        } else if (htmlContent.match(/目立つ傷や汚れなし/)) {
          condicion = '目立つ傷や汚れなし (Sin daño visible)';
        } else if (htmlContent.match(/傷や汚れあり/)) {
          condicion = '傷や汚れあり (Con daño)';
        } else if (htmlContent.match(/New\/unused|Never used/)) {
          condicion = 'New/Unused';
        } else if (htmlContent.match(/新品/)) {
          condicion = '新品 (Nuevo)';
        } else if (htmlContent.match(/未使用/)) {
          condicion = '未使用 (Sin usar)';
        }
      } else {
        condicion = conditionMatch[1].trim();
      }

      // Buscar estado (en_venta/vendido)
      if (htmlContent.includes('En venta') || htmlContent.includes('on_sale')) {
        estado = 'on_sale';
      } else if (htmlContent.includes('Vendido') || htmlContent.includes('sold_out')) {
        estado = 'sold_out';
      }

      // Buscar categoría - orden por especificidad (K-POP y Idols primero)
      if (htmlContent.includes('K-POP') || htmlContent.includes('K-pop')) {
        categoria = 'K-POP';
      } else if (htmlContent.includes('トレーディングカード')) {
        categoria = 'トレーディングカード (Trading Cards)';
      } else if (htmlContent.includes('タレントカード')) {
        categoria = 'タレントカード (Talent Cards)';
      } else if (htmlContent.includes('ポケモン')) {
        categoria = 'ポケモン (Pokémon)';
      } else if (htmlContent.includes('Vtuber') || htmlContent.includes('VTuber') || htmlContent.includes('Vtubers')) {
        categoria = 'Vtuber';
      } else if (htmlContent.includes('缶バッジ') || htmlContent.includes('Can badge') || htmlContent.includes('Button Badge')) {
        categoria = '缶バッジ (Can Badge)';
      } else if (htmlContent.includes('Celebrity Merchandise')) {
        categoria = 'Celebrity Merchandise';
      } else if (htmlContent.includes('ニンテンドー') || htmlContent.includes('Nintendo')) {
        categoria = 'ニンテンドー (Nintendo)';
      } else if (htmlContent.includes('ゲーム・おもちゃ・グッズ')) {
        categoria = 'ゲーム・おもちゃ・グッズ (Games/Toys)';
      } else if (htmlContent.includes('ゲーム')) {
        categoria = 'ゲーム (Games)';
      } else if (htmlContent.includes('靴')) {
        categoria = '靴 (Zapatos)';
      } else if (htmlContent.includes('ファッション')) {
        categoria = 'ファッション (Moda)';
      } else if (htmlContent.includes('メンズ')) {
        categoria = 'メンズ (Hombre)';
      } else if (htmlContent.includes('レディース')) {
        categoria = 'レディース (Mujer)';
      } else if (htmlContent.includes('エレクトロニクス')) {
        categoria = 'エレクトロニクス (Electrónica)';
      } else if (htmlContent.includes('本')) {
        categoria = '本 (Libros)';
      } else if (htmlContent.includes('おもちゃ')) {
        categoria = 'おもちゃ (Juguetes)';
      } else if (htmlContent.includes('ホーム')) {
        categoria = 'ホーム (Hogar)';
      }

      // Búsqueda 2: Intentar extraer del JSON si existe
      if (categoria === 'N/A') {
        const categoriaMatch = htmlContent.match(/"category"\s*:\s*{\s*"name"\s*:\s*"([^"]+)"/);
        if (categoriaMatch) {
          categoria = categoriaMatch[1];
        }
      }

      // Traducir nombre al español si contiene japonés
      let nombreTraducido = await traducirAlEspanol(nombre);

      // Remover solo corchetes vacíos o con contenido repetido, mantener el nombre principal
      nombreTraducido = nombreTraducido.replace(/\s+/g, ' ').trim();

      return {
        precio_jpy: precioJpy,
        tipo_producto: 'item',
        nombre_producto: nombreTraducido,
        estado: estado,
        condicion: condicion,
        categoria: categoria,
        foto: foto
      };
    } else {
      throw new Error('URL de Mercari no válida. Use https://jp.mercari.com/item/[ID]');
    }

  } catch (error) {
    throw new Error(`Error al obtener precio: ${error.message}`);
  }
}

// Función para calcular precio final
function calcularPrecioFinal(precioJpy) {
  const precioMxn = precioJpy * TIPO_CAMBIO_MERCARI;
  const precioFinal = Math.ceil(precioMxn + MARGEN_FIJO);

  return {
    precio_jpy: precioJpy,
    precio_mxn: Number(precioMxn.toFixed(2)),
    margen: MARGEN_FIJO,
    precio_final: precioFinal
  };
}

// Endpoint: Cotizar
app.post('/api/cotizar', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL es requerida' });
    }

    if (!url.includes('mercari.com')) {
      return res.status(400).json({ error: 'URL debe ser de Mercari' });
    }

    // Obtener información del producto
    const info = await obtenerPrecioProducto(url);

    // Calcular precio final
    const calculo = calcularPrecioFinal(info.precio_jpy);

    // Respuesta simplificada - precio primero con EMS
    return res.json({
      precio_final: `$${calculo.precio_final} MXN + EMS`,
      nombre_producto: info.nombre_producto,
      foto: info.foto,
      precio_jpy: calculo.precio_jpy,
      precio_mxn: calculo.precio_mxn
    });

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// Endpoint: Health check
app.get('/health', (req, res) => {
  return res.json({ status: 'ok', version: '2.0-nodejs' });
});

// Endpoint: Raíz
app.get('/', (req, res) => {
  try {
    const html = fs.readFileSync(path.join(__dirname, 'mercari-cotizador.html'), 'utf-8');
    return res.send(html);
  } catch (error) {
    return res.json({
      nombre: 'Cotizador Mercari API v2.0',
      version: '2.0-nodejs',
      motor: 'Node.js + Express + mercapi',
      endpoints: {
        'POST /api/cotizar': 'Cotiza un producto de Mercari',
        'GET /health': 'Verifica que el servidor está activo',
        'GET /': 'Página principal HTML'
      },
      soporta: [
        'https://jp.mercari.com/item/[ID]'
      ]
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n✅ Servidor Mercari Cotizador v2.0 (Node.js)`);
  console.log(`📍 Ejecutando en http://localhost:${PORT}`);
  console.log(`\n💡 Abre http://localhost:${PORT} en tu navegador\n`);
});
