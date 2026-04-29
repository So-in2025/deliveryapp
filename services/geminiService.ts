import { Product } from '../types';

export const generateBannerWithAI = async (prompt: string) => {
  try {
    const response = await fetch('/api/ai/generate-banner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) throw new Error('AI Server Error');
    const data = await response.json();

    return {
      title: data.title,
      subtitle: data.subtitle,
      badge: data.badge,
      image: `https://images.unsplash.com/featured/?${encodeURIComponent(data.unsplashTerm)}`
    };
  } catch (error) {
    console.error('Error generating banner:', error);
    throw error;
  }
};

export const extractProductsFromMenu = async (base64Image: string): Promise<Product[]> => {
  try {
    const response = await fetch('/api/ai/extract-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image })
    });

    if (!response.ok) throw new Error('AI Server Error');
    const products = await response.json();

    return products.map((p: any) => ({
      ...p,
      id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      image: `https://images.unsplash.com/featured/?${encodeURIComponent(p.category || 'food')},${encodeURIComponent(p.name)}`,
      modifierGroups: []
    }));
  } catch (error) {
    console.error('Error extracting products:', error);
    throw error;
  }
};
