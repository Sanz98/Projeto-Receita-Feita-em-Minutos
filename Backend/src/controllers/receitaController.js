const fs = require("fs");

const caminho = "./data/receitas.json";

// GET
function listar(req, res) {
  const data = fs.readFileSync(caminho, "utf-8");
  let receitas = JSON.parse(data);

  const { nome } = req.query;

  if (nome) {
    receitas = receitas.filter(r =>
      r.nome.toLowerCase().includes(nome.toLowerCase())
    );
  }

  res.json(receitas);
}

// POST
function criar(req, res) {
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
}

// PUT
function atualizar(req, res) {
  const { id } = req.params;
  const { nome, ingredientes, imagem } = req.body;

  const data = fs.readFileSync(caminho, "utf-8");
  let receitas = JSON.parse(data);

  receitas = receitas.map(r =>
    r.id == id ? { ...r, nome, ingredientes, imagem } : r
  );

  fs.writeFileSync(caminho, JSON.stringify(receitas, null, 2));

  res.send("Atualizado!");
}

// DELETE
function deletar(req, res) {
  const { id } = req.params;

  const data = fs.readFileSync(caminho, "utf-8");
  let receitas = JSON.parse(data);

  receitas = receitas.filter(r => r.id != id);

  fs.writeFileSync(caminho, JSON.stringify(receitas, null, 2));

  res.send("Deletado!");
}

module.exports = { listar, criar, atualizar, deletar };