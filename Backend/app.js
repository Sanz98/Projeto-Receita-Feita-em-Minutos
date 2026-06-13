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

// Inicializando o GROQ (Substituto ultra-rápido do Gemini)
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
// ROTA DE EXTRAÇÃO AVANÇADA (CACHE -> SCRAPER -> YOUTUBE -> GROQ IA)
// ==========================================
app.post('/receitas/extrair-ia', async (req, res) => {
  try {
    const { link } = req.body;
    if (!link) return res.status(400).json({ mensagem: "Por favor, forneça um link válido." });

    // 1. CAMADA DE CACHE: Verificar se já existe na base de dados
    const receitaExistente = await Receita.findOne({ link: link });
    if (receitaExistente) {
      return res.status(200).json({ 
        nome: receitaExistente.nome, 
        ingredientes: receitaExistente.ingredientes,
        imagem: receitaExistente.imagem || "", // Puxa imagem do cache
        origem: "cache" 
      });
    }

    // 2. CAMADA DE SCRAPER: Tentar extração automática de sites (Zero Custo)
    try {
      const { default: scraper } = await import('recipe-scrapers');
      const data = await scraper(link);
      
      return res.status(200).json({ 
        nome: data.title, 
        ingredientes: data.ingredients.join(', '),
        imagem: data.image || "", // Puxa a imagem original do site
        origem: "scraper" 
      });
    } catch (scraperErr) {
      console.log("Scraper não suporta este site, a tentar extração por vídeo ou IA...");
    }

    // 3. CAMADA DE LEITURA DO YOUTUBE (Extração de Legendas Gratuita)
    let contextoAdicional = "";
    if (link.includes("youtube.com") || link.includes("youtu.be")) {
      try {
        const transcript = await YoutubeTranscript.fetchTranscript(link);
        // Junta os textos da legenda e limita a 3000 caracteres para ser rápido
        contextoAdicional = transcript.map(t => t.text).join(' ').substring(0, 3000); 
        console.log("Legenda do YouTube extraída com sucesso!");
      } catch (err) {
        console.log("Vídeo sem legenda disponível. A IA tentará deduzir.");
      }
    }

    // 4. CAMADA DE IA (Groq Cloud) - PROMPT FORTALECIDO
    const prompt = `Você é um assistente culinário. Analise o seguinte contexto e extraia a receita.
    Link: ${link}
    Legenda extraída (se houver): ${contextoAdicional}
    
    REGRAS ABSOLUTAS:
    1. Formate os ingredientes numa única linha, separados por vírgula.
    2. Responda EXCLUSIVAMENTE com um objeto JSON válido. Nenhuma palavra a mais antes ou depois.
    3. Se não houver contexto suficiente para deduzir os ingredientes, devolva este JSON: {"nome": "Receita não identificada", "ingredientes": "Não foi possível extrair a receita deste link. Verifique se o vídeo possui instruções claras."}
    
    Responda apenas com o JSON:`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant", 
      temperature: 0.1, // Temperatura baixa para respostas robóticas/estritas
    });

    let textoResposta = chatCompletion.choices[0]?.message?.content || "";
    textoResposta = textoResposta.replace(/```json|```/g, '').trim();
    
    // PROTEÇÃO ANTI-CRASH E GERAÇÃO DE IMAGEM YOUTUBE
    let dadosFormatados;
    try {
      dadosFormatados = JSON.parse(textoResposta);
      
      // Se a IA gerou o JSON e for link do YouTube, criamos a thumbnail manualmente
      let imagemGerada = "";
      const regex = /(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
      const match = link.match(regex);
      if (match && match[1].length === 11) {
        imagemGerada = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
      }
      dadosFormatados.imagem = imagemGerada; // Injeta a imagem no retorno

    } catch (parseError) {
      console.log("A IA falhou em gerar JSON. Resposta enviada:", textoResposta);
      dadosFormatados = {
        nome: "Receita Desconhecida",
        ingredientes: "Não conseguimos extrair as informações. O link não contém texto legível ou legenda pública.",
        imagem: ""
      };
    }
    
    res.status(200).json(dadosFormatados);

  } catch (error) {
    console.error("Erro crítico na integração:", error);

    if (error.status === 429) {
      res.status(429).json({ mensagem: "Muitos pedidos realizados num curto espaço de tempo. Aguarde um instante." });
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
  console.log("✅ Sistema atualizado com imagens reais e motor Groq (Llama 3.1)!");
});