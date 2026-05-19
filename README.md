 Feito em Minutos (Receita Fácil) 🍳
### Documentação do Projeto e Relatório Técnico Acadêmico de Engenharia de Software
**Disciplina:** Metodologias de Desenvolvimento de Software / Engenharia de Software  
**Metodologia Ágil Aplicada:** Scrum  

---

## 🏫 Informações Institucionais
* **Instituição:** Faculdade de Tecnologia de Americana "Ministro Ralph Biasi" (FATEC Americana)
* **Centro:** Centro Paula Souza — Governo do Estado de São Paulo
* **Curso:** Superior de Tecnologia em Análise e Desenvolvimento de Sistemas (ADS)
* **Semestre Letivo:** 2º Semestre de 2026
* **Orientação Pedagógica:** Profa. Anna Christina Amex
* **Período de Desenvolvimento (Sprint):** 29/04/2026 a 20/05/2026

---

## 👥 Equipe de Desenvolvimento (Scrum Team)
O projeto foi executado de forma colaborativa, dividindo as tarefas e as responsabilidades entre os integrantes da seguinte forma:

1. **Louis Marie Anelus** (RA: 0040482522046) — **Product Manager (PM)**
   * *Responsabilidade:* Organização do escopo do projeto, definição das prioridades das entregas através do Product Backlog e garantia de que o sistema atende aos objetivos de negócio especificados.
2. **Maria Julia Da Silva Francisco** (RA: 0040482522034) — **Scrum Master (SM)**
   * *Responsabilidade:* Facilitadora do trabalho do grupo, organização do cronograma de reuniões, remoção de impedimentos e acompanhamento das metas durante a Sprint.
3. **Háquila Silva Andrade de Lima** (RA: 0040482522042) — **UX/UI Designer**
   * *Responsabilidade:* Concepção da identidade visual do sistema, paleta de cores, tipografia corporativa e desenvolvimento do protótipo de alta fidelidade das telas no Figma.
4. **Diogo Fonseca Sanz** (RA: 0040482522039) — **Full-Stack Developer**
   * *Responsabilidade:* Engenharia e programação completa do sistema, desenvolvendo tanto o servidor de serviços (Backend) quanto as telas interativas do site (Frontend), incluindo as regras de segurança e gravação de dados em arquivos.

---

## 🎯 O Problema e a Solução

### ❌ O Problema
Atualmente, as pessoas consomem muitos vídeos de culinária nas redes sociais (como TikTok e YouTube). Elas salvam esses conteúdos com a intenção de cozinhar depois, mas quase nunca o fazem. O principal motivo é a **alta fricção do processo manual**: ter que rever o vídeo várias vezes, anotar os ingredientes em um papel, checar o armário e a geladeira, ir ao mercado e procurar os itens um a um. A intenção de cozinhar existe, mas o processo preparatório é cansativo e burocrático.

### ✔ A Solução
O **Feito em Minutos** elimina essa barreira de ponta a ponta. O usuário simplesmente copia o link do vídeo da receita e o cola no site. O sistema processa o link de forma assíncrona, aciona motores de Inteligência Artificial no servidor para descobrir o nome e extrair a lista estruturada de ingredientes necessários. A partir daí, o usuário pode marcar de forma interativa o que já possui em casa. O que estiver faltando é calculado de forma automática e enviado para um entregador parceiro (*Shopper*), que compra os insumos no supermercado e os entrega na porta do usuário em poucos minutos.

### 👤 Usuários do Sistema (Personas)
* **A Cozinheira (Ana, 27 anos):** Trabalha em home office, adora gastronomia, mas tem pouco tempo livre para planejar compras. Busca praticidade para cozinhar sem precisar passar horas em supermercados.
* **O Entregador (Carlos, 34 anos):** Realiza entregas para obter renda extra. Necessita de listas de compras muito claras, organizadas e com quantidades exatas para agilizar o seu trabalho dentro do estabelecimento comercial parceiro.

---

## 🚀 Arquitetura do Sistema e Engenharia de Software

O sistema foi desenhado utilizando o modelo **Cliente-Servidor (Client-Server Architecture)**, dividindo a aplicação em camadas independentes que se comunicam através de requisições web padronizadas (REST API).

