const User = require('../../models/User');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

const SECRET = process.env.JWT_SECRET || "minha_chave_secreta_para_gerar_tokens_12345";

// LER UTILIZADORES (GET)
async function listar(req, res) {
    try {
        const usuarios = await User.find({}, 'username'); 
        res.status(200).json(usuarios);
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao consultar a base de dados." });
    }
}

// CRIAR UTILIZADOR (POST)
async function register(req, res) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ mensagem: "Preencha todos os campos." });
        }

        const existe = await User.findOne({ username });
        if (existe) {
            return res.status(400).json({ mensagem: "O utilizador já existe." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const novoUsuario = new User({ username, password: hashedPassword });

        await novoUsuario.save();
        res.status(201).json({ mensagem: "Utilizador registado com sucesso!" });
    } catch (error) {
        res.status(500).json({ mensagem: "Erro interno ao registar utilizador." });
    }
}

// LOGIN DE UTILIZADOR (POST)
async function login(req, res) {
    try {
        const { username, password } = req.body;

        const usuario = await User.findOne({ username });
        if (!usuario) {
            return res.status(401).json({ mensagem: "Credenciais inválidas." });
        }

        const isValid = await bcrypt.compare(password, usuario.password);
        if (!isValid) {
            return res.status(401).json({ mensagem: "Credenciais inválidas." });
        }

        // Criamos o token passando o _id do MongoDB para a propriedade "id"
        const token = jwt.sign({ id: String(usuario._id), username: usuario.username }, SECRET, { expiresIn: '1h' });
        
        res.status(200).json({ mensagem: "Login bem-sucedido!", token, username: usuario.username });
    } catch (error) {
        res.status(500).json({ mensagem: "Erro interno durante o login." });
    }
}

// ATUALIZAR UTILIZADOR (PUT)
async function atualizar(req, res) {
    try {
        const { id } = req.params;
        const { username, password } = req.body;

        const usuario = await User.findById(id);
        if (!usuario) {
            return res.status(404).json({ mensagem: "Utilizador não encontrado." });
        }

        if (username) usuario.username = username;
        if (password) usuario.password = await bcrypt.hash(password, 10);

        await usuario.save();
        res.status(200).json({ mensagem: "Utilizador atualizado com sucesso!" });
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao atualizar utilizador." });
    }
}

// ELIMINAR UTILIZADOR (DELETE)
async function deletar(req, res) {
    try {
        const { id } = req.params;

        const resultado = await User.findByIdAndDelete(id);
        if (!resultado) {
            return res.status(404).json({ mensagem: "Utilizador não encontrado." });
        }

        res.status(200).json({ mensagem: "Utilizador eliminado com sucesso!" });
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao eliminar utilizador." });
    }
}

module.exports = { listar, register, login, atualizar, deletar };