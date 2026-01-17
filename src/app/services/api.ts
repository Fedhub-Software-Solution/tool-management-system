const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'Approver' | 'NPD' | 'Maintenance' | 'Spares' | 'Indentor';
    employeeId?: string;
    phone?: string;
    department?: string;
    isActive: boolean;
    lastLoginAt?: string;
    createdAt: string;
    updatedAt: string;
  };
  token: string;
  refreshToken: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retry = true
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('accessToken');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('=== API Request ===');
    console.log('URL:', `${this.baseUrl}${endpoint}`);
    console.log('Method:', options.method || 'GET');
    console.log('Headers:', headers);
    console.log('Body:', options.body);

    try {
      console.log('Making fetch request...');
      // Ensure body is properly set and headers are correct - don't let options override headers
      const fetchOptions: RequestInit = {
        method: options.method || 'GET',
        headers: headers,
      };
      
      // Only add body for methods that support it
      if (options.body) {
        fetchOptions.body = options.body;
      }
      
      // Copy other safe options
      if (options.signal) fetchOptions.signal = options.signal;
      if (options.cache) fetchOptions.cache = options.cache;
      if (options.credentials) fetchOptions.credentials = options.credentials;
      if (options.mode) fetchOptions.mode = options.mode;
      if (options.redirect) fetchOptions.redirect = options.redirect;
      if (options.referrer) fetchOptions.referrer = options.referrer;
      
      console.log('Fetch options being sent:', {
        method: fetchOptions.method,
        headers: fetchOptions.headers,
        hasBody: !!fetchOptions.body,
        bodyPreview: fetchOptions.body ? String(fetchOptions.body).substring(0, 200) : undefined
      });
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, fetchOptions);
      
      console.log('Fetch response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && retry) {
        try {
          await this.refreshToken();
          // Retry the request with new token
          return this.request<T>(endpoint, options, false);
        } catch (refreshError) {
          // Refresh failed, clear auth and throw
          this.logout();
          throw new Error('Session expired. Please login again.');
        }
      }

      // Handle 403 Forbidden - try refreshing token first in case it's expired
      // (Some backends return 403 instead of 401 for expired tokens)
      if (response.status === 403 && retry) {
        const token = localStorage.getItem('accessToken');
        const decodedToken = token ? this.decodeToken(token) : null;
        
        console.error('=== 403 Forbidden Error Debug ===');
        console.error('Endpoint:', endpoint);
        console.error('Current user from localStorage:', this.getCurrentUser());
        console.error('Decoded JWT token payload:', decodedToken);
        console.error('Token role:', decodedToken?.role);
        console.error('Token user ID:', decodedToken?.userId || decodedToken?.id);
        console.error('Token expiration:', decodedToken?.exp ? new Date(decodedToken.exp * 1000) : 'N/A');
        console.error('Current time:', new Date());
        
        // Check if token is expired
        const isExpired = decodedToken?.exp && decodedToken.exp < Date.now() / 1000;
        console.error('Token expired:', isExpired);
        console.error('Token expiration time:', decodedToken?.exp ? new Date(decodedToken.exp * 1000).toISOString() : 'N/A');
        console.error('Current time:', new Date().toISOString());
        
        // Try to refresh token if it might be expired
        if (isExpired) {
          try {
            console.log('Attempting to refresh expired token...');
            await this.refreshToken();
            console.log('Token refreshed successfully, retrying request...');
            // Retry the request with new token
            return this.request<T>(endpoint, options, false);
          } catch (refreshError) {
            // Refresh failed, clear auth and throw
            console.error('Token refresh failed:', refreshError);
            this.logout();
            throw new Error('Session expired. Please login again.');
          }
        }
      }

      const data = await response.json();

      if (!response.ok) {
        // Log detailed error for debugging
        if (response.status === 403) {
          const token = localStorage.getItem('accessToken');
          const decodedToken = token ? this.decodeToken(token) : null;
          console.error('Access denied. Response:', data);
          console.error('Current user from localStorage:', this.getCurrentUser());
          console.error('Decoded JWT token:', decodedToken);
          console.error('Token role:', decodedToken?.role);
          console.error('Expected roles:', data.error?.includes('Approver') ? 'Approver or NPD' : 'Unknown');
        } else {
          // Log validation or other errors
          console.error(`API Error (${response.status}):`, data);
          if (data.details && Array.isArray(data.details)) {
            console.error('Validation errors:', data.details);
          } else if (data.errors && Array.isArray(data.errors)) {
            console.error('Validation errors:', data.errors);
          }
        }
        // Include validation errors in the error message if available
        if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details.map((err: any) => err.message || err.path || err).join(', ');
          throw new Error(errorMessages || data.error || data.message || 'An error occurred');
        } else if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map((err: any) => err.message || err).join(', ');
          throw new Error(errorMessages || data.error || data.message || 'An error occurred');
        }
        throw new Error(data.error || data.message || 'An error occurred');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        // Check for network errors
        if (error.message.includes('fetch')) {
          throw new Error('Network error. Please check your connection.');
        }
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data) {
      // Store tokens
      localStorage.setItem('accessToken', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data!;
  }

  async refreshToken(): Promise<{ token: string }> {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.request<{ token: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    if (response.data) {
      localStorage.setItem('accessToken', response.data.token);
    }

    return response.data!;
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  // Helper to decode JWT token (for debugging)
  decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  // Projects endpoints
  async getProjects(filters?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: any[]; pagination?: any }> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = `/projects${queryString ? `?${queryString}` : ''}`;
    
    // Backend returns: { success: true, data: [...projects], pagination: {...} }
    // Our request method returns ApiResponse<T> which is { success: true, data: T, ... }
    // So response is { success: true, data: [...projects], pagination: {...} }
    // This means response.data is the projects array, and response has pagination at root level
    const response = await this.request<any>(endpoint, {
      method: 'GET',
    });

    // Extract data and pagination from response
    // response structure: { success: true, data: [...projects], pagination: {...} }
    const projectsArray = Array.isArray(response.data) ? response.data : [];
    // Pagination is at root level of response, not in ApiResponse interface
    const pagination = (response as any).pagination;

    return {
      data: projectsArray,
      pagination: pagination,
    };
  }

  async getProjectById(id: string): Promise<any> {
    const response = await this.request<any>(`/projects/${id}`, {
      method: 'GET',
    });

    return response.data!;
  }

  async createProject(data: {
    customerPO: string;
    partNumber: string;
    toolNumber: string;
    price: number;
    targetDate: string;
    status?: string;
    description?: string;
  }): Promise<any> {
    console.log('=== API Service: createProject ===');
    console.log('Endpoint:', `${this.baseUrl}/projects`);
    console.log('Method: POST');
    console.log('Request data:', data);
    console.log('Request body (JSON):', JSON.stringify(data));
    
    try {
      // Ensure status is a valid ProjectStatus enum value or omit it (backend will default to Active)
      const requestData = {
        customerPO: data.customerPO,
        partNumber: data.partNumber,
        toolNumber: data.toolNumber,
        price: data.price,
        targetDate: data.targetDate,
        ...(data.status && { status: data.status }),
        ...(data.description && { description: data.description }),
      };
      
      console.log('Final request data being sent:', requestData);
      
      const response = await this.request<any>('/projects', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      console.log('API Response received:', response);
      return response.data!;
    } catch (error) {
      console.error('API Error in createProject:', error);
      throw error;
    }
  }

  async updateProject(id: string, data: {
    customerPO?: string;
    partNumber?: string;
    toolNumber?: string;
    price?: number;
    targetDate?: string;
    status?: string;
    description?: string;
  }): Promise<any> {
    const response = await this.request<any>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    return response.data!;
  }

  async deleteProject(id: string): Promise<void> {
    await this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // PRs endpoints
  async getPRs(filters?: {
    status?: string;
    prType?: string;
    projectId?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: any[]; pagination?: any }> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = `/prs${queryString ? `?${queryString}` : ''}`;
    
    // Backend returns: { success: true, data: [...prs], pagination: {...} }
    const response = await this.request<any>(endpoint, {
      method: 'GET',
    });

    // Extract data and pagination from response
    const prsArray = Array.isArray(response.data) ? response.data : [];
    const pagination = (response as any).pagination;

    return {
      data: prsArray,
      pagination: pagination,
    };
  }

  async getPRById(id: string): Promise<any> {
    const response = await this.request<any>(`/prs/${id}`, {
      method: 'GET',
    });

    return response.data!;
  }

  async createPR(data: {
    projectId: string;
    prType: string;
    modRefReason?: string;
    items: Array<{
      itemCode?: string;
      name: string;
      specification: string;
      quantity: number;
      requirements?: string;
      bomUnitPrice?: number;
      sequenceNumber?: number;
    }>;
    supplierIds?: string[];
    criticalSpares?: Array<{
      quantity: number;
      notes?: string;
    }>;
  }): Promise<any> {
    const response = await this.request<any>('/prs', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response.data!;
  }

  async updatePR(id: string, data: {
    prType?: string;
    modRefReason?: string;
    items?: Array<{
      itemCode?: string;
      name: string;
      specification: string;
      quantity: number;
      requirements?: string;
      bomUnitPrice?: number;
      sequenceNumber?: number;
    }>;
    supplierIds?: string[];
    criticalSpares?: Array<{
      quantity: number;
      notes?: string;
    }>;
  }): Promise<any> {
    const response = await this.request<any>(`/prs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    return response.data!;
  }

  async approvePR(id: string, comments?: string): Promise<any> {
    const response = await this.request<any>(`/prs/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comments }),
    });

    return response.data!;
  }

  async rejectPR(id: string, comments: string): Promise<any> {
    const response = await this.request<any>(`/prs/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comments }),
    });

    return response.data!;
  }

  async sendToSuppliers(id: string): Promise<any> {
    const response = await this.request<any>(`/prs/${id}/send-to-suppliers`, {
      method: 'POST',
    });

    return response.data!;
  }

  async awardPR(id: string, supplierId: string, quotationId: string): Promise<any> {
    const response = await this.request<any>(`/prs/${id}/award`, {
      method: 'POST',
      body: JSON.stringify({ supplierId, quotationId }),
    });

    return response.data!;
  }

  async deletePR(id: string): Promise<void> {
    await this.request(`/prs/${id}`, {
      method: 'DELETE',
    });
  }

  async compareQuotations(prId: string): Promise<any> {
    const response = await this.request<any>(`/prs/${prId}/quotations/compare`, {
      method: 'GET',
    });

    return response.data!;
  }

  // ========== Suppliers API ==========
  async getSuppliers(filters?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: any[]; pagination?: any }> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = `/suppliers${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<any>(endpoint, {
      method: 'GET',
    });

    const suppliersArray = Array.isArray(response.data) ? response.data : [];
    const pagination = (response as any).pagination;

    return {
      data: suppliersArray,
      pagination: pagination,
    };
  }

  async getSupplierById(id: string): Promise<any> {
    const response = await this.request<any>(`/suppliers/${id}`, {
      method: 'GET',
    });

    return response.data!;
  }

  async createSupplier(supplierData: {
    supplierCode: string;
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    gstin?: string;
    status?: string;
    rating?: number;
    notes?: string;
    categories?: string[];
  }): Promise<any> {
    const response = await this.request<any>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplierData),
    });

    return response.data!;
  }

  async updateSupplier(id: string, supplierData: {
    supplierCode?: string;
    name?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    gstin?: string;
    status?: string;
    rating?: number;
    notes?: string;
    categories?: string[];
  }): Promise<any> {
    const response = await this.request<any>(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(supplierData),
    });

    return response.data!;
  }

  async deleteSupplier(id: string): Promise<void> {
    await this.request<void>(`/suppliers/${id}`, {
      method: 'DELETE',
    });
  }

  // ========== Tool Handovers API ==========
  async getHandovers(filters?: {
    status?: string;
    projectId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: any[]; pagination?: any }> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = `/handovers${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<any>(endpoint, {
      method: 'GET',
    });

    const handoversArray = Array.isArray(response.data) ? response.data : [];
    const pagination = (response as any).pagination;

    return {
      data: handoversArray,
      pagination: pagination,
    };
  }

  async getHandoverById(id: string): Promise<any> {
    const response = await this.request<any>(`/handovers/${id}`, {
      method: 'GET',
    });

    return response.data!;
  }

  async createHandover(data: {
    projectId: string;
    prId: string;
    toolSetDescription: string;
    allItems: Array<{
      prItemId: string;
      receivedQuantity: number;
    }>;
    criticalSpares?: Array<{
      prItemId: string;
      quantity: number;
    }>;
  }): Promise<any> {
    const response = await this.request<any>('/handovers', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response.data!;
  }

  async approveHandover(id: string, remarks?: string): Promise<any> {
    const response = await this.request<any>(`/handovers/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ remarks }),
    });

    return response.data!;
  }

  async rejectHandover(id: string, remarks: string): Promise<any> {
    const response = await this.request<any>(`/handovers/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ remarks }),
    });

    return response.data!;
  }

  // ========== Inventory API ==========
  async getInventory(filters?: {
    status?: string;
    partNumber?: string;
    toolNumber?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: any[]; pagination?: any }> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = `/inventory${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<any>(endpoint, {
      method: 'GET',
    });

    const inventoryArray = Array.isArray(response.data) ? response.data : [];
    const pagination = (response as any).pagination;

    return {
      data: inventoryArray,
      pagination: pagination,
    };
  }

  async getInventoryById(id: string): Promise<any> {
    const response = await this.request<any>(`/inventory/${id}`, {
      method: 'GET',
    });

    return response.data!;
  }

  async updateInventory(id: string, data: {
    quantity?: number;
    minStockLevel?: number;
    notes?: string;
  }): Promise<any> {
    const response = await this.request<any>(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    return response.data!;
  }

  async adjustInventory(id: string, data: {
    quantity: number;
    type: 'Addition' | 'Removal' | 'Adjustment';
    notes?: string;
  }): Promise<any> {
    const response = await this.request<any>(`/inventory/${id}/adjust`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response.data!;
  }

  async getLowStockItems(): Promise<any[]> {
    const response = await this.request<any>('/inventory/low-stock', {
      method: 'GET',
    });

    return Array.isArray(response.data) ? response.data : [];
  }

  // ========== Spares Requests API ==========
  async getSparesRequests(filters?: {
    status?: string;
    requestedBy?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: any[]; pagination?: any }> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = `/requests${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<any>(endpoint, {
      method: 'GET',
    });

    const requestsArray = Array.isArray(response.data) ? response.data : [];
    const pagination = (response as any).pagination;

    return {
      data: requestsArray,
      pagination: pagination,
    };
  }

  async getSparesRequestById(id: string): Promise<any> {
    const response = await this.request<any>(`/requests/${id}`, {
      method: 'GET',
    });

    return response.data!;
  }

  async createSparesRequest(data: {
    inventoryItemId: string;
    quantityRequested: number;
    projectId?: string;
    purpose: string;
  }): Promise<any> {
    const response = await this.request<any>('/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response.data!;
  }

  async fulfillSparesRequest(id: string, data: {
    quantityFulfilled: number;
    notes?: string;
  }): Promise<any> {
    const response = await this.request<any>(`/requests/${id}/fulfill`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response.data!;
  }

  async rejectSparesRequest(id: string, rejectionReason: string): Promise<any> {
    const response = await this.request<any>(`/requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason }),
    });

    return response.data!;
  }
}

export const apiService = new ApiService();

