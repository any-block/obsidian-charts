import { Plugin } from 'obsidian';
import * as echarts from 'echarts';
import * as chartjs from 'chart.js';

export default class EchartsDependPlugin extends Plugin {
	public echarts: typeof echarts;
	public chartjs: typeof chartjs;

	async onload() {
		this.echarts = echarts;
		this.chartjs = chartjs;
	}

	onunload() {
	}
}
