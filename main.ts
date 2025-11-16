import { Plugin } from 'obsidian';
import * as echarts from 'echarts';

export default class EchartsDependPlugin extends Plugin {
	public echarts: typeof echarts;

	async onload() {
		this.echarts = echarts;
	}

	onunload() {
	}
}
