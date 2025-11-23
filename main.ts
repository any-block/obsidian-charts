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
            void new CEcharts(this).codeBlockProcessor_echarts(source, el, ctx)
        })
    }

    onunload() {
    }
}

class CEcharts {
    echarts_lib: type_echarts
    source: string
    parent_el: HTMLElement
    ctx: MarkdownPostProcessorContext

    el: HTMLElement
    option: any
    width: number | string = '100%' // '600px' // 百分比可能不行，100%
    height: number | string = '400px'

    constructor(
        public plugin: EchartsDependPlugin
    ) {
        this.echarts_lib = plugin.echarts
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

        // 创建一个容器来放置图表和可能的错误信息
        this.el = this.parent_el.createDiv({ cls: 'echarts-container' })
        // 渲染前明确父元素尺寸
        // 必须保证先应用成功尺寸后，再去渲染ECharts。否则尺寸会为 min-width，导致 ECharts 图表尺寸过小
        this.el.style.width = typeof this.width === 'number' ? `${this.width}px` : this.width
        this.el.style.height = typeof this.height === 'number' ? `${this.height}px` : this.height
        await new Promise(resolve => setTimeout(resolve, 10))

        // 分发
        try {
            this.option = JSON.parse(source)
            return this.codeBlockProcessor_echarts_json()
        } catch (e) {
            // 如果 JSON 解析失败，则假定为 JavaScript
            return this.codeBlockProcessor_echarts_js()
        }
    }

    async codeBlockProcessor_echarts_json() {
        if (!this.option) {
            throw new Error('"option" variable is not defined in the script or the JSON is invalid.')
        }

        let echarts: echarts.ECharts | null = null
        try {
            // (1) 初始化
            const currentTheme = document.body.classList.contains('theme-dark') ? 'dark' : 'light'; // obsidian主题
            echarts = this.echarts_lib.init(this.el, currentTheme)

            // (2) 设置图表配置
            echarts.setOption(this.option)

            // (4) 动态变化部分
            this.plugin.register(() => { if (echarts) echarts.dispose() }) // 确保图表在窗口大小改变时能够自适应
            this.ctx.addChild(new CEChart_Render(this.el, echarts)) // 当插件被卸载或代码块被重绘时，销毁图表实例以释放资源
        } catch (err) {
            console.error('ECharts rendering error:', err)
            // 如果发生错误，在代码块位置显示错误信息
            const errorEl = this.parent_el.createEl('pre', { cls: 'echarts-error' })
            errorEl.setText(`[ECharts] Render Error:\n${err.message}`)
            if (echarts) { echarts.dispose(); }
        }
    }

    async codeBlockProcessor_echarts_js() {
        let echarts: echarts.ECharts | null = null
        try {
            // (1) 初始化
            const currentTheme = document.body.classList.contains('theme-dark') ? 'dark' : 'light'; // obsidian主题
            echarts = this.echarts_lib.init(this.el, currentTheme)

            // (2) 设置图表配置 —— by 函数
            // 使用异步函数构造器来执行代码，这比 eval 更安全
            // 
            // 脚本自需要运行 echarts.setOption
            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
            const ctx = {
                echarts: echarts,
                el: this.el,
                ctx: this.ctx,
                echarts_lib: this.echarts_lib,
            }
            // 名字这里有些问题:
            // 官方在线demo中，实例对象名是myChart, 库对象名是echarts
            // 而在 vuepress ecosystem 中，实例对象名是echarts, 暂无暴露库对象 (我已FR, 等待解决)
            const runner = new AsyncFunction('ctx', `\
const echarts = ctx.echarts;
const myChart = ctx.echarts;
const echarts_lib = ctx.echarts_lib;
let width,height,option,__echarts_config__;
{
    ${this.source}
    __echarts_config__={width,height,option};
}

return __echarts_config__;`)
            const result = await runner(ctx) // 传递给脚本一些上下文，以便在脚本内部使用
            if (result.width) {
                this.width = result.width
                this.el.style.width = typeof this.width === 'number' ? `${this.width}px` : this.width
                if (typeof this.width === 'number') echarts.resize({ width: this.width })
            }
            if (result.height) {
                this.height = result.height
                this.el.style.height = typeof this.height === 'number' ? `${this.height}px` : this.height
                if (typeof this.height === 'number') echarts.resize({ height: this.height })
            }
            this.option = result.option
            echarts.setOption({ ...this.option })

            // (4) 动态变化部分
            this.plugin.register(() => { if (echarts) echarts.dispose() }) // 确保图表在窗口大小改变时能够自适应
            if (echarts) this.ctx.addChild(new CEChart_Render(this.el, echarts)) // 当插件被卸载或代码块被重绘时，销毁图表实例以释放资源
        } catch (err) {
            console.error('ECharts rendering error:', err)
            // 如果发生错误，在代码块位置显示错误信息
            const errorEl = this.parent_el.createEl('pre', { cls: 'echarts-error' })
            errorEl.setText(`[ECharts] Render Error:\n${err.message}`)
            if (echarts) { echarts.dispose(); }
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
