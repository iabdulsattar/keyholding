import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  ListNotificationsRequest,
  ListNotificationsResponse,
  UnreadCountResponse,
  SetEmailContactRequest,
  SetEmailContactResponse,
  SetPreferenceRequest,
  SetPreferenceResponse
} from '../models/notification.models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private api: ApiService) {}

  // GET /api/v1/notifications
  list(payload: ListNotificationsRequest): Observable<ListNotificationsResponse> {
    const params = new URLSearchParams();
    params.set('userId', payload.userId);
    if (payload.page !== undefined) params.set('page', String(payload.page));
    if (payload.size !== undefined) params.set('size', String(payload.size));
    if (payload.unreadOnly) params.set('unreadOnly', 'true');
    return this.api.get<any>(`/api/v1/notifications?${params.toString()}`).pipe(
      map((res) => {
        if (res && typeof res === 'object' && 'data' in res) {
          return res.data as ListNotificationsResponse;
        }
        return res as ListNotificationsResponse;
      })
    );
  }

  // GET /api/v1/notifications/unread-count
  unreadCount(userId: string): Observable<UnreadCountResponse> {
    return this.api.get<any>(`/api/v1/notifications/unread-count?userId=${encodeURIComponent(userId)}`).pipe(
      map((res) => {
        if (res && typeof res === 'object' && 'data' in res) {
          return res.data as UnreadCountResponse;
        }
        return res as UnreadCountResponse;
      })
    );
  }

  // POST /api/v1/notifications/read-all
  markAllRead(userId: string): Observable<any> {
    return this.api.post(`/api/v1/notifications/read-all?userId=${encodeURIComponent(userId)}`, {});
  }

  // PATCH /api/v1/notifications/{notificationId}
  markOneRead(notificationId: string): Observable<any> {
    return this.api.patch(`/api/v1/notifications/${encodeURIComponent(notificationId)}`, { read: true });
  }

  // PUT /api/v1/notifications/contacts/email
  setEmailContact(userId: string, email: string): Observable<any> {
    return this.api.put(
      `/api/v1/notifications/contacts/email?userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(email)}`,
      {}
    );
  }

  // PUT /api/v1/notifications/organizations/{orgId}/preferences/{type}
  setPreference(orgId: string, type: string, payload: SetPreferenceRequest): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.put(`/api/v1/notifications/organizations/${orgId}/preferences/${type}`, payload, headers);
  }
}