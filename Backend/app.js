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

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());

const User = require('./models/User');
const Receita = require('./models/Receita');
const Avaliacao = require('./models/Avaliacao');
const Pedido = require('./models/Pedido');

app.use(express.static(path.join(__dirname, "../FrontEnd/Body")));
app.use(express.static(path.join(__dirname, "../FrontEnd")));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../FrontEnd/Body/index.html'));
});

// ==========================================
// SEGURANÇA MÁXIMA DE PERFIS (LOGIN E CADASTRO)
// ==========================================
app.post('/users/register', async (req, res) => {
  try {
    const { username, password, perfil } = req.body;
    const userExists = await User.findOne({ username });
    if (userExists) return res.status(400).json({ mensagem: "Este usuário já existe no sistema!" });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({ 
      username, 
      password: hashedPassword, 
      perfil: perfil || 'cliente' 
    });
    
    await newUser.save();
    res.status(201).json({ mensagem: "Conta criada com sucesso!" });
  } catch (err) { 
    res.status(500).json({ mensagem: "Erro interno ao criar conta." }); 
  }
});

app.post('/users/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user) return res.status(400).json({ mensagem: "Usuário não encontrado!" });
    
    const senhaValida = await bcrypt.compare(password, user.password);
    if (!senhaValida) return res.status(400).json({ mensagem: "Senha incorreta!" });
    
    const token = jwt.sign({ id: user._id, username: user.username, perfil: user.perfil }, SECRET);
    res.status(200).json({ token, perfil: user.perfil }); 
  } catch (err) { 
    res.status(500).json({ mensagem: "Erro interno no login." }); 
  }
});

const rotasReceitas = require('./src/routes/receitas');
const rotasUsuarios = require('./src/routes/users');

app.use('/receitas', rotasReceitas);
app.use('/users', rotasUsuarios);

