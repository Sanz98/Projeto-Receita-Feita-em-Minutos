const API = "http://localhost:3000/receitas";

function navegar(idPagina, btnElement) {
  const paginas = document.querySelectorAll('.pagina');
  paginas.forEach(pagina => pagina.style.display = 'none');
  document.getElementById(idPagina).style.display = 'block';

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

// === TELA DE INGREDIENTES EXATA DO FIGMA ===
function verIngredientes(nomeDaReceita, listaDeIngredientes) {
  navegar('ingredientes', document.querySelectorAll('.menu button')[1]);
  
  document.getElementById('titulo-ingredientes').innerText = `Ingredientes: ${nomeDaReceita}`;
  const divLista = document.getElementById('lista-ingredientes');
  const itens = listaDeIngredientes.split(',');
  
  let htmlContexto = '';
  
  itens.forEach(item => {
    htmlContexto += `
      <label class="checkbox-label">
        <input type="checkbox" class="checkbox-input" onchange="toggleCheckbox(this)">
        <span class="checkbox-text">${item.trim()}</span>
      </label>
    `;
  });
  
  divLista.innerHTML = htmlContexto;
}

// Faz o texto ficar riscado e mais escuro ao clicar no checkbox
function toggleCheckbox(element) {
  const label = element.closest('label');
  const text = label.querySelector('.checkbox-text');
  
  if (element.checked) {
      label.style.backgroundColor = 'rgba(38, 38, 38, 0.4)';
      label.style.borderColor = 'rgba(38, 38, 38, 0.5)';
      text.style.textDecoration = 'line-through';
      text.style.color = '#737373';
  } else {
      label.style.backgroundColor = '#262626';
      label.style.borderColor = '#404040';
      text.style.textDecoration = 'none';
      text.style.color = '#e5e5e5';
  }
}

// === TELA DE HISTÓRICO ===
async function carregarHistorico() {
  const res = await fetch(API);
  const data = await res.json();
  const lista = document.getElementById("lista-historico");
  lista.innerHTML = "";
  
  data.forEach(r => {
    lista.innerHTML += `
      <div class="historico-card">
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <h3 style="font-size: 1rem; font-weight: 700; color: #f5f5f5;">${r.nome}</h3>
          <div style="display: flex; gap: 12px; font-size: 0.875rem; font-weight: 500;">
            <span style="color: #a3a3a3;">Adicionado recentemente</span>
            <span style="color: #10b981;">Concluído</span>
          </div>
        </div>
        <button class="h-icon-btn" onclick="verIngredientes('${r.nome}', '${r.ingredientes}')">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>
    `;
  });
}

carregar();