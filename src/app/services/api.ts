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

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
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

      const data = await response.json();

      if (!response.ok) {
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
    const response = await this.request<any>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response.data!;
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

