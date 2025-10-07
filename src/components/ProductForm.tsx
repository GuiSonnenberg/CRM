"use client";

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
import { useCreateProduct, useUpdateProduct, useDeleteProductImage } from '@/hooks/use-products';
import { Product, ProductImage } from '@/types/product';
import { X, Star, Upload, StarHalf } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  price: z.number().min(0.01, 'Preço deve ser maior que zero'),
  stockQuantity: z.number().int().min(0, 'Quantidade deve ser um número positivo'),
  promotionalPrice: z.number().min(0).optional(),
  isPromotionActive: z.boolean().default(false),
  isActive: z.boolean().default(true),
  rating: z.number().min(0).max(5).optional().default(0),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product;
  onSuccess?: () => void;
}

// Componente de Estrelas atualizado para decimais
const StarRating = ({ rating, setRating }: { rating: number; setRating: (rating: number) => void }) => {
  const handleStarClick = (starIndex: number, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const isHalf = clickX < rect.width / 2;
    const newRating = isHalf ? starIndex - 0.5 : starIndex;
    setRating(newRating);
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const isFull = starIndex <= rating;
        const isHalf = starIndex - 0.5 === rating;

        return (
          <button
            key={starIndex}
            type="button"
            onClick={(e) => handleStarClick(starIndex, e)}
            className="focus:outline-none"
          >
            {isHalf ? (
              <StarHalf className="h-6 w-6 text-yellow-400 fill-yellow-400" />
            ) : (
              <Star
                className={cn(
                  "h-6 w-6",
                  isFull ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const [newImageUrl, setNewImageUrl] = useState('');
  const [localImageFiles, setLocalImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isEditing = !!product;
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteImageMutation = useDeleteProductImage();

  useEffect(() => {
    if (product && product.images) {
      const sorted = [...product.images].sort((a, b) => a.url.localeCompare(b.url));
      setExistingImages(sorted);
    } else {
      setExistingImages([]);
    }
  }, [product]);

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
      rating: product?.rating || 0,
    },
  });

  const isPromotionActive = watch('isPromotionActive');
  const currentRating = watch('rating');

  const removePlaceholderIfNeeded = () => {
    if (product && existingImages.length > 0) {
      const placeholder = existingImages.find(img => img.url.includes('calvaodecria-products-images-placeholder'));
      if (placeholder) {
        handleRemoveExistingImage(placeholder.publicId);
      }
    }
  };

  const handleRemoveExistingImage = (imagePublicId: string) => {
    if (!product) return;
    deleteImageMutation.mutate({ productId: product.id, imagePublicId }, {
        onSuccess: () => {
            setExistingImages(prev => prev.filter(img => img.publicId !== imagePublicId));
        }
    });
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      removePlaceholderIfNeeded();
      setLocalImageFiles(prev => [...prev, ...Array.from(event.target.files as FileList)]);
    }
  };
  
  const removeLocalImage = (index: number) => {
    setLocalImageFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleAddImageUrl = () => {
    if (newImageUrl.trim()) {
      if (!isEditing) { // A adição por URL só funciona na criação
        removePlaceholderIfNeeded();
        // A lógica de envio está no onSubmit
        alert('URL será adicionada ao criar o produto.');
      }
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (isEditing && product) {
        await updateMutation.mutateAsync({
          id: product.id,
          data: { ...data, localImageFiles },
        });
      } else {
        await createMutation.mutateAsync({
            ...data,
            images: newImageUrl ? [{ url: newImageUrl, publicId: 'url' }] : [],
            localImageFiles,
        });
        reset();
        setNewImageUrl('');
        setLocalImageFiles([]);
      }
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Editar Produto' : 'Criar Novo Produto'}</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input id="name" {...register('name')} placeholder="Ex: iPhone 15 Pro" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea id="description" {...register('description')} placeholder="Descreva as características do produto..." rows={3} />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
          </CardContent>
        </Card>
        
        {/* Rating and Pricing */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h4 className="font-medium">Avaliação e Preço</h4>
             <div className="space-y-2">
                <Label>Avaliação</Label>
                <StarRating rating={currentRating || 0} setRating={(rating) => setValue('rating', rating, { shouldValidate: true })} />
                {errors.rating && <p className="text-sm text-destructive">{errors.rating.message}</p>}
              </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preço Original (R$) *</Label>
                <Input id="price" type="number" step="0.01" {...register('price', { valueAsNumber: true })} placeholder="0.00" />
                {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Quantidade em Estoque *</Label>
                <Input id="stockQuantity" type="number" {...register('stockQuantity', { valueAsNumber: true })} placeholder="0" />
                {errors.stockQuantity && <p className="text-sm text-destructive">{errors.stockQuantity.message}</p>}
              </div>
            </div>
            {isEditing && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="isPromotionActive" checked={isPromotionActive} onCheckedChange={(checked) => setValue('isPromotionActive', checked)} />
                    <Label htmlFor="isPromotionActive">Ativar Promoção</Label>
                  </div>
                  {isPromotionActive && (
                    <div className="space-y-2">
                      <Label htmlFor="promotionalPrice">Preço Promocional (R$)</Label>
                      <Input id="promotionalPrice" type="number" step="0.01" {...register('promotionalPrice', { valueAsNumber: true })} placeholder="0.00" />
                      {errors.promotionalPrice && <p className="text-sm text-destructive">{errors.promotionalPrice.message}</p>}
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
                {isEditing && existingImages.length > 0 && (
                  <div className="space-y-2">
                      <Label>Imagens existentes:</Label>
                      <div className="space-y-2">
                          {existingImages.map((image) => (
                              <div key={image.publicId} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                                  <img src={image.url} alt="Preview" className="h-10 w-10 rounded-md object-cover" />
                                  <span className="flex-1 text-sm break-all">{image.url}</span>
                                  <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveExistingImage(image.publicId)} disabled={deleteImageMutation.isPending}>
                                      <X className="h-3 w-3" />
                                  </Button>
                              </div>
                          ))}
                      </div>
                  </div>
                )}
                <Tabs defaultValue="upload">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upload">Adicionar via Upload</TabsTrigger>
                        <TabsTrigger value="url">Adicionar via URL</TabsTrigger>
                    </TabsList>
                    <TabsContent value="url" className="space-y-4">
                        <p className="text-xs text-muted-foreground">Nota: a adição por URL só funciona ao criar um novo produto.</p>
                        <div className="flex gap-2">
                            <Input value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} placeholder="https://exemplo.com/imagem.png" className="flex-1" disabled={isEditing} />
                            <Button type="button" onClick={handleAddImageUrl} variant="outline" disabled={isEditing}>Adicionar</Button>
                        </div>
                    </TabsContent>
                    <TabsContent value="upload" className="space-y-4">
                        <Input id="image-upload" type="file" accept="image/png, image/jpeg" multiple onChange={handleFileChange} className="hidden" ref={fileInputRef} />
                        <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" />
                            Selecionar Novos Arquivos
                        </Button>
                        {localImageFiles.length > 0 && (
                            <div className="space-y-2">
                                <Label>Novos arquivos para upload:</Label>
                                <div className="space-y-2">
                                    {localImageFiles.map((file, index) => (
                                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                                            <img src={URL.createObjectURL(file)} alt="Preview" className="h-10 w-10 rounded-md object-cover" />
                                            <span className="flex-1 text-sm break-all">{file.name}</span>
                                            <Button type="button" variant="ghost" size="sm" onClick={() => removeLocalImage(index)}>
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Switch id="isActive" {...register('isActive')} defaultChecked={watch('isActive')} onCheckedChange={(checked) => setValue('isActive', checked)} />
              <Label htmlFor="isActive">Produto Ativo</Label>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
            {(createMutation.isPending || updateMutation.isPending) ? 'Salvando...' : isEditing ? 'Atualizar Produto' : 'Criar Produto'}
          </Button>
        </div>
      </form>
    </>
  );
}