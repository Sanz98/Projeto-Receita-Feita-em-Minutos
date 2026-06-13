const express = require("express");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken"); 
const bcrypt = require("bcrypt"); 
const mongoose = require("mongoose");
require('dotenv').config();

// Importação da biblioteca oficial da Inteligência Artificial do Google
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || "minha_chave_secreta_para_gerar_tokens_12345"; 

// ==========================================
// CONEXÃO COM O BANCO DE DADOS (MONGODB ATLAS)
// ==========================================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado ao MongoDB Atlas com sucesso!'))
  .catch((err) => console.error('❌ Erro ao conectar ao MongoDB:', err));

// 🔥 TESTE DE FOGO: Cole a sua chave nova gerada no Google AI Studio exatamente dentro das aspas abaixo!
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyAIcb4Xw4YwwgBqdCiTU327m_-PVh_ndio");

app.use(cors());
app.use(express.json());

// ==========================================
// IMPORTAÇÃO DOS MODELOS DO BANCO DE DADOS
// ==========================================
// Certifique-se de que criou estes ficheiros na pasta Backend/models/
const User = require('./models/User');
const Receita = require('./models/Receita');
const Avaliacao = require('./models/Avaliacao');

// ==========================================
// SERVIR FICHEIROS ESTÁTICOS DO FRONTEND
// ==========================================
// Lê a pasta onde estão o index.html e login.html
app.use(express.static(path.join(__dirname, "../FrontEnd/Body")));
// Lê a pasta onde está o register.html atualmente
app.use(express.static(path.join(__dirname, "../FrontEnd")));

// ROTA RAIZ: Abre o index.html automaticamente ao aceder a http://localhost:3000
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../FrontEnd/Body/index.html'));
});

// ==========================================
// IMPORTAR E USAR AS ROTAS ORGANIZADAS
// ==========================================
const rotasReceitas = require('./src/routes/receitas');
const rotasUsuarios = require('./src/routes/users');

app.use('/receitas', rotasReceitas);
app.use('/users', rotasUsuarios);

// ==========================================
// ROTA DE EXTRAÇÃO REAL COM INTELIGÊNCIA ARTIFICIAL (GEMINI)
// ==========================================
app.post('/receitas/extrair-ia', async (req, res) => {
  try {
    const { link } = req.body;
    if (!link) {
      return res.status(400).json({ mensagem: "Por favor, forneça um link válido para a extração." });
    }

    let tituloRealDoVideo = "";
    try {
      if (link.includes("youtu")) {
        const urlMetadados = `https://www.youtube.com/oembed?url=${encodeURIComponent(link)}&format=json`;
        const respostaMetadados = await fetch(urlMetadados);
        
        if (respostaMetadados.ok) {
          const metadados = await respostaMetadados.json();
          tituloRealDoVideo = metadados.title || "";
        }
      }
    } catch (erroMetadados) {
      console.log("Aviso: Não foi possível ler o título via oEmbed, o Gemini tentará deduzir em modo global.");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const contextoTitulo = tituloRealDoVideo 
      ? `O título real deste vídeo no YouTube é: "${tituloRealDoVideo}". Use este título como base absoluta para dar nome ao prato.` 
      : "";

    const prompt = `Você é um engenheiro de dados e assistente culinário especializado em estruturação de dados.
    Analise o seguinte link de receita: "${link}".
    ${contextoTitulo}
    
    Com base no contexto fornecido e no seu conhecimento enciclopédico sobre culinária, determine o nome correto do prato e extraia todos os ingredientes necessários para o preparo.
    Regra de formatação de ingredientes: Formate todos os ingredientes numa única linha de texto contínua, onde cada ingrediente é obrigatoriamente separado por uma vírgula simples (Exemplo: "3 ovos, 2 xícaras de açúcar, 1 colher de fermento").
    
    Responda OBRIGATORIAMENTE no formato JSON puro abaixo, sem formatação de bloco de código markdown (sem as três crases), sem a palavra 'json' e sem nenhum texto explicativo adicional:
    {
      "nome": "Nome Correto da Receita Encontrada",
      "ingredientes": "ingrediente um, ingrediente dois, ingrediente três"
    }`;

    const resultado = await model.generateContent(prompt);
    let textoResposta = resultado.response.text().trim();

    if (textoResposta.startsWith("```")) {
      textoResposta = textoResposta.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }
    
    const dadosFormatados = JSON.parse(textoResposta);
    res.status(200).json(dadosFormatados);

  } catch (error) {
    console.error("Erro crítico na integração com o Gemini API:", error);
    res.status(500).json({ mensagem: "Erro interno no servidor ao processar a receita com Inteligência Artificial." });
  }
});

// ==========================================
// ROTA: SISTEMA DE AVALIAÇÕES (VINCULADO AO UTILIZADOR)
// ==========================================
app.post('/avaliacoes', async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ mensagem: "Token não fornecido. Faça login." });
    
    const token = authHeader.split(" ")[1];
    let usuarioLogado;
    try {
      usuarioLogado = jwt.verify(token, SECRET); 
    } catch (err) {
      return res.status(403).json({ mensagem: "Token inválido ou expirado." });
    }

    const { nota, comentario } = req.body;
    
    // Procura avaliação existente do utilizador
    let avaliacaoExistente = await Avaliacao.findOne({ userId: usuarioLogado.id });

    if (avaliacaoExistente) {
      // Atualiza avaliação existente
      avaliacaoExistente.nota = nota;
      avaliacaoExistente.comentario = comentario || "";
      avaliacaoExistente.dataAtualizacao = new Date().toLocaleString('pt-BR');
      await avaliacaoExistente.save();
    } else {
      // Cria nova avaliação
      const novaAvaliacao = new Avaliacao({
        userId: usuarioLogado.id,
        username: usuarioLogado.username,
        nota: nota,
        comentario: comentario || "",
        dataCriacao: new Date().toLocaleString('pt-BR')
      });
      await novaAvaliacao.save();
    }
    
    res.status(201).json({ mensagem: "Avaliação registada/atualizada com sucesso!" });
    
  } catch (error) { 
    console.error("Erro ao guardar avaliação:", error);
    res.status(500).json({ mensagem: "Erro interno ao guardar avaliação" }); 
  }
});

