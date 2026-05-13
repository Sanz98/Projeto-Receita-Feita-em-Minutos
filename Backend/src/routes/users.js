const express = require("express");
const router = express.Router();
const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");

const userController = require('../controllers/userController');

// Suas rotas existentes (login, cadastro, etc) ...

//  rota deletar usuario 
router.delete('/:id', userController.deletar);

// Novas rotas para recuperação de senha
router.post('/esqueci-senha', userController.solicitarRecuperacao);
router.post('/redefinir-senha', userController.redefinirSenha);

// Puxa a chave do .env
const SECRET = process.env.JWT_SECRET;
// Caminho corrigido para buscar users.json
const caminho = path.join(__dirname, "../../Data/users.json");

// LOGIN
router.post("/login", (req, res) => {
  const { usuario, senha } = req.body;
  try {
    const data = fs.readFileSync(caminho, "utf-8");
    const usuarios = JSON.parse(data);
    const user = usuarios.find(
      u => u.usuario === usuario && u.senha === senha
    );
    if (!user) {
      return res.status(401).send("Credenciais inválidas");
    }
    const token = jwt.sign(
      { usuario: user.usuario },
      SECRET,
      { expiresIn: "1h" }
    );
    res.json({ token });
  } catch (error) {
    res.status(500).send("Erro no login");
  }
});



module.exports = router;