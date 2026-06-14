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
// SISTEMA DE NOTIFICAÇÕES (TOAST)
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

  toast.style.cssText = `background: #202024; border: 1px solid #323238; border-left: 4px solid ${bgColor}; color: #f5f5f5; padding: 16px 20px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); font-family: 'Poppins', sans-serif; font-size: 0.95rem; font-weight: 500; display: flex; align-items: center; gap: 14px; width: max-content; max-width: calc(100vw - 40px); transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease; opacity: 0; pointer-events: auto;`;
  
  toast.innerHTML = `${icon} <span style="line-height: 1.4;">${message}</span>`;
  container.appendChild(toast);
  
  requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; toast.style.opacity = '1'; });
  setTimeout(() => { toast.style.transform = 'translateX(120%)'; toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 3500);
}

// ==========================================
// FUNÇÕES DE RECEITA
// ==========================================
function gerarImagemReceita(nome, link) {
  if (link) {
    const regex = /(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
    const match = link.match(regex);
    if (match && match[1].length === 11) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  }
  const busca = (nome && nome !== "Receita via Link") ? nome : "delicious recipe";
  return `https://loremflickr.com/400/300/${encodeURIComponent(busca.trim().split(' ')[0])},food/all?lock=${Math.floor(Math.random() * 1000)}`;
}

function navegar(idPagina, btnElement) {
  document.querySelectorAll('.pagina').forEach(p => p.style.display = 'none');
  const alvo = document.getElementById(idPagina);
  if (alvo) { alvo.style.display = 'block'; window.scrollTo({ top: 0, behavior: 'smooth' }); }
  if (btnElement) { document.querySelectorAll('.menu button').forEach(b => b.classList.remove('active')); btnElement.classList.add('active'); }
  if (idPagina === 'historico') carregarHistorico();
  if (idPagina === 'home') carregar();
  if (idPagina === 'compras') atualizarListaCompras();
  if (idPagina === 'pedidos') carregarPedidosShopper();
  if (idPagina === 'perfil') carregarPerfil();
}

async function carregar() {
  try {
    const res = await fetch(API, { headers: { "Authorization": `Bearer ${obterToken()}` } });
    if (res.status === 401 || res.status === 403) { sair(); return; }
    if (!res.ok) return;

    const data = await res.json();
    receitasGlobais = Array.isArray(data) ? data : [];
    const lista = document.getElementById("lista");
    if (!lista) return;
    lista.innerHTML = "";

    receitasGlobais.forEach((r, index) => {
      lista.innerHTML += `
        <div class="historico-card" style="padding: 16px; margin-bottom: 16px; display: flex; align-items: center; position: relative;">
          <div style="position: absolute; top: -10px; left: -10px; background: #10b981; color: #fff; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800; box-shadow: 0 4px 6px rgba(0,0,0,0.4); border: 2px solid #171717;">${index + 1}</div>
          <img src="${r.imagem || gerarImagemReceita(r.nome, r.link)}" style="width: 70px; height: 70px; border-radius: 8px; object-fit: cover; margin-right: 16px;">
          <div style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
            <h3 style="font-size: 1rem; font-weight: 700; color: #f5f5f5;">${r.nome}</h3>
            <span style="font-size: 0.825rem; color: #a3a3a3; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 150px;">${r.link || 'Link não informado'}</span>
          </div>
          <button class="h-icon-btn" onclick="verIngredientes('${r._id}')" style="margin-right: 6px;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg></button>
          <button class="h-icon-btn" onclick="abrirEditarReceita('${r._id}')" style="margin-right: 6px; color: #3b82f6;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
          <button class="h-icon-btn" onclick="deletar('${r._id}')" style="color: #ef4444;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
        </div>`;
    });
  } catch (e) {}
}

// ==========================================
// MODAL DE ENDEREÇO UNIVERSAL
// ==========================================
function abrirModalEndereco(modo, pedidoId = null, valorTotal = 0) {
  let modal = document.getElementById('modal-endereco');
  if(modal) modal.remove();

  const titulo = modo === 'pedido' ? 'Onde devemos entregar?' : 'Alterar Destino da Entrega';
  const btnTexto = modo === 'pedido' ? 'Confirmar e Pedir' : 'Confirmar Nova Rota (+R$ 3,00)';

  modal = document.createElement('div');
  modal.id = 'modal-endereco';
  modal.innerHTML = `
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; justify-content: center; align-items: center; padding: 20px;">
      <div style="background: #202024; padding: 25px; border-radius: 16px; width: 100%; max-width: 450px; border: 1px solid #323238; max-height: 90vh; overflow-y: auto;">
        <h3 style="color: #f5f5f5; margin-top: 0;">${titulo}</h3>
        <div id="area-enderecos-salvos" style="display: none; margin-bottom: 20px;">
          <p style="color: #10b981; font-size: 0.85rem; margin-bottom: 10px;">Endereços Salvos:</p>
          <div id="lista-enderecos" style="display: flex; flex-direction: column; gap: 10px;"></div>
        </div>
        <div id="divisor-ou" style="display: none; text-align: center; color: #737373; font-size: 0.8rem; margin: 15px 0;">OU NOVO ENDEREÇO</div>
        <input type="text" id="input-cep" placeholder="CEP" onkeyup="mascaraCEP(this)" oninput="desmarcarRadios()" style="width: 100%; padding: 12px; background: #121214; border: 1px solid #323238; color: #f5f5f5; border-radius: 8px; margin-bottom: 10px;">
        <button id="btn-buscar-cep" onclick="buscarCEP()" style="width:100%; padding: 10px; background: #3b82f6; color: white; border: none; border-radius: 8px; margin-bottom: 10px;">Buscar CEP</button>
        <input type="text" id="input-rua" placeholder="Rua" oninput="desmarcarRadios()" style="width: 100%; padding: 12px; background: #121214; border: 1px solid #323238; color: #f5f5f5; border-radius: 8px; margin-bottom: 10px;">
        <input type="text" id="input-numero" placeholder="Número" oninput="desmarcarRadios()" style="width: 100%; padding: 12px; background: #121214; border: 1px solid #323238; color: #f5f5f5; border-radius: 8px; margin-bottom: 10px;">
        <input type="text" id="input-complemento" placeholder="Complemento" oninput="desmarcarRadios()" style="width: 100%; padding: 12px; background: #121214; border: 1px solid #323238; color: #f5f5f5; border-radius: 8px; margin-bottom: 10px;">
        <input type="text" id="input-bairro" placeholder="Bairro" oninput="desmarcarRadios()" style="width: 100%; padding: 12px; background: #121214; border: 1px solid #323238; color: #f5f5f5; border-radius: 8px; margin-bottom: 10px;">
        <input type="text" id="input-cidade" placeholder="Cidade-UF" oninput="desmarcarRadios()" style="width: 100%; padding: 12px; background: #121214; border: 1px solid #323238; color: #f5f5f5; border-radius: 8px; margin-bottom: 10px;">
        <label style="color: #a3a3a3; font-size: 0.8rem; display:flex; align-items:center; gap:8px; margin-bottom:20px;">
           <input type="checkbox" id="check-salvar-endereco"> Salvar este endereço
        </label>
        <button onclick="processarFormularioEndereco('${modo}', '${pedidoId}', ${valorTotal})" style="width: 100%; padding: 14px; background: #FF6B00; color: white; border: none; border-radius: 8px; margin-bottom: 10px;">${btnTexto}</button>
        <button onclick="fecharModalEndereco()" style="width: 100%; padding: 10px; background: transparent; color: #737373; border: none;">Cancelar</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  fetch(`${baseUrl}/perfil/dados`, { headers: { "Authorization": `Bearer ${obterToken()}` } })
    .then(res => res.json())
    .then(data => {
      if (data.enderecosSalvos && data.enderecosSalvos.length > 0) {
        document.getElementById("area-enderecos-salvos").style.display = "block";
        document.getElementById("divisor-ou").style.display = "block";
        const lista = document.getElementById("lista-enderecos");
        data.enderecosSalvos.forEach((end) => {
          const safeEnd = end.replace(/'/g, "\\'");
          lista.innerHTML += `
            <div style="display:flex; gap:8px; align-items:center;">
              <label class="label-endereco-salvo" style="display: flex; align-items: center; gap: 10px; background: #1c1c1e; padding: 10px; border-radius: 8px; border: 1px solid #323238; flex:1; cursor:pointer;">
                <input type="radio" name="endereco-selecionado" value="${end}" onchange="destacarEndereco(this)"> ${end}
              </label>
              <button onclick="deletarEnderecoSalvo('${safeEnd}', '${modo}', '${pedidoId}', ${valorTotal})" style="background:transparent; border:1px solid #ef4444; color:#ef4444; padding:8px; border-radius:8px;">🗑️</button>
            </div>`;
        });
      }
    });
}

async function deletarEnderecoSalvo(endereco, modo, pedidoId, valorTotal) {
  if (!confirm("Remover este endereço?")) return;
  try {
    const res = await fetch(`${baseUrl}/perfil/endereco`, { method: "DELETE", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${obterToken()}` }, body: JSON.stringify({ endereco }) });
    if (res.ok) { showToast("Endereço removido!", "success"); abrirModalEndereco(modo, pedidoId, valorTotal); }
  } catch(e) { showToast("Erro.", "error"); }
}

