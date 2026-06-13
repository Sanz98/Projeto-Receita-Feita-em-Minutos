// === TRAVA DE SEGURANÇA ===
if (localStorage.getItem('logado') !== 'true') {
  window.location.href = 'login.html';
}

function sair() {
  localStorage.removeItem('logado');
  localStorage.removeItem('token');
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
          </div>
          <button class="h-icon-btn" onclick="verIngredientes('${r._id}')" title="Ver"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></button>
          <button class="h-icon-btn" onclick="abrirEditarReceita('${r._id}')" style="color: #3b82f6;" title="Editar"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 20px; height: 20px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
          <button class="h-icon-btn" onclick="deletar('${r._id}')" style="color: #ef4444;" title="Excluir"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
        </div>
      `;
    });
  } catch (e) {
    console.error("Erro ao carregar receitas:", e);
  }
}

async function deletar(id) {
  if (!confirm("Tem certeza que deseja excluir esta receita?")) return; 
  try {
    const res = await fetch(`${API}/${id}`, { 
      method: "DELETE",
      headers: { "Authorization": `Bearer ${obterToken()}` }
    });
    if (res.ok) { carregar(); } else { alert("Erro ao excluir."); }
  } catch (error) {
    alert("Erro de conexão.");
  }
}

function abrirEditarReceita(id) {
  const receita = receitasGlobais.find(r => String(r._id) === String(id));
  if (!receita) return alert("Receita não encontrada!");
  document.getElementById("edit-nome").value = receita.nome;
  document.getElementById("edit-link").value = receita.link || "";
  document.getElementById("edit-ingredientes").value = receita.ingredientes;
  document.getElementById("btn-salvar-edicao").onclick = () => salvarEdicaoReceita(id, receita.imagem);
  document.getElementById("modal-editar").style.display = "flex";
}

async function salvarEdicaoReceita(id, imagemOriginal) {
  const nome = document.getElementById("edit-nome").value.trim();
  const link = document.getElementById("edit-link").value.trim();
  const ingredientes = document.getElementById("edit-ingredientes").value.trim();
  try {
    const res = await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${obterToken()}` },
      body: JSON.stringify({ nome, link, ingredientes, imagem: imagemOriginal })
    });
    if (res.ok) { document.getElementById("modal-editar").style.display = "none"; carregar(); }
  } catch (error) { console.error(error); }
}

function verIngredientes(idDaReceita) {
  const receita = receitasGlobais.find(r => String(r._id) === String(idDaReceita));
  if (!receita) return;
  navegar('ingredientes', document.querySelectorAll('.menu button')[1]);
  document.getElementById('titulo-ingredientes').innerText = `Ingredientes: ${receita.nome}`;
  const divLista = document.getElementById('lista-ingredientes');
  divLista.innerHTML = receita.ingredientes.split(',').map(item => `<p>${item.trim()}</p>`).join('');
}

function navegar(idPagina, btnElement) {
  document.querySelectorAll('.pagina').forEach(p => p.style.display = 'none');
  document.getElementById(idPagina).style.display = 'block';
  if (btnElement) {
    document.querySelectorAll('.menu button').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
  }
}

carregar();