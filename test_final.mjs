import axios from "axios";

const response = await axios.post("http://localhost:5000/api/cotizar", {
  url: "https://jp.mercari.com/item/m46973798721"
});

console.log("\n✅ RESULTADO MEJORADO:\n");
console.log("Condición:", response.data.condicion);
console.log("Categoría:", response.data.categoria);
console.log("\nDatos completos:\n");
console.log(JSON.stringify(response.data, null, 2));
