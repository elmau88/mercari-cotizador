import axios from "axios";

const response = await axios.post("http://localhost:5000/api/cotizar", {
  url: "https://jp.mercari.com/item/m19184216739"
});

console.log("\n✅ COTIZACIÓN ENHYPEN CARD:\n");
console.log("═".repeat(50));
console.log("Nombre:     " + response.data.nombre_producto);
console.log("Precio JPY: ¥" + response.data.precio_jpy);
console.log("Precio MXN: $" + response.data.precio_mxn);
console.log("Margen:     +$" + response.data.ganancia);
console.log("Precio Final: $" + response.data.precio_final + " MXN");
console.log("═".repeat(50));
console.log("\nCondición:  " + response.data.condicion);
console.log("Categoría:  " + response.data.categoria);
console.log("Estado:     " + response.data.estado);
console.log("Foto:       " + (response.data.foto ? "✓" : "✗"));
console.log("\n📊 Datos completos:\n");
console.log(JSON.stringify(response.data, null, 2));
