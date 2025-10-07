export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  promotionalPrice?: number;
  isPromotionActive?: boolean;
  stockQuantity: number;
  images?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  images?: string[];
  isActive?: boolean;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  promotionalPrice?: number;
  isPromotionActive?: boolean;
  stockQuantity?: number;
  images?: string[];
  isActive?: boolean;
}

export interface ProductsResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'name' | 'price' | 'stockQuantity';
  order?: 'asc' | 'desc';
  isActive?: boolean;
}