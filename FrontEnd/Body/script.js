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
  toast.style.cssText = `background: #202024; border: 1px solid #323238; border-left: 4px solid ${bgColor}; color: #f5f5f5; padding: 16px 20px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); font-family: 'Poppins', sans-serif; font-size: 0.95rem; font-weight: 500; display: flex; align-items: center; gap: 14px; width: max-content; pointer-events: auto;`;
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ==========================================
// FUNÇÕES DE RECEITA
// ==========================================
function gerarImagemReceita(nome, link) {
  if (link) {
    const match = link.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i);
    if (match && match[1].length === 11) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  }
  return `https://loremflickr.com/400/300/${encodeURIComponent((nome || "food").split(' ')[0])},food/all?lock=${Math.floor(Math.random() * 1000)}`;
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
    if (!res.ok) return;
    const data = await res.json();
    receitasGlobais = Array.isArray(data) ? data : [];
    const lista = document.getElementById("lista");
    if (lista) {
      lista.innerHTML = "";
      receitasGlobais.forEach((r, i) => {
        lista.innerHTML += `<div class="historico-card" style="padding:16px; margin-bottom:16px; display:flex; align-items:center;">
          <img src="${r.imagem || gerarImagemReceita(r.nome, r.link)}" style="width:70px; height:70px; border-radius:8px; margin-right:16px;">
          <div style="flex:1;"><h3>${r.nome}</h3></div>
          <button class="h-icon-btn" onclick="verIngredientes('${r._id}')">👁️</button>
          <button class="h-icon-btn" onclick="deletar('${r._id}')">🗑️</button>
        </div>`;
      });
    }
  } catch (e) {}
}

async function criarReceita() {
  const linkInput = document.getElementById("input-link");
  if (!linkInput?.value) return showToast("Cole um link!", "error");
  const btn = document.querySelector("#home .form .btn-primary");
  if(btn) btn.innerText = "Processando..."; btn.disabled = true;
  try {
    const resIA = await fetch(`${baseUrl}/receitas/extrair-ia`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ link: linkInput.value }) });
    const d = await resIA.json();
    const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${obterToken()}` }, body: JSON.stringify({ nome: d.nome, ingredientes: d.ingredientes, link: linkInput.value, imagem: d.imagem }) });
    if (res.ok) { linkInput.value = ""; await carregar(); showToast("Receita extraída!"); navegar('confirmacao', document.querySelectorAll('.menu button')[7]); }
  } catch(e) { showToast("Erro.", "error"); } finally { if(btn) btn.innerText = "Sincronizar"; btn.disabled = false; }
}

async function deletar(id) {
  if (!confirm("Excluir receita?")) return;
  await fetch(`${API}/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${obterToken()}` } });
  carregar();
}

// ==========================================
// GESTÃO DE ENDEREÇOS (COM SEGURANÇA E DELETE)
// ==========================================
function abrirModalEndereco(modo, pedidoId = null, valorTotal = 0) {
  let modal = document.getElementById('modal-endereco');
  if(modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'modal-endereco';
  modal.innerHTML = `
    <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; display:flex; justify-content:center; align-items:center; padding:20px;">
      <div style="background:#202024; padding:25px; border-radius:16px; width:450px; border:1px solid #323238; max-height:90vh; overflow-y:auto;">
        <h3>Endereço de Entrega</h3>
        <div id="area-enderecos-salvos" style="display:none; margin-bottom:20px;">
           <p style="color:#10b981; font-size:0.8rem;">Seus endereços:</p>
           <div id="lista-enderecos" style="display:flex; flex-direction:column; gap:8px;"></div>
        </div>
        <div id="divisor-ou" style="display:none; color:#737373; text-align:center; margin:10px 0;">OU NOVO ENDEREÇO</div>
        <input type="text" id="input-cep" placeholder="CEP" onkeyup="mascaraCEP(this)" oninput="desmarcarRadios()" style="width:100%; padding:10px; background:#121214; color:#fff; border:1px solid #323238; border-radius:8px; margin-bottom:5px;">
        <button id="btn-buscar-cep" onclick="buscarCEP()" style="width:100%; padding:10px; background:#3b82f6; border:none; border-radius:8px; color:white; margin-bottom:10px;">Buscar CEP</button>
        <input type="text" id="input-rua" placeholder="Rua" oninput="desmarcarRadios()" style="width:100%; padding:10px; background:#121214; color:#fff; border:1px solid #323238; border-radius:8px; margin-bottom:5px;">
        <input type="text" id="input-numero" placeholder="Número" oninput="desmarcarRadios()" style="width:100%; padding:10px; background:#121214; color:#fff; border:1px solid #323238; border-radius:8px; margin-bottom:5px;">
        <input type="checkbox" id="check-salvar-endereco"> Salvar este endereço
        <button onclick="processarFormularioEndereco('${modo}', '${pedidoId}', ${valorTotal})" style="width:100%; padding:12px; background:#FF6B00; border:none; color:white; border-radius:8px; margin-top:10px;">Confirmar</button>
        <button onclick="fecharModalEndereco()" style="width:100%; background:transparent; border:none; color:#737373; margin-top:10px;">Cancelar</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  fetch(`${baseUrl}/perfil/dados`, { headers: { "Authorization": `Bearer ${obterToken()}` } })
    .then(res => res.json())
    .then(data => {
      if (data.enderecosSalvos?.length > 0) {
        document.getElementById("area-enderecos-salvos").style.display = "block";
        document.getElementById("divisor-ou").style.display = "block";
        const lista = document.getElementById("lista-enderecos");
        data.enderecosSalvos.forEach(end => {
          const safeEnd = end.replace(/'/g, "\\'");
          lista.innerHTML += `
            <div style="display:flex; gap:8px; align-items:center;">
              <label class="label-endereco-salvo" style="flex:1; padding:10px; background:#1c1c1e; border:1px solid #323238; border-radius:8px; cursor:pointer; color:#fff;">
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
    const res = await fetch(`${baseUrl}/perfil/endereco`, {
      method: "DELETE", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${obterToken()}` },
      body: JSON.stringify({ endereco })
    });
    if (res.ok) { showToast("Removido!"); abrirModalEndereco(modo, pedidoId, valorTotal); }
  } catch(e) { showToast("Erro.", "error"); }
}

function fecharModalEndereco() { const m = document.getElementById('modal-endereco'); if(m) m.remove(); }
function mascaraCEP(i) { let v = i.value.replace(/\D/g, ""); if (v.length > 5) v = v.substring(0, 5) + "-" + v.substring(5, 8); i.value = v; }
function desmarcarRadios() { document.querySelectorAll('input[name="endereco-selecionado"]').forEach(r => r.checked = false); document.querySelectorAll('.label-endereco-salvo').forEach(l => { l.style.borderColor = '#323238'; l.style.background = '#1c1c1e'; }); }
function destacarEndereco(r) { document.querySelectorAll('.label-endereco-salvo').forEach(l => { l.style.borderColor = '#323238'; l.style.background = '#1c1c1e'; }); r.closest('label').style.borderColor = '#10b981'; r.closest('label').style.background = 'rgba(16, 185, 129, 0.1)'; }

async function buscarCEP() {
  const btn = document.getElementById("btn-buscar-cep");
  const cepInput = document.getElementById("input-cep");
  if(!cepInput) return;
  const cep = cepInput.value.replace(/\D/g, "");
  if (cep.length !== 8) return showToast("CEP inválido!", "error");
  if(btn) btn.innerText = "...";
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await res.json();
    if (!data.erro) {
      if(document.getElementById("input-rua")) document.getElementById("input-rua").value = data.logradouro;
      if(document.getElementById("input-bairro")) document.getElementById("input-bairro").value = data.bairro;
      if(document.getElementById("input-cidade")) document.getElementById("input-cidade").value = `${data.localidade} - ${data.uf}`;
      desmarcarRadios();
    }
  } catch(e) {} finally { if(btn) btn.innerText = "Buscar"; }
}

