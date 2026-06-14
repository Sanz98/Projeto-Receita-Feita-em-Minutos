const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  perfil: { type: String, enum: ['cliente', 'entregador'], default: 'cliente' },
  enderecoSalvo: { type: String, default: "" } // NOVO: Memória de localização do cliente
});

module.exports = mongoose.model('User', UserSchema);