async function login() {
  const usuario = document.getElementById("user").value;
  const senha = document.getElementById("pass").value;

  const res = await fetch("http://localhost:3000/users/login", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ usuario, senha })
  });

  if (res.status === 200) {
    window.location.href = "index.html";
  } else {
    alert("Login inválido");
  }
}