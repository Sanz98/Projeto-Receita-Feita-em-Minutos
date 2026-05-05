const express = require('express');
const cors = require('cors');
const fs = require('fs');
const bcrypt = require('bcrypt');
const path = require('path');
const caminhoReceitas = path.join(__dirname, "./Data/receitas.json");
const caminhoUsuarios = path.join(__dirname, "./Data/users.json");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// A linha mágica do Frontend
app.use(express.static(path.join(__dirname, '../FrontEnd/Body')));

// ... (daqui para baixo, a partir da linha 16, você mantém o seu código normal com as rotas app.get("/receitas", etc) ....

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
// ROTA DE CADASTRO (REGISTER)
// ==========================================
app.post('/users/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const usersPath = './Data/users.json';
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

    const usuarioExiste = users.find(u => u.username === username);
    if (usuarioExiste) {
      return res.status(400).json({ mensagem: "Nome de usuário já existe!" });
    }

    // Criptografa a senha antes de salvar
    const senhaCriptografada = await bcrypt.hash(password, 10);

    const novoUsuario = {
      id: users.length > 0 ? users[users.length - 1].id + 1 : 1,
      username: username,
      password: senhaCriptografada // Salva o hash seguro
    };

    users.push(novoUsuario);
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

    res.status(201).json({ mensagem: "Usuário criado!" });
  } catch (error) {
    res.status(500).json({ mensagem: "Erro ao cadastrar." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});