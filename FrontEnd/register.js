async function registrarUsuario(event) {
  event.preventDefault(); 

  const usuarioDigitado = document.getElementById('reg-username').value.trim();
  const senhaDigitada = document.getElementById('reg-password').value.trim();
  
  const msgErro = document.getElementById('msg-erro');
  const msgSucesso = document.getElementById('msg-sucesso');

  msgErro.style.display = 'none';
  msgSucesso.style.display = 'none';

  if (usuarioDigitado.length < 3) {
    msgErro.innerText = "O nome de usuário deve ter pelo menos 3 caracteres.";
    msgErro.style.display = 'block';
    return;
  }
  if (senhaDigitada.length < 6) {
    msgErro.innerText = "A senha deve ter pelo menos 6 caracteres para ser segura.";
    msgErro.style.display = 'block';
    return;
  }

  try {
    const resposta = await fetch('http://localhost:3000/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usuarioDigitado, password: senhaDigitada })
    });

    const dados = await resposta.json();

    if (resposta.status === 201) {
      msgSucesso.innerText = "Conta criada com sucesso! Redirecionando para o Login...";
      msgSucesso.style.display = 'block';
      
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);

    } else {
      msgErro.innerText = dados.mensagem || "Erro ao criar conta. Tente outro usuário.";
      msgErro.style.display = 'block';
    }
  } catch (error) {
    console.error("Erro na API de registro:", error);
    msgErro.innerText = "Erro de conexão. Verifique se o Back-end está rodando.";
    msgErro.style.display = 'block';
  }
}