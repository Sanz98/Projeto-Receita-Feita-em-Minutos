const API = "http://localhost:3000/receitas";

// ==========================================
// 1. SISTEMA DE NAVEGAÇÃO DE PÁGINAS
// ==========================================
function navegar(idPagina) {
  // Pega todas as seções que têm a classe 'pagina'
  const paginas = document.querySelectorAll('.pagina');

  // Esconde todas elas
  paginas.forEach(pagina => {
    pagina.style.display = 'none';
  });

  // Mostra apenas a página correspondente ao botão clicado
  document.getElementById(idPagina).style.display = 'block';

  // Se o usuário clicou no Histórico, atualiza a lista de lá
  if (idPagina === 'historico') {
    carregarHistorico();
  }
}

// ==========================================
// 2. LÓGICA DE RECEITAS E COMUNICAÇÃO COM A API
// ==========================================
async function carregar() {
  const res = await fetch(API);
  const data = await res.json();
  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  data.forEach(r => {
    lista.innerHTML += `
      <div class="card">
        <h3>${r.nome}</h3>
        <p>${r.ingredientes}</p>
        <br>
        <button onclick="verIngredientes('${r.nome}', '${r.ingredientes}')">Ver Ingredientes</button>
        <button onclick="deletar(${r.id})">Excluir</button>
      </div>
    `;
  });
}

async function criarReceita() {
  const nome = document.getElementById("nome").value;
  const ingredientes = document.getElementById("ingredientes").value;

  if (!nome || !ingredientes) return alert("Preencha todos os campos!");

  await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, ingredientes })
  });

  // Limpa os campos após enviar
  document.getElementById("nome").value = "";
  document.getElementById("ingredientes").value = "";
  carregar();
}

async function deletar(id) {
  await fetch(`${API}/${id}`, { method: "DELETE" });
  carregar();
}

// ==========================================
// 3. FUNÇÕES PARA AS NOVAS PÁGINAS
// ==========================================

// Prepara a tela de ingredientes e navega pra lá
function verIngredientes(nomeDaReceita, listaDeIngredientes) {
  navegar('ingredientes'); // Vai para a tela 2

  const divLista = document.getElementById('lista-ingredientes');

  // Transforma a string "Carne, pão, queijo" em uma lista separada
  const itens = listaDeIngredientes.split(',');

  let htmlContexto = `<h3>${nomeDaReceita}</h3><hr><br>`;

  // Cria um checkbox para cada ingrediente
  itens.forEach(item => {
    htmlContexto += `
      <label style="display:block; margin: 8px 0; cursor:pointer;">
        <input type="checkbox"> ${item.trim()}
      </label>
    `;
  });

  divLista.innerHTML = htmlContexto;
}

// Busca as receitas para mostrar de forma simplificada no Histórico
async function carregar() {
  const res = await fetch(API);
  const data = await res.json();
  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  data.forEach(r => {
    // Se a receita não tiver imagem, usa uma foto genérica e bonita de comida
    const imagemComida = r.imagem || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";

    lista.innerHTML += `
      <div class="card">
        <img src="${imagemComida}" alt="${r.nome}">
        <h3>${r.nome}</h3>
        <p>${r.ingredientes}</p>
        <div class="card-buttons">
          <button onclick="verIngredientes('${r.nome}', '${r.ingredientes}')">Detalhes</button>
          <button class="btn-excluir" onclick="deletar(${r.id})">Excluir</button>
        </div>
      </div>
    `;
  });
}

async function carregarHistorico() {
  const res = await fetch(API);
  const data = await res.json();
  const lista = document.getElementById("lista-historico");
  lista.innerHTML = "";

  data.forEach(r => {
    const imagemComida = r.imagem || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";

    lista.innerHTML += `
      <div class="card">
        <img src="${imagemComida}" alt="${r.nome}" style="height: 120px;">
        <h3>${r.nome}</h3>
      </div>
    `;
  });
}

// Inicia o app carregando as receitas da API
carregar();