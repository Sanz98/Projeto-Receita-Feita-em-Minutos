const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");
const jwt = require("jsonwebtoken"); // ADICIONADO: Para verificar quem é o utilizador
require("dotenv").config();

const caminho = "./Data/receitas.json";
const SECRET = process.env.JWT_SECRET || "minha_chave_secreta_para_gerar_tokens_12345";

// LER RECEITAS (GET) - Agora filtrado por utilizador
function listar(req, res) {
  try {
    // 1. Verifica quem está a fazer o pedido
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ mensagem: "Acesso negado. Token em falta." });
    
    const token = authHeader.split(" ")[1];
    const usuarioLogado = jwt.verify(token, SECRET);

    const data = fs.readFileSync(caminho, "utf-8");
    let receitas = JSON.parse(data);

    // 2. FILTRO DE ISOLAMENTO: Devolve APENAS as receitas do utilizador logado!
    receitas = receitas.filter(r => String(r.userId) === String(usuarioLogado.id));

    const { nome } = req.query;
    if (nome) {
      receitas = receitas.filter(r =>
        r.nome.toLowerCase().includes(nome.toLowerCase())
      );
    }
    res.status(200).json(receitas);
  } catch (error) {
    res.status(403).json({ mensagem: "Token inválido ou expirado." });
  }
}

// CRIAR RECEITA (POST) - Agora vincula a receita ao utilizador
async function criar(req, res) {
  try {
    // 1. Verifica quem está a fazer o pedido
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ mensagem: "Acesso negado." });
    
    const token = authHeader.split(" ")[1];
    const usuarioLogado = jwt.verify(token, SECRET);

    let { nome, ingredientes, link, imagem } = req.body;

    // Lógica de Extração (Scraping)
    if (link && ingredientes === "Extraindo ingredientes do vídeo...") {
      if (!link.startsWith('http')) link = 'https://' + link;

      try {
        if (link.includes('youtube.com') || link.includes('youtu.be')) {
          nome = "Receita do YouTube";
          ingredientes = "Assista ao vídeo para ver as medidas exatas.";
        } else {
          const resposta = await axios.get(link, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
          });
          const $ = cheerio.load(resposta.data);

          const title = $('title').text().trim();
          if (title) nome = title.replace(/ Receita | TudoGostoso/g, '');

          const imgExtraida = $('meta[property="og:image"]').attr('content') || 
                              $('meta[name="twitter:image"]').attr('content') || 
                              $('img').first().attr('src');
          
          if (imgExtraida) {
             imagem = imgExtraida.startsWith('http') ? imgExtraida : new URL(imgExtraida, link).href;
          }

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
        ingredientes = "Não foi possível ler este site (link inválido ou bloqueio de segurança).";
      }
    }

    const data = fs.readFileSync(caminho, "utf-8");
    let receitas = JSON.parse(data);

    // 2. VÍNCULO DE ISOLAMENTO: Regista o userId na receita criada
    const novaReceita = {
      id: Date.now().toString(),
      userId: usuarioLogado.id, // O segredo está aqui!
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
    res.status(500).json({ mensagem: "Erro ao criar receita ou acesso negado." });
  }
}

// ATUALIZAR (PUT) - Impede que um utilizador edite a receita de outro
function atualizar(req, res) {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ mensagem: "Acesso negado." });
    const token = authHeader.split(" ")[1];
    const usuarioLogado = jwt.verify(token, SECRET);

    const { id } = req.params;
    const { nome, ingredientes, imagem, link } = req.body; // Adicionado link aqui para permitir edição manual

    const data = fs.readFileSync(caminho, "utf-8");
    let receitas = JSON.parse(data);

    // Verifica se a receita existe E se pertence ao utilizador logado
    const index = receitas.findIndex(r => String(r.id) === String(id) && String(r.userId) === String(usuarioLogado.id));
    
    if (index === -1) {
        return res.status(404).json({ mensagem: "Receita não encontrada ou sem permissão para editar." });
    }

    receitas[index] = { ...receitas[index], nome, ingredientes, imagem, link };

    fs.writeFileSync(caminho, JSON.stringify(receitas, null, 2));
    res.status(200).json({ mensagem: "Atualizado!" });
  } catch (error) {
    res.status(500).json({ mensagem: "Erro ao atualizar receita ou token inválido." });
  }
}

// DELETAR (DELETE) - Impede que um utilizador apague a receita de outro
function deletar(req, res) {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ mensagem: "Acesso negado." });
    const token = authHeader.split(" ")[1];
    const usuarioLogado = jwt.verify(token, SECRET);

    const { id } = req.params;

    const data = fs.readFileSync(caminho, "utf-8");
    let receitas = JSON.parse(data);

    const tamanhoOriginal = receitas.length;
    
    // Mantém as receitas que NÃO correspondam ao (id da receita + id do utilizador logado)
    receitas = receitas.filter(r => !(String(r.id) === String(id) && String(r.userId) === String(usuarioLogado.id)));

    if (receitas.length === tamanhoOriginal) {
        return res.status(404).json({ mensagem: "Receita não encontrada ou não tens permissão para apagar." });
    }

    fs.writeFileSync(caminho, JSON.stringify(receitas, null, 2));
    res.status(200).json({ mensagem: "Deletado!" });
  } catch (error) {
    res.status(500).json({ mensagem: "Erro ao deletar receita." });
  }
}

module.exports = { listar, criar, atualizar, deletar };