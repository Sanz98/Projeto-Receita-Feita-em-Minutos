const mongoose = require('mongoose');

const PedidoSchema = new mongoose.Schema({
  clienteId: { type: String, required: true },
  clienteNome: { type: String, required: true },
  itens: { type: String, required: true },
  itensContagem: { type: Number, required: true },
  valorTotal: { type: Number, required: true },
  endereco: { type: String, required: true },
  status: { type: String, default: 'aguardando' }, // Pode ser: aguardando, em_rota, entregue
  entregadorId: { type: String, default: null },
  horaCriacao: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pedido', PedidoSchema);