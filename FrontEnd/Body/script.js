// === TRAVA DE SEGURANÇA (Garante que passe pelo Login primeiro) ===
if (localStorage.getItem('logado') !== 'true') {
  window.location.href = 'login.html';
}

function sair() {
  localStorage.removeItem('logado');
  window.location.href = 'login.html';
}

const API = "http://localhost:3000/receitas";
let receitasGlobais = []; // Vai guardar todas as receitas pra evitar o erro da tela preta

// === SISTEMA DE NAVEGAÇÃO SPA ===
function navegar(idPagina, btnElement) {
  const paginas = document.querySelectorAll('.pagina');
  paginas.forEach(pagina => pagina.style.display = 'none');
  
  const paginaAlvo = document.getElementById(idPagina);
  if (paginaAlvo) {
      paginaAlvo.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Correção oficial do Bug do Scroll!
  }

  if (btnElement) {
    document.querySelectorAll('.menu button').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
  }

  if (idPagina === 'historico') carregarHistorico();
  if (idPagina === 'home') carregar();
}

// === LÓGICA DA API ===
async function carregar() {
  const res = await fetch(API);
  receitasGlobais = await res.json(); // Guarda os dados aqui
  const lista = document.getElementById("lista");
  lista.innerHTML = "";
  
  receitasGlobais.forEach(r => {
    const img = r.imagem || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
    lista.innerHTML += `
      <div class="historico-card" style="padding: 16px;">
        <img src="${img}" alt="${r.nome}" style="width: 64px; height: 64px; border-radius: 8px; object-fit: cover; margin-right: 16px;">
        <div style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
          <h3 style="font-size: 1rem; font-weight: 700;">${r.nome}</h3>
          <span style="font-size: 0.875rem; color: #a3a3a3;">Adicionado via API</span>
        </div>
        <button class="h-icon-btn" onclick="verIngredientes(${r.id})" style="margin-right: 8px;">
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

// === TELA DE INGREDIENTES 100% BLINDADA ===
function verIngredientes(idDaReceita) {
  // Busca a receita pelo ID para não dar erro de aspas no texto
  const receita = receitasGlobais.find(r => r.id === idDaReceita);
  if (!receita) return;

  navegar('ingredientes', document.querySelectorAll('.menu button')[1]);
  
  document.getElementById('titulo-ingredientes').innerText = `Ingredientes: ${receita.nome}`;
  const divLista = document.getElementById('lista-ingredientes');
  
  let listaHtml = '';
  let itensLista = receita.ingredientes;
  
  if (!itensLista || itensLista === "undefined") {
    itensLista = "Nenhum ingrediente";
  }
  
  itensLista.split(',').forEach(item => {
    if (item.trim() !== '') {
      listaHtml += `
        <label class="checkbox-label">
          <input type="checkbox" class="checkbox-input" onchange="toggleCheckbox(this)">
          <span class="checkbox-text">${item.trim()}</span>
        </label>
      `;
    }
  });
  
  divLista.innerHTML = listaHtml;
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
            <span style="color: #a3a3a3;">Adicionado recentemente</span>
            <span style="color: #10b981;">Concluído</span>
          </div>
        </div>
      </div>
    `;
  });
}

// Início automático do App
carregar();