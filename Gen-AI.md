# Gen AI

## Part 1: Gen AI Chat Assistant

- `client`
  - `vue`
  - `markdown-it`
  - Google OAuth 2.0
- `server`
  - `fastify`
  - Google AI Studio
  - Qdrant
  - MongoDB
- `infra`
  - `pulumi`
  - Google Cloud

多階段漸進演示方向：

- [x] 封裝 Gemini (SSE 回覆)
  - [ ] 短期記憶
  - [ ] Tool (Google 搜尋)
- [ ] Gemini RAG 知識庫
  - [ ] 短期記憶
  - [ ] Tool (找當前用戶)

```coffee
genai
  ├── client
  │   ├── src
  │   └── package.json
  ├── server
  │   ├── src
  │   └── package.json
  └── infra
      ├── src
      └── package.json
```

## Part 2: Gen AI Voice Assistant

- `client`
  - `vue`
  - `markdown-it`
  - Google OAuth 2.0
  - `tauri`
  - Windows App
  - Android App
  - Raspberry Pi 5 Model B
  - Raspberry Pi Touch Display 2
- `server`
  - `fastify`
  - Google AI Studio
- `infra`
  - `pulumi`
  - Google Cloud
- `device`
  - `embassy-rp`
  - Raspberry Pi Pico 2 W

演示：

- 跨平台語音對話，螢幕文字算繪
- 閒置 10 分鐘進入「待機」狀態，喚醒詞為「Hey Gemini」(嵌入式設備上)

```coffee
genai2
  ├── client
  │   ├── src
  │   ├── src-tauri
  │   │   ├── src
  │   │   └── Cargo.toml
  │   └── package.json
  ├── server
  │   ├── src
  │   └── package.json
  ├── infra
  │   ├── src
  │   └── package.json
  └── device
      ├── src
      └── Cargo.toml
```
