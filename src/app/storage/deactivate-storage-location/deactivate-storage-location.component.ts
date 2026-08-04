import { Component, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-deactivate-storage-location',
  standalone: true,
  imports: [],
  templateUrl: './deactivate-storage-location.component.html',
})
export class DeactivateStorageLocationComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    const icons = (window as any).lucide;
    if (icons && icons.createIcons) {
      icons.createIcons();
    }
  }
}
