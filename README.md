我是关昊，🤩🤯🤩🤯🤩🔥👍🤯👍🤯🚀🚀😱😋😊👎🏻😱👍🚀。

## Bug 自动修复通道

网站的 `/bugs` 页面会先把反馈保存到现有 R2 桶。访客不能直接调用付费模型；管理员必须在
`/review` 点击“交给 DeepSeek 修复”，Worker 才会通过 GitHub `repository_dispatch` 启动
`.github/workflows/bug-autofix.yml`。受限修复代理只提供读取、搜索和精确替换工具，只允许修改
已有的 `app/` 和 `worker/` 源文件。候选修改必须通过 lint、构建、测试和 Wrangler dry-run，
随后只创建等待管理员确认的草稿 PR。

启用完整自动修复需要：

1. 在 Cloudflare Worker `super-guan-hao` 中添加加密 Secret `GITHUB_AUTOFIX_TOKEN`。使用仅授权
   `bb54188/super-guan-hao`、仓库 Contents 写权限的 fine-grained GitHub token。
2. 在 GitHub 仓库的 Actions secrets 中添加 `DEEPSEEK_API_KEY`。该密钥只传给单独的 DeepSeek
   修复步骤，不应写进代码、Cloudflare 环境变量或聊天记录。
3. 在 GitHub 仓库 Actions 设置中允许 Actions 创建 Pull Request；自动修复只创建草稿 PR，
   不会自动合并或直接修改线上网站。

缺少这些 Secret 时，Bug 仍会安全保存，但状态会显示为“等待启用”，不会假装已经调用 DeepSeek。
