<p align="center"><img src="rizz-icon.png" width="128" alt="Rizz"></p>

# Rizz

说一句大白话，Rizz 帮你换成想要的语气，直接打到光标所在的地方。

按住快捷键说话 → 语音在本机转成文字 → AI 按你选的风格改写 → 自动粘贴。

## 特点

- **按住就说**：在任何 app 里都能用，微信、Slack、邮件、备忘录……
- **一键换风格**：自带 Original（原话）、Friendly、Diplomatic、Manager、Airtight、Silly、Flirty。
- **做你自己的风格**：粘贴聊天记录或一段文字，或者丢几张聊天截图，Rizz 会学会这种说话方式，生成一个新风格。也可以自己写要求。
- **语音识别在本机完成**，不上传录音。

## 安装

> 需要 Apple 芯片的 Mac（M1 及以后）。

1. 打开 [Releases](../../releases/latest)，下载 `Rizz.zip`，解压，把 **Rizz.app** 拖进「应用程序」文件夹。
2. 第一次打开时，macOS 会提示「无法验证开发者」，因为这个 app 没有经过 Apple 公证。这样打开：
   - 双击 Rizz，看到提示后点「完成」。
   - 打开 **系统设置 → 隐私与安全性**，往下滚，找到 Rizz 那一行，点 **仍要打开**，输入电脑密码。
   - 旧版 macOS 也可以直接 **右键点 Rizz → 打开**。
   - 还不行的话，在终端运行：
     ```bash
     xattr -dr com.apple.quarantine /Applications/Rizz.app
     ```
3. 按提示允许 **麦克风** 和 **辅助功能** 权限。辅助功能是用来把文字粘贴到光标位置的。
4. 第一次使用会下载一个语音识别模型，等它下完就行。

## 设置 AI（必须）

改写语气要用 AI，每个人用自己的账号：

1. 去 [console.anthropic.com](https://console.anthropic.com) 注册，创建一个 **API key**（需要绑卡，按用量付费；改写一句话的用量很小）。
2. 打开 Rizz → **Styles** → 最下面的 **AI**：
   - Provider 选 **Claude**
   - API Key 粘贴你的 key
   - Model 选 **claude-haiku-5-5**（最快）
3. 不想付费的话，Provider 也可以选 **Apple Intelligence**（需要 macOS 26 及以上，并在系统设置里打开 Apple Intelligence），免费但改写效果差一些。也支持 GPT（OpenAI 的 key）。

你的 key 只存在你自己的电脑上。

## 怎么用

| 快捷键 | 作用 |
|---|---|
| **Option + Space** | 按住说话，松开后按当前风格输出 |
| **Option + Shift + S** | 换风格。按住 Option + Shift，再按 S 或 ↑↓ 选择 |
| **Esc** | 取消这次录音 |

选 **Original** 就是说什么打什么，不改写。

## 做自己的风格

**Styles → New Style from Chats or Text**

- 粘贴一段聊天记录、一封邮件、任何你喜欢的文字，或者点 **Add Files** 加聊天截图。
- 如果是聊天记录，选一下要模仿的是哪个人。
- 点 **Build**，生成后可以再改，满意就保存。
- 不想用例子的话，点 **Write Your Own** 直接写要求。

风格列表可以拖动排序，用不到的可以点眼睛图标隐藏。

> 用来生成风格的文字和截图会发给你选的 AI 处理一次，请只用你愿意分享的内容。

## ⚠️ 快捷键冲突

Option + Space 很常用。如果你装了下面这些 app，很可能会撞车，表现是：按了没反应，或者文字跑到别的窗口里去了。

- **ChatGPT** 桌面版（浮动小窗、宠物）
- **Alfred**、**Raycast** 等启动器
- **Wispr Flow**、**Superwhisper**、**Spokenly**、macOS 自带听写等其他语音输入工具

解决办法：去那个 app 的设置里改掉它的快捷键，或者在 Rizz → **General → Transcribe Shortcut** 换一个组合。

## 常见问题

- **提示 Failed to Paste**：去 **系统设置 → 隐私与安全性 → 辅助功能**，确认 Rizz 是打开的。如果已经打开还是不行，把 Rizz 删掉（点 −）再加回来。
- **说完没反应**：先看看上面的快捷键冲突；再看看 Styles → AI 里 key 有没有填。
- **改写有点慢**：模型换成 claude-haiku-5-5。

## 从源码编译

需要 [Rust](https://rustup.rs/) 和 [Bun](https://bun.sh/)：

```bash
bun install
CMAKE_POLICY_VERSION_MINIMUM=3.5 bun run tauri build --bundles app
```

`scripts/build-rizz.sh` 会用一个叫 "Rizz Local Signing" 的本地证书签名，这样每次重新编译后 macOS 权限不会丢。没有这个证书的话，用上面的命令就行。

## 致谢

Rizz 基于 [Handy](https://github.com/cjpais/Handy)（作者 CJ Pais，MIT 协议）修改而来。原项目说明见 [HANDY_README.md](HANDY_README.md)。
