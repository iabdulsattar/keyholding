import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../config';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  get<T>(path: string, headers?: HttpHeaders): Observable<T> {
    return this.http.get<T>(`${API_BASE}${path}`, { headers });
  }

  post<T>(path: string, body: any, headers?: HttpHeaders): Observable<T> {
    return this.http.post<T>(`${API_BASE}${path}`, body, { headers });
  }

  put<T>(path: string, body: any, headers?: HttpHeaders): Observable<T> {
    return this.http.put<T>(`${API_BASE}${path}`, body, { headers });
  }

  patch<T>(path: string, body: any, headers?: HttpHeaders): Observable<T> {
    return this.http.patch<T>(`${API_BASE}${path}`, body, { headers });
  }

  delete<T>(path: string, headers?: HttpHeaders): Observable<T> {
    return this.http.delete<T>(`${API_BASE}${path}`, { headers });
  }

  getBlob(path: string, headers?: HttpHeaders): Observable<Blob> {
    return this.http.get(`${API_BASE}${path}`, { headers, responseType: 'blob' });
  }
}
