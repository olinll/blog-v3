---
title: Halo博客Hao主题添加个人导航页
description: 详解如何在Halo博客中添加个人导航页，包括添加链接、分组、自定义属性等。
date: 2025-11-09
updated: 2026-06-27 15:16:40
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [服务]
tags: [Halo, 主题, 导航页]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

> 本教程是修改的主题是[Halo-theme-Hao](https://github.com/chengzhongxue/halo-theme-hao) 版本是：1.6.6
> 
> 根据友联页面修改而来。
> 
> 原理是添加链接，给分组添加一个自定义属性，通过属性过滤展示的链接

~~效果如图：[前往：导航页](#)~~

![](./images/halo-hao-navigation-813593.webp)

下面就开始教程吧！

## 修改Halo运行配置

在运行时会缓存模板文件，下次访问不再会读取物理的模板文件，这会有性能的损耗。

如果我们修改主题，可以添加一个运行参数

[搭建开发环境](https://docs.halo.run/developer-guide/theme/prepare#搭建开发环境)

::alert{type="warning"}

`--spring.thymeleaf.cache=false` 仅用于开发调试，生产环境必须移除此参数，否则会严重影响性能。

::

```shell
# 关闭主题模板缓存
- --spring.thymeleaf.cache=false
```

## 创建navigation模板页面

首先先找到主题文件夹：在持久化存储的`halo2`文件夹下的`themes/theme-hao`里面

## 修改theme.yaml配置

找到`spec.customTemplates.page`添加一个导航页面模板：

```yaml
spec:
  displayName: Hao
  author:
    name: 程序员小航 & 困困鱼 & Carol
    website: https://github.com/chengzhongxue
  customTemplates:
    page:
      - name: 友情链接页面模版
        description: 支持可预设文本的友链
        screenshot:
        file: page_links.html
      # 添加导航页面模板
      - name: 导航页面模板
        description: 个人导航页
        screenshot:
        file: navigation.html
```

## 添加navigation.html

在`templates`目录下新建一个文件`navigation.html`

添加如下内容：

```html
<!DOCTYPE html>
<html  xmlns:th="http://www.thymeleaf.org"
      th:replace="~{modules/layouts/layout :: layout(content = ~{::content}, htmlType = 'page',title = ${singlePage.spec.title + ' | ' + site.title}, head = ~{::head})}">
<th:block th:fragment="head">
    <th:block th:replace="~{modules/common/open-graph :: open-graph(_title = ${singlePage.spec.title},
                _permalink = ${singlePage.status.permalink},
                _cover = ${singlePage.spec.cover},
                _excerpt = ${singlePage.status.excerpt},
                _type = 'website')}"></th:block>
</th:block>
<th:block th:fragment="content">

    <div class="page" id="body-wrap">
        <header class="not-top-img" id="page-header">
            <nav th:replace="~{modules/nav :: nav(title = ${singlePage.spec.title})}"></nav>
            <link rel="stylesheet" type="text/css" th:href="${assets_link + '/libs/fcircle/heo-fcircle3.css'}">

        </header>
        <main class="layout hide-aside" id="content-inner">
            <div id="page">
                <th:block th:replace="~{macro/content-nav :: content-nav(${htmlType})}" />
                <hr/>
                <!--/* 评论组件 */-->
                <th:block
                        th:replace="~{modules/comment :: comment(group = 'content.halo.run',
                  kind = 'SinglePage',
                  name = ${singlePage.metadata.name},
                  allowComment = ${singlePage.spec.allowComment})}"/>
            </div>
        </main>
        <!-- 底部 -->
        <footer th:replace="~{modules/footer}"/>
    </div>

</th:block>

</html>
```
