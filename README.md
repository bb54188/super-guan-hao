我是关昊，🤩🤯🤩🤯🤩🔥👍🤯👍🤯🚀🚀😱😋😊👎🏻😱👍🚀。

## Bug 自动修复通道

网站的 `/bugs` 页面会把反馈保存到现有 R2 桶，并通过 GitHub `repository_dispatch` 启动
`.github/workflows/bug-autofix.yml`。Codex 只允许修改 `app/` 和 `worker/`，候选修改必须通过
lint、构建、测试和 Wrangler dry-run，随后只创建等待管理员确认的草稿 PR。

启用完整自动修复需要：

1. 在 Cloudflare Worker `super-guan-hao` 中添加加密 Secret `GITHUB_AUTOFIX_TOKEN`。使用仅授权
   `bb54188/super-guan-hao`、仓库 Contents 写权限的 fine-grained GitHub token。
2. 在 GitHub 仓库 Actions secrets 中添加 `OPENAI_API_KEY`。

缺少这些 Secret 时，Bug 仍会安全保存，但状态会显示为“等待启用”，不会假装已经调用 ChatGPT。