function fecharModalEndereco() { const m = document.getElementById('modal-endereco'); if(m) m.remove(); }
function mascaraCEP(i) { let v = i.value.replace(/\D/g, ""); if (v.length > 5) v = v.substring(0, 5) + "-" + v.substring(5, 8); i.value = v; }

function destacarEndereco(r) {
  document.querySelectorAll('.label-endereco-salvo').forEach(l => { l.style.borderColor = '#323238'; l.style.background = '#1c1c1e'; });
  r.closest('label').style.borderColor = '#10b981'; r.closest('label').style.background = 'rgba(16, 185, 129, 0.1)';
  document.getElementById("input-cep").value = ""; document.getElementById("input-rua").value = ""; 
  document.getElementById("input-numero").value = ""; document.getElementById("input-complemento").value = "";
  document.getElementById("input-bairro").value = ""; document.getElementById("input-cidade").value = "";
}

function desmarcarRadios() {
  document.querySelectorAll('input[name="endereco-selecionado"]').forEach(r => r.checked = false);
  document.querySelectorAll('.label-endereco-salvo').forEach(l => { l.style.borderColor = '#323238'; l.style.background = '#1c1c1e'; });
}

async function buscarCEP() {
  const inputCEP = document.getElementById("input-cep");
  if(!inputCEP) return;
  const cep = inputCEP.value.replace(/\D/g, "");
  if (cep.length !== 8) return showToast("CEP inválido!", "error");
  const btn = document.getElementById("btn-buscar-cep");
  if(btn) btn.innerText = "...";
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await res.json();
    if (!data.erro) {
      document.getElementById("input-rua").value = data.logradouro;
      document.getElementById("input-bairro").value = data.bairro;
      document.getElementById("input-cidade").value = `${data.localidade} - ${data.uf}`;
      desmarcarRadios(); document.getElementById("input-numero").focus();
    }
  } catch(e) {} finally { if(btn) btn.innerText = "Buscar"; }
}

