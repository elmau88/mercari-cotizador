import axios from "axios";

console.log("\n📊 PRUEBAS DE COTIZACIÓN MEJORADA\n");
console.log("═".repeat(70));

// Test 1: PeaceMinusONE
try {
  const res1 = await axios.post("http://localhost:5000/api/cotizar", {
    url: "https://jp.mercari.com/item/m46973798721"
  });
  
  console.log("\n1️⃣  PeaceMinusONE Shoes");
  console.log("   Condición: " + res1.data.condicion);
  console.log("   Categoría: " + res1.data.categoria);
  console.log("   Precio:    $" + res1.data.precio_final + " MXN");
} catch (err) {
  console.error("   ❌ Error:", err.message);
}

// Test 2: ENHYPEN Card
try {
  const res2 = await axios.post("http://localhost:5000/api/cotizar", {
    url: "https://jp.mercari.com/item/m19184216739"
  });
  
  console.log("\n2️⃣  ENHYPEN Card (K-POP)");
  console.log("   Condición: " + res2.data.condicion);
  console.log("   Categoría: " + res2.data.categoria);
  console.log("   Precio:    $" + res2.data.precio_final + " MXN");
} catch (err) {
  console.error("   ❌ Error:", err.message);
}

console.log("\n" + "═".repeat(70));
