---
title: 将“上游项目”的更新合并到“我的项目”上
description: 几行代码即可合并上游分支的最新代码
date: 2026-03-08
updated: 2026-03-08
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [开发]
tags: [git]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

## 一、添加上游项目的本地分支索引

1、从名为 `upstream`的远程仓库拉取 `master`分支的最新信息到本地

```bash
git fetch upstream master
```

此操作只会更新本地仓库的远程分支索引（如 `upstream/master`），不会自动修改你本地任何分支上的文件

2、使用 `--force`选项，强制创建一个名为 `master-upstream`的新本地分支（如果已存在则重置），并让其指向 `upstream/master`所对应的提交

```bash
git branch --force master-upstream upstream/master
```

这个分支相当于当前上游 `master`分支状态的一个快照。

3、列出所有名称匹配 `master-upstream`的分支

```bash
git branch --list master-upstream
```

4、显示 master-upstream分支最近的10条提交记录

```bash
git log --oneline master-upstream -n 10
```

## 二、上游项目的更新

1、将上游仓库为`upstream`的最新提交记录拉到本地

```bash
git fetch upstream
```

更新所有远程跟踪分支（包括 `upstream/master`），但不会改动任何本地分支的工作内容。

2、强制重置 `master-upstream`分支，使其指向 `upstream/master`最新的提交

```bash
git branch -f master-upstream upstream/master
```

## 三、将更新合并到本地分支`master`

1、切换到`master`分支

```bash
git switch master
```

2、将 `master-upstream`上的最新内容整合到 `master`分支

```bash
git merge master-upstream
```

## 四、解决任何冲突，完成合并后提交并推送代码到`master`

```bash
git push origin master
```

## 小贴士：如何优雅地处理合并冲突？

当你执行 `git merge` 看到提示 `CONFLICT (content): Merge conflict in <file>` 时，不要慌，按照这三步走：

1. 找到“案发现场”

打开冲突的文件，你会看到 Git 自动标记的冲突区域：

```sql
<<<<<< HEAD
这里是你本地 master 分支的代码（你改动的内容）
======
这里是上游 master-upstream 分支的代码（别人改动的内容）
>>>>>> master-upstream
```

2. 进行“人工裁决”

- 保留一方： 删掉你不想要的那部分代码和所有的 `<<<<` `====` `>>>>` 标记。
- 整合双方： 手动将两段代码逻辑合并在一起，然后删掉标记。
- VS Code 技巧： 如果你用 VS Code，代码上方会出现快捷按钮（Accept Current Change / Accept Incoming Change），点一下即可自动完成。

3. 告诉 Git 冲突已搞定

修改并保存文件后，必须执行：

```bash
# 1. 将解决后的文件标记为已暂存
git add <文件名>

# 2. 完成合并提交
git commit -m "fix: 解决与上游分支的合并冲突"
```

如果合并过程太乱，你想重头来过，可以执行 git merge --abort 瞬间回到合并前的干净状态，就像什么都没发生过一样。
