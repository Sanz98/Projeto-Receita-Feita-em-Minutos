const mongoose = require('mongoose');

const receitaSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    nome: { type: String, default: "Nova Receita" },
    ingredientes: { type: String, default: "Sem ingredientes listados" },
    link: { type: String, default: "" },
    imagem: { type: String, default: "" }
});

module.exports = mongoose.model('Receita', receitaSchema);