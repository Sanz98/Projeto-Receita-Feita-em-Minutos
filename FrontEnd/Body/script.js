const API = "http://localhost:3000/receitas";

async function carregar() {
  const res = await fetch(API);
  const data = await res.json();

  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  data.forEach(r => {
    lista.innerHTML += `
      <div class="card">
        <h3>${r.nome}</h3>
        <p>${r.ingredientes}</p>
        <button onclick="deletar(${r.id})">Excluir</button>
      </div>
    `;
  });
}

async function criarReceita() {
  const nome = document.getElementById("nome").value;
  const ingredientes = document.getElementById("ingredientes").value;

  await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, ingredientes })
  });

  carregar();
}

async function deletar(id) {
  await fetch(`${API}/${id}`, { method: "DELETE" });
  carregar();
}

carregar();