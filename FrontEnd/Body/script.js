// === TRAVA DE SEGURANÇA ===
if (localStorage.getItem('logado') !== 'true') {
  window.location.href = 'login.html';
}

function sair() {
  localStorage.removeItem('logado');
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}

const API = "http://localhost:3000/receitas";
let receitasGlobais = [];
let itensParaComprarGlobal = []; 

function obterToken() {
  return localStorage.getItem('token') || "jwt-fake"; 
}

// ==========================================
// FUNÇÃO QUE GERA A IMAGEM DE FALLBACK
// ==========================================
function gerarImagemReceita(nome, link) {
  if (link) {
    const regex = /(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
    const match = link.match(regex);
    if (match && match[1].length === 11) {
      return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
    }
  }
  const busca = (nome && nome !== "Receita via Link") ? nome : "delicious recipe";
  const palavraChave = encodeURIComponent(busca.trim().split(' ')[0]);
  const randomID = Math.floor(Math.random() * 1000);
  return `https://loremflickr.com/400/300/${palavraChave},food/all?lock=${randomID}`;
}

// ==========================================
// FUNÇÃO PARA MOSTRAR O PREVIEW NA HORA DO INPUT
// ==========================================
function mostrarPreview() {
  const link = document.getElementById("input-link").value;
  const imgElement = document.getElementById("previewReceita");

  if (!link) {
    imgElement.style.display = 'none';
    imgElement.src = "";
    return;
  }

  const regex = /(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
  const match = link.match(regex);
  
  if (match && match[1].length === 11) {
    imgElement.src = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
    imgElement.style.display = 'block';
  } else {
    imgElement.src = "https://loremflickr.com/400/300/recipe,cooking/all";
    imgElement.style.display = 'block';
  }
}

// ==========================================
// NAVEGAÇÃO ENTRE AS PÁGINAS DO MENU
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
  if (idPagina === 'compras') atualizarListaCompras();
  if (idPagina === 'pedidos') carregarPedidosShopper();
  if (idPagina === 'perfil') carregarPerfil();
}

// ==========================================
// CARREGAR RECEITAS COM FILTRO, NUMERAÇÃO E BOTÃO EDITAR
// ==========================================
async function carregar() {
  try {
    const res = await fetch(API);
    receitasGlobais = await res.json();
    const lista = document.getElementById("lista");
    if (!lista) return;
    lista.innerHTML = "";

    receitasGlobais.forEach((r, index) => {
      const img = r.imagem || "https://loremflickr.com/400/300/food,recipe/all";

      lista.innerHTML += `
        <div class="historico-card" style="padding: 16px; margin-bottom: 16px; display: flex; align-items: center; position: relative;">
          <div style="position: absolute; top: -10px; left: -10px; background: #10b981; color: #fff; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800; box-shadow: 0 4px 6px rgba(0,0,0,0.4); border: 2px solid #171717;">
            ${index + 1}
          </div>
          
          <img src="${img}" alt="${r.nome}" style="width: 70px; height: 70px; border-radius: 8px; object-fit: cover; margin-right: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.5);">
          
          <div style="display: flex; flex-direction: column; gap: 4px; flex: 1; padding-left: 5px;">
            <h3 style="font-size: 1rem; font-weight: 700; color: #f5f5f5;">${r.nome}</h3>
            <span style="font-size: 0.825rem; color: #a3a3a3; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 150px;">
              ${r.link || 'Link não informado'}
            </span>
          </div>
          
          <button class="h-icon-btn" onclick="verIngredientes('${r.id}')" style="margin-right: 6px;" title="Ver Ingredientes">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
          </button>
          
          <button class="h-icon-btn" onclick="abrirEditarReceita('${r.id}')" style="margin-right: 6px; color: #3b82f6;" title="Editar Cadastro">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 20px; height: 20px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          </button>
          
          <button class="h-icon-btn" onclick="deletar('${r.id}')" style="color: #ef4444;" title="Excluir">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      `;
    });
  } catch (e) {
    console.error("Erro ao carregar receitas:", e);
  }
}

// ==========================================
// CRIAR RECEITA (INTEGRAÇÃO REAL COM INTELIGÊNCIA ARTIFICIAL - GEMINI)
// ==========================================
async function criarReceita() {
  const linkInput = document.getElementById("input-link");
  const linkOriginal = linkInput ? linkInput.value.trim() : ""; 
  const btnExtrair = document.querySelector("#home .form .btn-primary");

  if (!linkOriginal) {
    return alert("Por favor, cole um link válido para extrair a receita!");
  }

  // --- INÍCIO DO EFEITO VISUAL DE LOADING ---
  const textoOriginal = btnExtrair.innerText;
  btnExtrair.innerText = "Processando IA... 🤖";
  btnExtrair.style.opacity = "0.7";
  btnExtrair.style.cursor = "wait";
  btnExtrair.disabled = true;

  try {
    // 1. Faz a chamada HTTP POST para a rota de IA do nosso Back-end seguro
    const respostaIA = await fetch("http://localhost:3000/receitas/extrair-ia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ link: linkOriginal })
    });

    if (!respostaIA.ok) {
      const erroDados = await respostaIA.json();
      throw new Error(erroDados.mensagem || "A Inteligência Artificial falhou ao analisar este link.");
    }

    // Recebe o objeto estruturado { nome, ingredientes } processado pelo Gemini API
    const dadosExtraidos = await respostaIA.json(); 
    
    const nome = dadosExtraidos.nome || "Receita Extraída por IA";
    const ingredientes = dadosExtraidos.ingredientes || "Ingredientes não catalogados";
    const urlImagemGerada = gerarImagemReceita(nome, linkOriginal);

    // 2. Persiste a receita real gerada pela IA no nosso banco de dados JSON nativo do servidor
    const res = await fetch(API, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${obterToken()}`
      },
      body: JSON.stringify({ nome, ingredientes, link: linkOriginal, imagem: urlImagemGerada })
    });

    if (res.ok) {
      if (linkInput) linkInput.value = "";
      const imgElement = document.getElementById("previewReceita");
      if(imgElement) {
        imgElement.style.display = 'none';
        imgElement.src = "";
      }

      await carregar(); 
      navegar('confirmacao', document.querySelectorAll('.menu button')[7]);
    } else {
      if (res.status === 401 || res.status === 403) {
        alert("Sessão expirada. Faça login novamente.");
        sair();
      } else {
        alert("Erro ao salvar a receita no servidor.");
      }
    }
  } catch (error) {
    console.error("Erro no fluxo de execução de IA:", error);
    alert(error.message || "Falha de comunicação com o motor de Inteligência Artificial.");
  } finally {
    // --- FIM DO EFEITO DE LOADING ---
    btnExtrair.innerText = textoOriginal;
    btnExtrair.style.opacity = "1";
    btnExtrair.style.cursor = "pointer";
    btnExtrair.disabled = false;
  }
}

// ==========================================
// DELETAR RECEITA (COM AVISOS NA TELA)
// ==========================================
async function deletar(id) {
  const confirmacao = confirm("Tem certeza que deseja excluir esta receita permanentemente?");
  if (!confirmacao) return; 

  try {
    const res = await fetch(`${API}/${id}`, { 
      method: "DELETE",
      headers: { "Authorization": `Bearer ${obterToken()}` }
    });

    if (res.ok) {
      alert("Receita excluída com sucesso do banco de dados!");
      carregar(); 
    } else {
      alert("Erro de Autorização: Seu login expirou. Por favor, saia e faça login novamente.");
    }
  } catch (error) {
    console.error("Erro ao deletar receita:", error);
    alert("Erro de conexão. Verifique se o seu servidor Back-end está rodando.");
  }
}

// ==========================================
// GERENCIAMENTO DE EDIÇÃO (MODAL + PUT)
// ==========================================
function abrirEditarReceita(id) {
  const receita = receitasGlobais.find(r => String(r.id) === String(id));
  if (!receita) return alert("Receita não encontrada!");

  document.getElementById("edit-nome").value = receita.nome;
  document.getElementById("edit-link").value = receita.link || "";
  document.getElementById("edit-ingredientes").value = receita.ingredientes;

  const btnSalvar = document.getElementById("btn-salvar-edicao");
  btnSalvar.onclick = () => salvarEdicaoReceita(id, receita.imagem);

  document.getElementById("modal-editar").style.display = "flex";
}

function fecharModalEditar() {
  document.getElementById("modal-editar").style.display = "none";
}

async function salvarEdicaoReceita(id, imagemOriginal) {
  const nome = document.getElementById("edit-nome").value.trim();
  const link = document.getElementById("edit-link").value.trim();
  const ingredientes = document.getElementById("edit-ingredientes").value.trim();

  if (!nome || !ingredientes) {
    return alert("Os campos de Nome e Ingredientes não podem ficar vazios!");
  }

  try {
    const res = await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${obterToken()}`
      },
      body: JSON.stringify({ nome, link, ingredientes, imagem: imagemOriginal })
    });

    if (res.ok) {
      fecharModalEditar();
      carregar(); 
      alert("Receita atualizada com sucesso!");
    } else {
      alert("Erro ao atualizar a receita no servidor.");
    }
  } catch (error) {
    console.error("Erro crítico na requisição PUT:", error);
  }
}

