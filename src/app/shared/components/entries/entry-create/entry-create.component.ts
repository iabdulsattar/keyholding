import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../ui/button/button.component';
import { PermissionService } from '../../../../core/services/permission.service';

@Component({
  selector: 'app-entry-create',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './entry-create.component.html',
})
export class EntryCreateComponent {
  @Output() create = new EventEmitter<void>();
  private permissionService = inject(PermissionService);
  canCreate = this.permissionService.hasPermission('entry.create');

  constructor(private router: Router) {}

  onCreate() {
    if (!this.canCreate) return;
    this.create.emit();
    this.router.navigate(['/create-entry']);
  }
}
