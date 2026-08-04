import { Component, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-edit-storage-location',
  standalone: true,
  imports: [],
  templateUrl: './edit-storage-location.component.html',
})
export class EditStorageLocationComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    const icons = (window as any).lucide;
    if (icons && icons.createIcons) {
      icons.createIcons();
    }
  }
}
