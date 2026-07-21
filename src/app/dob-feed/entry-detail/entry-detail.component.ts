import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EdobService } from '../../core/services/edob.service';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import { Entry, Comment } from '../../core/models/edob.models';
import { getUserAvatar } from '../../shared/utils/avatar.utils';

@Component({
  selector: 'app-entry-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './entry-detail.component.html',
  styles: ``
})
export class EntryDetailComponent implements OnInit {
  entry: Entry | null = null;
  loading = true;
  errorMessage = '';

  comments: Comment[] = [];
  newCommentText = '';
  isSubmittingComment = false;
  currentUserName = '';
  currentUserRole = 'User';
  currentUserImg = '/images/user/dummy-user.png';

  private categoryMap = new Map<string, string>();
  private userMap = new Map<string, string>();
  private userRoleMap = new Map<string, string>();

  constructor(
    private edobService: EdobService,
    private authService: AuthService,
    private permissionService: PermissionService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'Entry not found.';
      this.loading = false;
      return;
    }
    this.loadEntry(id);
  }

  private loadEntry(id: string): void {
    const orgId = this.getOrgId();
    if (!orgId) {
      this.errorMessage = 'Organization not found. Please sign in again.';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.edobService.getEntry(orgId, id).subscribe({
      next: (data: Entry) => {
        this.entry = data;
        this.loading = false;
        this.loadLookups(orgId);
        this.loadComments(orgId, id);
      },
      error: () => {
        this.errorMessage = 'Failed to load entry. Please try again.';
        this.loading = false;
      }
    });
  }

  private loadLookups(orgId: string): void {
    this.edobService.listCategories(orgId).subscribe({
      next: (cats) => {
        this.categoryMap = new Map(cats.map(c => [c.id, c.name]));
      },
      error: () => {}
    });

    this.edobService.listOrgUsers(orgId).subscribe({
      next: (users) => {
        this.userMap = new Map(users.map(u => [u.id, `${u.firstName} ${u.lastName}`.trim() || u.email]));
        users.forEach(u => {
          const role = (u.roles && u.roles.length > 0) ? u.roles[0].name : 'User';
          this.userRoleMap.set(u.id, role);
        });
      },
      error: () => {}
    });

    const token = this.authService.getAccessToken();
    if (token) {
      this.authService.me(token).subscribe({
        next: (profile: any) => {
          const user = profile?.user || profile?.data || profile;
          this.currentUserName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User';
          this.currentUserRole = (user.roles?.[0]?.name || user.role || 'User') as string;
          this.currentUserImg = getUserAvatar(user);
        },
        error: () => {}
      });
    }
  }

  private loadComments(orgId: string, entryId: string): void {
    this.edobService.getComments(orgId, entryId).subscribe({
      next: (comments) => {
        this.comments = (comments || []).map(c => this.mapComment(c));
      },
      error: () => {
        this.comments = (this.entry?.data?.['comments'] as Comment[]) || [];
      }
    });
  }

  private mapComment(c: any): Comment {
    const avatarUrl = c.authorAvatarUrl
      ? (c.authorAvatarUrl.startsWith('http') ? c.authorAvatarUrl : `/images/user/${c.authorAvatarUrl}`)
      : getUserAvatar({ firstName: c.authorName });
    return {
      ...c,
      user: c.authorName || 'User',
      role: this.userRoleMap.get(c.authorUserId) || 'User',
      time: c.createdAt || new Date().toISOString(),
      img: avatarUrl,
    };
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 70 + 1;
  }

  get canComment(): boolean {
    return this.permissionService.hasPermission('entry.comment');
  }

  addComment(): void {
    const orgId = this.getOrgId();
    const entryId = this.entry?.id;
    const text = this.newCommentText.trim();
    if (!orgId || !entryId || !text || this.isSubmittingComment) return;

    if (!this.canComment) {
      return;
    }

    this.isSubmittingComment = true;
    this.edobService.addComment(orgId, entryId, { body: text }).subscribe({
      next: (comment) => {
        const enriched = this.mapComment({
          ...comment,
          authorName: this.currentUserName || 'User',
          authorUserId: 'current',
        });
        this.comments = [...this.comments, enriched];
        this.newCommentText = '';
        this.isSubmittingComment = false;
      },
      error: () => {
        const optimisticComment: Comment = {
          id: 'local-' + Date.now(),
          entryId,
          authorUserId: 'current',
          authorName: this.currentUserName || 'User',
          authorAvatarUrl: null,
          body: text,
          editedAt: null,
          createdAt: new Date().toISOString(),
          user: this.currentUserName || 'User',
          role: this.currentUserRole || 'User',
          time: new Date().toISOString(),
          img: this.currentUserImg,
        };
        this.comments = [...this.comments, optimisticComment];
        this.newCommentText = '';
        this.isSubmittingComment = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/entries']);
  }

  formatDateTime(iso: string): string {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  get createdByUserName(): string {
    if (!this.entry?.createdByUserId) return '-';
    return this.userMap.get(this.entry.createdByUserId) || this.entry.createdByUserId;
  }

  get typeName(): string {
    if (!this.entry) return '-';
    const map: Record<string, string> = { BASIC: 'Basic Entry', INCIDENT: 'Incident', HANDOVER: 'Handover', FOLLOW_UP: 'Follow-Up' };
    return map[this.entry.entryTypeCode] || this.entry.entryTypeCode;
  }

  get categoryName(): string {
    if (!this.entry?.categoryId) return '-';
    return this.categoryMap.get(this.entry.categoryId) || this.entry.categoryId;
  }

  get priorityClass(): string {
    if (!this.entry) return '';
    const map: Record<string, string> = {
      LOW: 'bg-gray-50 text-gray-700',
      NORMAL: 'bg-blue-50 text-blue-700',
      MEDIUM: 'bg-yellow-50 text-yellow-700',
      HIGH: 'bg-red-50 text-red-600',
      CRITICAL: 'bg-red-50 text-red-600',
    };
    return map[this.entry.priority] || 'bg-gray-50 text-gray-700';
  }

  get priorityLabel(): string {
    if (!this.entry) return '';
    return this.entry.priority.charAt(0) + this.entry.priority.slice(1).toLowerCase();
  }

  getAttachmentIcon(att: any): string {
    const kind = (att.kind || '').toUpperCase();
    if (kind === 'PHOTO' || att.type === 'image') return 'ti-photo';
    if (kind === 'AUDIO' || att.type === 'audio') return 'ti-microphone';
    if (att.contentType === 'application/pdf' || att.type === 'document') return 'ti-file-type-pdf';
    return 'ti-file';
  }

  getAttachmentColor(att: any): string {
    const kind = (att.kind || '').toUpperCase();
    if (kind === 'PHOTO' || att.type === 'image') return 'text-green-600';
    if (kind === 'AUDIO' || att.type === 'audio') return 'text-indigo-500';
    if (att.contentType === 'application/pdf' || att.type === 'document') return 'text-red-500';
    return 'text-slate-600';
  }

  getAttachmentBg(att: any): string {
    const kind = (att.kind || '').toUpperCase();
    if (kind === 'PHOTO' || att.type === 'image') return 'bg-green-50';
    if (kind === 'AUDIO' || att.type === 'audio') return 'bg-indigo-50';
    if (att.contentType === 'application/pdf' || att.type === 'document') return 'bg-red-50';
    return 'bg-slate-50';
  }

  private attachmentName(att: any): string {
    return att.filename || att.fileName || 'attachment';
  }

  viewAttachment(att: any): void {
    const orgId = this.getOrgId();
    const entryId = this.entry?.id;
    if (!orgId || !entryId || !att?.id) return;

    this.edobService.downloadAttachment(orgId, entryId, att.id).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      },
      error: () => {}
    });
  }

  downloadAttachment(att: any): void {
    const orgId = this.getOrgId();
    const entryId = this.entry?.id;
    if (!orgId || !entryId || !att?.id) return;

    this.edobService.downloadAttachment(orgId, entryId, att.id).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = this.attachmentName(att);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
      },
      error: () => {}
    });
  }

  private getOrgId(): string | null {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
    }
    return sessionStorage.getItem('org_id') || sessionStorage.getItem('organizationId') || localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
  }
}
