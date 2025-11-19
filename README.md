# Obsidian Charts Depend

只有两个功能:

- 为其他插件提供 ECharts 与 Chart.js 依赖
  - 其他插件可以将 ECharts 作为可选依赖，避免插件体积过大 (1.27MB) 且重复
  - 也便于开发者无需自行维护 ECharts 版本 (可能存在过期问题，若过期又不想更新，则需自行依赖在自己的插件中并固定)
- 提供 echarts / chartjs 类型的代码块
  - 可以通过代码块简单地渲染 ECharts / Chart.js

## (1) 为其他插件提供 ECharts 与 Chart.js 依赖

安装即可

- 最好是先加载该插件，再加载需要依赖于该插件的插件。可以用一些延时加载插件做到这一点
- 当然，依赖于该插件的插件，也可以做一些操作避免这种繁琐步骤: 加载后等待轮询一段时间，去尝试寻找该插件并获取对应的依赖

For developer: 其他插件如何获取依赖? 以下是一个代码示例:

```typescript
import { App, Plugin } from 'obsidian';

// 假设这是另一个插件
export default class MyChartPlugin extends Plugin {
    private echarts: any;

    async onload() {
        this.app.workspace.onLayoutReady(() => {
            const echartsPlugin = this.app.plugins.plugins['obsidian-echarts-depend'];
            if (echartsPlugin) {
                this.echarts = echartsPlugin.echarts;
                console.log('Successfully get echarts from EchartsDependPlugin.');
                // 在这里您就可以使用 this.echarts 来创建图表了
                // 例如：const myChart = this.echarts.init(document.getElementById('main'));
            } else {
                console.error('EchartsDependPlugin not found. Please install and enable it.');
                // 在这里可以做一些降级处理，比如提示用户安装依赖插件
            }
        });
    }
}
```

## (2) 提供 echarts / chartjs 类型的代码块

代码块类型为 echarts / chartjs

### 语法

参考了 vuepress 生态系统中的语法:

- https://theme-hope.vuejs.press/zh/guide/markdown/chart/echarts.html
- https://ecosystem.vuejs.press/zh/plugins/markdown/markdown-chart/echarts.html

更详细的语法你可以参考 ECharts 和 chart.js 官网

部分教程可见上，或见插件示例 (需要同时安装此插件和 AnyBlock 插件再进行查看): [demo from vuepress-hope-theme](./docs/demo%20from%20vuepress-hope-theme.md)

### 使用 anyblock, 并用 js/json 作为代码块类型进行美化

与 vuepress 插件中的用法不同的是，该插件本身不支持 `:::` 语法，你需要直接使用 echart / chartjs 作为代码块类型

至于使用 json / js 作为代码块类型进行美化，并使用 `:::` 或其他标识将其转换为 echarts / chartjs 代码块并渲染的功能，
则交由我的另一个插件实现 —— [AnyBlock](https://github.com/any-block/any-block)

其语法见: [demo from vuepress-hope-theme](./docs/demo%20from%20vuepress-hope-theme.md)

### 使用 anyblock，并使用一些转换处理器来简化语法

anyblock 2025-11-19 之后的版本内置了一些将 markdown 转 echarts 对象的处理器，你可以使用他们大幅简化 echarts 的书写。如:

```md
[list2echarts_radial|code(echarts)]

- 11
  - 22
  - 33
- 44
```

(如果你觉得开头那一串很长，你可以使用别名系统将他们修改成任意标识，甚至是非英文标识。你也可以使用 anymenu 插件/软件来可视化快速输入他们，减少记忆负担)

## 其他

### 学习 ECharts / chartjs 编写

此处仅提供一些资料

- ECharts (官方提供中文文档)
  - 官网: https://echarts.apache.org/zh/index.html
  - 快速入门: https://echarts.apache.org/handbook/zh/get-started/#
  - 示例: https://echarts.apache.org/examples/zh/index.html
- Chart.js
  - 官网：https://www.chartjs.org/

参考了 Vuepress-Hope-Theme 的部分语法: https://theme-hope.vuejs.press/zh/guide/markdown/chart/echarts.html，在此鸣谢。这里尽量使语法与之贴近，以便跨平台使用
