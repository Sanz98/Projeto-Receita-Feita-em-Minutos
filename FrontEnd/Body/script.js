// === TRAVA DE SEGURANÇA ===
if (localStorage.getItem('logado') !== 'true') {
  window.location.href = 'login.html';
}

function sair() {
  localStorage.removeItem('logado');
  localStorage.removeItem('token');
  localStorage.removeItem('perfil');
  window.location.href = 'login.html';
}

let baseUrl = '';
const host = window.location.hostname;
if (host === '127.0.0.1' || host === 'localhost' || window.location.protocol === 'file:') {
    if(window.location.port !== '3000') {
        baseUrl = 'http://localhost:3000';
    }
}

const API = `${baseUrl}/receitas`;
let receitasGlobais = [];
let itensParaComprarGlobal = []; 

function obterToken() {
  return localStorage.getItem('token') || "jwt-fake"; 
}

// ==========================================
// SISTEMA DE NOTIFICAÇÕES (TOAST) MINIMALISTA
// ==========================================
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position: fixed; bottom: 30px; right: 20px; z-index: 10000; display: flex; flex-direction: column; gap: 12px; pointer-events: none; align-items: flex-end;';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  const bgColor = type === 'success' ? '#10b981' : '#ef4444';
  const icon = type === 'success' 
    ? `<svg style="width: 22px; height: 22px; color: ${bgColor}; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>`
    : `<svg style="width: 22px; height: 22px; color: ${bgColor}; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>`;

  toast.style.cssText = `
    background: #202024; 
    border: 1px solid #323238;
    border-left: 4px solid ${bgColor}; 
    color: #f5f5f5; 
    padding: 16px 20px; 
    border-radius: 12px; 
    box-shadow: 0 10px 30px rgba(0,0,0,0.5); 
    font-family: 'Poppins', sans-serif; 
    font-size: 0.95rem; 
    font-weight: 500; 
    display: flex; 
    align-items: center; 
    gap: 14px; 
    width: max-content;
    max-width: calc(100vw - 40px);
    transform: translateX(120%); 
    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease; 
    opacity: 0;
    pointer-events: auto;
  `;
  
  toast.innerHTML = `${icon} <span style="line-height: 1.4;">${message}</span>`;
  container.appendChild(toast);
  
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
  });
  
  setTimeout(() => {
    toast.style.transform = 'translateX(120%)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

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
// CARREGAR RECEITAS
// ==========================================
async function carregar() {
  try {
    const res = await fetch(API, {
      method: "GET",
      headers: { "Authorization": `Bearer ${obterToken()}` }
    });

    if (res.status === 401 || res.status === 403) {
      sair(); 
      return;
    }

    if (!res.ok) return;

    const data = await res.json();
    receitasGlobais = Array.isArray(data) ? data : [];
    
    const lista = document.getElementById("lista");
    if (!lista) return;
    lista.innerHTML = "";

    receitasGlobais.forEach((r, index) => {
      const img = r.imagem || gerarImagemReceita(r.nome, r.link);

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
          
          <button class="h-icon-btn" onclick="verIngredientes('${r._id}')" style="margin-right: 6px;" title="Ver Ingredientes">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
          </button>
          
          <button class="h-icon-btn" onclick="abrirEditarReceita('${r._id}')" style="margin-right: 6px; color: #3b82f6;" title="Editar Cadastro">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 20px; height: 20px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          </button>
          
          <button class="h-icon-btn" onclick="deletar('${r._id}')" style="color: #ef4444;" title="Excluir">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      `;
    });
  } catch (e) {
    console.error("Erro no processo de carregamento:", e);
  }
}

// ==========================================
// CRIAR RECEITA (INTEGRAÇÃO DA IA)
// ==========================================
async function criarReceita() {
  const linkInput = document.getElementById("input-link");
  const linkOriginal = linkInput ? linkInput.value.trim() : ""; 
  const btnExtrair = document.querySelector("#home .form .btn-primary");

  if (!linkOriginal) {
    return showToast("Por favor, cole um link válido para extrair a receita!", "error");
  }

  const textoOriginal = btnExtrair.innerText;
  btnExtrair.innerText = "Processando IA... 🤖";
  btnExtrair.style.opacity = "0.7";
  btnExtrair.style.cursor = "wait";
  btnExtrair.disabled = true;

  try {
    const respostaIA = await fetch(`${baseUrl}/receitas/extrair-ia`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ link: linkOriginal })
    });

    if (!respostaIA.ok) {
      const erroDados = await respostaIA.json();
      throw new Error(erroDados.mensagem || "A Inteligência Artificial falhou ao analisar este link.");
    }

    const dadosExtraidos = await respostaIA.json(); 
    
    const nome = dadosExtraidos.nome || "Receita Extraída por IA";
    const ingredientes = dadosExtraidos.ingredientes || "Ingredientes não catalogados";
    const urlImagemGerada = dadosExtraidos.imagem || gerarImagemReceita(nome, linkOriginal);

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
      showToast("Receita extraída com sucesso!", "success");
      navegar('confirmacao', document.querySelectorAll('.menu button')[7]);
    } else {
      if (res.status === 401 || res.status === 403) {
        showToast("Sessão expirada. Faça login novamente.", "error");
        sair();
      } else {
        showToast("Erro ao salvar a receita no servidor.", "error");
      }
    }
  } catch (error) {
    console.error("Erro no fluxo de execução de IA:", error);
    showToast(error.message || "Falha de conexão com a Inteligência Artificial.", "error");
  } finally {
    btnExtrair.innerText = textoOriginal;
    btnExtrair.style.opacity = "1";
    btnExtrair.style.cursor = "pointer";
    btnExtrair.disabled = false;
  }
}

// ==========================================
// DELETAR RECEITA
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
      showToast("Receita excluída com sucesso!", "success");
      carregar(); 
    } else {
      showToast("Erro ao excluir receita do servidor.", "error");
    }
  } catch (error) {
    console.error("Erro ao deletar receita:", error);
    showToast("Erro de conexão. Verifique se o seu servidor Back-end está rodando.", "error");
  }
}

// ==========================================
// GERENCIAMENTO DE EDIÇÃO (MODAL + PUT)
// ==========================================
function abrirEditarReceita(id) {
  const receita = receitasGlobais.find(r => String(r._id) === String(id));
  if (!receita) return showToast("Receita não encontrada!", "error");

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
    return showToast("Os campos de Nome e Ingredientes não podem ficar vazios!", "error");
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
      showToast("Receita atualizada com sucesso!", "success");
    } else {
      showToast("Erro ao atualizar a receita no servidor.", "error");
    }
  } catch (error) {
    console.error("Erro crítica na requisição PUT:", error);
    showToast("Erro de requisição ao servidor.", "error");
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
    return showToast("Por favor, preencha o Nome e os Ingredientes para criar a receita!", "error");
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
      showToast("Receita criada com sucesso!", "success");
    } else {
      if (res.status === 401 || res.status === 403) {
        showToast("Sessão expirada. Faça login novamente.", "error");
        sair();
      } else {
        showToast("Erro ao salvar a receita no servidor.", "error");
      }
    }
  } catch (error) {
    console.error("Erro ao salvar receita manual:", error);
    showToast("Falha de conexão com o servidor.", "error");
  }
}

// ==========================================
// VISUALIZAR INGREDIENTES EXTRAÍDOS
// ==========================================
function verIngredientes(idDaReceita) {
  const receita = receitasGlobais.find(r => String(r._id) === String(idDaReceita));
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
    btnConfirmar.setAttribute("onclick", `abrirModalEndereco('pedido', null, ${valorTotal})`);
  }
}

// ==========================================
// MODAL DE ENDEREÇOS UNIVERSAL (INSERIR E ALTERAR ROTAS)
// ==========================================
function abrirModalEndereco(modo, pedidoId = null, valorTotal = 0) {
  let modal = document.getElementById('modal-endereco');
  if(modal) modal.remove();

  const titulo = modo === 'pedido' ? 'Onde devemos entregar?' : 'Alterar Destino da Entrega';
  const subtitulo = modo === 'pedido' ? 'Selecione ou insira um endereço.' : 'A alteração de rota adicionará uma taxa de R$ 3,00.';
  const btnTexto = modo === 'pedido' ? 'Confirmar e Pedir' : 'Confirmar Nova Rota (+R$ 3,00)';

  modal = document.createElement('div');
  modal.id = 'modal-endereco';
  modal.innerHTML = `
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; justify-content: center; align-items: center; padding: 20px; box-sizing: border-box;">
      <div style="background: #202024; padding: 25px; border-radius: 16px; width: 100%; max-width: 450px; border: 1px solid #323238; max-height: 90vh; overflow-y: auto; font-family: 'Poppins', sans-serif;">
        <h3 style="color: #f5f5f5; margin-top: 0; font-size: 1.3rem;">${titulo}</h3>
        <p style="color: #a3a3a3; font-size: 0.85rem; margin-bottom: 20px;">${subtitulo}</p>

        <div id="area-enderecos-salvos" style="display: none; margin-bottom: 20px;">
          <p style="color: #10b981; font-weight: 600; font-size: 0.85rem; margin: 0 0 10px 0;">Seus Endereços Salvos</p>
          <div id="lista-enderecos" style="display: flex; flex-direction: column; gap: 10px;"></div>
        </div>

        <div id="divisor-ou" style="display: none; text-align: center; color: #737373; font-size: 0.85rem; margin-bottom: 15px; font-weight: 600;">OU PREENCHA UM NOVO ENDEREÇO</div>

        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
          <input type="text" id="input-cep" placeholder="CEP" maxlength="9" onkeyup="mascaraCEP(this)" onchange="desmarcarRadios()" style="flex: 1; padding: 12px; background: #121214; border: 1px solid #323238; border-radius: 8px; color: #f5f5f5; outline: none;">
          <button id="btn-buscar-cep" onclick="buscarCEP()" style="padding: 0 15px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.3s;">Buscar</button>
        </div>

        <input type="text" id="input-rua" placeholder="Rua / Logradouro" oninput="desmarcarRadios()" style="width: 100%; padding: 12px; background: #121214; border: 1px solid #323238; border-radius: 8px; color: #f5f5f5; margin-bottom: 10px; box-sizing: border-box; outline: none;">

        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
          <input type="text" id="input-numero" placeholder="Número" oninput="desmarcarRadios()" style="width: 30%; padding: 12px; background: #121214; border: 1px solid #323238; border-radius: 8px; color: #f5f5f5; box-sizing: border-box; outline: none;">
          <input type="text" id="input-complemento" placeholder="Complemento" oninput="desmarcarRadios()" style="flex: 1; padding: 12px; background: #121214; border: 1px solid #323238; border-radius: 8px; color: #f5f5f5; box-sizing: border-box; outline: none;">
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
          <input type="text" id="input-bairro" placeholder="Bairro" oninput="desmarcarRadios()" style="flex: 1; padding: 12px; background: #121214; border: 1px solid #323238; border-radius: 8px; color: #f5f5f5; box-sizing: border-box; outline: none;">
          <input type="text" id="input-cidade" placeholder="Cidade - UF" oninput="desmarcarRadios()" style="flex: 1; padding: 12px; background: #121214; border: 1px solid #323238; border-radius: 8px; color: #f5f5f5; box-sizing: border-box; outline: none;">
        </div>

        <label style="display: flex; align-items: center; gap: 10px; color: #a3a3a3; font-size: 0.85rem; margin-bottom: 25px; cursor: pointer;">
          <input type="checkbox" id="check-salvar-endereco" style="width: 18px; height: 18px; accent-color: #10b981;"> Salvar este endereço para as próximas compras
        </label>

        <button onclick="processarFormularioEndereco('${modo}', '${pedidoId}', ${valorTotal})" style="width: 100%; padding: 14px; background: #FF6B00; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 1rem; cursor: pointer; margin-bottom: 10px;">${btnTexto}</button>

        <button onclick="fecharModalEndereco()" style="width: 100%; padding: 12px; background: transparent; color: #a3a3a3; border: none; cursor: pointer; font-weight: 500;">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Busca os múltiplos endereços no banco e desenha as opções exclusivas (Radios)
  fetch(`${baseUrl}/perfil/dados`, { headers: { "Authorization": `Bearer ${obterToken()}` } })
    .then(res => res.json())
    .then(data => {
      if (data.enderecosSalvos && data.enderecosSalvos.length > 0) {
        document.getElementById("area-enderecos-salvos").style.display = "block";
        document.getElementById("divisor-ou").style.display = "block";
        const lista = document.getElementById("lista-enderecos");
        
        data.enderecosSalvos.forEach((end, idx) => {
          lista.innerHTML += `
            <label style="display: flex; align-items: center; gap: 12px; background: #1c1c1e; padding: 12px; border-radius: 8px; border: 1px solid #323238; cursor: pointer; color: #f5f5f5; font-size: 0.875rem;">
              <input type="radio" name="endereco-selecionado" value="${end}" style="accent-color: #10b981; width: 18px; height: 18px;" onchange="limparCamposNovoEndereco()">
              <span style="flex: 1;">${end}</span>
            </label>
          `;
        });
      }
    });
}

function fecharModalEndereco() {
  const modal = document.getElementById('modal-endereco');
  if (modal) modal.remove();
}

function mascaraCEP(input) {
  let v = input.value.replace(/\D/g, "");
  if (v.length > 5) v = v.substring(0, 5) + "-" + v.substring(5, 8);
  input.value = v;
}

// Desmarca as opções salvas se o cliente decidir digitar um endereço novo à mão
function desmarcarRadios() {
  const radios = document.querySelectorAll('input[name="endereco-selecionado"]');
  radios.forEach(r => r.checked = false);
}

// Limpa os textos se o cliente desistir e decidir escolher uma opção salva
function limparCamposNovoEndereco() {
  document.getElementById("input-cep").value = "";
  document.getElementById("input-rua").value = "";
  document.getElementById("input-numero").value = "";
  document.getElementById("input-complemento").value = "";
  document.getElementById("input-bairro").value = "";
  document.getElementById("input-cidade").value = "";
  document.getElementById("check-salvar-endereco").checked = false;
}

async function buscarCEP() {
  const cep = document.getElementById("input-cep").value.replace(/\D/g, "");
  if (cep.length !== 8) return showToast("Digite um CEP válido com 8 números!", "error");
  
  const btn = document.getElementById("btn-buscar-cep");
  btn.innerText = "...";
  
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await res.json();
    if (data.erro) {
      showToast("CEP não encontrado.", "error");
    } else {
      document.getElementById("input-rua").value = data.logradouro;
      document.getElementById("input-bairro").value = data.bairro;
      document.getElementById("input-cidade").value = `${data.localidade} - ${data.uf}`;
      desmarcarRadios();
      document.getElementById("input-numero").focus();
    }
  } catch(e) {
    showToast("Erro ao buscar o CEP.", "error");
  } finally {
    btn.innerText = "Buscar";
  }
}

// O Mestre do Roteamento: Lê a escolha (Radio ou Texto Novo) e encaminha para a central
async function processarFormularioEndereco(modo, pedidoId, valorTotal) {
  let enderecoFinal = "";
  const radioSelecionado = document.querySelector('input[name="endereco-selecionado"]:checked');

  // LÓGICA DE EXCLUSIVIDADE: Se marcou a bolinha, usa o salvo. Se não, usa o digitado.
  if (radioSelecionado) {
    enderecoFinal = radioSelecionado.value;
  } else {
    const rua = document.getElementById("input-rua").value.trim();
    const num = document.getElementById("input-numero").value.trim();
    const comp = document.getElementById("input-complemento").value.trim();
    const bairro = document.getElementById("input-bairro").value.trim();
    const cidade = document.getElementById("input-cidade").value.trim();

    if (!rua || !num || !bairro || !cidade) {
      return showToast("Preencha todos os campos do novo endereço ou selecione um dos seus endereços salvos!", "error");
    }

    enderecoFinal = `${rua}, ${num}${comp ? ' - ' + comp : ''} - ${bairro}, ${cidade}`;

    // Se decidiu salvar este novo endereço na lista...
    if (document.getElementById("check-salvar-endereco").checked) {
      try {
        await fetch(`${baseUrl}/perfil/endereco`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${obterToken()}` },
          body: JSON.stringify({ endereco: enderecoFinal })
        });
      } catch(e) { console.warn("Erro ao salvar endereço no perfil."); }
    }
  }

  // REDIRECIONA PARA A ROTA CORRETA DO BACKEND
  if (modo === 'pedido') {
    despacharPedidoNovo(enderecoFinal, valorTotal);
  } else if (modo === 'redefinir') {
    despacharMudancaRota(pedidoId, enderecoFinal);
  }
}

async function despacharPedidoNovo(enderecoFinal, valorTotal) {
  try {
    const res = await fetch(`${baseUrl}/pedidos`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${obterToken()}` },
      body: JSON.stringify({
        itens: itensParaComprarGlobal.join(', '),
        itensContagem: itensParaComprarGlobal.length,
        valorTotal: valorTotal.toFixed(2),
        endereco: enderecoFinal 
      })
    });

    if (res.ok) {
      itensParaComprarGlobal = []; 
      fecharModalEndereco();
      showToast("Pedido confirmado! Buscando motoristas disponíveis...", "success");
      navegar('confirmacao', document.querySelectorAll('.menu button')[7]);
    } else {
      showToast("Erro ao criar pedido no servidor.", "error");
    }
  } catch(e) {
    showToast("Falha de conexão com a central de entregas.", "error");
  }
}

async function despacharMudancaRota(pedidoId, enderecoFinal) {
  try {
    const res = await fetch(`${baseUrl}/pedidos/${pedidoId}/endereco-taxa`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${obterToken()}` },
      body: JSON.stringify({ novoEndereco: enderecoFinal })
    });
    
    const dados = await res.json();
    if (res.ok) {
      fecharModalEndereco();
      showToast(dados.mensagem, "success");
      carregarPedidosShopper();
    } else {
      showToast("Erro ao atualizar o endereço.", "error");
    }
  } catch (error) { showToast("Falha de conexão com a central.", "error"); }
}


// ==========================================
// RASTREAMENTO E GESTÃO DE PEDIDOS ATIVOS
// ==========================================
let timeoutPollingCliente = null;

async function carregarPedidosShopper() {
  const container = document.getElementById("lista-pedidos-shopper");
  if (!container) return;

  try {
    const res = await fetch(`${baseUrl}/pedidos/cliente`, {
      headers: { "Authorization": `Bearer ${obterToken()}` }
    });
    
    if (!res.ok) return;
    const pedidos = await res.json();

    if (pedidos.length === 0) {
      container.innerHTML = `
        <div class="historico-card" style="padding: 16px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h4 style="font-weight: 700; color: #f5f5f5;">Nenhum pedido ativo</h4>
            <span style="font-size: 0.85rem; color: #a3a3a3;">Monte uma lista de compras e confirme o pedido.</span>
          </div>
        </div>
      `;
      clearTimeout(timeoutPollingCliente);
      timeoutPollingCliente = setTimeout(carregarPedidosShopper, 5000);
      return;
    }

    container.innerHTML = pedidos.map(p => {
      let statusText = "Buscando motorista disponível...";
      let corStatus = "#FFB800";
      let tempoText = "Calculando...";

      if (p.status === 'em_rota') {
        statusText = "Motorista a caminho!";
        corStatus = "#10b981";
        tempoText = `Chega em breve`;
      } else if (p.status === 'entregue') {
        statusText = "Entregue e Finalizado";
        corStatus = "#3b82f6";
        tempoText = "Concluído";
      }

      const mapaReal = `https://maps.google.com/maps?q=${encodeURIComponent(p.endereco || 'Sumaré, SP')}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

      return `
        <div class="historico-card" style="padding: 16px; margin-bottom: 20px; border-left: 4px solid ${corStatus}; display: block;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h4 style="font-weight: 700; color: #f5f5f5;">Pedido Shopper</h4>
              <span style="font-size: 0.85rem; color: #a3a3a3;">${p.itensContagem} produtos • R$ ${Number(p.valorTotal).toFixed(2).replace('.', ',')}</span>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
              <span style="color: ${corStatus}; font-weight: 600; font-size: 0.9rem; text-align: right;">${statusText}</span>
              <span style="font-size: 0.85rem; color: #FFB800; font-weight: 700;">⏱ ${tempoText}</span>
            </div>
          </div>
          
          ${p.status !== 'entregue' ? `
          <div style="margin-top: 15px; width: 100%; height: 200px; border-radius: 12px; overflow: hidden; border: 1px solid #323238; position: relative;">
            <iframe src="${mapaReal}" width="100%" height="100%" style="border:0; filter: invert(90%) hue-rotate(180deg);" allowfullscreen="" loading="lazy"></iframe>
            <div style="position: absolute; bottom: 10px; left: 10px; background: rgba(28, 28, 30, 0.9); padding: 8px 12px; border-radius: 6px; font-size: 0.75rem; border: 1px solid #323238; color: #f5f5f5;">
              📍 Rastreamento GPS Satélite Ativo
            </div>
          </div>
          
          <div style="display: flex; gap: 10px; margin-top: 15px;">
            <button onclick="abrirModalEndereco('redefinir', '${p._id}', 0)" style="flex: 1; padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: 0.3s;">Mudar Rota (+R$ 3,00)</button>
            <button onclick="cancelarPedido('${p._id}')" style="flex: 1; padding: 12px; background: transparent; border: 1px solid #ef4444; color: #ef4444; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: 0.3s;">Cancelar Pedido</button>
          </div>
          ` : ''}
        </div>
      `;
    }).join('');

  } catch(e) { console.error("Erro ao sincronizar pedidos:", e); }

  clearTimeout(timeoutPollingCliente);
  timeoutPollingCliente = setTimeout(carregarPedidosShopper, 3000);
}

async function cancelarPedido(id) {
  const confirmacao = confirm("Tem certeza que deseja cancelar este pedido? O motorista será notificado e a corrida será encerrada.");
  if (!confirmacao) return;

  try {
    const res = await fetch(`${baseUrl}/pedidos/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${obterToken()}` }
    });
    if (res.ok) {
      showToast("Pedido cancelado com sucesso.", "success");
      carregarPedidosShopper(); 
    } else {
      showToast("Erro ao cancelar o pedido.", "error");
    }
  } catch (error) { showToast("Falha de conexão com a central.", "error"); }
}

// ==========================================
// HISTÓRICO E AVALIAÇÕES
// ==========================================
async function carregarHistorico() {
  try {
    const res = await fetch(API, { headers: { "Authorization": `Bearer ${obterToken()}` }});
    if (!res.ok) return;
    const data = await res.json();
    receitasGlobais = Array.isArray(data) ? data : [];
    const lista = document.getElementById("lista-historico");
    if (!lista) return;
    lista.innerHTML = "";
    receitasGlobais.forEach((r, index) => {
      const img = r.imagem || gerarImagemReceita(r.nome, r.link);
      lista.innerHTML += `
        <div class="historico-card" style="margin-bottom: 16px; padding: 16px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <img src="${img}" alt="${r.nome}" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover; box-shadow: 0 2px 4px rgba(0,0,0,0.5);">
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <h3 style="font-size: 1.125rem; font-weight: 700; color: #f5f5f5;">${r.nome}</h3>
              <div style="display: flex; gap: 12px; font-size: 0.875rem; font-weight: 500;">
                <span style="color: #a3a3a3;">Sincronizado via Extração</span><span style="color: #10b981;">Ativo</span>
              </div>
            </div>
          </div>
          <button class="h-icon-btn" onclick="verIngredientes('${r._id}')" title="Ver Receita">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
          </button>
        </div>
      `;
    });
  } catch (error) {}
}

let notaSelecionada = 0;
function hoverEstrela(valor) {
  document.querySelectorAll(".star").forEach(star => { star.style.color = star.getAttribute("data-value") <= valor ? "#FFB800" : "#323238"; });
}
function resetEstrelas() { hoverEstrela(notaSelecionada); }
function selecionarNota(valor) { notaSelecionada = valor; hoverEstrela(valor); }

async function enviarAvaliacao() {
  if (notaSelecionada === 0) return showToast("Por favor, selecione pelo menos uma estrela para nos avaliar!", "error");
  const comentario = document.getElementById("comentario-avaliacao").value.trim();
  try {
    const res = await fetch(`${baseUrl}/avaliacoes`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${obterToken()}` }, body: JSON.stringify({ nota: notaSelecionada, comentario: comentario }) });
    if (res.ok) {
      notaSelecionada = 0; resetEstrelas(); document.getElementById("comentario-avaliacao").value = "";
      showToast("Avaliação enviada com sucesso!", "success"); navegar('confirmacao', document.querySelectorAll('.menu button')[7]);
    } else {
      if (res.status === 401 || res.status === 403) { showToast("Sessão expirada! Por favor, faça login novamente para avaliar.", "error"); sair(); } 
      else { showToast("Erro ao enviar avaliação no servidor.", "error"); }
    }
  } catch (error) { showToast("Falha na conexão com o servidor.", "error"); }
}

// ==========================================
// MEU PERFIL (GESTÃO DE CONTA)
// ==========================================
function carregarPerfil() {
  const token = obterToken();
  if (token !== "jwt-fake") {
    try { document.getElementById('perfil-username').innerText = JSON.parse(atob(token.split('.')[1])).username || "Usuário"; } 
    catch(e) {}
  }
}

async function alterarSenha() {
  const senhaAtual = document.getElementById("senha-atual").value.trim();
  const novaSenha = document.getElementById("nova-senha").value.trim();
  if (!senhaAtual || !novaSenha) return showToast("Preencha a senha atual e a nova!", "error");
  if (novaSenha.length < 6) return showToast("A nova senha deve ter pelo menos 6 caracteres.", "error");

  try {
    const res = await fetch(`${baseUrl}/perfil/senha`, { method: "PUT", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${obterToken()}` }, body: JSON.stringify({ senhaAtual, novaSenha }) });
    const dados = await res.json();
    if (res.ok) {
      showToast(dados.mensagem, "success");
      document.getElementById("senha-atual").value = ""; document.getElementById("nova-senha").value = "";
    } else { showToast(dados.mensagem, "error"); }
  } catch (error) { showToast("Erro de conexão com o servidor ao alterar a senha.", "error"); }
}

async function excluirConta() {
  const confirmacao = confirm("CUIDADO: Tem certeza absoluta que deseja excluir a sua conta? TODOS os seus dados e PEDIDOS ATIVOS serão perdidos para sempre!");
  if (!confirmacao) return;

  try {
    const res = await fetch(`${baseUrl}/perfil`, { method: "DELETE", headers: { "Authorization": `Bearer ${obterToken()}` } });
    if (res.ok) {
      showToast("Conta excluída com sucesso", "success"); setTimeout(() => sair(), 1500); 
    } else { showToast("Erro ao excluir conta.", "error"); }
  } catch (error) { showToast("Erro de conexão com o servidor.", "error"); }
}

carregar();