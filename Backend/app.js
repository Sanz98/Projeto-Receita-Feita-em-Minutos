const express = require("express");
const cors = require("cors");
const bcrypt = require('bcrypt');
const fs = require('fs'); // Aproveite e confirme se o fs também está aí!
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const caminhoReceitas = path.join(__dirname, "./Data/receitas.json");
const caminhoUsuarios = path.join(__dirname, "./Data/users.json");

// Importar as rotas de receitas
const rotasReceitas = require('./src/routes/receitas');

// Dizer ao Express para usar estas rotas quando o caminho começar por "/receitas"
app.use('/receitas', rotasReceitas);



// GET (listar receitas)
app.get("/receitas", (req, res) => {
  try {
    const data = fs.readFileSync(caminhoReceitas, "utf-8");
    const receitas = JSON.parse(data);
    res.status(200).json(receitas);
  } catch (error) {
    res.status(500).send("Erro ao buscar receitas");
  } // FECHAMENTO ADICIONADO AQUI
}); // FECHAMENTO ADICIONADO AQUI

// POST (criar receita)
app.post("/receitas", (req, res) => {
  try {
    const { nome, ingredientes } = req.body;
    const data = fs.readFileSync(caminhoReceitas, "utf-8");
    const receitas = JSON.parse(data);

    const nova = {
      id: receitas.length + 1,
      nome,
      ingredientes,
    };

    receitas.push(nova);
    fs.writeFileSync(caminhoReceitas, JSON.stringify(receitas, null, 2));
    res.status(201).json(nova);
  } catch (error) {
    res.status(500).send("Erro ao salvar");
  } // FECHAMENTO ADICIONADO AQUI
}); // FECHAMENTO ADICIONADO AQUI

// PUT (editar)
app.put("/receitas/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { nome, ingredientes } = req.body;
    const data = fs.readFileSync(caminhoReceitas, "utf-8");
    let receitas = JSON.parse(data);

    receitas = receitas.map(r =>
      r.id == id ? { ...r, nome, ingredientes } : r
    );

    fs.writeFileSync(caminhoReceitas, JSON.stringify(receitas, null, 2));
    res.send("Atualizado!");
  } catch (error) {
    res.status(500).send("Erro ao atualizar");
  } // FECHAMENTO ADICIONADO AQUI
}); // FECHAMENTO ADICIONADO AQUI

// DELETE
app.delete("/receitas/:id", (req, res) => {
  try {
    const { id } = req.params;
    const data = fs.readFileSync(caminhoReceitas, "utf-8");
    let receitas = JSON.parse(data);

    receitas = receitas.filter(r => r.id != id);

    fs.writeFileSync(caminhoReceitas, JSON.stringify(receitas, null, 2));
    res.send("Deletado!");
  } catch (error) {
    res.status(500).send("Erro ao deletar");
  } // FECHAMENTO ADICIONADO AQUI
}); // FECHAMENTO ADICIONADO AQUI

// ROTA DE LOGIN
app.post("/login", (req, res) => {
  try {
    const { usuario, senha } = req.body;

    // É preciso ler o arquivo de dados primeiro
    const data = fs.readFileSync(caminhoUsuarios, "utf-8");
    const usuarios = JSON.parse(data);

    const user = usuarios.find(
      u => u.usuario === usuario && u.senha === senha
    );

    if (user) {
      res.status(200).json({ mensagem: "Login OK" });
    } else {
      res.status(401).send("Erro login");
    }
  } catch (error) {
    res.status(500).send("Erro ao processar login");
  } // FECHAMENTO ADICIONADO AQUI
}); // FECHAMENTO ADICIONADO AQUI

// ==========================================
// ROTA DE LOGIN
// ==========================================
app.post('/users/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = JSON.parse(fs.readFileSync('./Data/users.json', 'utf8'));

    // Busca usando 'username' em vez de 'usuario'
    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(400).json({ mensagem: "Usuário não encontrado" });
    }

    // Compara a senha digitada com a criptografada
    const senhaValida = await bcrypt.compare(password, user.password);
    if (!senhaValida) {
      return res.status(400).json({ mensagem: "Senha incorreta" });
    }

    res.status(200).json({ token: "seu-token-jwt-aqui", mensagem: "Login efetuado!" });
  } catch (error) {
    res.status(500).json({ mensagem: "Erro interno." });
  }
});

