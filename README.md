# Obsidian ECharts Depend

只有两个功能:

- 为其他插件提供 ECharts 与 Chart.js 依赖
  - 其他插件可以将 ECharts 作为可选依赖，避免插件体积过大 (1.27MB) 且重复
  - 也便于开发者无需自行维护 ECharts 版本 (可能存在过期问题，若过期又不想更新，则需自行依赖在自己的插件中并固定)
- 提供 echarts / chartjs 类型的代码块
  - 可以通过代码块简单地渲染 ECharts / Chart.js

## 为其他插件提供 ECharts 依赖

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

## 提供 echarts / chartjs 类型的代码块

略

## 学习 ECharts / chartjs 编写

此处仅提供一些资料

- ECharts (官方提供中文文档)
  - 官网: https://echarts.apache.org/zh/index.html
  - 快速入门: https://echarts.apache.org/handbook/zh/get-started/#
  - 示例: https://echarts.apache.org/examples/zh/index.html
- Chart.js
  - 官网：https://www.chartjs.org/

参考了 Vuepress-Hope-Theme 的部分语法: https://theme-hope.vuejs.press/zh/guide/markdown/chart/echarts.html，在此鸣谢。这里尽量使语法与之贴近，以便跨平台使用
