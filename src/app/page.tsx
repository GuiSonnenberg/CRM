"use client";
import ProductManagement from '@/components/ProductManagement';

export default function Home() {
  // A proteção agora é feita pelo middleware, então o useEffect e a verificação podem ser removidos.
  return <ProductManagement />;
}