// ==========================================
// ROTAS DE USUÁRIOS (CRUD)
// ==========================================

// 1. LISTAR USUÁRIOS (GET) 
app.get("/users", (req, res) => {
  try {
    const data = fs.readFileSync(caminhoUsuarios, "utf-8");
    const usuarios = JSON.parse(data);

    // Por segurança, não devolvemos as senhas
    const usuariosSemSenha = usuarios.map(u => ({ id: u.id, username: u.username }));

    res.status(200).json(usuariosSemSenha);
  } catch (error) {
    res.status(500).json({ mensagem: "Erro ao buscar usuários" });
  }
});

// 2. ROTA DE CADASTRO / REGISTER (POST)
app.post('/users/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = JSON.parse(fs.readFileSync(caminhoUsuarios, 'utf8'));

    const usuarioExiste = users.find(u => u.username === username);
    if (usuarioExiste) {
      return res.status(400).json({ mensagem: "Nome de usuário já existe!" });
    }

    // Criptografa a senha antes de salvar
    const senhaCriptografada = await bcrypt.hash(password, 10);

    const novoUsuario = {
      id: users.length > 0 ? users[users.length - 1].id + 1 : 1, // Gera ID sequencial
      username: username,
      password: senhaCriptografada
    };

    users.push(novoUsuario);
    fs.writeFileSync(caminhoUsuarios, JSON.stringify(users, null, 2));

    res.status(201).json({ mensagem: "Usuário criado com sucesso!", usuario: { id: novoUsuario.id, username: novoUsuario.username } });
  } catch (error) {
    res.status(500).json({ mensagem: "Erro ao cadastrar." });
  }
});

// 3. ROTA DE LOGIN (POST)
app.post('/users/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = JSON.parse(fs.readFileSync(caminhoUsuarios, 'utf8'));

    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(400).json({ mensagem: "Usuário não encontrado" });
    }

    // Compara a senha digitada com a criptografada
    const senhaValida = await bcrypt.compare(password, user.password);
    if (!senhaValida) {
      return res.status(400).json({ mensagem: "Senha incorreta" });
    }

    res.status(200).json({ token: "seu-token-jwt-aqui", mensagem: "Login efetuado!" });
  } catch (error) {
    res.status(500).json({ mensagem: "Erro interno no login." });
  }
});

// 4. ROTA PARA DELETAR USUÁRIO (DELETE) - Adicionada!
app.delete('/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = fs.readFileSync(caminhoUsuarios, "utf-8");
    let users = JSON.parse(data);

    const usersRestantes = users.filter(u => u.id != id);

    if (users.length === usersRestantes.length) {
      return res.status(404).json({ mensagem: "Usuário não encontrado" });
    }

    fs.writeFileSync(caminhoUsuarios, JSON.stringify(usersRestantes, null, 2));
    res.status(200).json({ mensagem: "Usuário deletado com sucesso!" });
  } catch (error) {
    res.status(500).json({ mensagem: "Erro ao deletar usuário" });
  }
});

// 5. ROTA PARA ATUALIZAR USUÁRIO (PUT)
app.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password } = req.body;
    
    const data = fs.readFileSync(caminhoUsuarios, "utf-8");
    let users = JSON.parse(data);

    // Encontra a posição do utilizador na lista
    const userIndex = users.findIndex(u => u.id == id);

    if (userIndex === -1) {
      return res.status(404).json({ mensagem: "Usuário não encontrado" });
    }

    // Se o utilizador enviou um novo username, atualizamos
    if (username) {
      // Verifica se o novo username já está a ser usado por outra pessoa
      const usernameEmUso = users.find(u => u.username === username && u.id != id);
      if (usernameEmUso) {
        return res.status(400).json({ mensagem: "Este nome de usuário já está em uso!" });
      }
      users[userIndex].username = username;
    }

    // Se o utilizador enviou uma nova senha, criptografamos e atualizamos
    if (password) {
      users[userIndex].password = await bcrypt.hash(password, 10);
    }

    // Guarda as alterações no ficheiro users.json
    fs.writeFileSync(caminhoUsuarios, JSON.stringify(users, null, 2));
    
    res.status(200).json({ mensagem: "Usuário atualizado com sucesso!" });
  } catch (error) {
    res.status(500).json({ mensagem: "Erro ao atualizar usuário" });
  }
});

// ==========================================

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
