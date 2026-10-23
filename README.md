# KEYCON — Teclado com CRM para corretores (React Native + TypeScript)

> Seu negócio na ponta dos dedos.

Teclado de sistema (IME Android / Keyboard Extension iOS) para corretores de imóveis,
utilizável dentro do WhatsApp ou de qualquer app. O app principal só faz login e configuração.

## Arquitetura

```
┌─────────────── WhatsApp ───────────────┐
│  EditText  ◄── InputConnection (IPC) ──┼────┐
└────────────────────────────────────────┘    │
┌──────────── Processo do nosso app ──────────┼──────────────┐
│ CustomKeyboardService (InputMethodService)  ┘              │
│   └─ ReactRootView ("CorretorKeyboard")                    │
│        ├─ Toolbar: 📂 Imóveis | ⚡ Respostas | 🔗 Atalhos | 🤖 │
│        ├─ KeyboardBridge.insertText() ──► commitText()     │
│        ├─ MMKV (catálogo offline, leitura síncrona)        │
│        └─ aiService → Clipboard → POST backend → LLM       │
│ MainActivity ("CorretorApp") — login/config (mesmo MMKV)   │
└────────────────────────────────────────────────────────────┘
```

## Estrutura

| Caminho | Responsabilidade |
|---|---|
| `android/.../AndroidManifest.xml` | Declara o serviço IME com `BIND_INPUT_METHOD` |
| `android/.../res/xml/method.xml` | Metadados do teclado (subtype pt-BR, settings) |
| `android/.../keyboard/CustomKeyboardService.kt` | `InputMethodService` que hospeda o RN + `commitText` |
| `android/.../keyboard/KeyboardBridgeModule.kt` | NativeModule JS → InputConnection |
| `ios/CorretorKeyboardExtension/*` | `UIInputViewController` + bridge Swift (`textDocumentProxy`) |
| `src/keyboard/CorretorKeyboard.tsx` | Componente raiz do teclado |
| `src/keyboard/components/*` | Toolbar, abas, barra inferior |
| `src/services/aiService.ts` | Clipboard + contexto local + API de IA |
| `src/storage/storage.ts` | Repositório MMKV compartilhado |
| `backend/server.ts` | Rota Node.js que chama a OpenAI com saída JSON estruturada |

## Identidade visual (manual KEYCON v1.0)

| O quê | Onde |
|---|---|
| Cores (grafite `#242833`, coral `#F17860`, cloud `#F1F2F4`, branco), status, raios, espaçamentos, escala tipográfica | `src/keyboard/theme.ts` |
| Fonte Inter 400/500/600/700 (aplicada sozinha pelo `makeStyles`) | `android/app/src/main/assets/fonts/` |
| Ícones funcionais (cores do manual; Configurações = engrenagem) | `src/keyboard/components/Icon.tsx` |
| Artes originais da marca (ícone, símbolo K, logotipos com e sem slogan) | `assets/` |
| Versões otimizadas usadas no app + componente `KeyconLogo` / `KeyconMark` | `src/assets/brand/`, `src/keyboard/components/KeyconLogo.tsx` |
| Ícone do app no Android (clássico, redondo e adaptativo) | `android/app/src/main/res/mipmap-*` |
| Ícone do iPhone (App Store, 1024 × 1024 sem transparência) | `ios/AppIcon/AppIcon-1024.png` → arraste para o AppIcon no Xcode |

Coral só em ações, marca e estados ativos; grafite como cor estrutural.

## Passo a passo

### 1. Criar o projeto base e copiar os arquivos
```bash
npx @react-native-community/cli@latest init CorretorKeyboard --version 0.74.5 --package-name com.corretorkeyboard
cd CorretorKeyboard
npm i react-native-mmkv@^2.12.2 @react-native-clipboard/clipboard react-native-svg@15.8.0
```
Copie `src/`, `index.js`, `backend/` e os arquivos de `android/` e `ios/` deste repositório por cima.

### 2. Android
1. Em `android/gradle.properties`: `newArchEnabled=false` (o serviço usa `ReactRootView`;
   para Bridgeless veja a nota no topo de `CustomKeyboardService.kt`).
