import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-ai-sidebar-history',
  standalone: true,
  imports: [],
  template: `
    <div class="hidden xl:block w-80 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div class="p-5">
        <h4 class="text-lg font-medium text-gray-800 dark:text-white/90">Chats History</h4>
      </div>
    </div>
  `,
  styles: ``
})
export class AiSidebarHistoryComponent {
  @Input() isSidebarOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();
}
