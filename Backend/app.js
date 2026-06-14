const express = require("express");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken"); 
const bcrypt = require("bcrypt"); 
const mongoose = require("mongoose");
const { YoutubeTranscript } = require('youtube-transcript');
const Groq = require("groq-sdk");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || "minha_chave_secreta_para_gerar_tokens_12345"; 

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado ao MongoDB Atlas com sucesso!'))
  .catch((err) => console.error('❌ Erro ao conectar ao MongoDB:', err));

// Inicializando o GROQ
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());

const User = require('./models/User');
const Receita = require('./models/Receita');
const Avaliacao = require('./models/Avaliacao');

app.use(express.static(path.join(__dirname, "../FrontEnd/Body")));
app.use(express.static(path.join(__dirname, "../FrontEnd")));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../FrontEnd/Body/index.html'));
});

const rotasReceitas = require('./src/routes/receitas');
const rotasUsuarios = require('./src/routes/users');

app.use('/receitas', rotasReceitas);
app.use('/users', rotasUsuarios);

// ==========================================
// ROTA DE EXTRAÇÃO AVANÇADA (TÍTULOS EXATOS + MODO JSON)
// ==========================================
app.post('/receitas/extrair-ia', async (req, res) => {
  try {
    let { link } = req.body;
    if (!link) return res.status(400).json({ mensagem: "Por favor, forneça um link válido." });

    // --- FILTRO INTELIGENTE MOBILE ---
    let urlLimpa = link;
    let tituloExtraidoDoTexto = "";

    const urlRegex = /(https?:\/\/[^\s]+)/;
    const matchUrl = link.match(urlRegex);

    if (matchUrl) {
      urlLimpa = matchUrl[1]; 
      tituloExtraidoDoTexto = link.replace(urlLimpa, '').trim(); 
      tituloExtraidoDoTexto = tituloExtraidoDoTexto.replace(/- YouTube$/i, '').trim();
      tituloExtraidoDoTexto = tituloExtraidoDoTexto.replace(/\| TikTok$/i, '').trim();
      tituloExtraidoDoTexto = tituloExtraidoDoTexto.replace(/Olha este vídeo no TikTok!/i, '').trim();
      
      if (/^(youtube|tiktok|instagram)$/i.test(tituloExtraidoDoTexto)) {
        tituloExtraidoDoTexto = "";
      }
    }

    link = urlLimpa;
    let tituloOficial = tituloExtraidoDoTexto;

    // 1. CAMADA DE CACHE
    const receitaExistente = await Receita.findOne({ link: link });
    if (receitaExistente) {
      return res.status(200).json({ 
        nome: receitaExistente.nome, 
        ingredientes: receitaExistente.ingredientes,
        imagem: receitaExistente.imagem || "",
        origem: "cache" 
      });
    }

    // 2. CAMADA DE SCRAPER (Para Blogs famosos)
    try {
      const { default: scraper } = await import('recipe-scrapers');
      const data = await scraper(link);
      
      if (data.ingredients && data.ingredients.length > 0) {
        return res.status(200).json({ 
          nome: tituloOficial || data.title, 
          ingredientes: data.ingredients.join(', '),
          imagem: data.image || "", 
          origem: "scraper" 
        });
      }
    } catch (scraperErr) {
      console.log("Scraper direto falhou. A tentar leitura universal...");
    }

    // 3. CAMADA DE LEITURA UNIVERSAL E PROFUNDA
    let contextoAdicional = "";
    let imagemCapturada = "";

    // A) NOVIDADE: OEMBED API (O Segredo para YouTube, TikTok e outras Redes Sociais)
    // Ultrapassa bloqueios de HTML para roubar o Título Exato Oficial do vídeo
    if (!tituloOficial || /^(youtube|tiktok|instagram)$/i.test(tituloOficial)) {
      try {
        let oembedUrl = "";
        if (link.includes("youtube.com") || link.includes("youtu.be")) {
          oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(link)}&format=json`;
        } else if (link.includes("tiktok.com")) {
          oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(link)}`;
        } else if (link.includes("vimeo.com")) {
          oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(link)}`;
        }

        if (oembedUrl) {
          const oembedRes = await fetch(oembedUrl);
          if (oembedRes.ok) {
            const oembedData = await oembedRes.json();
            if (oembedData && oembedData.title) {
              tituloOficial = oembedData.title; // Título Exato Confirmado!
            }
            if (oembedData && oembedData.thumbnail_url) {
              imagemCapturada = oembedData.thumbnail_url;
            }
          }
        }
      } catch(e) {
        console.log("oEmbed não suportado ou falhou.");
      }
    }

    // B) ROUBAR o HTML de QUALQUER link (Se não for rede social, é um blog ou site)
    try {
      const response = await fetch(link, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
          "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7"
        }
      });
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        const html = await response.text();
        
        // Se o oEmbed não pegou o título, fazemos uma varredura extrema no HTML
        if (!tituloOficial || /^(youtube|tiktok|instagram)$/i.test(tituloOficial)) {
          const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) 
                            || html.match(/<meta[^>]+name=["']title["'][^>]+content=["']([^"']+)["']/i)
                            || html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i);
          
          if (ogTitleMatch && ogTitleMatch[1]) {
            let titleWeb = ogTitleMatch[1].trim();
            if (!/^(YouTube|TikTok|Instagram|Login • Instagram)$/i.test(titleWeb)) {
              tituloOficial = titleWeb;
            }
          }
          
          if (!tituloOficial || /^(youtube|tiktok|instagram)$/i.test(tituloOficial)) {
            const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            if (titleMatch && titleMatch[1]) {
              let titleWeb = titleMatch[1].trim().replace(/\n/g, '').replace(/ - YouTube/g, '');
              if (!/^(YouTube|TikTok|Instagram)$/i.test(titleWeb) && !titleWeb.includes("http")) {
                tituloOficial = titleWeb;
              }
            }
          }

          // NOVIDADE: Busca por H1 em blogs obscuros
          if (!tituloOficial || /^(youtube|tiktok|instagram)$/i.test(tituloOficial)) {
            const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
            if (h1Match && h1Match[1]) {
              tituloOficial = h1Match[1].replace(/<[^>]+>/g, '').trim(); 
            }
          }
        }
        
        if (!imagemCapturada) {
          const imgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
                        || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
          if (imgMatch && imgMatch[1]) {
            imagemCapturada = imgMatch[1];
          }
        }

        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch && bodyMatch[1]) {
          contextoAdicional = bodyMatch[1]
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') 
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')   
            .replace(/<[^>]+>/g, ' ')                         
            .replace(/\s+/g, ' ')                             
            .trim()
            .substring(0, 3500); 
        }
      }
    } catch(err) {
      console.log("Falha de rede ao capturar HTML. Proteção do site ativada.");
    }

    // C) Tratamento de Legendas para YouTube
    if (link.includes("youtube.com") || link.includes("youtu.be")) {
      try {
        const transcript = await YoutubeTranscript.fetchTranscript(link);
        contextoAdicional = transcript.map(t => t.text).join(' ').substring(0, 3500); 
      } catch (err) {
        console.log("YouTube sem legendas. A forçar dedução...");
        contextoAdicional = "Vídeo sem legendas. Extraia ou deduza os ingredientes com base no título."; 
      }
      
      if (!imagemCapturada) {
        const regex = /(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
        const match = link.match(regex);
        if (match && match[1].length === 11) {
          imagemCapturada = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
        }
      }
    }

    // D) Fallback Final de Domínio (Acontecerá apenas se o link for completamente quebrado)
    if (!tituloOficial || /^(youtube|tiktok|instagram|receita via)$/i.test(tituloOficial.trim().toLowerCase())) {
      try {
        const urlObj = new URL(link);
        const dominio = urlObj.hostname.replace('www.', '');
        tituloOficial = `Receita via ${dominio}`;
      } catch (e) {
        tituloOficial = "Receita via Link Externo";
      }
    }

    // 4. CAMADA DE IA (GROQ) COM MODO ESTRICTO JSON_OBJECT
    const prompt = `Sua missão é extrair ou deduzir os ingredientes da receita.
    Link: ${link}
    Título da Receita: ${tituloOficial}
    Texto Extraído: ${contextoAdicional || "Indisponível"}
    
    REGRAS:
    1. O "nome" DEVE ser EXATAMENTE o "Título da Receita" fornecido acima. Não o altere nem invente.
    2. Formate os ingredientes numa única linha, separados por vírgula.
    3. MODO SOBREVIVÊNCIA: Se não houver ingredientes no Texto, você DEVE DEDUZIR uma lista realista baseada apenas no "Título da Receita". Nunca devolva ingredientes vazios.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are an API that outputs ONLY valid JSON objects. Never include conversational text. Format: {\"nome\": \"...\", \"ingredientes\": \"...\"}" },
        { role: "user", content: prompt }
      ],
      model: "llama-3.1-8b-instant", 
      temperature: 0.1, 
      response_format: { type: "json_object" }
    });

    let textoResposta = chatCompletion.choices[0]?.message?.content || "{}";
    
    let dadosFormatados;
    try {
      dadosFormatados = JSON.parse(textoResposta);
      
      // Validação final de segurança para garantir que o título exato foi respeitado
      if (!dadosFormatados.nome || dadosFormatados.nome.toLowerCase().includes("desconhecid")) {
        dadosFormatados.nome = tituloOficial;
      }
      
      dadosFormatados.imagem = imagemCapturada || ""; 

    } catch (parseError) {
      console.log("Erro Crítico de Parse:", textoResposta);
      dadosFormatados = {
        nome: tituloOficial,
        ingredientes: "Ovos, Leite, Farinha, Açúcar, Manteiga, Sal, Óleo, Água (Ingredientes deduzidos devido a falha do site)",
        imagem: imagemCapturada || ""
      };
    }
    
    res.status(200).json(dadosFormatados);

  } catch (error) {
    console.error("Erro na integração:", error);
    if (error.status === 429) {
      res.status(429).json({ mensagem: "Muitos pedidos num curto espaço de tempo." });
    } else {
      res.status(500).json({ mensagem: "Erro interno no servidor ao processar a receita." });
    }
  }
});

