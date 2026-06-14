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
// ROTA DE EXTRAÇÃO AVANÇADA (100% BLINDADA)
// ==========================================
app.post('/receitas/extrair-ia', async (req, res) => {
  try {
    const { link } = req.body;
    if (!link) return res.status(400).json({ mensagem: "Por favor, forneça um link válido." });

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

    // 2. CAMADA DE SCRAPER
    try {
      const { default: scraper } = await import('recipe-scrapers');
      const data = await scraper(link);
      
      return res.status(200).json({ 
        nome: data.title, 
        ingredientes: data.ingredients.join(', '),
        imagem: data.image || "", 
        origem: "scraper" 
      });
    } catch (scraperErr) {
      console.log("Scraper direto falhou. A iniciar leitura profunda do site...");
    }

    // 3. CAMADA DE LEITURA UNIVERSAL (TÍTULO PARA TODOS OS LINKS)
    let contextoAdicional = "";
    let imagemCapturada = "";
    let tituloOficial = "";

    // A) Vamos ROUBAR o HTML de QUALQUER link primeiro (com User-Agent para evitar bloqueios)
    try {
      const response = await fetch(link, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
        }
      });
      const html = await response.text();
      
      // Roubar o Título e limpar lixo (" - YouTube", quebras de linha)
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        tituloOficial = titleMatch[1].trim().replace(/\n/g, '').replace(/ - YouTube/g, '').replace(/ \| TikTok/g, '');
      }
      
      // Roubar a Fotografia Oficial (OG:Image)
      const imgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
                    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
      if (imgMatch && imgMatch[1]) {
        imagemCapturada = imgMatch[1];
      }
    } catch(err) {
      console.log("Falha ao capturar o HTML externo.");
    }

    // B) Se for YouTube, AGORA SIM puxamos a legenda também!
    if (link.includes("youtube.com") || link.includes("youtu.be")) {
      try {
        const transcript = await YoutubeTranscript.fetchTranscript(link);
        contextoAdicional = transcript.map(t => t.text).join(' ').substring(0, 3000); 
      } catch (err) {
        console.log("Vídeo sem legenda disponível.");
      }
      
      // Se a imagem não tiver sido capturada pelo HTML, força o padrão do YouTube
      if (!imagemCapturada) {
        const regex = /(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
        const match = link.match(regex);
        if (match && match[1].length === 11) {
          imagemCapturada = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
        }
      }
    }

    // 4. CAMADA DE IA (Groq)
    const prompt = `Você é um assistente culinário. Extraia os ingredientes do seguinte contexto:
    Link: ${link}
    Título do Vídeo/Site: ${tituloOficial || "Desconhecido"}
    Legenda Extraída: ${contextoAdicional || "Não disponível"}
    
    REGRAS ABSOLUTAS:
    1. Responda EXCLUSIVAMENTE em formato JSON: {"nome": "...", "ingredientes": "..."}.
    2. O "nome" DEVE OBRIGATORIAMENTE ser o "Título do Vídeo/Site" fornecido acima.
    3. Formate os ingredientes numa única linha, separados por vírgula.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant", 
      temperature: 0.1, 
    });

    let textoResposta = chatCompletion.choices[0]?.message?.content || "";
    textoResposta = textoResposta.replace(/```json|```/g, '').trim();
    
    let dadosFormatados;
    try {
      dadosFormatados = JSON.parse(textoResposta);
      
      // INJEÇÃO FORÇADA: Ignora o que a IA pensou e FORÇA o uso do título real do site/vídeo
      if (tituloOficial && tituloOficial !== "Desconhecido") {
        dadosFormatados.nome = tituloOficial;
      }
      
      // Força a imagem correta
      dadosFormatados.imagem = imagemCapturada || ""; 

    } catch (parseError) {
      console.log("A IA falhou em gerar JSON. Resposta enviada:", textoResposta);
      dadosFormatados = {
        nome: tituloOficial || "Receita Desconhecida",
        ingredientes: "Não conseguimos extrair os detalhes desta receita.",
        imagem: imagemCapturada || ""
      };
    }
    
    res.status(200).json(dadosFormatados);

  } catch (error) {
    console.error("Erro crítico na integração:", error);
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
  console.log("✅ Sistema blindado: Extração universal de título + Injeção ativada!");
});