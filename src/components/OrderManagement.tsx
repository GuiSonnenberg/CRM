"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, LogOut, ShoppingCart } from 'lucide-react';
import { useOrders, useUpdateOrderStatus } from '@/hooks/use-orders';
import { OrderFilters, Order } from '@/types/order';
import { useAuth } from '@/contexts/AuthContext';

const OrderManagement = () => {
  const [filters, setFilters] = useState<OrderFilters>({
    limit: 20,
    sortBy: 'createdAt',
    order: 'desc'
  });

  const { data: ordersResponse, isLoading } = useOrders(filters);
  const updateStatusMutation = useUpdateOrderStatus();
  const { logout } = useAuth();

  useEffect(() => {
    document.title = 'Calvão de Cria | Gerenciamento de Pedidos';
  }, []);

  const orders = ordersResponse?.data ?? [];

  const handleFilterChange = (key: keyof OrderFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleStatusChange = (orderId: string, status: string) => {
    updateStatusMutation.mutate({ orderId, status });
  };
  
  const getStatusVariant = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'paid': return 'default';
      case 'shipped': return 'outline';
      case 'delivered': return 'default';
      case 'canceled': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Pedidos</h1>
            <p className="text-muted-foreground">Visualize e gerencie as vendas da sua loja</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                Ver Produtos
              </Button>
            </Link>
            <Button variant="outline" size="icon" onClick={logout}>
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Sair</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="shipped">Enviado</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="canceled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos ({orders.length || 0})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-4 text-left font-semibold">Cliente</th>
                    <th className="p-4 text-left font-semibold">Total</th>
                    <th className="p-4 text-left font-semibold">Data</th>
                    <th className="p-4 text-left font-semibold">Status</th>
                    <th className="p-4 text-left font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={5} className="p-8 text-center">Carregando...</td></tr>
                  ) : orders.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center">Nenhum pedido encontrado.</td></tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-muted/25">
                        <td className="p-4">
                          <p className="font-medium">{order.customer.name}</p>
                          <p className="text-sm text-muted-foreground">{order.customer.email}</p>
                        </td>
                        {/* CORRIGIDO AQUI: usando order.total */}
                        <td className="p-4 font-medium">{formatPrice(order.total)}</td>
                        <td className="p-4 text-muted-foreground">{formatDate(order.createdAt)}</td>
                        <td className="p-4">
                          <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                        </td>
                        <td className="p-4">
                            <Select 
                                value={order.status}
                                onValueChange={(newStatus) => handleStatusChange(order.id, newStatus)}
                                disabled={updateStatusMutation.isPending}
                            >
                                <SelectTrigger className="w-32">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pendente</SelectItem>
                                    <SelectItem value="paid">Pago</SelectItem>
                                    <SelectItem value="shipped">Enviado</SelectItem>
                                    <SelectItem value="delivered">Entregue</SelectItem>
                                    <SelectItem value="canceled">Cancelado</SelectItem>
                                </SelectContent>
                            </Select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderManagement;