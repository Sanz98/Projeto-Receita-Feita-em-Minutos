const express = require("express");
const cors = require("cors");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const caminhoReceitas = path.join(__dirname, "./Data/receitas.json");
const caminhoUsuarios = path.join(__dirname, "./Data/users.json");

// GET (listar receitas)
app.get("/receitas", (req, res) => {
  try {
    const data = fs.readFileSync(caminhoReceitas, "utf-8");
    const receitas = JSON.parse(data);
    res.status(200).json(receitas);
  } catch (error) {
    res.status(500).send("Erro ao buscar receitas");
  } // FECHAMENTO ADICIONADO AQUI
}); // FECHAMENTO ADICIONADO AQUI

// POST (criar receita)
app.post("/receitas", (req, res) => {
  try {
    const { nome, ingredientes } = req.body;
    const data = fs.readFileSync(caminhoReceitas, "utf-8");
    const receitas = JSON.parse(data);
         
    const nova = {
      id: receitas.length + 1,
      nome,
      ingredientes,
    };
         
    receitas.push(nova);
    fs.writeFileSync(caminhoReceitas, JSON.stringify(receitas, null, 2));
    res.status(201).json(nova);
  } catch (error) {
    res.status(500).send("Erro ao salvar");
  } // FECHAMENTO ADICIONADO AQUI
}); // FECHAMENTO ADICIONADO AQUI

// PUT (editar)
app.put("/receitas/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { nome, ingredientes } = req.body;
    const data = fs.readFileSync(caminhoReceitas, "utf-8");
    let receitas = JSON.parse(data);
         
    receitas = receitas.map(r =>
      r.id == id ? { ...r, nome, ingredientes } : r
    );
         
    fs.writeFileSync(caminhoReceitas, JSON.stringify(receitas, null, 2));
    res.send("Atualizado!");
  } catch (error) {
    res.status(500).send("Erro ao atualizar");
  } // FECHAMENTO ADICIONADO AQUI
}); // FECHAMENTO ADICIONADO AQUI

// DELETE
app.delete("/receitas/:id", (req, res) => {
  try {
    const { id } = req.params;
    const data = fs.readFileSync(caminhoReceitas, "utf-8");
    let receitas = JSON.parse(data);
         
    receitas = receitas.filter(r => r.id != id);
         
    fs.writeFileSync(caminhoReceitas, JSON.stringify(receitas, null, 2));
    res.send("Deletado!");
  } catch (error) {
    res.status(500).send("Erro ao deletar");
  } // FECHAMENTO ADICIONADO AQUI
}); // FECHAMENTO ADICIONADO AQUI

// ROTA DE LOGIN
app.post("/login", (req, res) => {
  try {
    const { usuario, senha } = req.body;
         
    // É preciso ler o arquivo de dados primeiro
    const data = fs.readFileSync(caminhoUsuarios, "utf-8");
    const usuarios = JSON.parse(data);
         
    const user = usuarios.find(
      u => u.usuario === usuario && u.senha === senha
    );
         
    if (user) {
      res.status(200).json({ mensagem: "Login OK" });
    } else {
      res.status(401).send("Erro login");
    }
  } catch (error) {
    res.status(500).send("Erro ao processar login");
  } // FECHAMENTO ADICIONADO AQUI
}); // FECHAMENTO ADICIONADO AQUI

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});