const express = require('express');
const router = express.Router();

// Importar o Controller de Usuários e o Middleware de Autenticação (Token)
const userController = require('../controllers/userController');
const { verificarToken } = require('../Middleware/auth');

router.get('/', userController.listar);
router.post('/register', userController.register);
router.post('/login', userController.login);
router.put('/:id', verificarToken, userController.atualizar);
router.delete('/:id', verificarToken, userController.deletar);

module.exports = router;