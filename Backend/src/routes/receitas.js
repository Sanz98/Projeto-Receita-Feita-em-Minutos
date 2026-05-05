const express = require("express");
const router = express.Router();
const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");

// Puxa a chave do .env
const SECRET = process.env.JWT_SECRET;
// Caminho corrigido usando path.join para evitar erros de diretório
const caminho = path.join(__dirname, "../../Data/receitas.json");

// Middleware JWT
function verificarToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).send("Token não fornecido");
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(403).send("Token inválido");
    req.usuario = decoded;
    next();
  });
}

// GET (com filtro)
router.get("/", (req, res) => {
  try {
    const data = fs.readFileSync(caminho, "utf-8");
    let receitas = JSON.parse(data);
    const { nome } = req.query;
    if (nome) {
      receitas = receitas.filter(r =>
        r.nome.toLowerCase().includes(nome.toLowerCase())
      );
    }
    res.json(receitas);
  } catch {
    res.status(500).send("Erro ao buscar receitas");
  }
});

// POST
router.post("/", verificarToken, (req, res) => {
  const { nome, ingredientes, imagem } = req.body;
  const data = fs.readFileSync(caminho, "utf-8");
  const receitas = JSON.parse(data);
  const nova = {
    id: receitas.length + 1,
    nome,
    ingredientes,
    imagem
  };
  receitas.push(nova);
  fs.writeFileSync(caminho, JSON.stringify(receitas, null, 2));
  res.status(201).json(nova);
});

// PUT
router.put("/:id", verificarToken, (req, res) => {
  const { id } = req.params;
  const { nome, ingredientes, imagem } = req.body;
  const data = fs.readFileSync(caminho, "utf-8");
  let receitas = JSON.parse(data);
  receitas = receitas.map(r =>
    r.id == id ? { ...r, nome, ingredientes, imagem } : r
  );
  fs.writeFileSync(caminho, JSON.stringify(receitas, null, 2));
  res.send("Atualizado!");
});

// DELETE
router.delete("/:id", verificarToken, (req, res) => {
  const { id } = req.params;
  const data = fs.readFileSync(caminho, "utf-8");
  let receitas = JSON.parse(data);
  receitas = receitas.filter(r => r.id != id);
  fs.writeFileSync(caminho, JSON.stringify(receitas, null, 2));
  res.send("Deletado!");
});

module.exports = router;