async function processarFormularioEndereco(modo, pedidoId, valorTotal) {
  let endereco = "";
  const radio = document.querySelector('input[name="endereco-selecionado"]:checked');
  if (radio) { endereco = radio.value; } 
  else {
    const rua = document.getElementById("input-rua")?.value.trim(); 
    const num = document.getElementById("input-numero")?.value.trim();
    if (!rua || !num) return showToast("Preencha rua e número!", "error");
    endereco = `${rua}, ${num}`;
    if (document.getElementById("check-salvar-endereco")?.checked) {
       await fetch(`${baseUrl}/perfil/endereco`, { method: "PUT", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${obterToken()}` }, body: JSON.stringify({ endereco }) });
    }
  }
  if (modo === 'pedido') despacharPedidoNovo(endereco, valorTotal);
  else despacharMudancaRota(pedidoId, endereco);
}

// ==========================================
// RASTREAMENTO E CANCELAMENTOS
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
  setTimeout(carregarPedidosShopper, 3000);
}

async function cancelarPedido(id) {
  if (!confirm("Cancelar pedido?")) return;
  try {
    const res = await fetch(`${baseUrl}/pedidos/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${obterToken()}` } });
    if (res.ok) { showToast("Cancelado!", "success"); carregarPedidosShopper(); }
  } catch (e) {}
}

// ==========================================
// PERFIL E OUTROS
// ==========================================
async function carregarHistorico() { /* ... */ }
function carregarPerfil() {
  const token = obterToken();
  if (token !== "jwt-fake") { try { document.getElementById('perfil-username').innerText = JSON.parse(atob(token.split('.')[1])).username || "Usuário"; } catch(e) {} }
}
async function alterarSenha() {
  const senhaAtual = document.getElementById("senha-atual")?.value.trim(); 
  const novaSenha = document.getElementById("nova-senha")?.value.trim();
  try {
    const res = await fetch(`${baseUrl}/perfil/senha`, { method: "PUT", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${obterToken()}` }, body: JSON.stringify({ senhaAtual, novaSenha }) });
    if (res.ok) showToast("Senha alterada!");
  } catch(e) {}
}
async function excluirConta() {
  if (!confirm("Excluir conta permanentemente?")) return;
  try {
    const res = await fetch(`${baseUrl}/perfil`, { method: "DELETE", headers: { "Authorization": `Bearer ${obterToken()}` } });
    if (res.ok) { showToast("Conta excluída!"); setTimeout(() => sair(), 1500); }
  } catch(e) {}
}

carregar();