// ==========================================
// INSERÇÃO MANUAL DE RECEITAS
// ==========================================
function abrirModalAdicionar() {
  document.getElementById("add-nome").value = "";
  document.getElementById("add-ingredientes").value = "";
  document.getElementById("add-imagem").value = "";
  document.getElementById("modal-adicionar").style.display = "flex";
}

function fecharModalAdicionar() {
  document.getElementById("modal-adicionar").style.display = "none";
}

async function salvarReceitaManual() {
  const nome = document.getElementById("add-nome").value.trim();
  const ingredientes = document.getElementById("add-ingredientes").value.trim();
  let imagem = document.getElementById("add-imagem").value.trim();

  if (!nome || !ingredientes) {
    return alert("Por favor, preencha o Nome e os Ingredientes para criar a receita!");
  }

  if (!imagem) {
    const palavraChave = encodeURIComponent(nome.trim().split(' ')[0]);
    const randomID = Math.floor(Math.random() * 1000);
    imagem = `https://loremflickr.com/400/300/${palavraChave},food/all?lock=${randomID}`;
  }

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${obterToken()}`
      },
      body: JSON.stringify({ nome, ingredientes, link: "Receita de Família (Manual)", imagem })
    });

    if (res.ok) {
      fecharModalAdicionar();
      await carregar(); 
      alert("Receita criada com sucesso!");
    } else {
      if (res.status === 401 || res.status === 403) {
        alert("Sessão expirada. Faça login novamente.");
        sair();
      } else {
        alert("Erro ao salvar a receita no servidor.");
      }
    }
  } catch (error) {
    console.error("Erro ao salvar receita manual:", error);
    alert("Falha de conexão com o servidor.");
  }
}

// ==========================================
// VISUALIZAR INGREDIENTES EXTRAÍDOS
// ==========================================
function verIngredientes(idDaReceita) {
  const receita = receitasGlobais.find(r => String(r.id) === String(idDaReceita));
  if (!receita) return;

  navegar('ingredientes', document.querySelectorAll('.menu button')[1]);
  document.getElementById('titulo-ingredientes').innerText = `Ingredientes: ${receita.nome}`;
  
  const divLista = document.getElementById('lista-ingredientes');
  let listaHtml = '';
  let itensLista = receita.ingredientes;

  if (!itensLista || itensLista === "undefined") {
    itensLista = "Nenhum ingrediente identificado";
  }

  itensLista.split(',').forEach(item => {
    if (item.trim() !== '') {
      listaHtml += `
        <label class="checkbox-label" style="margin-bottom: 12px; display: flex; align-items: center; padding: 10px; border-radius: 6px; background: #262626; border: 1px solid #404040; cursor: pointer;">
          <input type="checkbox" class="checkbox-input" onchange="toggleCheckbox(this)" style="margin-right: 10px;" data-nome="${item.trim()}">
          <span class="checkbox-text" style="color: #e5e5e5;">${item.trim()}</span>
        </label>
      `;
    }
  });

  divLista.innerHTML = listaHtml;
  capturarItensParaFaltantes(); 
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
  capturarItensParaFaltantes();
}

function capturarItensParaFaltantes() {
  const checkboxes = document.querySelectorAll('#lista-ingredientes .checkbox-input');
  itensParaComprarGlobal = [];
  checkboxes.forEach(cb => {
    if (!cb.checked) {
      itensParaComprarGlobal.push(cb.getAttribute('data-nome'));
    }
  });
}

// ==========================================
// ABA DE LISTA DE COMPRAS
// ==========================================
function atualizarListaCompras() {
  const container = document.getElementById("lista-compras-itens");
  if (!container) return;

  if (itensParaComprarGlobal.length === 0) {
    container.innerHTML = `<p class="empty-text" style="color: #737373;">Todos os ingredientes estão marcados como disponíveis ou nenhuma receita foi selecionada.</p>`;
    return;
  }

  let html = `<div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px;">`;
  let valorTotal = 0;

  itensParaComprarGlobal.forEach(item => {
    const precoMockado = (Math.random() * (15 - 3) + 3);
    valorTotal += precoMockado;

    html += `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #262626; border-radius: 6px; border: 1px solid #404040;">
        <span style="color: #e5e5e5; font-weight: 500;">${item}</span>
        <span style="color: #10b981; font-weight: 700;">R$ ${precoMockado.toFixed(2).replace('.', ',')}</span>
      </div>
    `;
  });

  html += `</div>`;
  html += `
    <div style="padding: 16px; background: #171717; border-radius: 8px; border: 2px dashed #10b981; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
      <span style="font-weight: 700; color: #a3a3a3;">Total Estimado (Shopper):</span>
      <span style="font-size: 1.25rem; font-weight: 800; color: #10b981;">R$ ${valorTotal.toFixed(2).replace('.', ',')}</span>
    </div>
  `;

  container.innerHTML = html;

  const btnConfirmar = document.querySelector("#compras .btn-primary");
  if (btnConfirmar) {
    btnConfirmar.setAttribute("onclick", `fecharPedidoShopper(${valorTotal})`);
  }
}

