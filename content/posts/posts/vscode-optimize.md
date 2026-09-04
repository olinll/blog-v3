---
title: VSCode优化指南
description: 在VSCode中优化开发环境，如何解决一些遇到的问题。
date: 2025-11-12
updated: 2025-11-12
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [开发]
tags: [VSCode]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

## vscode 打开多个项目的时候，设置“任务栏处以项目名称”显示

在设置中搜 “Window: Title”改成：

```sql
#原始的
#${dirty}${activeEditorShort}${separator}${rootName}${separator}${profileName}${separator}${appName}

${dirty}${rootName}${separator}${activeEditorMedium}${separator}${appName}

```

## VSCode 终端显示“pnpm : 无法加载文件 C:\Program Files\nodejs\npm.ps1，因为在此系统上禁止运行脚本”

解决方法：

1. 以管理员身份运行 PowerShell。
2. 执行以下命令：

```bash
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

3. 输入 Y 确认。
