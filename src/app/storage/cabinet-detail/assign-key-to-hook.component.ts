import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface AvailableHook {
  no: string;
  status: string;
}

@Component({
  selector: 'app-assign-key-to-hook',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './assign-key-to-hook.component.html',
  styles: [`
    .scrollbar-thin::-webkit-scrollbar { height: 6px; width: 6px; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 9999px; }
    @keyframes fadeIn { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: scale(1); } }
    .animate-fade-in { animation: fadeIn .15s ease-out; }
  `],
})
export class AssignKeyToHookComponent {
  readonly availableHooks: AvailableHook[] = [
    { no: '03', status: 'Available for Key' },
    { no: '06', status: 'Available for Key' },
    { no: '09', status: 'Available for Key' },
    { no: '12', status: 'Available for Key' },
    { no: '15', status: 'Available for Key' },
    { no: '16', status: 'Available for Key' },
    { no: '18', status: 'Available for Key' },
  ];

  selectedHook: AvailableHook | null = null;
  selectedKey: string | null = null;
  assignmentNote = '';
  noteCount = 0;
  isHookDropdownOpen = false;
  isKeyDropdownOpen = false;

  toggleHookDropdown(): void {
    this.isHookDropdownOpen = !this.isHookDropdownOpen;
  }

  selectHook(hook: AvailableHook): void {
    this.selectedHook = hook;
    this.isHookDropdownOpen = false;
  }

  toggleKeyDropdown(): void {
    this.isKeyDropdownOpen = !this.isKeyDropdownOpen;
  }

  selectKey(key: string): void {
    this.selectedKey = key;
    this.isKeyDropdownOpen = false;
  }

  updateNoteCount(): void {
    this.noteCount = this.assignmentNote.length;
  }

  closeHookDropdown(): void {
    this.isHookDropdownOpen = false;
  }

  closeKeyDropdown(): void {
    this.isKeyDropdownOpen = false;
  }
}