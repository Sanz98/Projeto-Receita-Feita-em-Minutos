const fs = require("fs");

// Caminho corrigido com D maiúsculo
const caminho = "./Data/receitas.json";

// LER RECEITAS (GET)
function listar(req, res) {
  try {
    const data = fs.readFileSync(caminho, "utf-8");
    let receitas = JSON.parse(data);

    const { nome } = req.query;
    if (nome) {
      receitas = receitas.filter(r =>
        r.nome.toLowerCase().includes(nome.toLowerCase())
      );
    }
    res.status(200).json(receitas);
  } catch (error) {
    res.status(500).json({ mensagem: "Erro ao listar receitas" });
  }
}

// CRIAR RECEITA (POST)
function criar(req, res) {
  try {
    const { nome, ingredientes, link, imagem } = req.body;

    const data = fs.readFileSync(caminho, "utf-8");
    let receitas = JSON.parse(data);

    const novaReceita = {
      id: Date.now().toString(),
      nome: nome || "Nova Receita",
      ingredientes: ingredientes || "",
      link: link || "",
      imagem: imagem || ""
    };

    receitas.push(novaReceita);
    fs.writeFileSync(caminho, JSON.stringify(receitas, null, 2));

    res.status(201).json(novaReceita);
  } catch (error) {
    res.status(500).json({ mensagem: "Erro ao criar receita" });
  }
}

// ATUALIZAR (PUT)
function atualizar(req, res) {
  try {
    const { id } = req.params;
    const { nome, ingredientes, imagem } = req.body;

    const data = fs.readFileSync(caminho, "utf-8");
    let receitas = JSON.parse(data);

    receitas = receitas.map(r =>
      r.id == id ? { ...r, nome, ingredientes, imagem } : r
    );

    fs.writeFileSync(caminho, JSON.stringify(receitas, null, 2));
    res.status(200).json({ mensagem: "Atualizado!" });
  } catch (error) {
    res.status(500).json({ mensagem: "Erro ao atualizar receita" });
  }
}

// DELETAR (DELETE)
function deletar(req, res) {
  try {
    const { id } = req.params;

    const data = fs.readFileSync(caminho, "utf-8");
    let receitas = JSON.parse(data);

    receitas = receitas.filter(r => r.id != id);

    fs.writeFileSync(caminho, JSON.stringify(receitas, null, 2));
    res.status(200).json({ mensagem: "Deletado!" });
  } catch (error) {
    res.status(500).json({ mensagem: "Erro ao deletar receita" });
  }
}

// Exportar tudo corretamente!
module.exports = { listar, criar, atualizar, deletar };