```text
+--------------------------------------------------------+
|               INTERFACE DO USUÁRIO (Site)              |
|        HTML5 Semântico | CSS3 Premium Dark | JavaScript|
+---------------------------+----------------------------+
                            |
           Comunicação via Requisições da Internet
           (Uso de Token Digital de Segurança JWT)
                            |
                            v
+--------------------------------------------------------+
|                   SERVIDOR (Backend)                   |
|              Node.js rodando com Express.js            |
+---------------------+----------------------------------+
                      |
                      +------> Conexão Segura via API HTTP
                      |        (Chave Ocultada no .env)
                      |        v
                      |   +--------------------------------+
                      |   |   GOOGLE GEMINI AI SERVICES    |
                      |   |      (gemini-2.5-flash)        |
                      |   +--------------------------------+
                      |
             Gravação e Leitura de Arquivos Locais
                      |
                      v
+--------------------------------------------------------+
|              ARQUIVOS DE DADOS (Banco de Dados)        |
|     users.json  |  receitas.json  |  avaliacoes.json   |
+--------------------------------------------------------+
🎨 Interface (Frontend)HTML5 Semântico e CSS3: Interface responsiva focada em usabilidade e organização visual. Adotou-se um tema escuro modernizado (Premium Dark Mode) com destaques na cor Laranja Culinária (#FF6B00). A navigation simula uma aplicação de página única (SPA), alternando as abas instantaneamente sem a necessidade de recarregar o navegador.JavaScript Nativo (ES6+): Gerencia os estados da aplicação, captura os inputs de links, realiza a reatividade visual dos ingredientes riscados e efetua a comunicação assíncrona com o servidor através da Fetch API.⚙️ Servidor, Segurança e Inteligência Artificial (Backend)Node.js e Express.js: Servidor responsável pela orquestração das rotas, tratamento de requisições e intermediação de microsserviços.Integração Real com Google Gemini API: O backend consome a biblioteca oficial @google/generative-ai. A rota recebe o link do cliente, invoca o modelo de produção gemini-2.5-flash por meio de engenharia de prompts avançada e extrai os ingredientes estruturados.Princípio da Segurança de Chaves: Em conformidade com as boas práticas de Engenharia de Software, a chave de acesso da IA (GEMINI_API_KEY) é mantida exclusivamente oculta no arquivo .env do servidor, impedindo que usuários maliciosos interceptem ou visualizem credenciais privadas no inspecionar do navegador.Persistência de Dados em Arquivos JSON: As informações de usuários, receitas salvas e feedbacks são estruturadas e mantidas estavelmente em arquivos .json locais no servidor (Data/), simulando o ciclo de vida de uma base de dados convencional.📦 Explicação das Funcionalidades Implementadas1. Sistema de Cadastro, Login e Proteção de TelasO usuário pode criar a sua conta informando um nome de usuário exclusivo e uma senha (mínimo de 6 caracteres). Ao realizar o login, os dados são validados pelo servidor e um Token de segurança JWT é gerado. Caso um usuário tente burlar a segurança digitando o endereço direto de uma tela interna no navegador sem estar devidamente autenticado, o sistema identifica a ausência da chave local e o redireciona automaticamente para a tela de login.2. Módulo de Extração em Tempo Real com IAAo inserir um link e clicar em "Extrair", o botão é desativado e exibe uma animação de "Processando IA... 🤖" para indicar o processamento em segundo plano. O fluxo executa as seguintes etapas no servidor:Purificação de String: Limpa e trata a codificação de caracteres especiais (Percent-Encoding) de links complexos através do método decodeURIComponent.Processamento Cognitivo: O link é transmitido à API do Gemini. O modelo analisa o contexto culinário e retorna um objeto contendo o Nome da Receita e os Ingredientes separados estritamente por vírgulas.Tratamento de Saída (Sanitização de JSON): O servidor conta com um filtro de limpeza avançada via string literal que remove marcações ou crases indesejadas geradas pela IA (```json), garantindo que o método JSON.parse converta os dados sem estourar exceções ou derrubar o servidor.3. Lista de Compras Automatizada e Rastreamento com MapaNa tela de ingredientes, o usuário clica nos insumos que ele já possui na geladeira. O componente visual aplica um efeito de texto riscado (line-through) e altera a cor do item para indicar a disponibilidade. O sistema isola apenas os itens desmarcados (faltantes), gera valores financeiros randômicos simulando o mercado local e exibe o valor total estimado para o pedido.Ao fechar o pedido do Shopper, um cronômetro regressivo em tempo real é iniciado a partir de 30 minutos e atualiza-se de forma passiva minuto a minuto. Um mapa geográfico interativo centralizado na região de Sumaré/SP é embutido na tela para ilustrar o trajeto e aumentar o realismo da entrega.4. Avaliações Relacionais e Painel de Privacidade (LGPD)Sistema de Feedback: Permite ao usuário registrar uma nota de 1 a 5 estrelas (com estrelas interativas que mudam de cor ao passar o mouse) e um comentário. O sistema faz uma associação relacional com o ID da conta; se o mesmo usuário enviar uma nova avaliação, a nota antiga é atualizada, evitando duplicidade de registros no servidor.Gestão de Conta e LGPD: Na aba "Meu Perfil", o usuário pode atualizar a sua senha mediante a digitação da senha atual. Alinhado com as boas práticas da Lei Geral de Proteção de Dados (LGPD), adicionou-se a funcionalidade de exclusão definitiva de conta: ao clicar, o servidor realiza um expurgo em cascata, apagando o registro de usuário do arquivo users.json, todas as suas receitas do receitas.json e os seus feedbacks do avaliacoes.json, limpando completamente a pegada digital do usuário.🗺️ Tabela de Rotas do Servidor (Endpoints da API)O site (Frontend) comunica-se com o servidor (Backend) através dos seguintes caminhos RESTful estruturados:Método HTTPCaminho (Endpoint)Exige Login?O que esta rota faz no sistemaPOST/users/registerNãoCadastra as credenciais de um novo usuário no arquivo users.json.POST/users/loginNãoConfere os dados e emite o token de segurança para o navegador.GET/receitasNãoLê o arquivo de receitas e lista os dados registrados no painel.POST/receitasSimGrava uma nova receita associada ao ID do usuário autenticado.POST/receitas/extrair-iaNãoAciona de forma segura o motor do Gemini 2.5 Flash para processar o link.PUT/receitas/:idSimAltera as informações de uma receita específica através do seu ID.DELETE/receitas/:idSimRemove de forma permanente uma receita do banco de dados.POST/avaliacoesSimSalva ou atualiza a nota e o comentário do usuário logado.PUT/perfil/senhaSimValida as informações de segurança e grava a nova senha do perfil.DELETE/perfilSimExclui permanentemente a conta e limpa todos os dados vinculados.🗺️ Mapa Arquitetural Gráfico de EndpointsO diagrama abaixo mapeia graficamente as rotas descritas acima, gerando o fluxo dinâmico nativo do GitHub:Snippet de códigograph TD
    %% Estilização Global de Componentes
    classDef client fill:#FF6B00,stroke:#171717,stroke-width:2px,color:#fff,font-weight:bold;
    classDef server fill:#1f2937,stroke:#FF6B00,stroke-width:2px,color:#f5f5f5;
    classDef public fill:#10b981,stroke:#111,stroke-width:1px,color:#fff;
    classDef private fill:#ef4444,stroke:#111,stroke-width:1px,color:#fff;
    classDef external fill:#3b82f6,stroke:#111,stroke-width:1px,color:#fff;
    classDef database fill:#6b7280,stroke:#111,stroke-width:1px,color:#fff;

    %% Nós Principais
    Client[Interface Frontend / SPA] --->|Requisições HTTP REST| Server[Servidor Express Backend]
    class Client client;
    class Server server;

    %% Subgráfico de Rotas Públicas
    subgraph Rotas Públicas (Acesso Livre)
        Route_Reg["POST /users/register <br> (Cadastro de Contas)"]
        Route_Log["POST /users/login <br> (Autenticação JWT)"]
        Route_GetRec["GET /receitas <br> (Listagem do Painel)"]
        Route_IA["POST /receitas/extrair-ia <br> (Processamento Cognitivo)"]
        
        class Route_Reg,Route_Log,Route_GetRec,Route_IA public;
    end

    %% Subgráfico de Rotas Protegidas
    subgraph Rotas Privadas (Exige Token JWT Ativo)
        Route_PostRec["POST /receitas <br> (Persistir Receita)"]
        Route_PutRec["PUT /receitas/:id <br> (Editar Cadastro)"]
        Route_DelRec["DELETE /receitas/:id <br> (Excluir Receita)"]
        Route_Av["POST /avaliacoes <br> (Feedback Relacional)"]
        Route_Senha["PUT /perfil/senha <br> (Alteração Segura)"]
        Route_Perfil["DELETE /perfil <br> (Direito ao Esquecimento)"]
        
        class Route_PostRec,Route_PutRec,Route_DelRec,Route_Av,Route_Senha,Route_Perfil private;
    end

    %% Ligações de Direcionamento do Servidor
    Server --> Route_Reg
    Server --> Route_Log
    Server --> Route_GetRec
    Server --> Route_IA
    Server --> Route_PostRec
    Server --> Route_PutRec
    Server --> Route_DelRec
    Server --> Route_Av
    Server --> Route_Senha
    Server --> Route_Perfil

    %% Fluxos Externos e Persistência
    Route_IA ==>|1. Injeta Título oEmbed| YouTube[API oEmbed do YouTube]
    YouTube ==>|2. Prompt Enriquecido| Gemini[Google Gemini 2.5 Flash]
    
    Route_Perfil -.->|Expurgo Cascateado de Dados| DB[(Base JSON Local)]

    class YouTube,Gemini external;
    class DB database;
