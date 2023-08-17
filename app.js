import dotenv from "dotenv";
import app from "./server.js";

dotenv.config();
const PORT = process.env.PORT || 3000;

app.listen(process.env.PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
