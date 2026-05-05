const API = "http://localhost:3000/receitas";

// === SISTEMA DE NAVEGAÇÃO SPA (7 Páginas) ===
function navegar(idPagina, btnElement) {
  // Esconde todas as seções
  const paginas = document.querySelectorAll('.pagina');
  paginas.forEach(pagina => pagina.style.display = 'none');
  
  // Mostra a seção desejada
  document.getElementById(idPagina).style.display = 'block';

  // Atualiza a barra branca do menu ativo
  if (btnElement) {
    document.querySelectorAll('.menu button').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
  }

  // Comportamentos específicos por página
  if (idPagina === 'historico') carregarHistorico();
  if (idPagina === 'home') carregar();
}

// === TELA: INÍCIO ===
async function carregar() {
  const res = await fetch(API);
  const data = await res.json();
  const lista = document.getElementById("lista");
  lista.innerHTML = "";
  
  data.forEach(r => {
    // Foto dinâmica ou fallback
    const img = r.imagem || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
    lista.innerHTML += `
      <div class="historico-card" style="padding: 16px;">
        <img src="${img}" alt="${r.nome}" style="width: 64px; height: 64px; border-radius: 8px; object-fit: cover; margin-right: 16px;">
        <div style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
          <h3 style="font-size: 1rem; font-weight: 700;">${r.nome}</h3>
          <span style="font-size: 0.875rem; color: #a3a3a3;">Adicionado via API</span>
        </div>
        <button class="h-icon-btn" onclick="verIngredientes('${r.nome}', '${r.ingredientes}')" style="margin-right: 8px;">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>
        </button>
        <button class="h-icon-btn" onclick="deletar(${r.id})" style="color: #ef4444;">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
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

// === TELA: INGREDIENTES ===
function verIngredientes(nomeDaReceita, listaDeIngredientes) {
  // Navega e ativa o segundo botão (Ingredientes)
  navegar('ingredientes', document.querySelectorAll('.menu button')[1]);
  
  document.getElementById('titulo-ingredientes').innerText = `Ingredientes da receita`;
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

// === TELA: HISTÓRICO ===
async function carregarHistorico() {
  const res = await fetch(API);
  const data = await res.json();
  const lista = document.getElementById("lista-historico");
  lista.innerHTML = "";
  
  data.forEach(r => {
    lista.innerHTML += `
      <div class="historico-card">
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <h3 style="font-size: 1.125rem; font-weight: 700; color: #f5f5f5;">${r.nome}</h3>
          <div style="display: flex; gap: 12px; font-size: 0.875rem; font-weight: 500;">
            <span style="color: #a3a3a3;">14/05/2026</span>
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

// Inicia carregando as receitas da API na Home
carregar();