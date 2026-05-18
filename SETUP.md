# Marvix Pedidos — Guia de Configuração

## 1. Configurar o Supabase

### 1.1 Criar projeto
1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Clique em **New Project**
3. Escolha um nome (ex: `marvix-pedidos`) e senha forte
4. Aguarde a criação (≈2 min)

### 1.2 Executar as migrations
No painel do Supabase, vá em **SQL Editor** e execute em ordem:

1. Conteúdo de `supabase/migrations/001_initial_schema.sql`
2. Conteúdo de `supabase/migrations/002_rls_policies.sql`

### 1.3 Criar os usuários
No painel, vá em **Authentication > Users > Add user**:

**Administrador (você):**
- Email: seu email
- Senha: senha forte
- Após criar: execute no SQL Editor:
  ```sql
  UPDATE profiles SET role = 'admin' WHERE email = 'SEU_EMAIL';
  ```

**Clientes (seus pais):**
- Email: email deles
- Senha: senha forte
- Role padrão já é `client`, não precisa alterar

### 1.4 Criar o bucket de Storage
1. Vá em **Storage > New Bucket**
2. Nome: `attachments`
3. Marque **Public bucket**
4. Confirme

### 1.5 Pegar as credenciais
Vá em **Settings > API**:
- **Project URL**: algo como `https://xxxxxxxxxxx.supabase.co`
- **anon (public) key**: chave longa começando com `eyJ...`

---

## 2. Configurar o app Web

1. Abra o arquivo `apps/web/.env.local`
2. Substitua os valores:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_ANON_KEY
   ```

3. Para rodar localmente:
   ```bash
   cd apps/web
   npm run dev
   ```
   Acesse: http://localhost:3000

---

## 3. Configurar o app Mobile (Android APK)

1. Abra o arquivo `apps/mobile/.env`
2. Substitua os valores:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=SUA_ANON_KEY
   ```

3. Instale o EAS CLI (para gerar o APK):
   ```bash
   npm install -g eas-cli
   eas login
   ```

4. Configure o projeto Expo:
   ```bash
   cd apps/mobile
   eas build:configure
   ```

5. Gere o APK Android:
   ```bash
   eas build --platform android --profile preview
   ```
   > Isso gera um APK para instalar diretamente (sem Play Store)

---

## 4. Adicionar as logos

Coloque na pasta `/Logo`:
- `logo-branca.png` (para fundos escuros — dark mode)
- `logo-preta.png` (para fundos claros)

Formatos ideais: PNG com fundo transparente, ou SVG.

Para usar no app web, edite `apps/web/src/components/layout/sidebar.tsx` e substitua o ícone `Waves` por:
```tsx
import Image from 'next/image'
// ...
<Image src="/logo/logo-branca.png" alt="Marvix" width={100} height={32} />
```

Copie também as logos para `apps/web/public/logo/`.

---

## 5. Estrutura do projeto

```
Pedidos Marvix/
├── apps/
│   ├── web/              ← App Next.js (site)
│   │   ├── src/
│   │   │   ├── app/      ← Páginas (App Router)
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   └── types/
│   │   └── .env.local    ← Credenciais (NÃO commitar)
│   └── mobile/           ← App React Native (Android)
│       ├── src/
│       │   ├── screens/
│       │   ├── lib/
│       │   └── types/
│       └── .env          ← Credenciais (NÃO commitar)
├── supabase/
│   └── migrations/       ← SQL para o banco
└── Logo/                 ← Logos da marca
```

---

## 6. Fluxo de uso

### Cliente (seus pais):
1. Acessa o site → Login
2. Clica em **Novo Pedido**
3. Preenche: título, descrição, prazo, tipo de material
4. Pode anexar referências (imagens, PDFs)
5. Acompanha o status na lista de pedidos
6. Recebe notificação quando a prévia chegar
7. **Aprova** ou **Pede alteração** na prévia
8. Baixa o arquivo final quando concluído

### Administrador (você):
1. Vê todos os pedidos no Dashboard
2. Altera status: **Iniciar → Enviar Prévia → Finalizar**
3. Anexa as prévias como arquivos marcados como "Prévia"
4. Anexa o arquivo final marcado como "Final"
5. Comenta nos pedidos
6. Cancela pedidos se necessário

---

## 7. Notificações push (opcional, implementação futura)

O sistema já tem a tabela `notifications` no banco. Para push notifications reais:
- **Web**: integrar com Web Push API ou Supabase Edge Functions
- **Mobile**: usar `expo-notifications`

O banco já está preparado — só precisaria adicionar os tokens de dispositivo.
