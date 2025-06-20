'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';

export type CarbonChartType = 'bar' | 'radar' | 'gauge';

interface BarData {
  categories: string[];
  values: number[];
}

interface RadarData {
  indicators: { name: string; max: number }[];
  values: number[];
}

interface GaugeData {
  value: number;
}

type ChartData = BarData | RadarData | GaugeData;

export default function useCarbonChart(type: CarbonChartType, data: ChartData) {
  const option = React.useMemo(() => {
    switch (type) {
      case 'bar': {
        const d = data as BarData;
        return {
          xAxis: { type: 'category', data: d.categories },
          yAxis: { type: 'value' },
          series: [{ type: 'bar', data: d.values }],
        };
      }
      case 'radar': {
        const d = data as RadarData;
        return {
          radar: { indicator: d.indicators },
          series: [{ type: 'radar', data: [{ value: d.values }] }],
        };
      }
      case 'gauge': {
        const d = data as GaugeData;
        return {
          series: [
            {
              type: 'gauge',
              progress: { show: true },
              detail: { formatter: '{value}%' },
              data: [{ value: d.value }],
            },
          ],
        };
      }
      default:
        return {};
    }
  }, [type, data]);

  return <ReactECharts option={option} />;
}
