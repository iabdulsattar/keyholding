import { Component, AfterViewInit, OnDestroy, ViewChild, Input } from '@angular/core';
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexNonAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexTitleSubtitle,
  ApexDataLabels,
  ApexStroke,
  ApexFill,
  ApexLegend,
  ApexTooltip,
  ApexMarkers,
  ApexPlotOptions,
  ApexResponsive,
  ApexGrid,
  ApexAnnotations,
  ApexStates,
  ApexTheme,
  NgApexchartsModule,
} from 'ng-apexcharts';

export type ChartOptions = {
  series?: ApexAxisChartSeries | ApexNonAxisChartSeries;
  chart?: ApexChart;
  xaxis?: ApexXAxis;
  yaxis?: ApexYAxis | ApexYAxis[];
  title?: ApexTitleSubtitle;
  subtitle?: ApexTitleSubtitle;
  dataLabels?: ApexDataLabels;
  stroke?: ApexStroke;
  fill?: ApexFill;
  legend?: ApexLegend;
  tooltip?: ApexTooltip;
  markers?: ApexMarkers;
  plotOptions?: ApexPlotOptions;
  responsive?: ApexResponsive[];
  grid?: ApexGrid;
  annotations?: ApexAnnotations;
  states?: ApexStates;
  theme?: ApexTheme;
  colors?: string[];
  labels?: any;
};

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [NgApexchartsModule],
  templateUrl: './chart.component.html',
})
export class AppChart implements AfterViewInit, OnDestroy {
  @ViewChild('chart') chart!: ChartComponent;
  @Input() series: number[] = [];
  @Input() labels: string[] = [];

  private currentSeries: any[] = [];

  private appendData = (): any => {
    var arr = this.currentSeries.slice();
    arr.push(Math.floor(Math.random() * (100 - 1 + 1)) + 1);
    return arr;
  };

  private removeData = (): any => {
    var arr = this.currentSeries.slice();
    arr.pop();
    return arr;
  };

  private randomize = (): any => {
    return this.currentSeries.map(function () {
      return Math.floor(Math.random() * (100 - 1 + 1)) + 1;
    });
  };

  private reset = (): any => {
    return this.chartOptions.series;
  };

  public chartOptions: Partial<ChartOptions> = {
    chart: {
      height: 240,
      // width: 380,
      type: 'donut',
    },
    colors: ['#10b981', '#2563eb', '#f59e0b', '#e9edf5'],

    stroke: {
      width: 0
    },

    dataLabels: {
      enabled: false,
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200,
          },
          legend: {
            show: false,
          },
        },
      },
    ],
    legend: {
      position: 'bottom',
      // offsetY: 0,
      // height: 230,
    },
  };

  ngOnChanges(): void {
    this.syncChartOptions();
  }

  private syncChartOptions(): void {
    const hasInput = this.series.length > 0 && this.labels.length > 0;
    this.currentSeries = hasInput ? [...this.series] : [44, 55, 13, 33];
    this.chartOptions = {
      ...this.chartOptions,
      series: this.currentSeries,
      labels: hasInput ? this.labels : ['Stocks', 'Bonds', 'Real Estate', 'Cash'],
      
    };
  }

  ngAfterViewInit() {
    (window as any).ApexCharts.setLicense('APEX-eyJleHBpcnlEYXRlIjoiMjEyNi0wNy0wNCIsImlzc3VlRGF0ZSI6IjIwMjYtMDctMjgiLCJwbGFuIjoicHJlbWl1bSIsImRvbWFpbnMiOlsiYXBleGNoYXJ0cy5jb20iLCIxMjcuMC4wLjEiLCJsb2NhbGhvc3QiXSwic2lnIjoieVBmb1VCc0Z3TU9ZdUEyaEZkR0I2Y1FtZ0JITUtXcVdJSjB2NVRESXRZbFR3eDJMUmh6R2x0RUc3VXJ4X0s3b25ZMWRZb2Z2VGItN01ydFYyNDVyOWcifQ==');

    document.querySelector('#randomize')?.addEventListener('click', () => {
      this.chart.updateSeries(this.currentSeries = (this.randomize()));
    });
    document.querySelector('#add')?.addEventListener('click', () => {
      this.chart.updateSeries(this.currentSeries = (this.appendData()));
    });
    document.querySelector('#remove')?.addEventListener('click', () => {
      this.chart.updateSeries(this.currentSeries = (this.removeData()));
    });
    document.querySelector('#reset')?.addEventListener('click', () => {
      this.chart.updateSeries(this.currentSeries = (this.reset()));
    });
  }

  ngOnDestroy() {
    // no cleanup needed
  }
}