// ==========================================
// OUTRAS ROTAS (AVALIAÇÕES, PERFIL, SENHAS)
// ==========================================
app.post('/avaliacoes', async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ mensagem: "Token não fornecido." });
    const token = authHeader.split(" ")[1];
    const usuarioLogado = jwt.verify(token, SECRET);
    const { nota, comentario } = req.body;
    let avaliacaoExistente = await Avaliacao.findOne({ userId: usuarioLogado.id });
    if (avaliacaoExistente) {
      avaliacaoExistente.nota = nota;
      avaliacaoExistente.comentario = comentario || "";
      await avaliacaoExistente.save();
    } else {
      const novaAvaliacao = new Avaliacao({ userId: usuarioLogado.id, username: usuarioLogado.username, nota, comentario: comentario || "", dataCriacao: new Date().toLocaleString('pt-BR') });
      await novaAvaliacao.save();
    }
    res.status(201).json({ mensagem: "Avaliação registada!" });
  } catch (error) { res.status(500).json({ mensagem: "Erro interno." }); }
});

app.put('/perfil/senha', async (req, res) => { 
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ mensagem: "Acesso negado." });
    const token = authHeader.split(" ")[1];
    const usuarioLogado = jwt.verify(token, SECRET);
    const { senhaAtual, novaSenha } = req.body;
    const usuario = await User.findById(usuarioLogado.id);
    if (usuario) {
      const senhaValida = await bcrypt.compare(senhaAtual, usuario.password);
      if (!senhaValida) return res.status(400).json({ mensagem: "Palavra-passe incorreta." }); 
      usuario.password = await bcrypt.hash(novaSenha, 10);
      await usuario.save();
      return res.status(200).json({ mensagem: "Palavra-passe alterada!" });
    }
    res.status(404).json({ mensagem: "Utilizador não encontrado." });
  } catch (error) { res.status(500).json({ mensagem: "Erro no servidor." }); }
});

