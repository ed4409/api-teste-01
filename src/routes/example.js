import express from "express";
const router = express.Router();
import multer from "multer";
const upload = multer({ dest: "src/uploads/" });

/**
 * @swagger
 * /example/hello:
 *   get:
 *     summary: Exemplo de rota "Hello World"
 *     description: Retorna uma mensagem de saudação.
 *     responses:
 *       200:
 *         description: Sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get("/hello", (req, res) => {
  return res.json({ message: "Hello World!" });
});

/**
 * @swagger
 * /example/square:
 *   post:
 *     summary: Exemplo de rota para cálculo do quadrado de um número
 *     description: Recebe um número e retorna o seu quadrado.
 *     parameters:
 *       - in: body
 *         name: number
 *         description: Número para o cálculo do quadrado
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             number:
 *               type: number
 *     responses:
 *       200:
 *         description: Sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: number
 */
router.post("/square", (req, res) => {
  const { number } = req.body;
  if (typeof number !== "number") {
    return res
      .status(400)
      .json({ error: 'O parâmetro "number" deve ser um número.' });
  }
  const square = number * number;
  return res.json({ result: square });
});

/**
 * @swagger
 * /example/upload:
 *   post:
 *     summary: Upload de arquivo ZIP
 *     description: Faz o upload de um arquivo ZIP.
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: zipFile
 *         required: true
 *         type: file
 *     responses:
 *       200:
 *         description: Sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Requisição inválida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post("/upload", upload.single("zipFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Nenhum arquivo enviado." });
  }

  return res.json({ message: "Arquivo ZIP recebido com sucesso!" });
});

export default router;
