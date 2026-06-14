const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  perfil: { type: String, enum: ['cliente', 'entregador'], default: 'cliente' },
  enderecosSalvos: { type: [String], default: [] } // NOVO: Lista de múltiplos endereços
});

module.exports = mongoose.model('User', UserSchema);