import express from "express";
import multer from "multer";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import AdmZip from "adm-zip";
import redis from "redis";
import fs from "fs";
import { Transform } from "stream";
import { Readable } from "stream"; // Import Readable stream
import Queue from "bull";
import cors from "cors";

import yauzl from "yauzl";
import JSONStream from "JSONStream";
import path from "path"; // Import path library

const app = express();
app.use(cors());
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
  apis: ["./src/routes/example.js"], // Ajuste o caminho para as rotas dentro da pasta 'src'
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
//app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, null, null, null, null, `/`)
);

// Conexão com o Redis
const redisConfig = {
  host: "127.0.0.1", // Endereço IP ou nome do host onde o Redis está rodando
  port: 6379, // Porta padrão do Redis
};
const redisClient = redis.createClient(redisConfig);

redisClient.on("connect", () => {
  console.log("Conectado ao Redis");
});

redisClient.on("error", (err) => {
  console.error("Erro na conexão com o Redis:", err);
});

// Criação da fila usando a biblioteca Bull
const zipQueue = new Queue("zipQueue", {
  redis: {
    host: redisConfig.host,
    port: redisConfig.port,
  },
});

// Função para transformar o arquivo ZIP em um stream
function transformZipStream(zipFilePath) {
  return new Transform({
    objectMode: true,
    async transform(chunk, encoding, callback) {
      const zip = new AdmZip(chunk);
      const zipBuffer = zip.toBuffer();

      const zipStream = new Readable({
        read() {
          this.push(zipBuffer);
          this.push(null);
        },
      });

      callback(null, zipStream);
    },
  });
}

// Rota para o upload do arquivo ZIP
app.post("/upload", upload.single("zipFile"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Nenhum arquivo enviado." });
  }

  // Salvar a pasta zipada
  const zipFilePath = req.file.path;

  // Transformar o arquivo ZIP em stream
  const zipStream = fs.createReadStream(zipFilePath);

  // Adicionar a pasta zipada à fila no Redis usando Bull
  const zipBuffer = await streamToBuffer(zipStream);
  await zipQueue.add({ zipBuffer });

  return res.json({
    message: "Pasta ZIP recebida, salva e adicionada à fila com sucesso!",
  });
});

// Função para converter um stream para buffer
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  return buffer;
}

// Processar a fila usando Bull
zipQueue.process(async (job) => {
  const { zipBuffer } = job.data;

  console.log("Processing ZIP file...");

  // Usando yauzl para ler o arquivo ZIP
  yauzl.fromBuffer(zipBuffer, { lazyEntries: true }, (err, zipfile) => {
    if (err) {
      console.error("Error opening ZIP file:", err);
      return;
    }

    zipfile.readEntry();
    zipfile.on("entry", (entry) => {
      if (path.extname(entry.fileName) === ".json") {
        const jsonStream = JSONStream.parse("*");
        zipfile.openReadStream(entry, (err, readStream) => {
          if (err) {
            console.error("Error opening entry stream:", err);
            return;
          }

          readStream.pipe(jsonStream);
          jsonStream.on("data", (obj) => {
            console.log("Objeto JSON:", obj);
          });

          jsonStream.on("end", () => {
            console.log("JSON stream ended.");
            zipfile.readEntry();
          });
        });
      } else {
        zipfile.readEntry();
      }
    });

    zipfile.on("end", () => {
      console.log("ZIP file processed successfully");
    });
  });

  return { result: "Processed successfully" };
});

export default app;
