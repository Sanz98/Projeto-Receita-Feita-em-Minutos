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
// Exemplo de como a sua função deve ficar no receitaController.js
exports.criarReceita = (req, res) => {
    // 1. Receba a imagem e o link do FrontEnd
    const { nome, ingredientes, link, imagem } = req.body; 
    
    let receitas = lerReceitas(); // Sua função que lê o JSON

    const novaReceita = {
        id: Date.now().toString(), // Ou a forma como você gera o ID
        nome: nome,
        ingredientes: ingredientes,
        link: link || "",
        imagem: imagem || "" // 2. SALVE A IMAGEM AQUI!
    };

    receitas.push(novaReceita);
    salvarReceitas(receitas); // Sua função que salva no JSON

    res.status(201).json(novaReceita);
};

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