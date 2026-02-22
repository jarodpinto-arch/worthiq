const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  getToken() {
    return this.token;
  }

  isAuthenticated() {
    return !!this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));

      if (response.status === 401) {
        this.setToken(null);
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }

      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async register(email: string, password: string, name?: string) {
    const data = await this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    this.setToken(data.token);
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async getProfile() {
    return this.request<{ id: string; email: string; name?: string }>('/auth/me');
  }

  logout() {
    this.setToken(null);
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  // Plaid endpoints
  async createLinkToken() {
    return this.request<{ link_token: string }>('/plaid/create-link-token', {
      method: 'POST',
    });
  }

  async exchangePublicToken(publicToken: string) {
    return this.request<{ item: any; accounts: any[] }>('/plaid/exchange-public-token', {
      method: 'POST',
      body: JSON.stringify({ publicToken }),
    });
  }

  async getAccounts() {
    return this.request<any[]>('/plaid/accounts');
  }

  async syncAccounts() {
    return this.request<any[]>('/plaid/sync-accounts', {
      method: 'POST',
    });
  }

  async fetchTransactions(startDate: string, endDate: string) {
    return this.request<any[]>('/plaid/fetch-transactions', {
      method: 'POST',
      body: JSON.stringify({ startDate, endDate }),
    });
  }

  async getTransactions(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/plaid/transactions${query}`);
  }

  // Budget endpoints (new feature)
  async getBudgets() {
    return this.request<any[]>('/budgets');
  }

  async createBudget(category: string, amount: number, period: 'monthly' | 'weekly') {
    return this.request<any>('/budgets', {
      method: 'POST',
      body: JSON.stringify({ category, amount, period }),
    });
  }

  async updateBudget(id: string, amount: number) {
    return this.request<any>(`/budgets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ amount }),
    });
  }

  async deleteBudget(id: string) {
    return this.request<void>(`/budgets/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();
export default api;
