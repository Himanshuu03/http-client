import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface SavedRequest {
  id: string;
  name: string;
  method: string;
  url: string;
  bearerToken: string;
  body: string;
}

interface RequestResponse {
  status: number;
  statusText: string;
  body: any;
  headers: any;
  time: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="container mx-auto p-4 max-w-4xl">
      <h1 class="text-2xl font-bold mb-6 text-center">Angular HTTP Client</h1>
      
      <!-- Request Form -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="flex flex-wrap gap-4 mb-4">
          <div class="w-full md:w-32">
            <label class="block text-sm font-medium text-gray-700 mb-1">Method</label>
            <select [(ngModel)]="method" class="w-full p-2 border rounded">
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>
          
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input [(ngModel)]="url" type="text" placeholder="https://api.example.com/endpoint" 
                  class="w-full p-2 border rounded">
          </div>
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Bearer Token</label>
          <input [(ngModel)]="bearerToken" type="text" placeholder="Optional"
                class="w-full p-2 border rounded">
        </div>
        
        <div *ngIf="method !== 'GET' && method !== 'DELETE'" class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Request Body (JSON)</label>
          <textarea [(ngModel)]="body" rows="5" 
                    class="w-full p-2 border rounded font-mono text-sm"></textarea>
        </div>
        
        <div class="flex justify-between">
          <button (click)="sendRequest()" 
                  class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Send Request
          </button>
          
          <div class="flex gap-2">
            <input [(ngModel)]="saveName" type="text" placeholder="Save as..." 
                  class="p-2 border rounded">
            <button (click)="saveRequest()" 
                    class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Save
            </button>
          </div>
        </div>
      </div>
      
     <!-- Saved Requests -->
<div *ngIf="savedRequests().length > 0" class="bg-white rounded-lg shadow p-6 mb-6">
  <div class="flex justify-between items-center mb-3">
    <h2 class="text-lg font-semibold">Saved Requests</h2>
    <button (click)="generateAllRequestsPdf()" 
            class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" class="mr-1">
        <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
        <path d="M4.603 14.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645 19.697 19.697 0 0 0 1.062-2.227 7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.188-.012.396-.047.614-.084.51-.27 1.134-.52 1.794a10.954 10.954 0 0 0 .98 1.686 5.753 5.753 0 0 1 1.334.05c.364.066.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416.856.856 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.712 5.712 0 0 1-.911-.95 11.651 11.651 0 0 0-1.997.406 11.307 11.307 0 0 1-1.02 1.51c-.292.35-.609.656-.927.787a.793.793 0 0 1-.58.029z"/>
      </svg>
      Download All
    </button>
  </div>
  <div class="flex flex-wrap gap-2">
    <div *ngFor="let req of savedRequests()" 
         class="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded text-sm flex items-center">
      <span class="cursor-pointer" (click)="loadRequest(req)">{{ req.name }}</span>
      <div class="ml-2 flex items-center">
        <button (click)="generatePdf(req)" title="Export as PDF"
                class="ml-2 text-blue-600 hover:text-blue-800">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
            <path d="M4.603 14.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645a19.697 19.697 0 0 0 1.062-2.227a7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.188-.012.396-.047.614-.084.51-.27 1.134-.52 1.794a10.954 10.954 0 0 0 .98 1.686a5.753 5.753 0 0 1 1.334.05c.364.066.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416.856.856 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.712 5.712 0 0 1-.911-.95a11.651 11.651 0 0 0-1.997.406a11.307 11.307 0 0 1-1.02 1.51c-.292.35-.609.656-.927.787a.793.793 0 0 1-.58.029z"/>
          </svg>
        </button>
        <button (click)="deleteRequest(req.id); $event.stopPropagation()" 
                class="ml-2 text-red-500 hover:text-red-700" title="Delete">
          &times;
        </button>
      </div>
    </div>
  </div>
</div>
      
      <!-- Response Card -->
      <div *ngIf="response()" class="bg-white rounded-lg shadow overflow-hidden">
  <div class="bg-gray-100 p-4 flex justify-between items-center">
    <div>
      <span [class]="getStatusClass(response()?.status || 0)" class="font-mono font-bold mr-2">
        {{ response()?.status }}
      </span>
      <span class="text-medium">{{ response()?.statusText }}</span>
    </div>
    <div class="text-gray-600 text-sm">
      {{ response()?.time }}ms
    </div>
  </div>
        
        <div class="p-6">
          <div class="mb-4">
            <h3 class="text-sm font-semibold text-gray-700 mb-2">Response Headers</h3>
            <div class="bg-gray-50 p-3 rounded font-mono text-sm overflow-x-auto">
              <div *ngFor="let header of getHeadersArray()">
                <span class="font-semibold">{{ header.key }}:</span> {{ header.value }}
              </div>
            </div>
          </div>
          
