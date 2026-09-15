import axios from "axios";

const response = await axios.post("http://localhost:5000/api/cotizar", {
  url: "https://jp.mercari.com/item/m46973798721"
});

console.log("\n✅ Resultado:\n");
console.log(JSON.stringify(response.data, null, 2));
