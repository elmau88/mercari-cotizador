import axios from "axios";

const url = "https://jp.mercari.com/item/m46973798721";
const headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" };

const response = await axios.get(url, { headers, timeout: 10000 });
const content = response.data;

console.log("🔍 Buscando valores reales de condición y categoría...\n");

// Patrón 1: condition_id o conditionId
const condIdMatch = content.match(/"(?:condition_id|conditionId|itemConditionId)"\s*:\s*(\d+)/);
if (condIdMatch) console.log("✓ Condition ID:", condIdMatch[1]);

// Patrón 2: category_id o categoryId
const catIdMatch = content.match(/"(?:category_id|categoryId|itemCategoryId)"\s*:\s*(\d+)/);
if (catIdMatch) console.log("✓ Category ID:", catIdMatch[1]);

// Patrón 3: nombres de condición
const condNameMatch = content.match(/"condition"\s*:\s*"([^"]+)"/);
if (condNameMatch) console.log("✓ Condition name:", condNameMatch[1]);

// Patrón 4: nombres de categoría
const catNameMatch = content.match(/"category"\s*:\s*"([^"]+)"/);
if (catNameMatch) console.log("✓ Category name:", catNameMatch[1]);

// Patrón 5: Buscar 新品 (nuevo) o usado en Japonés
if (content.includes("新品")) console.log("✓ Encontrado: 新品 (Nuevo)");
if (content.includes("未使用")) console.log("✓ Encontrado: 未使用 (Sin usar)");
if (content.includes("目立つ傷や汚れなし")) console.log("✓ Encontrado: 目立つ傷や汚れなし");

// Patrón 6: Buscar categorías comunes en japonés
if (content.includes("ファッション")) console.log("✓ Encontrado: ファッション (Moda)");
if (content.includes("靴")) console.log("✓ Encontrado: 靴 (Zapatos)");
if (content.includes("メンズ")) console.log("✓ Encontrado: メンズ (Hombre)");

// Patrón 7: Variables de estado de React
const dataMatch = content.match(/"item"\s*:\s*{[^}]{0,3000}/);
if (dataMatch) {
  console.log("\n✓ Encontrado JSON de item en React state");
  console.log(dataMatch[0].substring(0, 300));
}
