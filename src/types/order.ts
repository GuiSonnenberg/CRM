export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customer: Customer;
  items: OrderItem[];
  total: number; // <-- CORRIGIDO AQUI (era totalAmount)
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'canceled';
  createdAt: string;
  updatedAt: string;
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface OrdersResponse {
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}