import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-view-document',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './view-document.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  `]
})
export class ViewDocumentComponent implements OnInit {
  clientId = '';
  clientName = 'Metro Security Services';
  docId = '';

  documentName = 'Service Agreement.pdf';
  category = 'Legal';
  documentType = 'PDF';
  size = '1.2 MB';
  uploadedBy = 'Faisa Ahmed';
  uploadDate = '15 May 2024, 10:30 AM';
  lastModified = '15 May 2024, 10:30 AM';
  description = 'Service agreement with terms and conditions.';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id') || '';
    this.docId = this.route.snapshot.paramMap.get('docId') || '';
    this.route.queryParams.subscribe(params => {
      this.clientName = params['clientName'] || this.clientName;
    });
  }

  goBack(): void {
    this.router.navigate(['/clients', this.clientId]);
  }

  toggleDropdown(id: string): void {
    const dropdown = document.getElementById(id);
    if (dropdown) {
      dropdown.classList.toggle('hidden');
    }
  }

  downloadDocument(): void {
    console.log('Download document:', this.docId);
  }

  openInNewTab(): void {
    console.log('Open document in new tab:', this.docId);
  }

  shareDocument(): void {
    console.log('Share document:', this.docId);
  }

  viewDocumentHistory(): void {
    console.log('View document history:', this.docId);
  }

  deleteDocument(): void {
    console.log('Delete document:', this.docId);
  }
}