// ==========================================
// ROTA DE EXTRAÇÃO IA (TÍTULOS EXATOS + MODO JSON)
// ==========================================
app.post('/receitas/extrair-ia', async (req, res) => {
  try {
    let { link } = req.body;
    if (!link) return res.status(400).json({ mensagem: "Por favor, forneça um link válido." });
    let urlLimpa = link;
    let tituloExtraidoDoTexto = "";
    const urlRegex = /(https?:\/\/[^\s]+)/;
    const matchUrl = link.match(urlRegex);
    if (matchUrl) {
      urlLimpa = matchUrl[1]; 
      tituloExtraidoDoTexto = link.replace(urlLimpa, '').trim(); 
      tituloExtraidoDoTexto = tituloExtraidoDoTexto.replace(/- YouTube$/i, '').trim().replace(/\| TikTok$/i, '').trim().replace(/Olha este vídeo no TikTok!/i, '').trim();
      if (/^(youtube|tiktok|instagram)$/i.test(tituloExtraidoDoTexto)) tituloExtraidoDoTexto = "";
    }
    link = urlLimpa;
    let tituloOficial = tituloExtraidoDoTexto;

    const receitaExistente = await Receita.findOne({ link: link });
    if (receitaExistente) return res.status(200).json({ nome: receitaExistente.nome, ingredientes: receitaExistente.ingredientes, imagem: receitaExistente.imagem || "", origem: "cache" });

    try {
      const { default: scraper } = await import('recipe-scrapers');
      const data = await scraper(link);
      if (data.ingredients && data.ingredients.length > 0) return res.status(200).json({ nome: tituloOficial || data.title, ingredientes: data.ingredients.join(', '), imagem: data.image || "", origem: "scraper" });
    } catch (scraperErr) {}

    let contextoAdicional = "";
    let imagemCapturada = "";

    if (!tituloOficial || /^(youtube|tiktok|instagram)$/i.test(tituloOficial)) {
      try {
        let oembedUrl = "";
        if (link.includes("youtube.com") || link.includes("youtu.be")) oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(link)}&format=json`;
        else if (link.includes("tiktok.com")) oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(link)}`;
        
        if (oembedUrl) {
          const oembedRes = await fetch(oembedUrl);
          if (oembedRes.ok) {
            const oembedData = await oembedRes.json();
            if (oembedData && oembedData.title) tituloOficial = oembedData.title; 
            if (oembedData && oembedData.thumbnail_url) imagemCapturada = oembedData.thumbnail_url;
          }
        }
      } catch(e) {}
    }

    try {
      const response = await fetch(link, { headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "pt-BR" } });
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        const html = await response.text();
        if (!tituloOficial || /^(youtube|tiktok|instagram)$/i.test(tituloOficial)) {
          const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) || html.match(/<meta[^>]+name=["']title["'][^>]+content=["']([^"']+)["']/i);
          if (ogTitleMatch && ogTitleMatch[1] && !/^(YouTube|TikTok|Instagram)$/i.test(ogTitleMatch[1].trim())) tituloOficial = ogTitleMatch[1].trim();
        }
        if (!imagemCapturada) {
          const imgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
          if (imgMatch && imgMatch[1]) imagemCapturada = imgMatch[1];
        }
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch && bodyMatch[1]) contextoAdicional = bodyMatch[1].replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 3500);
      }
    } catch(err) {}

    if (link.includes("youtube.com") || link.includes("youtu.be")) {
      try {
        const transcript = await YoutubeTranscript.fetchTranscript(link);
        contextoAdicional = transcript.map(t => t.text).join(' ').substring(0, 3500); 
      } catch (err) {}
      if (!imagemCapturada) {
        const match = link.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i);
        if (match && match[1].length === 11) imagemCapturada = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
      }
    }

    if (!tituloOficial) tituloOficial = "Receita via Link Externo";

    const prompt = `Sua missão é extrair ou deduzir os ingredientes. Link: ${link}. Título: ${tituloOficial}. Texto Extraído: ${contextoAdicional}. REGRAS: 1. O "nome" DEVE ser EXATAMENTE o "Título" fornecido. 2. Ingredientes numa única linha, separados por vírgula. Responda APENAS em formato JSON {"nome": "...", "ingredientes": "..."}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "system", content: "You are an API that outputs ONLY valid JSON objects." }, { role: "user", content: prompt }],
      model: "llama-3.1-8b-instant", temperature: 0.1, response_format: { type: "json_object" }
    });

    let dadosFormatados = JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");
    if (!dadosFormatados.nome || dadosFormatados.nome.toLowerCase().includes("desconhecid")) dadosFormatados.nome = tituloOficial;
    dadosFormatados.imagem = imagemCapturada || ""; 
    res.status(200).json(dadosFormatados);
  } catch (error) { res.status(500).json({ mensagem: "Erro interno ao processar receita." }); }
});

// ==========================================
// SISTEMA REAL DE DELIVERY COM GPS
// ==========================================
app.post('/pedidos', async (req, res) => {
  try {
    const user = jwt.verify(req.headers["authorization"].split(" ")[1], SECRET);
    
    // Apanha o endereço real enviado pelo GPS do cliente (ou fallback caso tenha sido negado)
    const { itens, itensContagem, valorTotal, endereco } = req.body;
    const enderecoFinal = endereco || "Localização GPS não fornecida pelo cliente";

    await new Pedido({ 
      clienteId: user.id, 
      clienteNome: user.username, 
      itens, 
      itensContagem, 
      valorTotal, 
      endereco: enderecoFinal 
    }).save();

    res.status(201).json({ mensagem: "Pedido enviado!" });
  } catch (err) { res.status(500).json({ mensagem: "Erro ao criar pedido." }); }
});

app.get('/pedidos/cliente', async (req, res) => {
  try {
    const user = jwt.verify(req.headers["authorization"].split(" ")[1], SECRET);
    res.status(200).json(await Pedido.find({ clienteId: user.id }).sort({ horaCriacao: -1 }));
  } catch (err) { res.status(500).json({ mensagem: "Erro." }); }
});

app.get('/pedidos/disponiveis', async (req, res) => {
  try { res.status(200).json(await Pedido.find({ status: 'aguardando' }).sort({ horaCriacao: -1 })); } 
  catch (err) { res.status(500).json({ mensagem: "Erro." }); }
});

app.put('/pedidos/:id/aceitar', async (req, res) => {
  try {
    const user = jwt.verify(req.headers["authorization"].split(" ")[1], SECRET);
    const pedido = await Pedido.findOneAndUpdate(
      { _id: req.params.id, status: 'aguardando' },
      { status: 'em_rota', entregadorId: user.id },
      { new: true }
    );
    if (!pedido) return res.status(400).json({ mensagem: "Tarde demais! Outro motorista já aceitou esta corrida." });
    res.status(200).json({ mensagem: "Corrida aceita!", pedido });
  } catch (err) { res.status(500).json({ mensagem: "Erro." }); }
});

app.put('/pedidos/:id/entregar', async (req, res) => {
  try {
    await Pedido.findByIdAndUpdate(req.params.id, { status: 'entregue' });
    res.status(200).json({ mensagem: "Finalizada!" });
  } catch (err) { res.status(500).json({ mensagem: "Erro." }); }
});

// ==========================================
// AVALIAÇÕES E PERFIL
// ==========================================
app.post('/avaliacoes', async (req, res) => {
  try {
    const user = jwt.verify(req.headers["authorization"].split(" ")[1], SECRET);
    const { nota, comentario } = req.body;
    let aval = await Avaliacao.findOne({ userId: user.id });
    if (aval) { aval.nota = nota; aval.comentario = comentario || ""; await aval.save(); } 
    else { await new Avaliacao({ userId: user.id, username: user.username, nota, comentario: comentario || "", dataCriacao: new Date().toLocaleString('pt-BR') }).save(); }
    res.status(201).json({ mensagem: "Avaliação registrada!" });
  } catch (error) { res.status(500).json({ mensagem: "Erro." }); }
});

app.put('/perfil/senha', async (req, res) => { 
  try {
    const userToken = jwt.verify(req.headers["authorization"].split(" ")[1], SECRET);
    const { senhaAtual, novaSenha } = req.body;
    const usuario = await User.findById(userToken.id);
    if (usuario && await bcrypt.compare(senhaAtual, usuario.password)) {
      usuario.password = await bcrypt.hash(novaSenha, 10);
      await usuario.save();
      return res.status(200).json({ mensagem: "Senha alterada!" });
    }
    res.status(400).json({ mensagem: "Senha incorreta." });
  } catch (error) { res.status(500).json({ mensagem: "Erro." }); }
});

app.delete('/perfil', async (req, res) => {
  try {
    const user = jwt.verify(req.headers["authorization"].split(" ")[1], SECRET);
    await User.findByIdAndDelete(user.id);
    await Receita.deleteMany({ userId: user.id });
    await Avaliacao.deleteMany({ userId: user.id });
    res.status(200).json({ mensagem: "Conta excluída." });
  } catch (error) { res.status(500).json({ mensagem: "Erro." }); }
});

let tokensRecuperacaoMemoria = {}; 
app.post('/users/esqueci-senha', async (req, res) => {
  const { username } = req.body;
  if (!await User.findOne({ username })) return res.status(404).json({ mensagem: "Não encontrado." });
  const token = Math.floor(100000 + Math.random() * 900000);
  tokensRecuperacaoMemoria[username] = String(token);
  res.status(200).json({ mensagem: "Token emitido.", link: `redefinirSenha.html?username=${username}&token=${token}` });
});
app.post('/users/redefinir-senha', async (req, res) => {
  const { username, token, novaSenha } = req.body;
  if (tokensRecuperacaoMemoria[username] !== String(token)) return res.status(400).json({ mensagem: "Token inválido." });
  const usuario = await User.findOne({ username });
  if (usuario) {
    usuario.password = await bcrypt.hash(novaSenha, 10); 
    await usuario.save();
    delete tokensRecuperacaoMemoria[username]; 
    return res.status(200).json({ mensagem: "Senha redefinida!" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log("✅ Sistema Back-end com Geolocalização de GPS e Perfis Ativos!");
});