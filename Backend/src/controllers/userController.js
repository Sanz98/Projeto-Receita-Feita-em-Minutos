const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require('crypto');
const path = require('path');

const caminho = path.join(__dirname, '../../Data/users.json');
const SECRET = process.env.JWT_SECRET || "minha_chave_secreta_para_gerar_tokens_12345";

// Função para ler a base de dados em segurança
const lerUsuarios = () => {
    if (!fs.existsSync(caminho)) return [];
    const data = fs.readFileSync(caminho, 'utf8');
    return data ? JSON.parse(data) : [];
};

// Função para guardar na base de dados
const salvarUsuarios = (dados) => fs.writeFileSync(caminho, JSON.stringify(dados, null, 2));

// 🔹 LER USUÁRIOS (GET)
function listar(req, res) {
    try {
        const usuarios = lerUsuarios();
        // Não envia a password para o Front-End por segurança
        const listaSegura = usuarios.map(u => ({ id: u.id, username: u.username }));
        res.status(200).json(listaSegura);
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao listar usuários" });
    }
}

// 🔹 REGISTRO (POST)
async function register(req, res) {
    try {
        const { username, password } = req.body;
        const usuarios = lerUsuarios();

        if (usuarios.find(u => u.username === username)) {
            return res.status(400).send("Este usuário já existe.");
        }

        // Lógica de ID Sequencial
        let novoId = 1;
        if (usuarios.length > 0) {
            const maiorId = Math.max(...usuarios.map(u => Number(u.id) || 0));
            novoId = maiorId + 1;
        }

        // Encriptar a password
        const senhaHash = await bcrypt.hash(password, 10);
        usuarios.push({ id: novoId.toString(), username, password: senhaHash });
        salvarUsuarios(usuarios);

        res.status(201).json({ mensagem: "Usuário criado com sucesso", id: novoId });
    } catch (error) {
        res.status(500).send("Erro ao registrar usuário");
    }
}

// 🔹 LOGIN (POST)
async function login(req, res) {
    try {
        const { username, password } = req.body;
        const usuarios = lerUsuarios();

        const user = usuarios.find(u => u.username === username);
        if (!user) return res.status(401).send("Usuário não encontrado");

        const senhaValida = await bcrypt.compare(password, user.password);
        if (!senhaValida) return res.status(401).send("Senha inválida");

        const token = jwt.sign({ username: user.username, id: user.id }, SECRET, { expiresIn: "1h" });
        res.json({ token, id: user.id, username: user.username });
    } catch (error) {
        res.status(500).send("Erro interno ao fazer login");
    }
}

// 🔹 ATUALIZAR USUÁRIO (PUT)
async function atualizar(req, res) {
    try {
        const { id } = req.params;
        const { username, password } = req.body;
        let usuarios = lerUsuarios();

        let index = usuarios.findIndex(u => String(u.id) === String(id));
        if (index === -1) return res.status(404).json({ mensagem: "Usuário não encontrado" });

        // Se enviar username, atualiza. Se enviar password, encripta a nova e atualiza.
        if (username) usuarios[index].username = username;
        if (password) usuarios[index].password = await bcrypt.hash(password, 10);

        salvarUsuarios(usuarios);
        res.status(200).json({ mensagem: "Usuário atualizado com sucesso!" });
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao atualizar usuário" });
    }
}

// 🔹 DELETAR USUÁRIO (DELETE)
function deletar(req, res) {
    try {
        const { id } = req.params;
        let usuarios = lerUsuarios();
        
        const usuariosRestantes = usuarios.filter(u => String(u.id) !== String(id));

        if (usuarios.length === usuariosRestantes.length) {
            return res.status(404).json({ mensagem: "Usuário não encontrado" });
        }

        salvarUsuarios(usuariosRestantes);
        res.status(200).json({ mensagem: "Usuário deletado com sucesso!" });
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao deletar usuário" });
    }
}

module.exports = { listar, register, login, atualizar, deletar };