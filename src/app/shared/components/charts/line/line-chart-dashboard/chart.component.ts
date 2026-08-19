import { Component, AfterViewInit, OnDestroy, ViewChild, Input } from '@angular/core';
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexTitleSubtitle,
  ApexDataLabels,
  ApexStroke,
  ApexGrid,
  ApexMarkers,
  ApexTooltip,
  NgApexchartsModule,
} from 'ng-apexcharts';

export type ChartOptions = {
  series?: ApexAxisChartSeries;
  chart?: ApexChart;
  xaxis?: ApexXAxis;
  title?: ApexTitleSubtitle;
  dataLabels?: ApexDataLabels;
  stroke?: ApexStroke;
  grid?: ApexGrid;
  markers?: ApexMarkers;
  tooltip?: ApexTooltip;
};

@Component({
  selector: 'app-line-chart-dashboard',
  standalone: true,
  imports: [NgApexchartsModule],
  templateUrl: './chart.component.html',
})
export class LineChartDashboardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chart') chart!: ChartComponent;

  @Input() chartOptions: Partial<ChartOptions> = {};

  ngAfterViewInit(): void {
    (window as any).ApexCharts?.setLicense?.(
      'APEX-eyJleHBpcnlEYXRlIjoiMjEyNi0wNy0wNCIsImlzc3VlRGF0ZSI6IjIwMjYtMDctMjgiLCJwbGFuIjoicHJlbWl1bSIsImRvbWFpbnMiOlsiYXBleGNoYXJ0cy5jb20iLCIxMjcuMC4wLjEiLCJsb2NhbGhvc3QiXSwic2lnIjoieVBmb1VCc0Z3TU9ZdUEyaEZkR0I2Y1FtZ0JITUtXcVdJSjB2NVRESXRZbFR3eDJMUmh6R2x0RUc3VXJ4X0s3b25ZMWRZb2Z2VGItN01ydFYyNDVyOWcifQ=='
    );
  }

  ngOnDestroy(): void {
    // no cleanup needed
  }
}
