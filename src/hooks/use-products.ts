import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product, ProductsResponse, CreateProductData, UpdateProductData, ProductFilters } from '@/types/product';
import { toast } from '@/hooks/use-toast';

const API_BASE_URL = 'https://apicalvaodecria-production.up.railway.app/api/v1';
const API_EMAIL = 'admin@admin.com';
const API_PASSWORD = 'Password123!';

// Cache do token de autenticação
let authToken: string | null = null;
let tokenExpiry: number = 0;

async function getAuthToken(): Promise<string> {
  // Se o token ainda é válido, retorna o cache
  if (authToken && Date.now() < tokenExpiry) {
    return authToken;
  }

  console.log('Authenticating with external API...');

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: API_EMAIL,
      password: API_PASSWORD,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Authentication failed:', errorText);
    throw new Error(`Failed to authenticate: ${response.status}`);
  }

  const data = await response.json();

  // A API retorna o token em data.data.tokens.accessToken
  authToken = data.data?.tokens?.accessToken || data.token || data.access_token || data.accessToken;

  if (!authToken) {
    console.error('No token in response:', data);
    throw new Error('No authentication token received');
  }

  // Token válido por 50 minutos (assumindo 1 hora de validade)
  tokenExpiry = Date.now() + (50 * 60 * 1000);

  console.log('Authentication successful');
  return authToken;
}

async function makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}) {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  // Se o token expirou, limpa o cache e tenta novamente
  if (response.status === 401) {
    console.log('Token expired, re-authenticating...');
    authToken = null;
    tokenExpiry = 0;
    const newToken = await getAuthToken();

    return fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${newToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  return response;
}


async function fetchProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
  const params = new URLSearchParams();

  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.search) params.append('search', filters.search);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.order) params.append('order', filters.order);
  if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());

  const queryString = params.toString();
  const endpoint = `/admin/products${queryString ? `?${queryString}` : ''}`;

  const response = await makeAuthenticatedRequest(endpoint);

  if (!response.ok) {
    console.error('Error fetching products:', response);
    throw new Error('Erro ao buscar produtos');
  }

  const apiData = await response.json();
  const products = apiData.data?.products || apiData.products || apiData.data || [];

  // Transformar produtos para converter objetos de imagem em URLs
  const transformedProducts = products.map((product: any) => {
    let images = product.images || [];

    // Se images é um array de objetos com url, extrair apenas as URLs
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

async function createProduct(data: CreateProductData): Promise<Product> {
  const response = await makeAuthenticatedRequest('/admin/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    console.error('Error creating product:', response);
    throw new Error('Erro ao criar produto');
  }

  return response.json();
}

async function updateProduct(id: string, data: UpdateProductData): Promise<Product> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { images, ...dataWithoutImages } = data;

  const response = await makeAuthenticatedRequest(`/admin/products/${id}`, {
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
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => fetchProducts(filters),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
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

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductData }) => updateProduct(id, data),
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