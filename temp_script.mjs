import axios from "axios";

const url = "https://jp.mercari.com/item/m46973798721";
const headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" };

const response = await axios.get(url, { headers, timeout: 10000 });
const content = response.data;

console.log("\n🔎 Búsqueda en HTML:\n");
if (content.includes("itemCondition")) console.log("✓ Encontrado: itemCondition");
if (content.includes("itemCategory")) console.log("✓ Encontrado: itemCategory");
if (content.includes("__INITIAL_STATE__")) console.log("✓ Encontrado: __INITIAL_STATE__ (React state)");

// Buscar el patrón de React state
const stateMatch = content.match(/__INITIAL_STATE__[\s=]*(.{0,2000})/);
if (stateMatch) {
  console.log("\n✓ React state encontrado\n");
  console.log(stateMatch[1].substring(0, 500));
}

// Mostrar en qué línea aparecen ciertas palabras
const lines = content.split("\n");
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("condition") && i < 100) {
    console.log(`\nLínea ${i}: ${lines[i].substring(0, 100)}`);
  }
}
