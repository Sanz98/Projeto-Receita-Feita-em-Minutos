const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");

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

// CRIAR RECEITA (POST) - Versão Protegida
async function criar(req, res) {
  try {
    let { nome, ingredientes, link, imagem } = req.body;

    // Se temos um link, vamos tentar extrair
    if (link && ingredientes === "Extraindo ingredientes do vídeo...") {
      
      // Garante que o link tem http:// ou https://
      if (!link.startsWith('http')) {
        link = 'https://' + link;
      }

      try {
        if (link.includes('youtube.com') || link.includes('youtu.be')) {
          nome = "Receita do YouTube";
          ingredientes = "Assista ao vídeo para ver as medidas exatas.";
        } else {
          // Tenta ler o site
          const resposta = await axios.get(link);
          const $ = cheerio.load(resposta.data);

          const title = $('title').text().trim();
          if (title) nome = title.replace(/ Receita | TudoGostoso/g, '');

          let extracao = [];
          $('li, .ingredient, p').each((i, el) => {
            const texto = $(el).text().trim();
            if (texto.length > 3 && texto.length < 80 && (texto.includes('g') || texto.includes('xícara') || texto.includes('colher') || texto.match(/\d/))) {
              extracao.push(texto);
            }
          });

          if (extracao.length > 0) {
            ingredientes = [...new Set(extracao)].join(', ');
          } else {
            ingredientes = "Site lido, mas ingredientes não encontrados.";
          }
        }
      } catch (err) {
        console.error("Aviso: O link falhou ou bloqueou a leitura:", err.message);
        ingredientes = "Não foi possível ler este site automaticamente.";
      }
    }

    // Guardar no Ficheiro JSON
    const data = fs.readFileSync(caminho, "utf-8");
    let receitas = JSON.parse(data);

    const novaReceita = {
      id: Date.now().toString(),
      nome: nome || "Nova Receita",
      ingredientes: ingredientes || "Sem ingredientes listados",
      link: link || "",
      imagem: imagem || ""
    };

    receitas.push(novaReceita);
    fs.writeFileSync(caminho, JSON.stringify(receitas, null, 2));

    res.status(201).json(novaReceita);
  } catch (error) {
    console.error("ERRO CRÍTICO NO BACKEND:", error);
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