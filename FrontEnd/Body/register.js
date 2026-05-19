async function registrarUsuario(event) {
  event.preventDefault(); 

  // CORREÇÃO 1: IDs atualizados para bater certo com o HTML atual
  const usuarioDigitado = document.getElementById('username').value.trim();
  const senhaDigitada = document.getElementById('password').value.trim();
  
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
    // CORREÇÃO 2: Rota relativa! O navegador descobre a URL original sozinho
    const resposta = await fetch('/users/register', {
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
      msgErro.innerText = dados.mensagem || "Erro ao criar conta.";
      msgErro.style.display = 'block';
    }
  } catch (error) {
    console.error("Erro na API de registro:", error);
    msgErro.innerText = "Erro de conexão. Verifique se o servidor está ativo.";
    msgErro.style.display = 'block';
  }
}

// CORREÇÃO 3: Garante que o evento está ligado ao formulário para evitar "refresh"
document.addEventListener("DOMContentLoaded", () => {
  const formCadastro = document.getElementById('form-cadastro');
  if (formCadastro) {
    formCadastro.addEventListener('submit', registrarUsuario);
  }
});