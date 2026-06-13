const mongoose = require('mongoose');

const avaliacaoSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    username: { type: String, required: true },
    nota: { type: Number, required: true },
    comentario: { type: String, default: "" },
    dataCriacao: { type: String, default: "" },
    dataAtualizacao: { type: String, default: "" }
});

module.exports = mongoose.model('Avaliacao', avaliacaoSchema);