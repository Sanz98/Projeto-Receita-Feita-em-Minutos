# Projeto Receita Feita em Minutos

Este repositório contém o código-fonte do projeto **Receita Feita em Minutos**, uma aplicação voltada para a organização e extração automatizada de receitas.

## 🛠️ Configuração do Ambiente (Importante)

Se você estiver utilizando **Windows** e o terminal **PowerShell**, poderá encontrar um erro de segurança ao tentar executar comandos `npm` (como `npm install` ou `npm start`).

### O Problema

O erro geralmente exibe uma mensagem como:
> *"O arquivo ...\npm.ps1 não pode ser carregado porque a execução de scripts foi desabilitada neste sistema."*

Isso acontece porque o Windows bloqueia a execução de scripts por padrão para proteção do sistema.

### A Solução

Para permitir que o projeto rode corretamente em sua máquina (ou em qualquer máquina nova onde o projeto for clonado), é necessário ajustar a política de execução localmente.

1. Abra o terminal no VS Code (PowerShell).
2. Copie e cole o comando abaixo:

    ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
    ```


### Instalando versão atualizada 

npm install @google/generative-ai@latest