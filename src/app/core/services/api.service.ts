import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  get<T>(path: string, headers?: HttpHeaders): Observable<T> {
    return this.http.get<T>(`${environment.apiBase}${path}`, { headers });
  }

  post<T>(path: string, body: any, headers?: HttpHeaders): Observable<T> {
    return this.http.post<T>(`${environment.apiBase}${path}`, body, { headers });
  }

  put<T>(path: string, body: any, headers?: HttpHeaders): Observable<T> {
    return this.http.put<T>(`${environment.apiBase}${path}`, body, { headers });
  }

  patch<T>(path: string, body: any, headers?: HttpHeaders): Observable<T> {
    return this.http.patch<T>(`${environment.apiBase}${path}`, body, { headers });
  }

  delete<T>(path: string, headers?: HttpHeaders): Observable<T> {
    return this.http.delete<T>(`${environment.apiBase}${path}`, { headers });
  }

  getBlob(path: string, headers?: HttpHeaders): Observable<Blob> {
    return this.http.get(`${environment.apiBase}${path}`, { headers, responseType: 'blob' });
  }
}
