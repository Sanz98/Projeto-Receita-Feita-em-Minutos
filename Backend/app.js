const express = require("express");
const cors = require("cors");
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const caminhoUsuarios = path.join(__dirname, "./Data/users.json");

// Importar as rotas de receitas
const rotasReceitas = require('./src/routes/receitas');
app.use('/receitas', rotasReceitas);

// ==========================================
// ROTAS DE USUÁRIOS
// ==========================================

app.get("/users", (req, res) => {
  try {
    const data = fs.readFileSync(caminhoUsuarios, "utf-8");
    const usuarios = JSON.parse(data);
    const usuariosSemSenha = usuarios.map(u => ({ id: u.id, username: u.username }));
    res.status(200).json(usuariosSemSenha);
  } catch (error) { res.status(500).json({ mensagem: "Erro ao buscar usuários" }); }
});

app.post('/users/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = JSON.parse(fs.readFileSync(caminhoUsuarios, 'utf8'));
    if (users.find(u => u.username === username)) return res.status(400).json({ mensagem: "Usuário existe!" });

    const senhaCriptografada = await bcrypt.hash(password, 10);
    const novoUsuario = { id: Date.now(), username, password: senhaCriptografada };
    users.push(novoUsuario);
    fs.writeFileSync(caminhoUsuarios, JSON.stringify(users, null, 2));
    res.status(201).json({ mensagem: "Criado!" });
  } catch (error) { res.status(500).json({ mensagem: "Erro ao cadastrar." }); }
});

app.post('/users/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = JSON.parse(fs.readFileSync(caminhoUsuarios, 'utf8'));
    const user = users.find(u => u.username === username);
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(400).json({ mensagem: "Credenciais inválidas" });
    res.status(200).json({ token: "jwt-fake", mensagem: "Login OK" });
  } catch (error) { res.status(500).json({ mensagem: "Erro no login." }); }
});

app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));