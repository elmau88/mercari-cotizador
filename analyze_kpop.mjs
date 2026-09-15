import axios from "axios";

const url = "https://jp.mercari.com/item/m19184216739";
const headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" };

const response = await axios.get(url, { headers, timeout: 10000 });
const content = response.data;

console.log("🔍 Búsqueda de categorías en ENHYPEN card:\n");

// Buscar categorías
if (content.includes("K-POP")) console.log("✓ Encontrado: K-POP");
if (content.includes("K-pop")) console.log("✓ Encontrado: K-pop");
if (content.includes("ゲーム・おもちゃ・グッズ")) console.log("✓ Encontrado: ゲーム・おもちゃ・グッズ");
if (content.includes("トレーディングカード")) console.log("✓ Encontrado: トレーディングカード");
if (content.includes("タレントカード")) console.log("✓ Encontrado: タレントカード");

// Buscar condición
if (content.includes("未使用に近い")) console.log("✓ Encontrado: 未使用に近い (Casi nuevo)");

// Mostrar contexto de K-POP
const kpopIndex = content.toLowerCase().indexOf("k-pop");
if (kpopIndex !== -1) {
  console.log("\n📍 Contexto de K-POP:");
  console.log(content.substring(kpopIndex - 100, kpopIndex + 100));
}
