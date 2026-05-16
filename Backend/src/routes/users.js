const express = require("express");
const router = express.Router();
const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");
const bcrypt = require('bcrypt');

const SECRET = process.env.JWT_SECRET || "sua_chave_secreta";
const caminho = path.join(__dirname, "../../Data/users.json");

// LISTAGEM DE USUÁRIOS
router.get("/", (req, res) => {
  try {
    const data = fs.readFileSync(caminho, "utf-8");
    const usuarios = JSON.parse(data);
    const usuariosSemSenha = usuarios.map(u => ({ id: u.id, username: u.username }));
    res.status(200).json(usuariosSemSenha);
  } catch (error) { 
    res.status(500).json({ mensagem: "Erro ao buscar usuários" }); 
  }
});

// REGISTRO DE USUÁRIO
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const data = fs.readFileSync(caminho, 'utf8');
    const users = JSON.parse(data);
    
    if (users.find(u => u.username === username)) {
      return res.status(400).json({ mensagem: "Usuário já existe!" });
    }

    const senhaCriptografada = await bcrypt.hash(password, 10);
    const novoUsuario = { id: Date.now(), username, password: senhaCriptografada };
    
    users.push(novoUsuario);
    fs.writeFileSync(caminho, JSON.stringify(users, null, 2));
    res.status(201).json({ mensagem: "Usuário criado com sucesso!" });
  } catch (error) {
    res.status(500).json({ mensagem: "Erro ao cadastrar usuário." });
  }
});

// LOGIN DE USUÁRIO
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const data = fs.readFileSync(caminho, "utf-8");
    const usuarios = JSON.parse(data);
    const user = usuarios.find(u => u.username === username);

    if (!user) return res.status(401).json({ mensagem: "Credenciais inválidas" });

    const senhaValida = await bcrypt.compare(password, user.password);
    if (!senhaValida) return res.status(401).json({ mensagem: "Credenciais inválidas" });

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: "1h" });
    res.json({ token, mensagem: "Login realizado com sucesso!" });
  } catch (error) {
    res.status(500).json({ mensagem: "Erro interno no servidor" });
  }
});

// DELETAR USUÁRIO
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = fs.readFileSync(caminho, "utf-8");
    let usuarios = JSON.parse(data);

    const usuariosRestantes = usuarios.filter(u => String(u.id) !== String(id));

    if (usuarios.length === usuariosRestantes.length) {
      return res.status(404).json({ mensagem: "Usuário não encontrado" });
    }

    fs.writeFileSync(caminho, JSON.stringify(usuariosRestantes, null, 2));
    res.status(200).json({ mensagem: "Usuário deletado com sucesso!" });
  } catch (error) {
    res.status(500).json({ mensagem: "Erro ao deletar usuário" });
  }
});

module.exports = router;