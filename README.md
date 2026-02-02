# VibeHunter - Prospecção Inteligente de Leads

Sistema avançado de prospecção B2B com scraping inteligente, enriquecimento via BrasilAPI e análise por IA (Google Gemini).

## 🚀 Deploy na Vercel

### Variáveis de Ambiente Necessárias

Configure as seguintes variáveis no painel da Vercel:

```bash
BROWSERLESS_TOKEN=seu_token_browserless
GEMINI_API_KEY=sua_chave_gemini
```

### Como obter as chaves:

1. **BROWSERLESS_TOKEN**: 
   - Acesse [browserless.io](https://www.browserless.io/)
   - Crie uma conta gratuita
   - Copie seu token de API

2. **GEMINI_API_KEY**:
   - Acesse [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Crie uma chave de API gratuita
   - Use o modelo `gemini-flash-latest`

### Deploy Rápido

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/seu-usuario/vibehunter)

Ou via CLI:

```bash
npm install -g vercel
vercel
```

## 🛠️ Stack Tecnológica

- **Framework**: Next.js 15 (App Router)
- **Linguagem**: TypeScript
- **State Management**: Redux Toolkit
- **Scraping**: Puppeteer + Browserless
- **IA**: Google Gemini (gemini-flash-latest)
- **APIs**: BrasilAPI (validação CNPJ)
- **UI**: Tailwind CSS + shadcn/ui

## 📋 Funcionalidades

- ✅ Busca inteligente de leads via Google Maps
- ✅ Scraping de websites para extração de dados
- ✅ Análise por IA (emails, Instagram, WhatsApp, especialidades)
- ✅ Validação de CNPJ via BrasilAPI
- ✅ Deduplicação automática
- ✅ Upload de base existente (CSV)
- ✅ Lead scoring e dicas de abordagem comercial
- ✅ Interface expandível com insights completos

## 🏃 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas chaves

# Rodar em desenvolvimento
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## 📦 Build de Produção

```bash
npm run build
npm start
```

## 🔐 Segurança

- Nunca commite o arquivo `.env` 
- Use variáveis de ambiente na Vercel
- As chaves de API são server-side only

## 📄 Licença

Projeto proprietário - Todos os direitos reservados
