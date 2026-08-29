# 🤖 Bot de Vendas Avançado - Discord

Bot completo de vendas para Discord com sistema de pagamentos via Pix, QR Code, logs, Facebook (feedback), cargos automáticos e muito mais!

## ✨ Funcionalidades

- 🛒 **Sistema de Vendas Completo** - Crie produtos, painéis e gerencie vendas
- 📱 **Pagamento via Pix** - QR Code gerado automaticamente
- 📊 **Canal de Logs** - Todas as vendas registradas automaticamente
- 💬 **Canal de Facebook/Feedback** - Sistema de avaliações com reações automáticas
- 👔 **Cargo de Cliente Automático** - Cargo dado assim que a compra é confirmada
- 🔊 **Conexão em Canal de Voz Permanente**
- 🎟️ **Sistema de Cupons** - Crie cupons com desconto e validade
- 🎭 **Emoji de Reação Personalizável**
- 🌐 **Painel Web Administrativo** - Visualize status, produtos e vendas
- 📦 **Sistema de Stock** - Controle de estoque com opção infinito
- 🔒 **Canais Privados de Compra** - Cada cliente tem seu canal exclusivo

## 🚀 Comandos

| Comando | Descrição |
|---------|-----------|
| `/painel vendas` | Abre o painel principal de configuração |
| `/cria cupom` | Cria um novo cupom de desconto |
| `/reacao` | Configura o emoji de reação do Facebook |

## 📦 Instalação

### 1. Clonar o repositório
```bash
git clone <seu-repositorio>
cd bot-vendas
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
Copie o arquivo `.env.example` para `.env` e preencha:
```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```env
# Token do bot (obtenha em https://discord.com/developers)
TOKEN=seu_token_aqui

# ID do cliente/bot
CLIENT_ID=seu_client_id_aqui

# ID do cargo que pode confirmar pagamentos
ADMIN_ROLE_ID=id_do_cargo_admin

# Sua chave Pix
PIX_CHAVE=sua_chave_pix
PIX_NOME=Seu Nome Completo
PIX_CIDADE=Sua Cidade

# Configurações do painel web
WEB_PORT=3000
```

### 4. Registrar comandos
```bash
npm run deploy
```

### 5. Iniciar o bot
```bash
npm start
```

## 🌐 Hospedagem no Render

1. Crie uma conta no [Render](https://render.com)
2. Conecte seu repositório GitHub
3. Crie um novo **Web Service**
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Adicione as variáveis de ambiente na seção **Environment**
6. Deploy! 🎉

## 📁 Estrutura de Pastas

```
bot-vendas/
├── commands/              # Comandos Slash
│   ├── painel.js         # /painel vendas
│   ├── cria.js           # /cria cupom
│   └── reacao.js         # /reacao
├── events/                # Eventos do Discord
│   ├── ready.js          # Inicialização
│   └── interactionCreate.js # Todas as interações
├── database/              # Banco de dados
│   └── database.js       # SQLite3
├── web/                   # Painel web
│   ├── server.js         # Servidor Express
│   └── public/           # Arquivos estáticos
├── utils/                 # Utilitários
├── buttons_gifs/          # GIFs para cada botão
│   ├── configurar_logs/
│   ├── configurar_facebook/
│   ├── configurar_cargo/
│   ├── conectar_voz/
│   ├── criar_painel/
│   └── ... (cada botão tem sua pasta)
├── package.json
├── deploy-commands.js
├── index.js
└── .env
```

## 🎨 Sistema de GIFs para Botões

Dentro da pasta `buttons_gifs/`, cada subpasta corresponde a um botão. Adicione seu arquivo `.gif` na pasta do botão correspondente e o bot irá usá-lo automaticamente!

Pastas disponíveis:
- `configurar_logs/`
- `configurar_facebook/`
- `configurar_cargo/`
- `conectar_voz/`
- `criar_painel/`
- `ver_opcao/`
- `alterar_quantidade/`
- `ir_pagamento/`
- `aplicar_cupom/`
- `cancelar/`
- `pix/`
- `cartao/`
- `bitcoin/`
- `boleto/`
- `copia_cola/`
- `confirmar_pagamento/`
- `compra_novamente/`
- `compra_produto/`

## ⚙️ Configuração Passo a Passo

1. Execute `/painel vendas` no seu servidor
2. Clique em cada botão para configurar:
   - 📊 **Canal de Logs** - Onde as vendas serão registradas
   - 📱 **Canal de Facebook** - Onde clientes deixam avaliações
   - 👔 **Cargo Cliente** - Cargo dado após compra confirmada
   - 🔊 **Canal de Voz** - Bot conecta permanentemente
3. Clique em **Criar Painel de Vendas**
4. Crie seus produtos
5. Envie o painel para um canal
6. Pronto! 🎉

## 🛠️ Tecnologias Utilizadas

- **Node.js** 18+
- **Discord.js** v14
- **SQLite3** - Banco de dados
- **Express** - Servidor web
- **QRCode** - Geração de QR Code Pix
- **Moment.js** - Manipulação de datas

## 📝 Suporte

Para dúvidas ou problemas, verifique os logs no console ou abra uma issue no repositório.

---

**Feito com ❤️ para o seu negócio no Discord!**
