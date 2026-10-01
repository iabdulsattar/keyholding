import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ToastService } from '../../core/services/toast.service';

import { TagsInputComponent } from '../../shared/components/form/tags-input/tags-input.component';

type IncidentKey = 'lost' | 'damaged';

interface IncidentRow {
  key: IncidentKey;
  name: string;
  description: string;
  icon: string;
  iconWrap: string;
  ariaLabel: string;
  emails: string[];
  enabled: boolean;
}

const DEFAULT_ROWS: IncidentRow[] = [
  {
    key: 'lost',
    name: 'Lost Key',
    description: 'Key is lost or cannot be recovered',
    icon: '<path d="M8.00065 5.99935V8.66602M8.00065 11.3327H8.00732M14.4876 11.9995L9.15426 2.66617C9.03797 2.46097 8.86933 2.29029 8.66555 2.17154C8.46176 2.0528 8.23012 1.99023 7.99426 1.99023C7.7584 1.99023 7.52677 2.0528 7.32298 2.17154C7.11919 2.29029 6.95055 2.46097 6.83426 2.66617L1.50093 11.9995C1.38338 12.2031 1.32175 12.4341 1.32227 12.6692C1.32279 12.9042 1.38545 13.135 1.50389 13.338C1.62234 13.5411 1.79236 13.7092 1.99673 13.8254C2.20109 13.9415 2.43253 14.0016 2.6676 13.9995H13.3343C13.5682 13.9993 13.7979 13.9375 14.0005 13.8204C14.203 13.7032 14.3711 13.5349 14.4879 13.3322C14.6048 13.1296 14.6663 12.8998 14.6662 12.6658C14.6662 12.4319 14.6046 12.2021 14.4876 11.9995Z" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/>',
    iconWrap: 'bg-red-50 text-red-500',
    ariaLabel: 'Lost Key escalation',
    emails: [],
    enabled: true,
  },
  {
    key: 'damaged',
    name: 'Damaged Key',
    description: 'Key is damaged or not working properly',
    icon: '<path d="M14.6664 8.00021H13.013C12.7216 7.99958 12.438 8.09442 12.2056 8.27021C11.9733 8.446 11.8049 8.69306 11.7262 8.97362L10.1594 14.5474C10.1493 14.582 10.1283 14.6124 10.0994 14.6341C10.0705 14.6557 10.0355 14.6674 9.99939 14.6674C9.96333 14.6674 9.92824 14.6557 9.89938 14.6341C9.87053 14.6124 9.84948 14.582 9.83938 14.5474L6.15908 1.45302C6.14899 1.4184 6.12793 1.38798 6.09908 1.36634C6.07023 1.34471 6.03514 1.33301 5.99907 1.33301C5.96301 1.33301 5.92792 1.34471 5.89906 1.36634C5.87021 1.38798 5.84916 1.4184 5.83906 1.45302L4.27227 7.0268C4.1939 7.30626 4.0265 7.55252 3.79547 7.7282C3.56444 7.90387 3.2824 7.99938 2.99216 8.00021H1.33203" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round"/>',
    iconWrap: 'bg-violet-50 text-violet-500',
    ariaLabel: 'Damaged Key escalation',
    emails: [],
    enabled: true,
  },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

@Component({
  selector: 'app-incident-escalation',
  standalone: true,
  imports: [CommonModule, FormsModule, TagsInputComponent],
  templateUrl: './incident-escalation.component.html',
  styles: [`
    .toggle-knob {
      transition: transform 0.2s ease;
    }
  `],
})
export class IncidentEscalationComponent implements OnInit {
  rows: IncidentRow[] = DEFAULT_ROWS.map(r => ({ ...r, emails: [...r.emails] }));

  editingKey: IncidentKey | null = null;
  draftEmail = '';
  draftInvalid = false;
  saving = false;
  dirty = false;

  reminderMinutes = 30;
  maxAttempts = 3;

  constructor(
    private toast: ToastService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  get storageKey(): string {
    const org = this.getOrgId() || 'default';
    return `kv_incident_escalation_${org}`;
  }

  private getOrgId(): string | null {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
    }
    return (
      sessionStorage.getItem('org_id') ||
      sessionStorage.getItem('organizationId') ||
      localStorage.getItem('org_id') ||
      localStorage.getItem('organizationId') ||
      null
    );
  }

  iconSvg(row: IncidentRow): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 16 16" style="display:block">${row.icon}</svg>`
    );
  }

  toggle(row: IncidentRow): void {
    row.enabled = !row.enabled;
    this.dirty = true;
  }

  onEmailsChange(row: IncidentRow, emails: string[]): void {
    if (row.emails.join('|') === emails.join('|')) return;
    row.emails = [...emails];
    this.dirty = true;
  }

  startAdd(row: IncidentRow): void {
    if (this.editingKey) return;
    this.editingKey = row.key;
    this.draftEmail = '';
    this.draftInvalid = false;
  }

  onDraftInput(): void {
    this.draftInvalid = false;
  }

  commitAdd(row: IncidentRow): void {
    const value = this.draftEmail.trim().toLowerCase();

    if (!value) {
      this.cancelAdd();
      return;
    }

    if (!EMAIL_PATTERN.test(value)) {
      this.draftInvalid = true;
      return;
    }

    if (row.emails.some(e => e.toLowerCase() === value)) {
      this.toast.warning(`${value} is already added`);
      this.cancelAdd();
      return;
    }

    row.emails = [...row.emails, value];
    this.dirty = true;
    this.cancelAdd();
  }

  cancelAdd(): void {
    this.editingKey = null;
    this.draftEmail = '';
    this.draftInvalid = false;
  }

  removeEmail(row: IncidentRow, email: string): void {
    row.emails = row.emails.filter(e => e !== email);
    this.dirty = true;
  }

  save(): void {
    const enabledRows = this.rows.filter(r => r.enabled);

    if (enabledRows.some(r => r.emails.length === 0)) {
      this.toast.error('Add at least one contact for every enabled incident type');
      return;
    }

    this.saving = true;
    try {
      this.persist();
      this.dirty = false;
      this.toast.success('Incident escalation settings saved');
    } finally {
      this.saving = false;
    }
  }

  reset(): void {
    this.rows = DEFAULT_ROWS.map(r => ({ ...r, emails: [...r.emails] }));
    this.reminderMinutes = 30;
    this.maxAttempts = 3;
    this.cancelAdd();
    this.dirty = true;
    this.toast.info('Settings reset to defaults — save to apply');
  }

  private load(): void {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      const savedRows: any[] = Array.isArray(parsed?.rows) ? parsed.rows : [];

      this.rows = this.rows.map(row => {
        const match = savedRows.find(r => r?.key === row.key);
        if (!match) return row;

        return {
          ...row,
          emails: Array.isArray(match.emails)
            ? match.emails.filter((e: any) => typeof e === 'string')
            : row.emails,
          enabled: typeof match.enabled === 'boolean' ? match.enabled : row.enabled,
        };
      });

      if (typeof parsed?.reminderMinutes === 'number') this.reminderMinutes = parsed.reminderMinutes;
      if (typeof parsed?.maxAttempts === 'number') this.maxAttempts = parsed.maxAttempts;
    } catch {
      localStorage.removeItem(this.storageKey);
    }
  }

  private persist(): void {
    localStorage.setItem(
      this.storageKey,
      JSON.stringify({
        rows: this.rows.map(r => ({ key: r.key, emails: r.emails, enabled: r.enabled })),
        reminderMinutes: this.reminderMinutes,
        maxAttempts: this.maxAttempts,
        updatedAt: new Date().toISOString(),
      })
    );
  }
}