2. Em `MainActivity.kt`: `override fun getMainComponentName() = "CorretorApp"`.
3. Em `MainApplication.kt`, registre o pacote:
   ```kotlin
   override fun getPackages(): List<ReactPackage> =
       PackageList(this).packages.apply { add(KeyboardBridgePackage()) }
   ```
4. `npm run android` → no app, toque em **Abrir configurações de teclado** → ative
   “KEYCON” → no WhatsApp, troque de teclado (ícone ⌨️ na barra de navegação).

### 3. iOS
1. Xcode → File › New › Target › **Custom Keyboard Extension** (`CorretorKeyboardExtension`).
2. Substitua os arquivos gerados pelos de `ios/CorretorKeyboardExtension/` (aceite criar o bridging header).
3. No `Podfile`, adicione o target da extensão herdando os pods do React:
   ```ruby
   target 'CorretorKeyboardExtension' do
     inherit! :complete
   end
   ```
4. Ative **App Groups** (`group.com.corretorkeyboard`) no app **e** na extensão, e adicione a
   chave `AppGroup` também no `Info.plist` do app (o MMKV lê esta chave).
5. Inclua `main.jsbundle` no "Copy Bundle Resources" da extensão (build de release).
6. Fonte da marca: arraste os 4 arquivos `Inter-*.otf` de `android/app/src/main/assets/fonts/` para o
   Xcode, marcando os dois targets (app e extensão), e adicione a lista `UIAppFonts` (igual à do
   `Info.plist` da extensão) também no `Info.plist` do app. Depois rode `cd ios && pod install`
   (o `react-native-svg` tem parte nativa).
7. Ajustes › Geral › Teclado › Teclados › Adicionar › “KEYCON” → **Permitir Acesso Total**.

### 4. Backend de IA
```bash
OPENAI_API_KEY=sk-... npm run backend
```
Ajuste `AI_CONFIG.baseUrl` em `src/services/aiService.ts`. Para testar sem backend: `useMock: true`.

## ⚠️ Restrições de plataforma (importante)

- **Sem `Modal`/`Alert` no teclado**: o IME não tem token de janela de Activity → `BadTokenException`.
- **Sem `TextInput` focável no teclado**: rouba o foco do WhatsApp e encerra a `InputConnection`.
- **Clipboard Android 10+**: só o IME *ativo* ou o app em foco leem — funciona porque somos o IME.
- **iOS – memória**: extensões de teclado têm limite de ~50–70 MB. RN + Hermes cabe, mas mantenha
  o bundle enxuto. Se ultrapassar, o iOS encerra o teclado silenciosamente; a alternativa é uma UI
  nativa SwiftUI para a extensão reaproveitando o mesmo MMKV/API.
- **iOS – rede/clipboard** só funcionam com “Acesso Total” ativado.
- **Chave da OpenAI nunca no app** — sempre via backend autenticado.
- **LGPD**: a mensagem do cliente vai ao backend; informe isso nos termos de uso e não persista o texto.

## 🌐 Versão web de testes (navegador, inclusive iPhone)

Roda o código **real** do app e do teclado no navegador (react-native-web + Vite), com o login
real do Supabase. A página tem duas telas: **App** e **WhatsApp + Teclado** (conversa de teste em
que o teclado escreve).

```bash
npm install
npm run web:dev      # desenvolvimento em http://localhost:5173
npm run web:build    # gera a pasta dist/ para publicar
npm run web:preview  # confere a dist/ em http://localhost:4173
```

- **Publicar:** envie o **conteúdo** de `dist/` para qualquer hospedagem estática (Netlify, Vercel,
  hospedagem comum via FTP...). Os caminhos são relativos, então funciona em subpastas.
- **Dados:** ficam no navegador de quem testa (localStorage), separados do celular.
- **Limitações na web:** fotos e áudios vão como link; envio de arquivos e a tecla 🌐 só no Android.
- Arquivos `.web.ts` (ex.: `src/native/KeyboardBridge.web.ts`) substituem os nativos só na web.
