const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");

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
async function criar(req, res) {
  try {
    let { nome, ingredientes, link, imagem } = req.body;

    // Aciona a extração se receber o texto exato do Front-End
    if (link && ingredientes === "Extraindo ingredientes do vídeo...") {
      
      if (!link.startsWith('http')) {
        link = 'https://' + link;
      }

      try {
        if (link.includes('youtube.com') || link.includes('youtu.be')) {
          nome = "Receita do YouTube";
          ingredientes = "Assista ao vídeo para ver as medidas exatas.";
        } else {
          // O User-Agent ajuda a evitar que sites bloqueiem a nossa extração
          const resposta = await axios.get(link, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
          });
          const $ = cheerio.load(resposta.data);

          const title = $('title').text().trim();
          if (title) nome = title.replace(/ Receita | TudoGostoso/g, '');

          // ==========================================
          // NOVO: EXTRAÇÃO DA IMAGEM PELO CHEERIO
          // ==========================================
          const imgExtraida = $('meta[property="og:image"]').attr('content') || 
                              $('meta[name="twitter:image"]').attr('content') || 
                              $('img').first().attr('src');
          
          if (imgExtraida) {
             // Garante que o link da imagem é válido
             imagem = imgExtraida.startsWith('http') ? imgExtraida : new URL(imgExtraida, link).href;
          }
          // ==========================================

          let extracao = [];
          $('li, .ingredient, p').each((i, el) => {
            const texto = $(el).text().trim();
            if (texto.length > 3 && texto.length < 150 && (texto.includes('g') || texto.includes('xícara') || texto.includes('colher') || texto.match(/\d/))) {
              extracao.push(texto);
            }
          });

          if (extracao.length > 0) {
            ingredientes = [...new Set(extracao)].join(', ');
          } else {
            ingredientes = "Site lido com sucesso, mas os ingredientes não foram encontrados na página.";
          }
        }
      } catch (err) {
        console.error("Bloqueio de site ou link inválido:", err.message);
        ingredientes = "Não foi possível ler este site (link inválido ou bloqueio de segurança do site).";
      }
    }

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
    console.error("Erro crítico no servidor:", error);
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

module.exports = { listar, criar, atualizar, deletar };