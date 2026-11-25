<p align="center"><img src="rizz-icon.png" width="128" alt="Rizz"></p>

# Rizz

Say it plainly. Rizz says it the way you want, and types it wherever your cursor is.

Hold a shortcut and talk → your speech becomes text on your Mac → AI rewrites it in the style you picked → it's pasted for you.

## Why Rizz

Dictation apps such as Wispr Flow turn speech into clean text. Rizz does that, then rewrites the text in a voice you choose, including voices you build from your own chats.

|                        | Rizz                                                                                 | Typical subscription dictation app       |
| ---------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------- |
| **Price**              | Free app. You pay your AI provider per use, usually well under $1 per 1,000 messages | Wispr Flow Pro is $12–15 a month         |
| **Free option**        | Apple Intelligence, with no word limit                                               | Wispr Flow's free plan caps words weekly |
| **Speech recognition** | Runs on your Mac, so recordings never leave it                                       | Usually in the cloud                     |
| **Tone**               | Switch styles mid-sentence, or make one from your own chats                          | Cleans up wording                        |
| **Source code**        | Open (MIT)                                                                           | Closed                                   |

Prices were checked in November 2026. The per-message cost assumes Claude Haiku 5.5 and a short message; long custom styles cost more.

## Features

- **Hold and talk** in any app: Messages, WhatsApp, WeChat, Slack, email, notes.
- **Switch styles in a keystroke**: Original, Friendly Tone, Diplomatic, Manager, Airtight, Silly and Flirty are built in.
- **Make your own styles**: paste chats or any text, or add chat screenshots, and Rizz learns how it sounds. Or write the instructions yourself.
- **Speech recognition runs on your Mac.** Your recordings never leave it.

## Install

> Requires a Mac with Apple silicon (M1 or later).

1. Open [Releases](../../releases/latest), download `Rizz.zip`, unzip it and drag **Rizz.app** into **Applications**.
2. The first time you open it, macOS says it can't verify the developer, because Rizz isn't notarized by Apple. To open it anyway:
   - Double-click Rizz and click **Done** on the warning.
   - Open **System Settings → Privacy & Security**, scroll down to the line about Rizz and click **Open Anyway**, then enter your Mac password.
   - On older macOS versions you can instead **right-click Rizz → Open**.
   - If it still won't open, run this in Terminal:
     ```bash
     xattr -dr com.apple.quarantine /Applications/Rizz.app
     ```
3. Allow **Microphone** and **Accessibility** when asked. Accessibility lets Rizz paste text where your cursor is.
4. On first use Rizz downloads a speech recognition model. Wait for it to finish.

## Set up the AI (required)

Rewriting needs an AI model, and everyone uses their own account:

1. Sign up at [console.anthropic.com](https://console.anthropic.com) and create an **API key**. It needs a card and is pay-as-you-go; rewriting a message uses very little.
2. In Rizz, open **Styles** and scroll to **AI**:
   - Provider: **Claude**
   - API Key: paste your key
   - Model: **claude-haiku-5-5** (fastest)
3. For a free option, pick **Apple Intelligence** as the provider (macOS 26 or later, with Apple Intelligence turned on in System Settings). It's free, but the rewrites are weaker. GPT (with an OpenAI key) works too.

Your key is stored only on your Mac.

## How to use

| Shortcut                 | What it does                                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **Control + Option**     | Hold to talk; release to get text in the current style. Tap once to keep talking hands-free, and tap again to finish |
| **Control + Option + S** | Switch style. Keep holding Control + Option and tap S (or ↑↓) to pick                                                |
| **Esc**                  | Cancel the recording                                                                                                 |

The same two keys do both: hold **Control + Option**, tap **S** until you see the style you want, then just start talking. Let go and the text arrives in that style.

Pick **Original** to get exactly what you said, with no rewriting.

## Make your own style

**Styles → New Style from Chats or Text**

- Paste a chat, an email or any writing you like, or click **Add Files** to add chat screenshots.
- For a chat, pick the person whose voice you want to copy.
- Click **Build**. You can edit the result before you save it.
- To skip examples, click **Write Your Own** and describe the style yourself.

Drag styles to reorder them, and click the eye icon to hide ones you don't use.

> The text and screenshots you use to build a style are sent once to the AI provider you chose. Only use content you're comfortable sharing.

## ⚠️ Shortcut conflicts

Rizz uses Control + Option, which most apps leave alone. If you set Rizz or another tool to share a shortcut, they clash: the shortcut does nothing, or your text lands in another window. Watch out for:

- **ChatGPT** desktop app (its floating window and pets)
- Launchers such as **Alfred** or **Raycast**
- Other dictation tools such as **Wispr Flow** (it uses **fn** by default, so the two can live side by side), **Superwhisper**, **Spokenly** or macOS Dictation
- **VoiceOver**, which uses Control + Option as its own keys while it's on

To fix it, change the shortcut in that app's settings, or pick a different one in Rizz under **General → Transcribe Shortcut**.

## Troubleshooting

- **"Failed to Paste"**: open **System Settings → Privacy & Security → Accessibility** and make sure Rizz is on. If it is and it still fails, remove Rizz with **−** and add it again.
- **Nothing happens after you talk**: check the shortcut conflicts above, then check that your API key is filled in under Styles → AI.
- **Rewrites feel slow**: switch the model to claude-haiku-5-5.

## Build from source

You need [Rust](https://rustup.rs/) and [Bun](https://bun.sh/):

```bash
bun install
CMAKE_POLICY_VERSION_MINIMUM=3.5 bun run tauri build --bundles app
```

`scripts/build-rizz.sh` signs the app with a local certificate named "Rizz Local Signing", so macOS keeps its permissions across rebuilds. Without that certificate, use the commands above.

## Credits

Rizz is a fork of [Handy](https://github.com/cjpais/Handy) by CJ Pais (MIT License). The original README is in [HANDY_README.md](HANDY_README.md).
