const express = require('express');
const router = express.Router();

// Importar o Controller e o Middleware de Autenticação (Token)
const receitaController = require('../controllers/receitaController');
const { verificarToken } = require('../Middleware/auth');

router.get('/', receitaController.listar);
router.post('/', verificarToken, receitaController.criar);
router.put('/:id', verificarToken, receitaController.atualizar);
router.delete('/:id', verificarToken, receitaController.deletar);

module.exports = router;