async function processarFormularioEndereco(modo, pedidoId, valorTotal) {
  let enderecoFinal = "";
  const radio = document.querySelector('input[name="endereco-selecionado"]:checked');
  if (radio) {
    enderecoFinal = radio.value;
  } else {
    const rua = document.getElementById("input-rua").value.trim(); const num = document.getElementById("input-numero").value.trim();
    const comp = document.getElementById("input-complemento").value.trim(); const bairro = document.getElementById("input-bairro").value.trim();
    const city = document.getElementById("input-cidade").value.trim();
    if (!rua || !num || !bairro || !city) return showToast("Preencha todos os campos!", "error");
    enderecoFinal = `${rua}, ${num}${comp ? ' - ' + comp : ''} - ${bairro}, ${city}`;
    if (document.getElementById("check-salvar-endereco").checked) {
      try { await fetch(`${baseUrl}/perfil/endereco`, { method: "PUT", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${obterToken()}` }, body: JSON.stringify({ endereco: enderecoFinal }) }); } catch(e) {}
    }
  }
  if (modo === 'pedido') despacharPedidoNovo(enderecoFinal, valorTotal);
  else despacharMudancaRota(pedidoId, enderecoFinal);
}

// ==========================================
// RASTREAMENTO E CANCELAMENTO
// ==========================================
async function despacharPedidoNovo(endereco, total) {
  try {
    const res = await fetch(`${baseUrl}/pedidos`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${obterToken()}` }, body: JSON.stringify({ itens: itensParaComprarGlobal.join(', '), itensContagem: itensParaComprarGlobal.length, valorTotal: total.toFixed(2), endereco }) });
    if (res.ok) { itensParaComprarGlobal = []; fecharModalEndereco(); showToast("Pedido enviado!", "success"); navegar('confirmacao', document.querySelectorAll('.menu button')[7]); }
  } catch(e) {}
}

async function despacharMudancaRota(id, endereco) {
  try {
    const res = await fetch(`${baseUrl}/pedidos/${id}/endereco-taxa`, { method: "PUT", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${obterToken()}` }, body: JSON.stringify({ novoEndereco: endereco }) });
    if (res.ok) { fecharModalEndereco(); showToast("Rota atualizada!", "success"); carregarPedidosShopper(); }
  } catch(e) {}
}

async function carregarPedidosShopper() {
  const container = document.getElementById("lista-pedidos-shopper");
  if (!container) return;
  try {
    const res = await fetch(`${baseUrl}/pedidos/cliente`, { headers: { "Authorization": `Bearer ${obterToken()}` } });
    const pedidos = await res.json();
    if (pedidos.length === 0) { container.innerHTML = `<div class="historico-card" style="padding:16px;">Nenhum pedido ativo</div>`; return; }
    container.innerHTML = pedidos.map(p => `
      <div class="historico-card" style="padding: 16px; margin-bottom: 20px;">
        <p><strong>Pedido:</strong> ${p.itens}</p>
        <p><strong>Destino:</strong> ${p.endereco}</p>
        ${p.status !== 'entregue' ? `<button onclick="abrirModalEndereco('redefinir', '${p._id}', 0)">Mudar Rota</button>` : ''}
      </div>`).join('');
  } catch(e) {}
  clearTimeout(timeoutPollingCliente); timeoutPollingCliente = setTimeout(carregarPedidosShopper, 3000);
}

// [Manter o restante das funções: carregarHistorico, enviarAvaliacao, carregarPerfil, alterarSenha, excluirConta como estavam...]