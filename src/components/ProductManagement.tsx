"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, ArrowUpDown, Edit2, Power, Image, LogOut } from 'lucide-react';
import { useProducts, useUpdateProduct } from '@/hooks/use-products';
import { ProductFilters, Product } from '@/types/product';
import { ProductForm } from '@/components/ProductForm';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';

const ProductManagement = () => {
  const [filters, setFilters] = useState<ProductFilters>({
    limit: 1000,
    sortBy: 'name',
    order: 'asc'
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { data: productsResponse, isLoading } = useProducts(filters);
  const updateProductMutation = useUpdateProduct();
  const { logout } = useAuth();

  useEffect(() => {
    document.title = 'Calvão de Cria | Gerenciamento';
  }, []);

  const products = Array.isArray(productsResponse?.data) ? productsResponse.data : [];

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSort = (sortBy: ProductFilters['sortBy']) => {
    const newOrder = filters.sortBy === sortBy && filters.order === 'asc' ? 'desc' : 'asc';
    setFilters(prev => ({ ...prev, sortBy, order: newOrder }));
  };

  const handleToggleActive = (product: Product) => {
    updateProductMutation.mutate({
      id: product.id,
      data: { isActive: !product.isActive }
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };
  
  const handleEditSuccess = () => {
    setEditingProduct(null);
  };

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Produtos</h1>
            <p className="text-muted-foreground">Gerencie o catálogo de produtos da sua loja</p>
          </div>
          <div className="flex items-center gap-4">
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Novo Produto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <ProductForm onSuccess={() => setIsCreateModalOpen(false)} />
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="icon" onClick={logout}>
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Sair</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={filters.isActive === undefined ? 'all' : filters.isActive.toString()}
                  onValueChange={(value) => handleFilterChange('isActive', value === 'all' ? undefined : value === 'true')}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="true">Ativos</SelectItem>
                    <SelectItem value="false">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Dialog open={!!editingProduct} onOpenChange={(isOpen) => !isOpen && setEditingProduct(null)}>
          <Card>
            <CardHeader>
              <CardTitle>Produtos ({products.length || 0})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="p-4 text-left">Imagem</th>
                      <th className="p-4 text-left">
                        <Button variant="ghost" size="sm" className="gap-2 font-semibold" onClick={() => handleSort('name')}>
                          Nome <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </th>
                      <th className="p-4 text-left">
                        <Button variant="ghost" size="sm" className="gap-2 font-semibold" onClick={() => handleSort('price')}>
                          Preço <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </th>
                      <th className="p-4 text-left">
                        <Button variant="ghost" size="sm" className="gap-2 font-semibold" onClick={() => handleSort('stockQuantity')}>
                          Estoque <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </th>
                      <th className="p-4 text-left">Status</th>
                      <th className="p-4 text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">Carregando produtos...</td>
                      </tr>
                    ) : products.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum produto encontrado</td>
                      </tr>
                    ) : (
                      products.map((product) => (
                        <tr key={product.id} className="border-b hover:bg-muted/25">
                          <td className="p-4">
                            {/* CORREÇÃO AQUI */}
                            {product.images && product.images.length > 0 ? (
                              <img src={product.images[0].url} alt={product.name} className="h-12 w-12 rounded-lg object-cover" />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                                <Image className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              {product.isPromotionActive && product.promotionalPrice ? (
                                <div>
                                  <p className="font-medium text-success">{formatPrice(product.promotionalPrice)}</p>
                                  <p className="text-sm text-muted-foreground line-through">{formatPrice(product.price)}</p>
                                </div>
                              ) : (
                                <p className="font-medium">{formatPrice(product.price)}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`font-medium ${product.stockQuantity > 20 ? 'text-success' : product.stockQuantity > 5 ? 'text-warning' : 'text-destructive'}`}>
                              {product.stockQuantity}
                            </span>
                          </td>
                          <td className="p-4">
                            <Badge variant={product.isActive ? 'default' : 'secondary'}>{product.isActive ? 'Ativo' : 'Inativo'}</Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setEditingProduct(product)}>
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <Button
                                variant={product.isActive ? 'destructive' : 'default'}
                                size="sm"
                                onClick={() => handleToggleActive(product)}
                                disabled={updateProductMutation.isPending}
                              >
                                <Power className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {editingProduct && (<ProductForm product={editingProduct} onSuccess={handleEditSuccess} />)}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ProductManagement;