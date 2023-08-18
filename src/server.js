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
  apis: ["./src/routes/*.js"], // Ajuste o caminho para as rotas dentro da pasta 'src'
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
      const zip = new AdmZip();
      zip.addFile("file.zip", chunk);
      const zipStream = new Readable({
        read() {
          this.push(zip.toBuffer());
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

  // Transformar o stream do ZIP
  const transformedZipStream = zipStream.pipe(transformZipStream(zipFilePath));

  // Adicionar a pasta zipada à fila no Redis usando Bull
  const zipBuffer = await streamToBuffer(transformedZipStream);
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
  return Buffer.concat(chunks);
}

// Processar a fila usando Bull
zipQueue.process(async (job) => {
  const { zipBuffer } = job.data;

  // Connect to Redis and perform your processing logic here
  // For example, update the buffer with actual processing logic

  console.log("Processing ZIP file...");

  // Simulating a connection to Redis and updating the buffer (replace with your logic)
  await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate processing time

  console.log("ZIP file processed successfully");

  return { result: "Processed successfully" };
});

export default app;
