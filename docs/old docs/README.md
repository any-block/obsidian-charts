# 旧文档说明

## 一个 vuepress 插件的 BREAKCHANGE

> [!warning]
> 旧文档适用于 https://github.com/vuepress/ecosystem/pull/574 之前的 vuepress 版本
> 不使用于该 pr 之后的版本

以前的 vuepress 生态插件中，对于脚本形式的变量暴露命名，并不与 ECharts 官方的文档或Examples保持一致

- 在 ECharts 文档和Examples 中，库名为 `echarts`，而实例名为 `myChart`
- 但以前的 vuepress echarts 插件中，不暴露库名，而实例名为 `echarts` (与ECharts官方的命名相反了，且有歧义)

而此 PR 所做的 BREAKCHANGE，重新规范了命名，使得可视化编辑快方便。这此得 ECharts 官网文档/示例、Vuepress插件、Obsidian插件，这三端的语法能够和谐地统一通用。

鸣谢: 我向 vuepress 团队中的 Mr.Hope 反馈了这个缺失库对象及暴露变量命名的问题，感谢其非常快速地响应和修改

## 旧版本的编辑方案

你可以使用 https://echarts.apache.org/examples/zh/editor.html 在线可视化编辑。在编辑完成后，你可以将代码复制到上面所说的语法的代码块中，**并在头部添加**:

```js
let echarts = myCharts;
echarts = echarts_lib;
```

反过来，如果你想要在线编辑这里的内容，则需要去除上面的内容，或在头部加上:

```js
let echarts_lib = echarts
echarts = myCharts
```

> [!WARNING]
> 由于暴露给脚本的变量名与和echarts官网示例中的变量名不完全一致，如果你使用到了这些变量，你通常需要做这一步