// ==========================================
// ROTAS DE GESTÃO DE PERFIL (MEU PERFIL)
// ==========================================
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
      if (!senhaValida) {
        return res.status(400).json({ mensagem: "A palavra-passe atual está incorreta." }); 
      }
      
      usuario.password = await bcrypt.hash(novaSenha, 10);
      await usuario.save();
      return res.status(200).json({ mensagem: "Palavra-passe alterada com sucesso!" });
    }
    res.status(404).json({ mensagem: "Utilizador não encontrado." });
  } catch (error) {
    console.error("Erro ao alterar palavra-passe no backend:", error);
    res.status(500).json({ mensagem: "Erro no servidor ao alterar a palavra-passe." });
  }
});

app.delete('/perfil', async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ mensagem: "Acesso negado." });
    
    const token = authHeader.split(" ")[1];
    const usuarioLogado = jwt.verify(token, SECRET);

    // Elimina o utilizador, as suas receitas e as suas avaliações
    await User.findByIdAndDelete(usuarioLogado.id);
    await Receita.deleteMany({ userId: usuarioLogado.id });
    await Avaliacao.deleteMany({ userId: usuarioLogado.id });

    res.status(200).json({ mensagem: "A sua conta e dados foram eliminados com sucesso." });
  } catch (error) {
    res.status(500).json({ mensagem: "Erro ao eliminar a conta." });
  }
});

// ==========================================
// ROTAS PÚBLICAS: FLUXO DE RECUPERAÇÃO DE PALAVRA-PASSE (NÃO EXIGEM TOKEN)
// ==========================================
let tokensRecuperacaoMemoria = {}; 

app.post('/users/esqueci-senha', async (req, res) => {
  try {
    const { username } = req.body;

    const usuarioEncontrado = await User.findOne({ username: username });

    if (!usuarioEncontrado) {
      return res.status(404).json({ mensagem: "Nome de utilizador não encontrado." });
    }

    const tokenSeguro = Math.floor(100000 + Math.random() * 900000);
    tokensRecuperacaoMemoria[username] = String(tokenSeguro);

    const linkRedefinir = `redefinirSenha.html?username=${username}&token=${tokenSeguro}`;

    res.status(200).json({ 
      mensagem: "Token emitido com sucesso.",
      link: linkRedefinir 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro interno ao processar a solicitação." });
  }
});

app.post('/users/redefinir-senha', async (req, res) => {
  try {
    const { username, token, novaSenha } = req.body;

    if (!tokensRecuperacaoMemoria[username] || tokensRecuperacaoMemoria[username] !== String(token)) {
      return res.status(400).json({ mensagem: "Token de segurança inválido, expirado ou corrompido." });
    }

    const usuario = await User.findOne({ username: username });

    if (usuario) {
      usuario.password = await bcrypt.hash(novaSenha, 10); 
      await usuario.save();
      delete tokensRecuperacaoMemoria[username]; 
      return res.status(200).json({ mensagem: "Palavra-passe redefinida com total sucesso!" });
    }

    res.status(404).json({ mensagem: "Utilizador não localizado durante a gravação." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro no servidor ao guardar a nova credencial." });
  }
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
app.listen(PORT, () => console.log(`Servidor a correr em http://localhost:${PORT}`));