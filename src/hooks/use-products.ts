import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product, ProductsResponse, CreateProductData, UpdateProductData, ProductFilters } from '@/types/product';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = 'https://apicalvaodecria-production.up.railway.app/api/v1';

async function makeAuthenticatedRequest(endpoint: string, token: string | null, options: RequestInit = {}) {
  if (!token) {
    throw new Error('Não autenticado');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return response;
}

async function fetchProducts(token: string | null, filters: ProductFilters = {}): Promise<ProductsResponse> {
  const params = new URLSearchParams();

  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.search) params.append('search', filters.search);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.order) params.append('order', filters.order);
  if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());

  const queryString = params.toString();
  const endpoint = `/admin/products${queryString ? `?${queryString}` : ''}`;

  const response = await makeAuthenticatedRequest(endpoint, token);

  if (!response.ok) {
    console.error('Error fetching products:', response);
    throw new Error('Erro ao buscar produtos');
  }

  const apiData = await response.json();
  const products = apiData.data?.products || apiData.products || apiData.data || [];

  const transformedProducts = products.map((product: any) => {
    let images = product.images || [];
    if (Array.isArray(images) && images.length > 0 && typeof images[0] === 'object' && images[0].url) {
      images = images.map((img: any) => img.url);
    }
    return {
      id: product.productId || product._id || product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      promotionalPrice: product.promotionalPrice,
      isPromotionActive: product.isPromotionActive,
      stockQuantity: product.stockQuantity,
      images,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  });

  return {
    data: transformedProducts,
    pagination: {
      page: apiData.data?.currentPage || apiData.currentPage || 1,
      limit: apiData.data?.limit || apiData.limit || 10,
      total: apiData.data?.totalProducts || apiData.totalProducts || apiData.total || 0,
      totalPages: apiData.data?.totalPages || apiData.totalPages || 1,
    }
  };
}

async function createProduct(token: string | null, data: CreateProductData): Promise<Product> {
  const response = await makeAuthenticatedRequest('/admin/products', token, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    console.error('Error creating product:', response);
    throw new Error('Erro ao criar produto');
  }

  return response.json();
}

async function updateProduct(token: string | null, id: string, data: UpdateProductData): Promise<Product> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { images, ...dataWithoutImages } = data;

  const response = await makeAuthenticatedRequest(`/admin/products/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(dataWithoutImages),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Error updating product:', errorBody);
    throw new Error('Erro ao atualizar produto');
  }

  return response.json();
}

export function useProducts(filters: ProductFilters = {}) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['products', filters, token],
    queryFn: () => fetchProducts(token, filters),
    enabled: !!token,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  return useMutation({
    mutationFn: (data: CreateProductData) => createProduct(token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Produto criado',
        description: 'Produto criado com sucesso!',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar produto. Tente novamente.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductData }) => updateProduct(token, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Produto atualizado',
        description: 'Produto atualizado com sucesso!',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar produto. Tente novamente.',
        variant: 'destructive',
      });
    },
  });
}