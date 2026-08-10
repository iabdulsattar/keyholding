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
  fileError = '';
  uploading = false;
  touched = new Set<string>();
  submitted = false;

  get informationInvalid(): boolean {
    return this.submitted && (
      !this.documentName.trim() ||
      !this.category ||
      !this.documentType ||
      !this.selectedFile
    );
  }

  markTouched(field: string): void {
    this.touched.add(field);
  }

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
      const allowedTypes = this.getUploadAllowedTypes();
      if (!allowedTypes.includes(file.type)) {
        const typeLabel = this.documentType === 'Image' ? 'images' : 'PDFs';
        this.fileError = `Only ${typeLabel} are allowed for the selected document type.`;
        input.value = '';
        this.selectedFile = null;
        this.fileName = '';
        return;
      }
      this.fileError = '';
      this.selectedFile = file;
      this.fileName = file.name;
    }
  }

  onDocumentTypeChange(): void {
    this.markTouched('documentType');
    if (this.selectedFile) {
      const allowedTypes = this.getUploadAllowedTypes();
      if (!allowedTypes.includes(this.selectedFile.type)) {
        this.selectedFile = null;
        this.fileName = '';
        this.fileError = '';
        const fileInput = document.getElementById('fileInput') as HTMLInputElement | null;
        if (fileInput) {
          fileInput.value = '';
        }
      }
    }
  }

  private getUploadAllowedTypes(): string[] {
    if (this.documentType === 'PDF') {
      return ['application/pdf'];
    }
    if (this.documentType === 'Image') {
      return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    }
    return ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  }

  get acceptedFileTypes(): string {
    if (this.documentType === 'PDF') {
      return '.pdf';
    }
    if (this.documentType === 'Image') {
      return 'image/*';
    }
    return 'application/pdf,image/*';
  }

  goBack(): void {
    this.router.navigate(['/clients', this.clientId]);
  }

  cancel(): void {
    this.goBack();
  }

  uploadDocument(): void {
    this.submitted = true;
    this.touched.add('documentName');
    this.touched.add('category');
    this.touched.add('documentType');
    this.touched.add('file');

    if (!this.selectedFile || !this.documentName.trim() || !this.category || !this.documentType) {
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
