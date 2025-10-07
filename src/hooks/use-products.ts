"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product, ProductsResponse, CreateProductData, UpdateProductData, ProductFilters } from '@/types/product';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = 'https://apicalvaodecria-production.up.railway.app/api/v1';

// Função para fazer requisições autenticadas
async function makeAuthenticatedRequest(endpoint: string, token: string | null, options: RequestInit = {}) {
  if (!token) {
    throw new Error('Não autenticado');
  }

  const defaultHeaders: HeadersInit = {
    'Authorization': `Bearer ${token}`,
  };

  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  return response;
}

// Função para fazer o upload de uma imagem para um produto
async function uploadImageToProduct(token: string | null, productId: string, imageFile: File): Promise<void> {
    const formData = new FormData();
    formData.append('images', imageFile);

    const response = await makeAuthenticatedRequest(`/admin/products/${productId}/images`, token, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha no upload da imagem.');
    }
}

// Função para deletar uma imagem de um produto
async function deleteProductImage(token: string | null, productId: string, imagePublicId: string): Promise<void> {
    const response = await makeAuthenticatedRequest(`/admin/products/${productId}/images`, token, {
        method: 'DELETE',
        body: JSON.stringify({ publicId: imagePublicId })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao deletar a imagem.');
    }
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

  // CORREÇÃO CRUCIAL AQUI: Garante que 'productId' da API vire 'id' para a aplicação
  const transformedProducts = products.map((product: any) => {
      const { productId, _id, ...rest } = product;
      return {
          ...rest,
          id: productId || _id || product.id,
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

async function createProduct(token: string | null, data: CreateProductData & { localImageFiles?: File[] }): Promise<Product> {
  const { localImageFiles, ...productData } = data;

  const response = await makeAuthenticatedRequest('/admin/products', token, {
    method: 'POST',
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao criar produto');
  }

  const newProduct = await response.json();
  const newProductId = newProduct.data.productId;

  if (localImageFiles && localImageFiles.length > 0) {
    await Promise.all(
      localImageFiles.map(file => uploadImageToProduct(token, newProductId, file))
    );
  }

  return newProduct.data;
}

async function updateProduct(token: string | null, id: string, data: UpdateProductData & { localImageFiles?: File[] }): Promise<Product> {
    const { localImageFiles, images, ...productData } = data;

    if (localImageFiles && localImageFiles.length > 0) {
        await Promise.all(
            localImageFiles.map(file => uploadImageToProduct(token, id, file))
        );
    }
  
  const response = await makeAuthenticatedRequest(`/admin/products/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody.message || 'Erro ao atualizar produto');
  }

  const result = await response.json();
  return result.data;
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
    mutationFn: (data: CreateProductData & { localImageFiles?: File[] }) => createProduct(token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar produto', {
        description: error.message || 'Por favor, tente novamente.',
      });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductData & { localImageFiles?: File[] } }) => updateProduct(token, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar produto', {
        description: error.message || 'Por favor, tente novamente.',
      });
    },
  });
}

export function useDeleteProductImage() {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  return useMutation({
    mutationFn: ({ productId, imagePublicId }: { productId: string; imagePublicId: string }) => deleteProductImage(token, productId, imagePublicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Imagem removida com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover imagem', {
        description: error.message || 'Por favor, tente novamente.',
      });
    },
  });
}