📂 Estrutura Hierárquica de DiretóriosPlaintextDesign Projeto Receita em Minutos/
│
├── Backend/                            # Código-Fonte do Servidor Node.js
│   ├── Data/                           # Camada de Armazenamento de Dados (Arquivos JSON)
│   │   ├── avaliacoes.json             # Armazena notas e comentários vinculados por ID
│   │   ├── receitas.json               # Armazena o acervo de receitas extraídas e manuais
│   │   └── users.json                  # Armazena credenciais e chaves de contas de usuários
│   │
│   ├── src/
│   │   ├── controllers/                # Controladores com as regras de negócios da API
│   │   │   ├── receitaController.js
│   │   │   └── userController.js
│   │   ├── Middleware/                 # Filtros de Segurança do Sistema
│   │   │   └── auth.js                 # Middleware validador de assinatura de Tokens JWT
│   │   └── routes/                     # Definição e roteamento das requisições HTTP Express
│   │       ├── receitas.js
│   │       └── users.js
│   │
│   ├── app.js                          # Arquivo Central / Entry Point do Servidor Express e IA
│   ├── package.json                    # Gerenciador de Dependências (express, cors, @google/generative-ai)
│   └── .env                            # Variáveis de Ambiente Protegidas (PORT, JWT_SECRET, GEMINI_API_KEY)
│
└── FrontEnd/                           # Código-Fonte da Interface Web Dinâmica
    └── Body/
        ├── Style/
        │   └── styles.css              # Estilização visual corporativa, paletas e Dark Mode
        ├── index.html                  # Painel Principal SPA (Início, Despensa, Carrinho, Shopper, Perfil)
        ├── login.html                  # Interface Premium de Autenticação de Usuários
        ├── login.js                    # Captura de credenciais e armazenamento local de Token JWT
        ├── register.html               # Interface Premium de Criação de Novas Contas
        ├── register.js                 # Comunicação com a API de registro e tratamento de alertas
        └── script.js                   # Orquestrador Geral do Frontend (Requisições, estados e reatividade)
