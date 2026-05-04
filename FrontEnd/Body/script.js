const API = "http://localhost:3000/receitas";

function navegar(idPagina, btnElement) {
  const paginas = document.querySelectorAll('.pagina');
  paginas.forEach(pagina => pagina.style.display = 'none');
  document.getElementById(idPagina).style.display = 'block';

  // Gerencia o botão "Ativo" (Branco) no Menu
  if (btnElement) {
    document.querySelectorAll('.menu button').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
  }

  if (idPagina === 'historico') carregarHistorico();
}

async function carregar() {
  const res = await fetch(API);
  const data = await res.json();
  const lista = document.getElementById("lista");
  lista.innerHTML = "";
  
  data.forEach(r => {
    const img = r.imagem || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
    lista.innerHTML += `
      <div class="card-item">
        <img src="${img}" alt="${r.nome}">
        <h3>${r.nome}</h3>
        <p>${r.ingredientes}</p>
        <div class="card-actions">
          <button class="btn-sm btn-details" onclick="verIngredientes('${r.nome}', '${r.ingredientes}')">Detalhes</button>
          <button class="btn-sm btn-delete" onclick="deletar(${r.id})">Excluir</button>
        </div>
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
  
  document.getElementById("nome").value = "";
  document.getElementById("ingredientes").value = "";
  carregar();
}

async function deletar(id) {
  await fetch(`${API}/${id}`, { method: "DELETE" });
  carregar();
}

function verIngredientes(nomeDaReceita, listaDeIngredientes) {
  navegar('ingredientes', document.querySelectorAll('.menu button')[1]);
  
  const divLista = document.getElementById('lista-ingredientes');
  const itens = listaDeIngredientes.split(',');
  
  let htmlContexto = `<h3 style="margin-bottom: 15px;">${nomeDaReceita}</h3>`;
  
  itens.forEach(item => {
    htmlContexto += `
      <label style="display:flex; align-items:center; gap:10px; margin: 12px 0; cursor:pointer; padding: 12px; background: #262626; border-radius: 8px;">
        <input type="checkbox" style="width: 20px; height: 20px; margin:0; padding:0;"> ${item.trim()}
      </label>
    `;
  });
  
  divLista.innerHTML = htmlContexto;
}

async function carregarHistorico() {
  const res = await fetch(API);
  const data = await res.json();
  const lista = document.getElementById("lista-historico");
  lista.innerHTML = "";
  
  data.forEach(r => {
    lista.innerHTML += `
      <div class="card-item" style="flex-direction: row; align-items: center;">
        <div style="flex: 1;">
          <h3 style="margin-bottom: 4px;">${r.nome}</h3>
          <p style="color: #10b981; font-weight: bold;">Concluído</p>
        </div>
        <button class="btn-sm btn-details" style="flex: 0; padding: 10px 20px;" onclick="verIngredientes('${r.nome}', '${r.ingredientes}')">Ver</button>
      </div>
    `;
  });
}

carregar();