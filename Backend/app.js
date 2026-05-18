const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken"); 
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || "minha_chave_secreta_para_gerar_tokens_12345"; 

app.use(cors());
app.use(express.json());

// ==========================================
// IMPORTAR E USAR AS ROTAS ORGANIZADAS
// ==========================================
const rotasReceitas = require('./src/routes/receitas');
const rotasUsuarios = require('./src/routes/users');

app.use('/receitas', rotasReceitas);
app.use('/users', rotasUsuarios);

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
app.put('/perfil/senha', (req, res) => {
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
        if (usuarios[index].password !== senhaAtual) {
          return res.status(400).json({ mensagem: "A senha atual está incorreta." });
        }
        usuarios[index].password = novaSenha;
        fs.writeFileSync(caminhoUsuarios, JSON.stringify(usuarios, null, 2));
        return res.status(200).json({ mensagem: "Senha alterada com sucesso!" });
      }
    }
    res.status(404).json({ mensagem: "Usuário não encontrado." });
  } catch (error) {
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

    // 1. Remover do arquivo de Usuários
    if (fs.existsSync(caminhoUsuarios)) {
      let usuarios = JSON.parse(fs.readFileSync(caminhoUsuarios, 'utf8'));
      usuarios = usuarios.filter(u => String(u.id) !== String(usuarioLogado.id));
      fs.writeFileSync(caminhoUsuarios, JSON.stringify(usuarios, null, 2));
    }

    // 2. Remover do arquivo de Receitas
    if (fs.existsSync(caminhoReceitas)) {
      let receitas = JSON.parse(fs.readFileSync(caminhoReceitas, 'utf8'));
      receitas = receitas.filter(r => String(r.userId) !== String(usuarioLogado.id));
      fs.writeFileSync(caminhoReceitas, JSON.stringify(receitas, null, 2));
    }

    // 3. Remover do arquivo de Avaliações
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