import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import {
  Plan,
  CreatePlanRequest,
  ServiceInfo,
  StartSubscriptionRequest,
  StartSubscriptionResponse,
  ChangePlanRequest,
  ChangePlanResponse,
  CancelSubscriptionRequest,
  CancelSubscriptionResponse,
  SubscriptionHistoryResponse,
  SubscriptionCheckResponse,
  BillingProfile,
  BillingProfileResponse,
  BillingInfo,
  BillingInfoResponse,
  UsageResponse
} from '../models/subscription.models';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  constructor(private api: ApiService, private auth: AuthService) {}

  private getAuthHeaders(): HttpHeaders | undefined {
    const token = this.auth.getAccessToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
  }

  private getAccessToken(): string | null {
    return this.auth.getAccessToken();
  }

  // -------- Plans --------

  listPlans(serviceCode?: string, country?: string): Observable<Plan[]> {
    const headers = this.getAuthHeaders();
    const q = new URLSearchParams();
    if (serviceCode) q.set('serviceCode', serviceCode);
    if (country) q.set('country', country);
    const query = q.toString();
    return this.api.get<Plan[]>(`/api/v1/subscriptions/plans${query ? `?${query}` : ''}`, headers);
  }

  getPlan(planId: string): Observable<Plan> {
    return this.api.get<Plan>(`/api/v1/subscriptions/plans/${planId}`);
  }

  createPlan(payload: CreatePlanRequest): Observable<Plan> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.getAccessToken() ? { Authorization: `Bearer ${this.getAccessToken()}` } : {})
    });
    return this.api.post<Plan>('/api/v1/subscriptions/plans', payload, headers);
  }

  syncPlanToStripe(planId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.post(`/api/v1/subscriptions/plans/${planId}/sync`, {}, headers);
  }

  disablePlan(planId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.post(`/api/v1/subscriptions/plans/${planId}/disable`, {}, headers);
  }

  listServices(): Observable<ServiceInfo[]> {
    const headers = this.getAuthHeaders();
    return this.api.get<ServiceInfo[]>('/api/v1/subscriptions/services', headers);
  }

  // -------- Subscription Lifecycle --------

  startSubscription(
    orgId: string,
    payload: StartSubscriptionRequest,
    serviceCode = 'key-vault',
    token?: string
  ): Observable<StartSubscriptionResponse> {
    const accessToken = token ?? this.getAccessToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    });
    return this.api.post<StartSubscriptionResponse>(
      `/api/v1/subscriptions/organizations/${orgId}/services/${serviceCode}/start`,
      payload,
      headers
    );
  }

  getSubscription(orgId: string, serviceCode: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.get<any>(`/api/v1/subscriptions/organizations/${orgId}/services/${serviceCode}`, headers);
  }

  getUsage(orgId: string, serviceCode: string): Observable<UsageResponse> {
    const headers = this.getAuthHeaders();
    return this.api.get<UsageResponse>(`/api/v1/keyvault/organizations/${orgId}/subscription/usage`, headers);
  }

  changePlan(orgId: string, serviceCode: string, payload: ChangePlanRequest, token?: string): Observable<ChangePlanResponse> {
    const accessToken = token ?? this.getAccessToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    });
    return this.api.patch<ChangePlanResponse>(
      `/api/v1/subscriptions/organizations/${orgId}/services/${serviceCode}/plan`,
      payload,
      headers
    );
  }

  cancelSubscription(orgId: string, serviceCode: string, payload: CancelSubscriptionRequest, token?: string): Observable<CancelSubscriptionResponse> {
    const accessToken = token ?? this.getAccessToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    });
    return this.api.post<CancelSubscriptionResponse>(
      `/api/v1/subscriptions/organizations/${orgId}/services/${serviceCode}/cancel`,
      payload,
      headers
    );
  }

  getSubscriptionHistory(orgId: string, serviceCode?: string): Observable<SubscriptionHistoryResponse> {
    const headers = this.getAuthHeaders();
    const query = serviceCode ? `?serviceCode=${encodeURIComponent(serviceCode)}` : '';
    return this.api.get<SubscriptionHistoryResponse>(`/api/v1/subscriptions/organizations/${orgId}/history${query}`, headers);
  }

  // -------- Subscription Check (gating) --------

  checkSubscription(orgId: string, serviceCode?: string): Observable<SubscriptionCheckResponse> {
    const headers = this.getAuthHeaders();
    const query = serviceCode
      ? `?organizationId=${encodeURIComponent(orgId)}&serviceCode=${encodeURIComponent(serviceCode)}`
      : `?organizationId=${encodeURIComponent(orgId)}`;
    return this.api.get<SubscriptionCheckResponse>(`/api/v1/subscriptions/check${query}`, headers);
  }

  // -------- Billing Profile --------

  getBillingProfile(orgId: string): Observable<BillingProfileResponse> {
    const headers = this.getAuthHeaders();
    return this.api.get<BillingProfileResponse>(`/api/v1/subscriptions/organizations/${orgId}/billing`, headers);
  }

  saveBillingProfile(orgId: string, payload: BillingProfile): Observable<BillingProfileResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.getAccessToken() ? { Authorization: `Bearer ${this.getAccessToken()}` } : {})
    });
    return this.api.put<BillingProfileResponse>(`/api/v1/subscriptions/organizations/${orgId}/billing`, payload, headers);
  }

  // -------- Billing Info --------

  getBillingInfo(orgId: string): Observable<BillingInfoResponse> {
    const headers = this.getAuthHeaders();
    return this.api.get<BillingInfoResponse>(`/api/v1/subscriptions/organizations/${orgId}/billing-info`, headers);
  }

  saveBillingInfo(orgId: string, payload: BillingInfo): Observable<BillingInfoResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.getAccessToken() ? { Authorization: `Bearer ${this.getAccessToken()}` } : {})
    });
    return this.api.put<BillingInfoResponse>(`/api/v1/subscriptions/organizations/${orgId}/billing-info`, payload, headers);
  }
}
