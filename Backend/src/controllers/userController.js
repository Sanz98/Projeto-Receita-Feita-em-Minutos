const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { SECRET } = require("../middleware/auth");
const caminho = "./data/usuarios.json";

const crypto = require('crypto'); // Módulo nativo do Node para gerar o token

const usersFilePath = path.join(__dirname, '../../Data/users.json');

// Função auxiliar para ler usuários (você já deve ter algo parecido)
const lerUsuarios = () => JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
const salvarUsuarios = (dados) => fs.writeFileSync(usersFilePath, JSON.stringify(dados, null, 2));

// 1. Função para gerar o token de recuperação
exports.solicitarRecuperacao = async (req, res) => {
  const { email } = req.body;
  let users = lerUsuarios();

  const userIndex = users.findIndex(u => u.email === email);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  // Gera um token aleatório e o tempo de expiração (1 hora)
  const resetToken = crypto.randomBytes(20).toString('hex');
  const resetExpires = Date.now() + 3600000; // 1 hora em milissegundos

  // Salva o token no usuário
  users[userIndex].resetToken = resetToken;
  users[userIndex].resetExpires = resetExpires;
  salvarUsuarios(users);

  // IMPORTANTE: Em um sistema real, você enviaria esse link por E-MAIL (usando Nodemailer).
  // Como estamos em desenvolvimento, vamos exibir o token no console e no retorno da API.
  const linkRecuperacao = `http://127.0.0.1:5500/FrontEnd/Body/redefinir-senha.html?token=${resetToken}`;
  console.log(`Link de recuperação para ${email}: ${linkRecuperacao}`);

  res.status(200).json({ message: 'Instruções de recuperação geradas no console do servidor.', token: resetToken });
};

// 2. Função para salvar a nova senha
exports.redefinirSenha = async (req, res) => {
  const { token, novaSenha } = req.body;
  let users = lerUsuarios();

  // Procura o usuário que tem esse token e se o token ainda não expirou
  const userIndex = users.findIndex(u => u.resetToken === token && u.resetExpires > Date.now());

  if (userIndex === -1) {
    return res.status(400).json({ error: 'Token inválido ou expirado.' });
  }

  // Criptografa a nova senha
  const salt = await bcrypt.genSalt(10);
  const senhaHash = await bcrypt.hash(novaSenha, salt);

  // Atualiza a senha e apaga os dados do token
  users[userIndex].password = senhaHash;
  delete users[userIndex].resetToken;
  delete users[userIndex].resetExpires;

  salvarUsuarios(users);

  res.status(200).json({ message: 'Senha redefinida com sucesso!' });
};

// 🔹 LOGIN
async function login(req, res) {
  const { usuario, senha } = req.body;

  const data = fs.readFileSync(caminho, "utf-8");
  const usuarios = JSON.parse(data);

  const user = usuarios.find(u => u.usuario === usuario);

  if (!user) {
    return res.status(401).send("Usuário não encontrado");
  }

  // 🔐 comparar senha criptografada
  const senhaValida = await bcrypt.compare(senha, user.senha);

  if (!senhaValida) {
    return res.status(401).send("Senha inválida");
  }

  const token = jwt.sign(
    { usuario: user.usuario },
    SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token });
}

// 🔹 REGISTRO (novo usuário)
async function register(req, res) {
  const { usuario, senha } = req.body;

  const data = fs.readFileSync(caminho, "utf-8");
  const usuarios = JSON.parse(data);

  const existe = usuarios.find(u => u.usuario === usuario);

  if (existe) {
    return res.status(400).send("Usuário já existe");
  }

  // Função para eliminar um usuario 
  function deletar(req, res) {
    const { id } = req.params;
    const caminho = "./Data/users.json";

    try {
      const data = fs.readFileSync(caminho, "utf-8");
      let usuarios = JSON.parse(data);

      // Filtra a lista removendo o utilizador com o ID correspondente
      const usuariosRestantes = usuarios.filter(u => u.id != id);

      if (usuarios.length === usuariosRestantes.length) {
        return res.status(404).json({ mensagem: "Usuário não encontrado" });
      }

      fs.writeFileSync(caminho, JSON.stringify(usuariosRestantes, null, 2));
      res.status(200).json({ mensagem: "Usuário deletado com sucesso!" });
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao eliminar utilizador" });
    }
  }

  // Lembre-se de adicionar 'deletar' ao module.exports no final do ficheiro
  module.exports = { register, login, redefinirSenha, deletar };

  // 🔐 CRIPTOGRAFAR SENHA
  const senhaHash = await bcrypt.hash(senha, 10);

  const novo = {
    usuario,
    senha: senhaHash
  };

  usuarios.push(novo);

  fs.writeFileSync(caminho, JSON.stringify(usuarios, null, 2));

  res.status(201).send("Usuário criado");
}

// 🔥 ACCESS TOKEN (curto)
const accessToken = jwt.sign(
  { usuario: user.usuario },
  process.env.JWT_SECRET,
  { expiresIn: process.env.TOKEN_EXPIRES }
);

// 🔥 REFRESH TOKEN (longo)
const refreshToken = jwt.sign(
  { usuario: user.usuario },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: process.env.REFRESH_EXPIRES }
);

refreshTokens.push(refreshToken);

res.json({ accessToken, refreshToken });


function refresh(req, res) {
  const { token } = req.body;

  if (!token) return res.status(401).send("Refresh token requerido");

  if (!refreshTokens.includes(token)) {
    return res.status(403).send("Refresh inválido");
  }

  jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, user) => {
    if (err) return res.status(403).send("Token inválido");

    const newAccessToken = jwt.sign(
      { usuario: user.usuario },
      process.env.JWT_SECRET,
      { expiresIn: process.env.TOKEN_EXPIRES }
    );

    res.json({ accessToken: newAccessToken });
  });
}
function logout(req, res) {
  const { token } = req.body;

  refreshTokens = refreshTokens.filter(t => t !== token);

  res.send("Logout realizado");
}

const fs = require('fs');
const caminhoUsuarios = './Backend/Data/users.json';

// Função para listar todos os usuários
function listar(req, res) {
    try {
        const data = fs.readFileSync(caminhoUsuarios, "utf-8");
        const usuarios = JSON.parse(data);
        
        // Retorna a lista sem as senhas por segurança
        const listaSegura = usuarios.map(u => ({ id: u.id, username: u.username }));
        res.status(200).json(listaSegura);
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao listar usuários" });
    }
}

module.exports = { login, register, refresh, logout };