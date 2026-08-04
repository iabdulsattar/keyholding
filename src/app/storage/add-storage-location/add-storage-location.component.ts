import { Component, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-add-storage-location',
  standalone: true,
  imports: [],
  templateUrl: './add-storage-location.component.html',
})
export class AddStorageLocationComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    const icons = (window as any).lucide;
    if (icons && icons.createIcons) {
      icons.createIcons();
    }
  }
}