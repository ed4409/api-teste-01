export function hello(req, res) {
  return res.json({ message: "Hello World!" });
}

export function square(req, res) {
  const { number } = req.body;
  if (typeof number !== "number") {
    return res
      .status(400)
      .json({ error: 'O parâmetro "number" deve ser um número.' });
  }
  const square = number * number;
  return res.json({ result: square });
}

export function upload(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: "Nenhum arquivo enviado." });
  }

  return res.json({ message: "Arquivo ZIP recebido com sucesso!" });
}
