// === TRAVA DE SEGURANÇA ===
if (localStorage.getItem('logado') !== 'true') {
  window.location.href = 'login.html';
}

function sair() {
  localStorage.removeItem('logado');
  window.location.href = 'login.html';
}

const API = "http://localhost:3000/receitas";
let receitasGlobais = [];

// ==========================================
// NOVO: Função para gerar a imagem dinâmica
// ==========================================
function gerarImagemReceita(nome, link) {
  // 1. Tenta extrair miniatura do YouTube de forma profissional
  if (link) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = link.match(regExp);
    if (match && match[2].length === 11) {
      return `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg`;
    }
  }

  // 2. Se for manual ou link comum, busca uma imagem real baseada no NOME
  // Se o nome for o padrão da IA, tentamos usar a palavra 'food' para não vir imagem aleatória
  const busca = (nome && nome !== "Receita Mágica Extraída") ? nome : "delicious food";
  const palavraChave = encodeURIComponent(busca.trim().split(' ')[0]);

  // Usamos o LoremFlickr com a tag 'recipe' para garantir que venha comida
  return `https://loremflickr.com/400/300/${palavraChave},recipe/all`;
}
// ==========================================

function navegar(idPagina, btnElement) {
  const paginas = document.querySelectorAll('.pagina');
  paginas.forEach(pagina => pagina.style.display = 'none');

  const paginaAlvo = document.getElementById(idPagina);
  if (paginaAlvo) {
    paginaAlvo.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (btnElement) {
    document.querySelectorAll('.menu button').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
  }

  if (idPagina === 'historico') carregarHistorico();
  if (idPagina === 'home') carregar();
}

async function carregar() {
  try {
    const res = await fetch(API);
    receitasGlobais = await res.json(); 
    const lista = document.getElementById("lista");
    if(!lista) return;
    lista.innerHTML = "";
    
    receitasGlobais.forEach(r => {
      // AQUI ESTÁ A CORREÇÃO:
      // Puxa a imagem que foi salva no banco (r.imagem). 
      // Se por algum motivo não tiver imagem salva, usa a busca de comida.
      const img = r.imagem || "https://loremflickr.com/400/300/food,recipe/all";
      
      lista.innerHTML += `
        <div class="historico-card" style="padding: 16px; margin-bottom: 16px; display: flex; align-items: center;">
          <img src="${img}" alt="${r.nome}" style="width: 64px; height: 64px; border-radius: 8px; object-fit: cover; margin-right: 16px;">
          <div style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
            <h3 style="font-size: 1rem; font-weight: 700;">${r.nome}</h3>
            <span style="font-size: 0.875rem; color: #a3a3a3;">Adicionado via API</span>
          </div>
          <button class="h-icon-btn" onclick="verIngredientes('${r.id}')" style="margin-right: 8px;" title="Ver Ingredientes">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
          </button>
          <button class="h-icon-btn" onclick="deletar('${r.id}')" style="color: #ef4444;" title="Excluir">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      `;
    });
  } catch(e) {
    console.error("Erro ao carregar:", e);
  }
}

// === FUNÇÃO CRIAR RECEITA CORRIGIDA ===
async function criarReceita() {
  let nome = document.getElementById("input-nome").value;
  let ingredientes = document.getElementById("input-ingredientes").value;
  const linkInput = document.getElementById("input-link");
  const link = linkInput ? linkInput.value : "";

  if (!nome && !ingredientes && !link) {
    return alert("Por favor, informe pelo menos o nome ou um link!");
  }

  // Simulação de extração por link (se nome ou ingredientes estiverem vazios)
  if (link && (!nome || !ingredientes)) {
    if (!nome) nome = "Receita via Link"; // Nome provisório
    if (!ingredientes) ingredientes = "Extraindo ingredientes do vídeo...";
  }

  // Gera a imagem correta (YouTube ou Busca por Nome)
  const urlImagemGerada = gerarImagemReceita(nome, link);

  try {
    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: nome || "Nova Receita",
        ingredientes: ingredientes || "Lista de ingredientes",
        link,
        imagem: urlImagemGerada
      })
    });

    // Limpa os campos
    document.getElementById("input-nome").value = "";
    document.getElementById("input-ingredientes").value = "";
    if (linkInput) linkInput.value = "";

    carregar(); // Recarrega a lista
  } catch (error) {
    console.error("Erro ao salvar:", error);
  }
}

async function deletar(id) {
  await fetch(`${API}/${id}`, { method: "DELETE" });
  carregar();
}

function verIngredientes(idDaReceita) {
  const receita = receitasGlobais.find(r => String(r.id) === String(idDaReceita));

  if (!receita) {
    alert("Erro ao buscar a receita. Atualize a página e tente novamente.");
    return;
  }

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
        <label class="checkbox-label" style="margin-bottom: 12px;">
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
  if (!lista) return;
  lista.innerHTML = "";

  data.forEach(r => {
    lista.innerHTML += `
      <div class="historico-card" style="margin-bottom: 16px;">
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <h3 style="font-size: 1.125rem; font-weight: 700; color: #f5f5f5;">${r.nome}</h3>
          <div style="display: flex; gap: 12px; font-size: 0.875rem; font-weight: 500;">
            <span style="color: #a3a3a3;">Adicionado recentemente</span>
            <span style="color: #10b981;">Concluído</span>
          </div>
        </div>
        <button class="h-icon-btn" onclick="verIngredientes('${r.id}')" title="Ver Receita">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
        </button>
      </div>
    `;
  });
}

carregar();