// ==========================================
// INTERAÇÃO COM HISTÓRICO DE PEDIDOS DO DELIVERY
// ==========================================
function fecharPedidoShopper(valorTotal) {
  if (itensParaComprarGlobal.length === 0) return alert("Seu carrinho de compras está vazio!");

  const numeroPedido = Math.floor(Math.random() * (9999 - 1000) + 1000);
  const novoPedido = {
    id: numeroPedido,
    itensContagem: itensParaComprarGlobal.length,
    total: valorTotal.toFixed(2),
    status: "Em rota de entrega",
    horaCriacao: Date.now() 
  };

  let pedidosAtuais = JSON.parse(localStorage.getItem('pedidos_shopper') || "[]");
  pedidosAtuais.unshift(novoPedido);
  localStorage.setItem('pedidos_shopper', JSON.stringify(pedidosAtuais));

  itensParaComprarGlobal = []; 
  navegar('confirmacao', document.querySelectorAll('.menu button')[7]);
}

function carregarPedidosShopper() {
  const container = document.getElementById("lista-pedidos-shopper");
  if (!container) return;

  const pedidos = JSON.parse(localStorage.getItem('pedidos_shopper') || "[]");

  if (pedidos.length === 0) {
    container.innerHTML = `
      <div class="historico-card" style="padding: 16px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h4 style="font-weight: 700; color: #f5f5f5;">Nenhum pedido ativo</h4>
          <span style="font-size: 0.85rem; color: #a3a3a3;">Monte uma lista de compras e confirme o pedido.</span>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = pedidos.map(p => {
    const minutosDecorridos = Math.floor((Date.now() - (p.horaCriacao || Date.now())) / 60000);
    let tempoRestante = 30 - minutosDecorridos;
    let statusText = p.status || "Em rota de entrega";
    let tempoText = `Entrega em ${tempoRestante} min`;

    if (tempoRestante <= 0) {
      tempoRestante = 0;
      statusText = "Entregue";
      tempoText = "Concluído";
    }

    return `
      <div class="historico-card" style="padding: 16px; margin-bottom: 20px; border-left: 4px solid #10b981; display: block;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h4 style="font-weight: 700; color: #f5f5f5;">Pedido Express #${p.id}</h4>
            <span style="font-size: 0.85rem; color: #a3a3a3;">${p.itensContagem} produtos • R$ ${p.total.replace('.', ',')}</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
            <span style="color: #10b981; font-weight: 600; font-size: 0.9rem;">${statusText}</span>
            <span style="font-size: 0.85rem; color: #FFB800; font-weight: 700;">⏱ ${tempoText}</span>
          </div>
        </div>
        
        ${tempoRestante > 0 ? `
        <div style="margin-top: 15px; width: 100%; height: 180px; border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color);">
          <iframe src="https://maps.google.com/maps?q=Sumaré,São Paulo&t=&z=13&ie=UTF8&iwloc=&output=embed" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
        </div>
        ` : ''}
      </div>
    `;
  }).join('');

  setTimeout(carregarPedidosShopper, 60000);
}

// ==========================================
// HISTÓRICO DE RECEITAS
// ==========================================
async function carregarHistorico() {
  try {
    const res = await fetch(API);
    const data = await res.json();
    const lista = document.getElementById("lista-historico");
    if (!lista) return;
    lista.innerHTML = "";

    data.forEach((r, index) => {
      const img = r.imagem || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80";

      lista.innerHTML += `
        <div class="historico-card" style="margin-bottom: 16px; padding: 16px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <img src="${img}" alt="${r.nome}" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover; box-shadow: 0 2px 4px rgba(0,0,0,0.5);">
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <h3 style="font-size: 1.125rem; font-weight: 700; color: #f5f5f5;">#${r.id || (index + 1)} - ${r.nome}</h3>
              <div style="display: flex; gap: 12px; font-size: 0.875rem; font-weight: 500;">
                <span style="color: #a3a3a3;">Sincronizado via Web Scraping</span>
                <span style="color: #10b981;">Ativo</span>
              </div>
            </div>
          </div>
          <button class="h-icon-btn" onclick="verIngredientes('${r.id}')" title="Ver Receita">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
          </button>
        </div>
      `;
    });
  } catch (error) {
    console.error("Erro ao carregar histórico:", error);
  }
}

// ==========================================
// SISTEMA DE AVALIAÇÃO (ESTRELAS)
// ==========================================
let notaSelecionada = 0;

function hoverEstrela(valor) {
  const stars = document.querySelectorAll(".star");
  stars.forEach(star => {
    if (star.getAttribute("data-value") <= valor) {
      star.style.color = "#FFB800"; 
    } else {
      star.style.color = "#323238"; 
    }
  });
}

function resetEstrelas() {
  hoverEstrela(notaSelecionada); 
}

function selecionarNota(valor) {
  notaSelecionada = valor;
  hoverEstrela(valor);
}

async function enviarAvaliacao() {
  if (notaSelecionada === 0) {
    return alert("Por favor, selecione pelo menos uma estrela para nos avaliar!");
  }

  const comentario = document.getElementById("comentario-avaliacao").value.trim();

  try {
    const res = await fetch("http://localhost:3000/avaliacoes", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${obterToken()}` 
      },
      body: JSON.stringify({ nota: notaSelecionada, comentario: comentario })
    });

    if (res.ok) {
      notaSelecionada = 0;
      resetEstrelas();
      document.getElementById("comentario-avaliacao").value = "";
      
      navegar('confirmacao', document.querySelectorAll('.menu button')[7]);
    } else {
      if (res.status === 401 || res.status === 403) {
         alert("Sessão expirada! Por favor, faça login novamente para avaliar.");
         sair();
      } else {
         alert("Erro ao enviar avaliação no servidor.");
      }
    }
  } catch (error) {
    console.error("Erro na avaliação:", error);
    alert("Falha na conexão com o Back-end.");
  }
}

