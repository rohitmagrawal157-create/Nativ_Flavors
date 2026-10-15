import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import type { CategoryProduct } from '../data/categoryData';

type ApiProduct = {
  id: number;
  name: string;
  image_url: string | null;
  category?: { id: number; name: string };
  price?: string;
  rating?: number;
  badge?: string;
};

export function useCategoryProductsByCategoryId(
  categoryId: number,
  fallbackProducts: CategoryProduct[],
  opts: {
    fallbackImage: string;
    fallbackTag: string;
    fallbackCategorySlug?: string;
  },
) {
  const [products, setProducts] = useState<CategoryProduct[]>(fallbackProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setError(null);

    if (!categoryId || categoryId <= 0) {
      setProducts(fallbackProducts);
      setLoading(false);
      return () => {
        alive = false;
      };
    }

    setLoading(true);

    apiClient
      .get<unknown>(`/categories/${categoryId}/products`)
      .then((res) => {
        const payload = res.data as any;
        const rows: ApiProduct[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

        if (!Array.isArray(rows)) throw new Error('Unexpected response shape');

        const fallbackCategory =
          opts.fallbackCategorySlug ?? fallbackProducts?.[0]?.category ?? '';

        const mapped: CategoryProduct[] = rows.map((p) => ({
          id: Number(p.id),
          name: String(p.name ?? ''),
          image: p.image_url || opts.fallbackImage,
          // API provides parent-of-subcategory name as `category.name`
          tag: p.category?.name ? String(p.category.name) : opts.fallbackTag,
          price: typeof p.price === 'string' ? p.price : '$0',
          rating: Number(p.rating ?? 4) || 4,
          badge: p.badge,
          category: fallbackCategory,
        }));

        if (!alive) return;

        // If API returns empty list, keep empty (not fallback) so UI reflects reality.
        setProducts(mapped);
      })
      .catch((err: any) => {
        // Prevent silent failures: keep fallback but expose error.
        // eslint-disable-next-line no-console
        console.error('Failed to fetch products by categoryId', { categoryId, err });
        if (!alive) return;
        setError('Failed to load products from API.');
        setProducts(fallbackProducts);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [categoryId, fallbackProducts, opts.fallbackCategorySlug, opts.fallbackImage, opts.fallbackTag]);

  return { products, loading, error };
}

