"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Order, OrdersResponse, OrderFilters } from '@/types/order';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = 'https://apicalvaodecria-production.up.railway.app/api/v1';

// Função genérica para requisições autenticadas
async function makeAuthenticatedRequest(endpoint: string, token: string | null, options: RequestInit = {}) {
  if (!token) {
    throw new Error('Não autenticado');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody.message || 'Ocorreu um erro na requisição');
  }

  return response.json();
}

// Buscar pedidos com filtros
async function fetchOrders(token: string | null, filters: OrderFilters = {}): Promise<OrdersResponse> {
  const params = new URLSearchParams();

  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.search) params.append('search', filters.search);
  if (filters.status) params.append('status', filters.status);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.order) params.append('order', filters.order);

  const queryString = params.toString();
  const endpoint = `/admin/orders${queryString ? `?${queryString}` : ''}`;

  const apiData = await makeAuthenticatedRequest(endpoint, token);
  
  const orders = apiData.data?.orders || apiData.data || [];

  return {
    data: orders.map((order: any) => ({
        ...order,
        id: order.orderId || order._id || order.id,
    })),
    pagination: {
      page: apiData.data?.currentPage || 1,
      limit: apiData.data?.limit || 10,
      total: apiData.data?.totalOrders || 0,
      totalPages: apiData.data?.totalPages || 1,
    }
  };
}

// Atualizar status de um pedido
async function updateOrderStatus(token: string | null, { orderId, status }: { orderId: string; status: string }): Promise<Order> {
  // CORREÇÃO FINAL APLICADA AQUI, COM BASE NA IMAGEM DA API
  const endpoint = `/admin/orders/${orderId}/status`; 
  return makeAuthenticatedRequest(endpoint, token, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}


export function useOrders(filters: OrderFilters = {}) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['orders', filters, token],
    queryFn: () => fetchOrders(token, filters),
    enabled: !!token,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  return useMutation({
    mutationFn: (data: { orderId: string; status: string }) => updateOrderStatus(token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Status do pedido atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar status', {
        description: error.message || 'Por favor, tente novamente.',
      });
    },
  });
}