// ==========================================
// MEU PERFIL (GESTÃO DE CONTA)
// ==========================================
function carregarPerfil() {
  const token = obterToken();
  if (token !== "jwt-fake") {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      document.getElementById('perfil-username').innerText = payload.username || "Usuário";
    } catch(e) {
      console.error("Erro ao decodificar perfil:", e);
    }
  }
}

async function alterarSenha() {
  const senhaAtual = document.getElementById("senha-atual").value.trim();
  const novaSenha = document.getElementById("nova-senha").value.trim();

  if (!senhaAtual || !novaSenha) return alert("Preencha a senha atual e a nova senha!");
  if (novaSenha.length < 6) return alert("A nova senha deve ter pelo menos 6 caracteres.");

  try {
    const res = await fetch("http://localhost:3000/perfil/senha", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${obterToken()}`
      },
      body: JSON.stringify({ senhaAtual, novaSenha })
    });

    const dados = await res.json();
    alert(dados.mensagem);

    if (res.ok) {
      document.getElementById("senha-atual").value = "";
      document.getElementById("nova-senha").value = "";
    }
  } catch (error) {
    alert("Erro de conexão com o servidor ao alterar senha.");
  }
}

async function excluirConta() {
  const confirmacao = confirm("CUIDADO: Tem certeza absoluta que deseja excluir sua conta? TODOS os seus dados e receitas serão perdidos para sempre!");
  if (!confirmacao) return;

  try {
    const res = await fetch("http://localhost:3000/perfil", {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${obterToken()}` }
    });

    const dados = await res.json();
    
    if (res.ok) {
      alert(dados.mensagem);
      sair(); 
    } else {
      alert(dados.mensagem || "Erro ao excluir conta.");
    }
  } catch (error) {
    alert("Erro de conexão com o servidor.");
  }
}

// Inicialização automática
carregar();