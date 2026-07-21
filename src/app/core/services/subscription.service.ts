import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Plan,
  CreatePlanRequest,
  StartSubscriptionRequest,
  StartSubscriptionResponse,
  ChangePlanRequest,
  ChangePlanResponse,
  CancelSubscriptionRequest,
  CancelSubscriptionResponse,
  ListSubscriptionsResponse,
  SubscriptionHistoryResponse,
  SubscriptionCheckResponse
} from '../models/subscription.models';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  constructor(private api: ApiService) {}

  // -------- Plans --------

  // GET /api/v1/subscriptions/plans
  listPlans(): Observable<Plan[]> {
    return this.api.get<Plan[]>('/api/v1/subscriptions/plans');
  }

  // GET /api/v1/subscriptions/plans/{planId}
  getPlan(planId: string): Observable<Plan> {
    return this.api.get<Plan>(`/api/v1/subscriptions/plans/${planId}`);
  }

  // POST /api/v1/subscriptions/plans (ADMIN)
  createPlan(payload: CreatePlanRequest): Observable<Plan> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post<Plan>('/api/v1/subscriptions/plans', payload, headers);
  }

  // POST /api/v1/subscriptions/plans/{planId}/sync (ADMIN — sync to Stripe)
  syncPlanToStripe(planId: string): Observable<any> {
    return this.api.post(`/api/v1/subscriptions/plans/${planId}/sync`, {});
  }

  // POST /api/v1/subscriptions/plans/{planId}/disable (ADMIN)
  disablePlan(planId: string): Observable<any> {
    return this.api.post(`/api/v1/subscriptions/plans/${planId}/disable`, {});
  }

  // -------- Subscription Lifecycle --------

  // POST /api/v1/subscriptions/organizations/{orgId}/start?orgEmail=&orgName=
  startSubscription(
    orgId: string,
    payload: StartSubscriptionRequest,
    orgEmail?: string,
    orgName?: string,
    token?: string
  ): Observable<StartSubscriptionResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    });
    let query = '';
    if (orgEmail || orgName) {
      const params = new URLSearchParams();
      if (orgEmail) params.set('orgEmail', orgEmail);
      if (orgName) params.set('orgName', orgName);
      query = `?${params.toString()}`;
    }
    return this.api.post<StartSubscriptionResponse>(
      `/api/v1/subscriptions/organizations/${orgId}/start${query}`,
      payload,
      headers
    );
  }

  // GET /api/v1/subscriptions/organizations/{orgId}
  getCurrentSubscription(orgId: string): Observable<ListSubscriptionsResponse> {
    return this.api.get<ListSubscriptionsResponse>(`/api/v1/subscriptions/organizations/${orgId}`);
  }

  // PATCH /api/v1/subscriptions/organizations/{orgId}/plan
  changePlan(orgId: string, payload: ChangePlanRequest, token?: string): Observable<ChangePlanResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    });
    return this.api.patch<ChangePlanResponse>(`/api/v1/subscriptions/organizations/${orgId}/plan`, payload, headers);
  }

  // POST /api/v1/subscriptions/organizations/{orgId}/cancel
  cancelSubscription(orgId: string, payload: CancelSubscriptionRequest, token?: string): Observable<CancelSubscriptionResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    });
    return this.api.post<CancelSubscriptionResponse>(`/api/v1/subscriptions/organizations/${orgId}/cancel`, payload, headers);
  }

  // GET /api/v1/subscriptions/organizations/{orgId}/history
  getSubscriptionHistory(orgId: string): Observable<SubscriptionHistoryResponse> {
    return this.api.get<SubscriptionHistoryResponse>(`/api/v1/subscriptions/organizations/${orgId}/history`);
  }

  // -------- Subscription Check (gating) --------

  // GET /api/v1/subscriptions/check?organizationId={orgId}
  checkSubscription(orgId: string): Observable<SubscriptionCheckResponse> {
    return this.api.get<SubscriptionCheckResponse>(`/api/v1/subscriptions/check?organizationId=${encodeURIComponent(orgId)}`);
  }
}