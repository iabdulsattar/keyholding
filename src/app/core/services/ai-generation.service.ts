import { HttpClient, HttpBackend, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
}

export type EntryTypeCode = 'BASIC' | 'INCIDENT' | 'HANDOVER' | 'FOLLOW_UP';

@Injectable({ providedIn: 'root' })
export class AIGenerationService {
  private readonly apiUrl = environment.OPENROUTER_API_URL;
  private readonly apiKey = environment.OPENROUTER_API_KEY;
  private readonly model = environment.OPENROUTER_MODEL;
  private http: HttpClient;

  constructor(handler: HttpBackend) {
    this.http = new HttpClient(handler);
  }

  private buildSystemPrompt(entryTypeCode: EntryTypeCode, categories: string[] = [], priorities: string[] = []): string {
    const base = `You are an assistant that helps create structured daily observation or business (DOB) log entries. Based on the user's description, generate all fields for a ${entryTypeCode} entry. Return ONLY a raw JSON object with these exact fields. Do NOT wrap it in markdown code fences or add any extra text.`;

    let schema = '';
    if (entryTypeCode === 'BASIC') {
      schema = `Required JSON schema: "title" (concise 1-line title), "category" (choose from available categories), "priority" (choose from available priorities), "description" (detailed description up to 5000 chars).`;
    } else if (entryTypeCode === 'INCIDENT') {
      schema = `Required JSON schema: "title" (concise incident title), "category" (choose from available categories), "priority" (choose from available priorities), "incidentType" (choose from available incident types), "location" (where the incident occurred), "description" (detailed description of the incident), "data" object with "peopleInvolved" (array of people involved), "immediateActionsTaken" (actions taken immediately after incident), "severityScore" (number 1-10).`;
    } else if (entryTypeCode === 'HANDOVER') {
      schema = `Required JSON schema: "title" (concise handover title), "category" (choose from available categories), "priority" (choose from available priorities), "handoverType" (choose from available handover types), "description" (operational summary), "data" object with "outstandingIssues" (optional array of unresolved issues), "outstandingActions" (optional array of action task objects with "task" and "done" boolean), "importantInformation" (optional key notes for next shift).`;
    } else if (entryTypeCode === 'FOLLOW_UP') {
      schema = `Required JSON schema: "title" (concise follow-up title), "category" (choose from available categories), "priority" (choose from available priorities), "description" (what needs follow-up), "data" object with "parentEntryId" (if user mentions it relates to another entry, use a placeholder ID string, otherwise omit or set to null).`;
    }

    const constraints: string[] = [];
    if (categories.length > 0) {
      constraints.push(`Available categories (choose the closest match): ${categories.join(', ')}`);
    }
    if (priorities.length > 0) {
      constraints.push(`Available priorities (choose one): ${priorities.join(', ')}`);
    }

    return [base, schema, ...constraints].join('\n\n');
  }

  generateEntry(prompt: string, history: AIMessage[] = [], categories: string[] = [], priorities: string[] = [], entryTypeCode: EntryTypeCode = 'BASIC'): Observable<AIResponse> {
    const systemPrompt = this.buildSystemPrompt(entryTypeCode, categories, priorities);

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: prompt }
    ];

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'HTTP-Referer': 'https://essentiatech.com',
      'X-Title': 'My DOB App'
    });

    const body = {
      model: this.model,
      messages: messages,
      max_tokens: 1024,
      temperature: 0.7
    };

    return this.http.post<any>(this.apiUrl, body, { headers }).pipe(
      map(res => ({
        content: res?.choices?.[0]?.message?.content || ''
      }))
    );
  }
}
