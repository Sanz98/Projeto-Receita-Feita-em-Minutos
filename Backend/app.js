const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken"); 
const bcrypt = require("bcrypt"); // CORREÇÃO 1: Importação do bcrypt adicionada
require("dotenv").config();

// Importação da biblioteca oficial da Inteligência Artificial do Google
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || "minha_chave_secreta_para_gerar_tokens_12345"; 

// Inicializa o motor do Gemini utilizando a chave de API guardada no ambiente seguro (.env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

app.use(cors());
app.use(express.json());

// ==========================================
// SERVIR ARQUIVOS ESTÁTICOS DO FRONTEND
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
// ROTA DE EXTRAÇÃO REAL COM INTELIGÊNCIA ARTIFICIAL (GEMINI) + METADADOS DO YOUTUBE
// ==========================================
app.post('/receitas/extrair-ia', async (req, res) => {
  try {
    const { link } = req.body;
    if (!link) {
      return res.status(400).json({ mensagem: "Por favor, forneça um link válido para a extração." });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("Erro: Variável GEMINI_API_KEY não configurada no arquivo .env");
      return res.status(500).json({ mensagem: "Chave de API da Inteligência Artificial não configurada no servidor." });
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
    Regra de formatação de ingredientes: Formate todos os ingredientes em uma única linha de texto contínua, onde cada ingrediente é obrigatoriamente separado por uma vírgula simples (Exemplo: "3 ovos, 2 xícaras de açúcar, 1 colher de fermento").
    
    Responda OBRIGATORIAMENTE no formato JSON puro abaixo, sem formatação de bloco de código markdown (sem as três crases), sem a palavra 'json' e sem nenhum texto explicativo adicionativo:
    {
      "nome": "Nome Correcto da Receita Encontrada",
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
// ROTA: SISTEMA DE AVALIAÇÕES (VINCULADO AO USUÁRIO)
// ==========================================
const caminhoAvaliacoes = path.join(__dirname, "./Data/avaliacoes.json");

app.post('/avaliacoes', (req, res) => {
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
    let avaliacoes = [];
    
    if (fs.existsSync(caminhoAvaliacoes)) {
      const data = fs.readFileSync(caminhoAvaliacoes, 'utf8');
      if (data) avaliacoes = JSON.parse(data);
    }
    
    const indexAvaliacao = avaliacoes.findIndex(av => String(av.userId) === String(usuarioLogado.id));

    if (indexAvaliacao !== -1) {
      avaliacoes[indexAvaliacao].nota = nota;
      avaliacoes[indexAvaliacao].comentario = comentario || "";
      avaliacoes[indexAvaliacao].dataAtualizacao = new Date().toLocaleString('pt-BR');
    } else {
      avaliacoes.push({ 
        idAvaliacao: Date.now(),
        userId: usuarioLogado.id,
        username: usuarioLogado.username,
        nota: nota, 
        comentario: comentario || "", 
        dataCriacao: new Date().toLocaleString('pt-BR') 
      });
    }
    
    fs.writeFileSync(caminhoAvaliacoes, JSON.stringify(avaliacoes, null, 2));
    res.status(201).json({ mensagem: "Avaliação registrada/atualizada com sucesso!" });
    
  } catch (error) { 
    console.error("Erro ao salvar avaliação:", error);
    res.status(500).json({ mensagem: "Erro interno ao salvar avaliação" }); 
  }
});

// ==========================================
// ROTAS DE GESTÃO DE PERFIL (MEU PERFIL)
// ==========================================
const caminhoUsuarios = path.join(__dirname, "./Data/users.json");
const caminhoReceitas = path.join(__dirname, "./Data/receitas.json");

// Alterar Senha do Usuário logado
app.put('/perfil/senha', async (req, res) => { // CORREÇÃO 2: Adicionado async para suportar criptografia síncrona
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ mensagem: "Acesso negado." });
    
    const token = authHeader.split(" ")[1];
    const usuarioLogado = jwt.verify(token, SECRET);
    const { senhaAtual, novaSenha } = req.body;

    if (fs.existsSync(caminhoUsuarios)) {
      let usuarios = JSON.parse(fs.readFileSync(caminhoUsuarios, 'utf8'));
      const index = usuarios.findIndex(u => String(u.id) === String(usuarioLogado.id));

      if (index !== -1) {
        // CORREÇÃO 3: Comparar de forma segura usando bcrypt contra o hash salvo na base de dados
        const senhaValida = await bcrypt.compare(senhaAtual, usuarios[index].password);
        if (!senhaValida) {
          return res.status(400).json({ mensagem: "A senha atual está incorreta." }); // Alinhado para 'mensagem'
        }
        
        // CORREÇÃO 4: Encriptar a nova senha antes de salvar de modo a manter a segurança do login
        usuarios[index].password = await bcrypt.hash(novaSenha, 10);
        
        fs.writeFileSync(caminhoUsuarios, JSON.stringify(usuarios, null, 2));
        return res.status(200).json({ mensagem: "Senha alterada com sucesso!" });
      }
    }
    res.status(404).json({ mensagem: "Usuário não encontrado." });
  } catch (error) {
    console.error("Erro ao alterar senha no backend:", error);
    res.status(500).json({ mensagem: "Erro no servidor ao alterar senha." });
  }
});

// Excluir Conta e Dados Vinculados (LGPD / Privacidade)
app.delete('/perfil', (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ mensagem: "Acesso negado." });
    
    const token = authHeader.split(" ")[1];
    const usuarioLogado = jwt.verify(token, SECRET);

    if (fs.existsSync(caminhoUsuarios)) {
      let usuarios = JSON.parse(fs.readFileSync(caminhoUsuarios, 'utf8'));
      usuarios = usuarios.filter(u => String(u.id) !== String(usuarioLogado.id));
      fs.writeFileSync(caminhoUsuarios, JSON.stringify(usuarios, null, 2));
    }

    if (fs.existsSync(caminhoReceitas)) {
      let receitas = JSON.parse(fs.readFileSync(caminhoReceitas, 'utf8'));
      receitas = receitas.filter(r => String(r.userId) !== String(usuarioLogado.id));
      fs.writeFileSync(caminhoReceitas, JSON.stringify(receitas, null, 2));
    }

    if (fs.existsSync(caminhoAvaliacoes)) {
      let avaliacoes = JSON.parse(fs.readFileSync(caminhoAvaliacoes, 'utf8'));
      avaliacoes = avaliacoes.filter(av => String(av.userId) !== String(usuarioLogado.id));
      fs.writeFileSync(caminhoAvaliacoes, JSON.stringify(avaliacoes, null, 2));
    }

    res.status(200).json({ mensagem: "Sua conta e dados foram excluídos com sucesso." });
  } catch (error) {
    res.status(500).json({ mensagem: "Erro ao excluir a conta." });
  }
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));