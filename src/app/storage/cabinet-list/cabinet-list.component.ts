import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Cabinet {
  id: number;
  code: string;
  name: string;
  type: string;
  totalHooks: number;
  usedHooks: number;
  availHooks: number;
  status: 'Active' | 'Full' | 'Inactive';
  updatedDate: string;
  updatedBy: string;
}

@Component({
  selector: 'app-cabinet-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cabinet-list.component.html',
})
export class CabinetListComponent {
  readonly cabinets: Cabinet[] = [
    { id: 1, code: 'CAB-0001', name: 'Cabinet A - Main Floor',       type: 'Standard',      totalHooks: 20, usedHooks: 14, availHooks: 6,  status: 'Active',    updatedDate: '15 May 2024, 11:20 AM', updatedBy: 'Faiza Ahmed' },
    { id: 2, code: 'CAB-0002', name: 'Cabinet B - Ground Floor',     type: 'Fire Rated',    totalHooks: 20, usedHooks: 18, availHooks: 2,  status: 'Active',    updatedDate: '15 May 2024, 10:45 AM', updatedBy: 'James Walker' },
    { id: 3, code: 'CAB-0003', name: 'Cabinet C - Server Room',      type: 'High Security', totalHooks: 20, usedHooks: 20, availHooks: 0,  status: 'Full',      updatedDate: '14 May 2024, 04:30 PM', updatedBy: 'Sarah Miller' },
    { id: 4, code: 'CAB-0004', name: 'Cabinet D - Back Office',      type: 'Standard',      totalHooks: 20, usedHooks: 10, availHooks: 10, status: 'Active',    updatedDate: '14 May 2024, 03:15 PM', updatedBy: 'David Johnson' },
    { id: 5, code: 'CAB-0005', name: 'Cabinet E - Archive Room',     type: 'Standard',      totalHooks: 20, usedHooks: 8,  availHooks: 12, status: 'Active',    updatedDate: '13 May 2024, 02:40 PM', updatedBy: 'Michael Brown' },
    { id: 6, code: 'CAB-0006', name: 'Cabinet F - IT Room',          type: 'Fire Rated',    totalHooks: 20, usedHooks: 6,  availHooks: 14, status: 'Active',    updatedDate: '13 May 2024, 11:05 AM', updatedBy: 'Faiza Ahmed' },
    { id: 7, code: 'CAB-0007', name: 'Cabinet G - Dispatch Office',  type: 'Standard',      totalHooks: 20, usedHooks: 12, availHooks: 8,  status: 'Active',    updatedDate: '12 May 2024, 04:20 PM', updatedBy: 'James Walker' },
    { id: 8, code: 'CAB-0008', name: 'Cabinet H - Spare Keys',       type: 'High Security', totalHooks: 20, usedHooks: 8,  availHooks: 12, status: 'Inactive',  updatedDate: '10 May 2024, 09:15 AM', updatedBy: 'Sarah Miller' },
  ];
}
