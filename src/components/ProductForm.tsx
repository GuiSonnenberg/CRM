import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCreateProduct, useUpdateProduct } from '@/hooks/use-products';
import { Product } from '@/types/product';
import { X } from 'lucide-react';
import { useState } from 'react';

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  price: z.number().min(0.01, 'Preço deve ser maior que zero'),
  stockQuantity: z.number().int().min(0, 'Quantidade deve ser um número positivo'),
  promotionalPrice: z.number().min(0).optional(),
  isPromotionActive: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product;
  onSuccess?: () => void;
}

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const [imageUrls, setImageUrls] = useState<string[]>(product?.images || []);
  const [newImageUrl, setNewImageUrl] = useState('');
  
  const isEditing = !!product;
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price || 0,
      stockQuantity: product?.stockQuantity || 0,
      promotionalPrice: product?.promotionalPrice || undefined,
      isPromotionActive: product?.isPromotionActive || false,
      isActive: product?.isActive ?? true,
    },
  });

  const isPromotionActive = watch('isPromotionActive');

  const addImageUrl = () => {
    if (newImageUrl.trim()) {
      setImageUrls(prev => [...prev, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const removeImageUrl = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      const submitData = {
        ...data,
        images: imageUrls,
      };

      if (isEditing && product) {
        await updateMutation.mutateAsync({
          id: product.id,
          data: submitData,
        });
      } else {
        // For creation, ensure required fields are present
        const createData = {
          name: data.name,
          description: data.description,
          price: data.price,
          stockQuantity: data.stockQuantity,
          images: imageUrls,
          isActive: data.isActive,
        };
        await createMutation.mutateAsync(createData);
        reset();
        setImageUrls([]);
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {isEditing ? 'Editar Produto' : 'Criar Novo Produto'}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Ex: iPhone 15 Pro"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Descreva as características do produto..."
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing Information */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h4 className="font-medium">Informações de Preço</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preço Original (R$) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...register('price', { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="text-sm text-destructive">{errors.price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Quantidade em Estoque *</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  {...register('stockQuantity', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.stockQuantity && (
                  <p className="text-sm text-destructive">{errors.stockQuantity.message}</p>
                )}
              </div>
            </div>

            {isEditing && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isPromotionActive"
                      checked={isPromotionActive}
                      onCheckedChange={(checked) => setValue('isPromotionActive', checked)}
                    />
                    <Label htmlFor="isPromotionActive">Ativar Promoção</Label>
                  </div>

                  {isPromotionActive && (
                    <div className="space-y-2">
                      <Label htmlFor="promotionalPrice">Preço Promocional (R$)</Label>
                      <Input
                        id="promotionalPrice"
                        type="number"
                        step="0.01"
                        {...register('promotionalPrice', { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                      {errors.promotionalPrice && (
                        <p className="text-sm text-destructive">{errors.promotionalPrice.message}</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h4 className="font-medium">Imagens do Produto</h4>
            
            <div className="flex gap-2">
              <Input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="URL da imagem"
                className="flex-1"
              />
              <Button type="button" onClick={addImageUrl} variant="outline">
                Adicionar
              </Button>
            </div>

            {imageUrls.length > 0 && (
              <div className="space-y-2">
                <Label>URLs das Imagens:</Label>
                <div className="space-y-2">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      <span className="flex-1 text-sm truncate">{url}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeImageUrl(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                {...register('isActive')}
                defaultChecked={watch('isActive')}
                onCheckedChange={(checked) => setValue('isActive', checked)}
              />
              <Label htmlFor="isActive">Produto Ativo</Label>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-2 pt-4">
          <Button
            type="submit"
            className="flex-1"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {(createMutation.isPending || updateMutation.isPending)
              ? 'Salvando...'
              : isEditing
              ? 'Atualizar Produto'
              : 'Criar Produto'}
          </Button>
        </div>
      </form>
    </>
  );
}