🛠️ Instruções de Instalação e ExecuçãoPara rodar o projeto localmente em seu computador para avaliação, siga o passo a passo:1️⃣ Inicializar o Servidor (Backend)Certifique-se de possuir o Node.js instalado em seu ambiente.Abra o seu terminal de comandos e navegue até a pasta do servidor backend:Bashcd Backend
Instale os pacotes de dependências estruturais do sistema executando o comando:Bashnpm install
Configure o arquivo .env inserindo sua credencial gerada no Google AI Studio:Snippet de códigoGEMINI_API_KEY=Sua_Chave_Privada_Aqui
Inicialize o servidor executando o comando de desenvolvimento:Bashnpm run dev
O terminal exibirá a mensagem de confirmação: Servidor rodando em http://localhost:3000.2️⃣ Abrir a Interface (Frontend)Como o site é construído utilizando linguagens web nativas, ele dispensa compilações.Navegue até a pasta FrontEnd/Body/.Clique duas vezes no arquivo login.html para executá-lo em qualquer navegador moderno.Cadastre um novo usuário na tela de registro, realize o login e teste os recursos com qualquer link real!🎯 Definição de Pronto (Definition of Done - DoD)Para garantir o cumprimento das etapas de qualidade estipuladas em Engenharia de Software, cada funcionalidade do sistema foi testada sob os seguintes critérios de aceitação:Fidelidade de Telas: O visual codificado precisa seguir estritamente o protótipo de alta fidelidade aprovado no Figma.Robustez do Código: O site deve executar as transações sem gerar nenhuma linha de erro ou exceção no console do desenvolvedor.Tratamento de Exceções Cognitivas: O backend deve ser capaz de processar retornos de IA em formatos de strings não padronizados sem interromper a execução do processo Node.js.Bloqueio de Rotas: Telas de gerenciamento interno não podem ser expostas se o usuário não possuir um token JWT válido ativo.
