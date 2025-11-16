import { MarkdownPostProcessorContext, MarkdownRenderChild, Plugin } from 'obsidian'
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
    parent_el: HTMLElement
    ctx: MarkdownPostProcessorContext

    el: HTMLElement
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
        this.source = source
        this.parent_el = el
        this.ctx = ctx

        // 分发        
        try {
            this.option = JSON.parse(source)
            return this.codeBlockProcessor_echarts_json()
        } catch (e) {
            return this.codeBlockProcessor_echarts_js()
        }
    }

    async codeBlockProcessor_echarts_json() {
        this.codeBlockProcessor_echarts_base()
    }

    async codeBlockProcessor_echarts_js() {
        // 如果 JSON 解析失败，则假定为 JavaScript
        // 使用异步函数构造器来执行代码，这比 eval 更安全
        // 我们将 echarts 实例和 ctx 传递给脚本，以便在脚本内部使用
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
        const func = new AsyncFunction('echarts', 'ctx', `
            let option;
            let width;
            let height;
            ${this.source}
            return { option, width, height };
        `)
        const result = await func(this.echarts, this.ctx)

        this.option = result.option
        if (result.width) this.width = result.width
        if (result.height) this.height = result.height

        this.codeBlockProcessor_echarts_base()
    }

    async codeBlockProcessor_echarts_base() {
        if (!this.option) {
            throw new Error('"option" variable is not defined in the script or the JSON is invalid.')
        }

        // 创建一个容器来放置图表和可能的错误信息
        this.el = this.parent_el.createDiv({ cls: 'echarts-container' })
        this.el.style.width = typeof this.width === 'number' ? `${this.width}px` : this.width
        this.el.style.height = typeof this.height === 'number' ? `${this.height}px` : this.height

        // ECharts 实例
        try {
            const chart = this.echarts.init(this.el) // 初始化

            // 设置图表配置
            chart.setOption(this.option)

            // 确保图表在窗口大小改变时能够自适应
            this.plugin.register(() => {
                chart.dispose()
            })
            
            // 当插件被卸载或代码块被重绘时，销毁图表实例以释放资源
            this.ctx.addChild(new CEChart_Render(this.el, chart))

        } catch (err) {
            console.error('ECharts rendering error:', err)
            // 如果发生错误，在代码块位置显示错误信息
            const errorEl = this.parent_el.createEl('pre', { cls: 'echarts-error' })
            errorEl.setText(`[ECharts] Render Error:\n${err.message}`)
        }
    }
}

class CEChart_Render extends MarkdownRenderChild {
    constructor(container: HTMLElement, public chart_obj: echarts.ECharts) {
        super(container)
    }

    onload(): void {
    }

    unload(): void {
        this.chart_obj.dispose()
    }
}