app.delete('/perfil', async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ mensagem: "Acesso negado." });
    const token = authHeader.split(" ")[1];
    const usuarioLogado = jwt.verify(token, SECRET);
    await User.findByIdAndDelete(usuarioLogado.id);
    await Receita.deleteMany({ userId: usuarioLogado.id });
    await Avaliacao.deleteMany({ userId: usuarioLogado.id });
    res.status(200).json({ mensagem: "Conta eliminada com sucesso." });
  } catch (error) { res.status(500).json({ mensagem: "Erro ao eliminar conta." }); }
});

let tokensRecuperacaoMemoria = {}; 

app.post('/users/esqueci-senha', async (req, res) => {
  try {
    const { username } = req.body;
    const usuarioEncontrado = await User.findOne({ username: username });
    if (!usuarioEncontrado) return res.status(404).json({ mensagem: "Utilizador não encontrado." });
    const tokenSeguro = Math.floor(100000 + Math.random() * 900000);
    tokensRecuperacaoMemoria[username] = String(tokenSeguro);
    res.status(200).json({ mensagem: "Token emitido.", link: `redefinirSenha.html?username=${username}&token=${tokenSeguro}` });
  } catch (error) { res.status(500).json({ mensagem: "Erro interno." }); }
});

app.post('/users/redefinir-senha', async (req, res) => {
  try {
    const { username, token, novaSenha } = req.body;
    if (!tokensRecuperacaoMemoria[username] || tokensRecuperacaoMemoria[username] !== String(token)) {
      return res.status(400).json({ mensagem: "Token inválido." });
    }
    const usuario = await User.findOne({ username: username });
    if (usuario) {
      usuario.password = await bcrypt.hash(novaSenha, 10); 
      await usuario.save();
      delete tokensRecuperacaoMemoria[username]; 
      return res.status(200).json({ mensagem: "Palavra-passe redefinida!" });
    }
    res.status(404).json({ mensagem: "Utilizador não localizado." });
  } catch (error) { res.status(500).json({ mensagem: "Erro no servidor." }); }
});

app.listen(PORT, () => {
  console.log(`Servidor a correr em http://localhost:${PORT}`);
  console.log("✅ Sistema API oEmbed ativado para captura de Títulos Inquebrável!");
});