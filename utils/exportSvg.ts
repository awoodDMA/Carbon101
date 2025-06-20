import type { ECharts } from 'echarts';

export default function exportSvg(chart: ECharts, filename = 'chart.svg') {
  const url = chart.getDataURL({ type: 'svg' })
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
