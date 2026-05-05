const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const { SECRET } = require("../middleware/auth");

const caminho = "./data/usuarios.json";

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

module.exports = { login, register,refresh,logout };