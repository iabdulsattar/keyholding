import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService } from '../../core/services/client.service';

@Component({
  selector: 'app-add-document',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './add-document.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    select { appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 1rem center; background-size: 1rem; }
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

  constructor(private route: ActivatedRoute, private router: Router, private clientService: ClientService) {}

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id') || '';
    this.route.queryParams.subscribe(params => {
      this.clientName = params['clientName'] || this.clientName;
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
