import express from "express";
import multer from "multer";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";

const app = express();
const upload = multer({ dest: "src/uploads/" });

// Configuração do Swagger
const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: "API TEST",
      version: "1.0.0",
      description: "Description of your API",
    },
  },
  apis: ["./src/routes/*.js"], // Ajuste o caminho para as rotas dentro da pasta 'src'
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Defina as rotas aqui
import exampleRoute from "./src/routes/example.js"; // Note o .js no final
app.use("/example", exampleRoute);

// Rota para o upload do arquivo ZIP
app.post("/upload", upload.single("zipFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Nenhum arquivo enviado." });
  }

  // Aqui você pode tratar o arquivo ZIP recebido, por exemplo, salvar no sistema de arquivos, descompactar, etc.

  return res.json({ message: "Arquivo ZIP recebido com sucesso!" });
});

export default app;
