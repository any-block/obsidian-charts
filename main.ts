import { MarkdownPostProcessorContext, Plugin } from 'obsidian'
import * as echarts from 'echarts'
import * as chartjs from 'chart.js'
type type_echarts = typeof echarts
type type_chartjs = typeof chartjs

export default class EchartsDependPlugin extends Plugin {
    public echarts: type_echarts
    public chartjs: type_chartjs

    async onload() {
        this.echarts = echarts
        this.chartjs = chartjs

        this.registerMarkdownCodeBlockProcessor('echarts', (source, el, ctx) => {
            new CEcharts(this).codeBlockProcessor_echarts(source, el, ctx)
        })
    }

    onunload() {
    }

    
}

class CEcharts {
    echarts: type_echarts

    source: string
    el: HTMLElement
    ctx: MarkdownPostProcessorContext

    option: any
    width: number | string = '100%'
    height: number | string = '400px'

    constructor(
        public plugin: EchartsDependPlugin
    ) {
        this.echarts = plugin.echarts
    }

    /**
     * 处理 echart 代码块并渲染图表
     * @param source 代码块中的字符串内容 (JSON 或 JavaScript)
     * @param el 用于渲染的 HTML 元素
     * @param ctx Markdown 后处理上下文
     */
    async codeBlockProcessor_echarts(
        source: string,
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext
    ) {
        this.source = source;
        this.el = el;
        this.ctx = ctx;

        // 分发        
        try {
            this.option = JSON.parse(source);
            return this.codeBlockProcessor_echarts_json();
        } catch (e) {
            return this.codeBlockProcessor_echarts_js();
        }
    }

    async codeBlockProcessor_echarts_json() {
        this.codeBlockProcessor_echarts_base();
    }

    async codeBlockProcessor_echarts_js() {
        // 如果 JSON 解析失败，则假定为 JavaScript
        // 使用异步函数构造器来执行代码，这比 eval 更安全
        // 我们将 echarts 实例和 ctx 传递给脚本，以便在脚本内部使用
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const func = new AsyncFunction('echarts', 'ctx', `
            let option;
            let width;
            let height;
            ${this.source}
            return { option, width, height };
        `);
        const result = await func(this.echarts, this.ctx);

        this.option = result.option;
        if (result.width) this.width = result.width;
        if (result.height) this.height = result.height;

        this.codeBlockProcessor_echarts_base();
    }

    async codeBlockProcessor_echarts_base() {
        // 创建一个容器来放置图表和可能的错误信息
        const chartContainer = this.el.createDiv({ cls: 'echarts-container' });
        try {
            let width: string | number = '100%';
            let height: string | number = '400px'; // 默认高度

            // 尝试将源码解析为 JSON
            

            if (!this.option) {
                throw new Error('"option" variable is not defined in the script or the JSON is invalid.');
            }
            
            // 设置图表容器的尺寸
            chartContainer.style.width = typeof width === 'number' ? `${width}px` : width;
            chartContainer.style.height = typeof height === 'number' ? `${height}px` : height;

            // 初始化 ECharts 实例
            const chart = this.echarts.init(chartContainer);

            // 设置图表配置
            chart.setOption(this.option);

            // 确保图表在窗口大小改变时能够自适应
            this.plugin.register(() => {
                chart.dispose();
            });
            
            // 当插件被卸载或代码块被重绘时，销毁图表实例以释放资源
            this.ctx.addChild(new (class {
                unload() {
                    chart.dispose();
                }
            })() as any);

        } catch (err) {
            console.error('ECharts rendering error:', err);
            // 如果发生错误，在代码块位置显示错误信息
            const errorEl = this.el.createEl('pre', { cls: 'echarts-error' });
            errorEl.setText(`[ECharts] Render Error:\n${err.message}`);
        }
    }
}
