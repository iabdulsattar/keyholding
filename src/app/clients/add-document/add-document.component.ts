import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService } from '../../core/services/client.service';
import { RichSelectComponent, RichSelectOption } from '../../shared/components/form/rich-select/rich-select.component';
import { PageBreadcrumbComponent, BreadcrumbItem } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

@Component({
  selector: 'app-add-document',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, RichSelectComponent, PageBreadcrumbComponent],
  templateUrl: './add-document.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  `]
})
export class AddDocumentComponent implements OnInit {
  clientId = '';
  clientName = 'Metro Security Services';

  documentName = '';
  category = '';
  documentType = '';
  relatedTo = '';
  description = '';
  notifyUsers = true;
  fileName = '';
  selectedFile: File | null = null;
  uploading = false;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Client Management', link: '/clients' },
    { label: 'Clients', link: '/clients' },
    { label: this.clientName, link: ['/clients', this.clientId] },
    { label: 'Documents' },
    { label: 'Add Document' }
  ];

  categoryOptions: RichSelectOption[] = [
    { value: '', label: 'Select category' },
    { value: 'Contract', label: 'Contract' },
    { value: 'License', label: 'License' },
    { value: 'Insurance', label: 'Insurance' },
    { value: 'Report', label: 'Report' },
    { value: 'Compliance', label: 'Compliance' },
    { value: 'Certificate', label: 'Certificate' },
    { value: 'Other', label: 'Other' },
  ];
  documentTypeOptions: RichSelectOption[] = [
    { value: '', label: 'Select document type' },
    { value: 'PDF', label: 'PDF' },
    { value: 'Image', label: 'Image' },
  ];
  relatedToOptions: RichSelectOption[] = [
    { value: '', label: 'Select related item' },
    { value: 'Site', label: 'Site' },
    { value: 'Job', label: 'Job' },
    { value: 'Key', label: 'Key' },
  ];

  constructor(private route: ActivatedRoute, private router: Router, private clientService: ClientService) {}

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id') || '';
    this.loadClientName();
  }

  private loadClientName(): void {
    if (!this.clientId) return;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;
    this.clientService.getClientById(orgId, this.clientId).subscribe({
      next: (client) => {
        if (client?.name) {
          this.clientName = client.name;
        }
      },
      error: () => {}
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only PDF and image files (.pdf, .jpg, .jpeg, .png, .webp) are allowed.');
        input.value = '';
        this.selectedFile = null;
        this.fileName = '';
        return;
      }
      this.selectedFile = file;
      this.fileName = file.name;
    }
  }

  goBack(): void {
    this.router.navigate(['/clients', this.clientId]);
  }

  cancel(): void {
    this.goBack();
  }

  uploadDocument(): void {
    if (!this.selectedFile || !this.documentName || !this.category || !this.documentType) {
      return;
    }
    this.uploading = true;
    this.clientService.createDocument(this.clientId, this.selectedFile, this.documentName, this.category, this.documentType, this.description).subscribe({
      next: () => {
        this.uploading = false;
        this.router.navigate(['/clients', this.clientId]);
      },
      error: () => {
        this.uploading = false;
      }
    });
  }
}