          <div>
            <h3 class="text-sm font-semibold text-gray-700 mb-2">Response Body</h3>
            <pre class="bg-gray-50 p-3 rounded font-mono text-sm overflow-x-auto whitespace-pre-wrap">{{ formatResponse(response()?.body) }}</pre>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      @apply bg-gray-50 min-h-screen;
      display: block;
    }
  `]
})
export class AppComponent implements OnInit {
  method = 'GET';
  url = '';
  bearerToken = '';
  body = '';
  saveName = '';
  
  response = signal<RequestResponse | null>(null);
  savedRequests = signal<SavedRequest[]>([]);
  
  constructor(private http: HttpClient) {}
  requestResponses = signal<{ [id: string]: RequestResponse }>({});
  
  ngOnInit() {
    this.loadSavedRequests();
  }
  
  sendRequest(savedReq?: SavedRequest) {
    const reqId = savedReq?.id || 'manual';
    const method = savedReq?.method || this.method;
    const url = savedReq?.url || this.url;
    const bearerToken = savedReq?.bearerToken || this.bearerToken;
    const body = savedReq?.body || this.body;
  
    if (!url) return;
  
    const startTime = Date.now();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(bearerToken ? { 'Authorization': `Bearer ${bearerToken}` } : {})
    });
  
    let parsedBody: any;
    try {
      parsedBody = body ? JSON.parse(body) : null;
    } catch (e) {
      alert('Invalid JSON in request body');
      return;
    }
  
    this.http.request(method, url, {
      body: ['POST', 'PUT', 'PATCH'].includes(method) ? parsedBody : null,
      headers,
      observe: 'response'
    }).subscribe({
      next: (res: any) => {
        const endTime = Date.now();
        const resData: RequestResponse = {
          status: res.status,
          statusText: res.statusText,
          body: res.body,
          headers: res.headers,
          time: endTime - startTime
        };
  
        this.response.set(resData);
        if (savedReq) {
          const current = this.requestResponses();
          this.requestResponses.set({ ...current, [reqId]: resData });
        }
      },
      error: (err) => {
        const endTime = Date.now();
        const resData: RequestResponse = {
          status: err.status || 0,
          statusText: err.statusText || 'Error',
          body: err.error || err.message,
          headers: err.headers || {},
          time: endTime - startTime
        };
  
        this.response.set(resData);
        if (savedReq) {
          const current = this.requestResponses();
          this.requestResponses.set({ ...current, [reqId]: resData });
        }
      }
    });
  }
  
  
  saveRequest() {
    if (!this.url || !this.saveName) return;
    
    const id = Date.now().toString();
    const newRequest: SavedRequest = {
      id,
      name: this.saveName,
      method: this.method,
      url: this.url,
      bearerToken: this.bearerToken,
      body: this.body
    };
    
    const currentSaved = this.savedRequests();
    this.savedRequests.set([...currentSaved, newRequest]);
    this.saveName = '';
    
    localStorage.setItem('httpClientRequests', JSON.stringify(this.savedRequests()));
  }
  
  loadRequest(req: SavedRequest) {
    // First load the request details into the form
    this.method = req.method;
    this.url = req.url;
    this.bearerToken = req.bearerToken;
    this.body = req.body;
    
    // Then automatically send the request
    this.sendRequest();
  }
  /**
 * Generates a PDF for a saved request (excluding the bearer token)
 */
generatePdf(req: SavedRequest) {
  // First check if we have a response to include
  if (!this.response()) {
    // If no response is available, load and execute the request first
    this.loadRequest(req);
    setTimeout(() => this.createPdf(req), 1000); // Give the request time to complete
  } else {
    this.createPdf(req);
  }
}

/**
 * Creates the actual PDF document
 */
private createPdf(req: SavedRequest) {
  // Create a temporary div to render our PDF content
  const element = document.createElement('div');
  element.innerHTML = this.generatePdfHtml(req);
  element.style.width = '700px';
  element.style.padding = '20px';
  document.body.appendChild(element);

  // Use html2canvas to render the div to canvas
  html2canvas(element).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = canvas.height * imgWidth / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if content overflows
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save the PDF
    pdf.save(`${req.name}-request.pdf`);
    
    // Remove the temporary element
    document.body.removeChild(element);
  });
}

/**
 * Generates the HTML content for the PDF
 * Note: Bearer token is intentionally excluded for security
 */
private generatePdfHtml(req: SavedRequest): string {
  const response = this.response();
  const statusClass = response ? this.getStatusClass(response.status).replace('text-', 'color:') : '';
  
  // Format the response body if available
  let formattedResponse = '';
  if (response?.body) {
    try {
      formattedResponse = JSON.stringify(response.body, null, 2);
    } catch {
      formattedResponse = String(response.body);
    }
  }

  return `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h1 style="color: #2563eb; margin-bottom: 20px;">${req.name}</h1>
      
      <div style="background: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <h2 style="font-size: 18px; margin-top: 0;">Request Details</h2>
        <div style="margin-bottom: 10px;">
          <strong>Method:</strong> <span style="color: #2563eb;">${req.method}</span>
        </div>
        <div style="margin-bottom: 10px;">
          <strong>URL:</strong> <span>${req.url}</span>
        </div>
        ${req.body ? `
        <div style="margin-bottom: 10px;">
          <strong>Request Body:</strong>
          <pre style="background: #f1f5f9; padding: 10px; border-radius: 4px; overflow-x: auto;">${req.body}</pre>
        </div>
        ` : ''}
      </div>
      
      ${response ? `
      <div style="background: #f9fafb; border-radius: 8px; padding: 15px;">
        <h2 style="font-size: 18px; margin-top: 0;">Response</h2>
        <div style="margin-bottom: 10px;">
          <strong>Status:</strong> <span style="${statusClass}; font-weight: bold;">${response.status} ${response.statusText}</span>
        </div>
        <div style="margin-bottom: 10px;">
          <strong>Time:</strong> ${response.time}ms
        </div>
        <div style="margin-bottom: 10px;">
          <strong>Response Body:</strong>
          <pre style="background: #f1f5f9; padding: 10px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap;">${formattedResponse}</pre>
        </div>
      </div>
      ` : ''}
    </div>
  `;
}

/**
 * Generates a PDF containing all saved requests
 */
generateAllRequestsPdf() {
  const requests = this.savedRequests();
  if (requests.length === 0) return;

  const promises = requests.map(req => {
    return new Promise<void>((resolve) => {
      if (this.requestResponses()[req.id]) {
        resolve();
      } else {
        this.sendRequest(req);
        setTimeout(() => resolve(), 1500); // Wait for response
      }
    });
  });

  Promise.all(promises).then(() => {
    const element = document.createElement('div');
    element.innerHTML = this.generateAllRequestsHtml();
    element.style.width = '700px';
    element.style.padding = '20px';
    document.body.appendChild(element);

    html2canvas(element).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`all-saved-requests.pdf`);
      document.body.removeChild(element);
    });
  });
}


/**
 * Generates HTML for all saved requests
 */
private generateAllRequestsHtml(): string {
  const requests = this.savedRequests();
  const responses = this.requestResponses();

  let html = `<div style="font-family: Arial, sans-serif; color: #333;">
    <h1 style="color: #2563eb; margin-bottom: 20px;">All Saved Requests</h1>
  `;

  requests.forEach((req, index) => {
    const res = responses[req.id];
    let formattedResponse = '';
    if (res?.body) {
      try {
        formattedResponse = JSON.stringify(res.body, null, 2);
      } catch {
        formattedResponse = String(res.body);
      }
    }

    html += `
      <div style="margin-bottom: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 20px;">
        <h2 style="color: #1e40af; margin-bottom: 15px;">${index + 1}. ${req.name}</h2>

        <div style="background: #f9fafb; border-radius: 8px; padding: 15px;">
          <h3 style="font-size: 16px; margin-top: 0;">Request Details</h3>
          <div><strong>Method:</strong> <span style="color: #2563eb;">${req.method}</span></div>
          <div><strong>URL:</strong> ${req.url}</div>
          ${req.body ? `<div><strong>Request Body:</strong><pre>${req.body}</pre></div>` : ''}
        </div>

        ${res ? `
        <div style="margin-top: 15px; background: #f1f5f9; border-radius: 8px; padding: 15px;">
          <h3 style="font-size: 16px;">Response</h3>
          <div><strong>Status:</strong> ${res.status} ${res.statusText}</div>
          <div><strong>Time:</strong> ${res.time}ms</div>
          <div><strong>Response Body:</strong><pre style="white-space: pre-wrap;">${formattedResponse}</pre></div>
        </div>
        ` : ''}
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

  
  deleteRequest(id: string) {
    const filtered = this.savedRequests().filter(req => req.id !== id);
    this.savedRequests.set(filtered);
    localStorage.setItem('httpClientRequests', JSON.stringify(filtered));
  }
  
  loadSavedRequests() {
    try {
      const saved = localStorage.getItem('httpClientRequests');
      if (saved) {
        this.savedRequests.set(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load saved requests', e);
    }
  }
  
  getStatusClass(status: number): string {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 300 && status < 400) return 'text-blue-600';
    if (status >= 400 && status < 500) return 'text-orange-600';
    return 'text-red-600';
  }
  
  formatResponse(response: any): string {
    try {
      return JSON.stringify(response, null, 2);
    } catch {
      return String(response);
    }
  }
  
  getHeadersArray() {
    if (!this.response()?.headers) return [];
    
    const headers: {key: string, value: string}[] = [];
    this.response()?.headers.keys().forEach((key: string) => {
      headers.push({
        key,
        value: this.response()?.headers.get(key)
      });
    });
    
    return headers;
  }
}