
<div align="center">

# 🍳 Feito em Minutos
**Plataforma de Inteligência Artificial e Logística Gastronômica em Tempo Real.**

[![Status do Projeto](https://img.shields.io/badge/Status-Produção-brightgreen?style=for-the-badge)]()
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Groq AI](https://img.shields.io/badge/Powered_by-Groq-f37626?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com/)

[🔗 Acesse a Aplicação ao Vivo](https://projeto-receita-feita-em-minutos.onrender.com/)

*Transformando a inspiração culinária digital em uma experiência prática: do clique no vídeo à entrega dos ingredientes na sua porta.*

---
</div>

## 📖 Visão Executiva

O **Feito em Minutos** é uma solução tecnológica ponta a ponta que elimina a barreira entre o consumo de conteúdo culinário e a prática na cozinha. Ao integrar o processamento de linguagem natural de latência ultrabaixa (via **Groq AI**) a um sistema logístico em tempo real, a plataforma traduz vídeos de receitas em listas de compras e orquestra a entrega dos ingredientes através de uma rede de motoristas parceiros.

> *Este documento foi elaborado para fornecer uma visão clara e abrangente do projeto para usuários, empresas, escolas de tecnologia e desenvolvedores.*

---

## 💡 Proposta de Valor: Para Quem Construímos?

Nossa arquitetura foi desenhada para gerar impacto real para diferentes públicos:

* 👩‍🍳 **Para o Usuário (Consumidor):** Fim da fricção burocrática. Basta colar o link de um vídeo (TikTok/YouTube), marcar o que já tem na despensa e esperar a entrega dos ingredientes que faltam. Economia de tempo e planejamento simplificado.
* 🛵 **Para o Mercado (Entregadores/Empresas):** Um ecossistema de *delivery* estruturado. Entregadores possuem um *dashboard* exclusivo para aceitar corridas, visualizar listas exatas de compras e otimizar suas rotas, garantindo geração de renda.
* 💻 **Para Desenvolvedores:** Uma arquitetura *Client-Server* modular, escalável e segura. O código explora integrações complexas de IA, segurança de rotas com JWT e design responsivo (SPA).
* 🏫 **Para a Academia (Escolas):** Um *case* de sucesso de Engenharia de Software. Aplicação rigorosa da metodologia ágil Scrum, design de interfaces e conformidade com a legislação de dados (LGPD).

---

## 🎯 O Desafio e a Solução

### ❌ O Cenário Atual (O Desafio)
Diariamente, milhões de pessoas salvam vídeos de receitas nas redes sociais. Contudo, a taxa de conversão (pessoas que de fato cozinham o prato) é baixíssima. O motivo é a **alta fricção manual**: rever o vídeo várias vezes, anotar insumos, verificar a geladeira, ir ao mercado e procurar os itens. A intenção morre no planejamento.

### ✔ Nossa Abordagem (A Solução)
A plataforma automatiza e terceiriza o trabalho exaustivo:
1. **Extração Cognitiva:** O sistema processa o link do vídeo e, em milissegundos, a Inteligência Artificial estrutura todos os ingredientes necessários.
2. **Gestão de Despensa:** Uma interface intuitiva permite que o usuário risque os itens que já possui.
3. **Logística Integrada:** Os itens faltantes tornam-se um *chamado de entrega* disparado instantaneamente para a frota de parceiros (Shoppers).

---

## 🚀 Arquitetura e Engenharia de Software

O ecossistema adota o modelo **Cliente-Servidor (Client-Server)**, focado em alta performance, segurança de dados e separação clara de responsabilidades.

### 🎨 Experiência do Usuário (Frontend SPA)
* **Design Premium & Acessível:** Interface moderna em *Dark Mode*, com tipografia cuidadosa e destaques em Laranja Culinária (`#FF6B00`), garantindo conforto visual.
* **Dinâmica e Reatividade (ES6+):** Renderização de Página Única (SPA) para transições fluidas sem recarregar o navegador. Inclui sistema de rastreamento com mapa e alternância inteligente de perfis (Cliente vs. Motorista).

### ⚙️ Servidor e Segurança (Backend Node.js)
* **Processamento de Latência Ultrabaixa (Groq AI):** O backend consome a API da Groq para ler, interpretar e higienizar dados de URLs complexas, retornando objetos JSON padronizados à prova de falhas.
* **Autenticação e Perfis (JWT):** Sistema blindado de verificação. A tecnologia garante que clientes não acessem a central de motoristas, e vice-versa.
* **Conformidade Legal (LGPD):** Respeito absoluto à privacidade. Fluxos seguros de "Esqueci minha senha" e um sistema de **Direito ao Esquecimento** que realiza o expurgo em cascata (remoção definitiva de contas, receitas e avaliações do banco de dados).

---

## 🗺️ Mapa Arquitetural do Sistema

```mermaid
graph TD
    %% Estilização Global
    classDef client fill:#FF6B00,stroke:#171717,stroke-width:2px,color:#fff,font-weight:bold;
    classDef server fill:#1f2937,stroke:#FF6B00,stroke-width:2px,color:#f5f5f5;
    classDef public fill:#10b981,stroke:#111,stroke-width:1px,color:#fff;
    classDef private fill:#ef4444,stroke:#111,stroke-width:1px,color:#fff;
    classDef external fill:#f37626,stroke:#111,stroke-width:1px,color:#fff;
    classDef database fill:#6b7280,stroke:#111,stroke-width:1px,color:#fff;

    Client[Interface SPA: Cliente / Entregador] --->|Requisições Fetch / REST| Server[Backend Node.js / Express]
    class Client client;
    class Server server;

    subgraph Rotas Públicas Acesso Livre
        Route_Auth["POST /users/login <br> POST /users/register"]
        Route_Pass["POST /users/esqueci-senha <br> POST /users/redefinir-senha"]
        Route_GetRec["GET /receitas (Painel)"]
        Route_IA["POST /receitas/extrair-ia"]
        
        class Route_Auth,Route_Pass,Route_GetRec,Route_IA public;
    end

    subgraph Rotas Privadas Exige Token JWT
        Route_Rec["POST, PUT, DELETE /receitas"]
        Route_Ped["POST /pedidos <br> POST /pedidos/:id/aceitar"]
        Route_Av["POST /avaliacoes"]
        Route_Perfil["PUT /perfil/senha <br> DELETE /perfil (LGPD)"]
        
        class Route_Rec,Route_Ped,Route_Av,Route_Perfil private;
    end

    Server --> Route_Auth
    Server --> Route_Pass
    Server --> Route_GetRec
    Server --> Route_IA
    Server --> Route_Rec
    Server --> Route_Ped
    Server --> Route_Av
    Server --> Route_Perfil

    Route_IA ==>|Prompt Cognitivo de Baixa Latência| Groq[Groq AI Engine]
    Route_Perfil -.->|Expurgo Cascateado de Dados| DB[(Bancos JSON Locais)]
    Route_Ped -.->|Gravação de Chamados| DB

    class Groq external;
    class DB database;
📡 Documentação da API (Endpoints)
A comunicação entre a interface e o servidor segue os rigorosos padrões RESTful:

Endpoint	Método	Acesso	Descrição Funcional
/users/register	POST	🟢 Público	Cadastra novos perfis, definindo os papéis (Roles): Cliente ou Entregador.
/users/login	POST	🟢 Público	Autentica o usuário e emite o token de segurança (JWT).
/users/esqueci-senha	POST	🟢 Público	Inicia o fluxo de recuperação de credenciais.
/users/redefinir-senha	POST	🟢 Público	Valida o token temporário e grava a nova senha.
/receitas/extrair-ia	POST	🟢 Público	Processa o link de vídeo e extrai ingredientes via Groq AI.
/receitas	CRUD	🔴 Privado	Gerencia o acervo pessoal de receitas do usuário logado.
/pedidos	POST	🔴 Privado	Dispara um novo chamado de compras para a central de entregadores.
/pedidos/:id/aceitar	POST	🔴 Privado	O Entregador aceita a corrida, atualizando o status logístico.
/avaliacoes	POST	🔴 Privado	Registra feedbacks e notas (sistema relacional de pontuação).
/perfil	DELETE	🔴 Privado	Exclui permanentemente a conta e os dados associados (Conformidade LGPD).
📂 Estrutura do Projeto
A organização do código foi pensada para ser facilmente escalável e compreensível por qualquer equipe de desenvolvimento.

Plaintext
Feito-em-Minutos/
│
├── Backend/                            # Core do Servidor e Regras de Negócio
│   ├── Data/                           # Banco de Dados (Persistência em Arquivos JSON)
│   │   ├── avaliacoes.json             
│   │   ├── pedidos.json                # Fila central de chamados logísticos
│   │   ├── receitas.json               
│   │   └── users.json                  
│   │
│   ├── models/                         # Modelagem estrutural de dados
│   │   └── Avaliacao.js, Pedido.js, Receita.js, User.js
│   │
│   ├── src/                            # Lógica Operacional
│   │   ├── controllers/                # Controladores (Receitas, Usuários, Pedidos)
│   │   ├── Middleware/auth.js          # Barreira de Segurança e Validação JWT
│   │   └── routes/                     # Definição e roteamento das requisições
│   │
│   ├── app.js                          # Arquivo Central (Entry Point)
│   └── .env                            # Variáveis Sensíveis (Tokens e API Keys)
│
└── FrontEnd/Body/                      # Interface e Experiência do Usuário (UI/UX)
    ├── Style/styles.css                # Identidade Visual e Temas
    ├── index.html & script.js          # Dashboard do Cliente (Rastreio e Extração)
    ├── entregador.html                 # Central de Corridas (Motorista/Shopper)
    ├── login.html & register.html      # Módulo Seguro de Autenticação e Cadastro
    └── esqueciSenha.html & redefinir.. # Fluxos de Recuperação de Conta
🛠️ Guia Rápido de Implantação e Testes
Deseja rodar o projeto na sua máquina? Siga o passo a passo abaixo:

1️⃣ Preparando o Servidor (Backend)
Certifique-se de ter o Node.js instalado. Abra seu terminal, acesse a pasta do backend e instale as dependências:

Bash
cd Backend
npm install
Crie um arquivo chamado .env na raiz da pasta Backend/ e insira as credenciais de segurança:

Snippet de código
GROQ_API_KEY=Sua_Chave_Privada_Da_Groq
JWT_SECRET=Sua_Chave_Super_Secreta
PORT=3000
Dê a partida no servidor:

Bash
npm run dev
(Aguarde a confirmação: Servidor rodando em http://localhost:3000)

```
🖥️ 2️⃣ Executando a Interface (Frontend)
O frontend não necessita de compiladores pesados. Para iniciar o sistema:

Vá até a pasta FrontEnd/Body/.

Abra o arquivo login.html em qualquer navegador web moderno.

💡 Dica de Teste Logístico:

Crie uma conta com o perfil de Cliente, cole um link de receita, gere a lista e faça o pedido.

Em seguida, abra uma aba anônima, crie uma conta de Entregador e veja a mágica acontecer, recebendo o chamado instantaneamente na tela!

🎓 Contexto Acadêmico e Institucional
Este projeto é um marco prático da disciplina de Metodologias de Desenvolvimento de Software / Engenharia de Software, desenvolvido no 2º Semestre de 2026.

Faculdade de Tecnologia de Americana "Ministro Ralph Biasi" (FATEC Americana)

Centro Paula Souza — Governo do Estado de São Paulo

Curso: Superior de Tecnologia em Análise e Desenvolvimento de Sistemas (ADS)

Orientação Pedagógica: Profa. Anna Christina Amex

Metodologia Ágil Aplicada: Scrum (Período de Desenvolvimento da Sprint: 29/04/2026 a 20/05/2026)

👥 O Scrum Team
O projeto foi executado de forma colaborativa, dividindo as tarefas e as responsabilidades entre os integrantes da seguinte forma:

🎯 Louis Marie Anelus
Função: Product Manager (PM)  |  RA: 0040482522046

Responsabilidade: Organização do escopo do projeto, definição das prioridades das entregas através do Product Backlog e garantia de que o sistema atende aos objetivos de negócio especificados.

🔄 Maria Julia Da Silva Francisco
Função: Scrum Master (SM)  |  RA: 0040482522034

Responsabilidade: Facilitadora do trabalho do grupo, organização do cronograma de reuniões, remoção de impedimentos e acompanhamento das metas durante a Sprint.

🎨 Háquila Silva Andrade de Lima
Função: UX/UI Designer  |  RA: 0040482522042

Responsabilidade: Concepção da identidade visual do sistema, paleta de cores, tipografia corporativa e desenvolvimento do protótipo de alta fidelidade das telas no Figma.

💻 Diogo Fonseca Sanz
Função: Full-Stack Developer  |  RA: 0040482522039

Responsabilidade: Programação completa do sistema, desenvolvendo tanto o servidor de serviços (Backend) quanto as telas interativas do site (Frontend), incluindo as regras de segurança e gravação de dados em arquivos.

📸 Preview do Projeto
Abaixo estão as capturas de tela demonstrando a interface final e a usabilidade do ecossistema:

1️⃣ Tela de Login e Autenticação

<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/a49b2e21-67bc-4223-8d7c-db5630f46c31" />


2️⃣ Interface do Cliente (Aplicação de Receitas)


<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/a49b2e21-67bc-4223-8d7c-db5630f46c31" />


3️⃣ Interface do Entregador (Central de Chamados)

<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/19f25dee-13cd-4a13-8624-03e020904594" />
