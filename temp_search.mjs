import axios from "axios";

const url = "https://jp.mercari.com/item/m46973798721";
const headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" };

const response = await axios.get(url, { headers, timeout: 10000 });
const content = response.data;

// Encontrar context de itemCondition
const condIndex = content.indexOf("itemCondition");
if (condIndex !== -1) {
  console.log("📍 itemCondition encontrado en posición:", condIndex);
  console.log("\n📄 Contexto (200 chars):\n");
  console.log(content.substring(condIndex - 50, condIndex + 200));
}

console.log("\n" + "=".repeat(60) + "\n");

// Encontrar context de itemCategory
const catIndex = content.indexOf("itemCategory");
if (catIndex !== -1) {
  console.log("📍 itemCategory encontrado en posición:", catIndex);
  console.log("\n📄 Contexto (200 chars):\n");
  console.log(content.substring(catIndex - 50, catIndex + 200));
}
