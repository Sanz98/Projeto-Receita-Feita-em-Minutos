const Receita = require('../../models/Receita');
const jwt = require("jsonwebtoken");
require("dotenv").config();

const SECRET = process.env.JWT_SECRET || "minha_chave_secreta_para_gerar_tokens_12345";

// LER RECEITAS (GET)
async function listar(req, res) {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ mensagem: "Acesso negado. Token em falta." });
    
    const token = authHeader.split(" ")[1];
    const usuarioLogado = jwt.verify(token, SECRET);

    // O Mongoose filtra as receitas para mostrar apenas as do utilizador com sessão iniciada
    let filtro = { userId: usuarioLogado.id };

    const { nome } = req.query;
    if (nome) {
      filtro.nome = { $regex: nome, $options: 'i' }; 
    }

    const receitas = await Receita.find(filtro);
    res.status(200).json(receitas);
  } catch (error) {
    res.status(500).json({ mensagem: "Erro ao listar receitas na base de dados." });
  }
}

// CRIAR NOVA RECEITA (POST)
async function criar(req, res) {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ mensagem: "Acesso negado." });
    
    const token = authHeader.split(" ")[1];
    const usuarioLogado = jwt.verify(token, SECRET);

    const { nome, ingredientes, link, imagem } = req.body;

    const novaReceita = new Receita({
      userId: usuarioLogado.id,
      nome: nome || "Nova Receita",
      ingredientes: ingredientes || "Sem ingredientes listados",
      link: link || "",
      imagem: imagem || ""
    });

    await novaReceita.save();
    res.status(201).json({ mensagem: "Receita criada com sucesso!", receita: novaReceita });
  } catch (error) {
    res.status(500).json({ mensagem: "Erro ao gravar receita na base de dados." });
  }
}

// ATUALIZAR (PUT)
async function atualizar(req, res) {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ mensagem: "Acesso negado." });
    const token = authHeader.split(" ")[1];
    const usuarioLogado = jwt.verify(token, SECRET);

    const { id } = req.params;
    const { nome, ingredientes, link, imagem } = req.body;

    const receita = await Receita.findOne({ _id: id, userId: usuarioLogado.id });

    if (!receita) {
      return res.status(404).json({ mensagem: "Receita não encontrada ou sem permissão." });
    }

    receita.nome = nome || receita.nome;
    receita.ingredientes = ingredientes || receita.ingredientes;
    receita.link = link !== undefined ? link : receita.link;
    receita.imagem = imagem !== undefined ? imagem : receita.imagem;

    await receita.save();
    res.status(200).json({ mensagem: "Atualizado!" });
  } catch (error) {
    res.status(500).json({ mensagem: "Erro ao atualizar receita ou token inválido." });
  }
}

// ELIMINAR (DELETE)
async function deletar(req, res) {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ mensagem: "Acesso negado." });
    const token = authHeader.split(" ")[1];
    const usuarioLogado = jwt.verify(token, SECRET);

    const { id } = req.params;

    const resultado = await Receita.findOneAndDelete({ _id: id, userId: usuarioLogado.id });

    if (!resultado) {
      return res.status(404).json({ mensagem: "Receita não encontrada ou sem permissão para apagar." });
    }

    res.status(200).json({ mensagem: "Apagado!" });
  } catch (error) {
    res.status(500).json({ mensagem: "Erro ao apagar receita." });
  }
}

module.exports = { listar, criar, atualizar, deletar };