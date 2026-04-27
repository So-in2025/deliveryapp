import { GoogleGenAI, Type } from "@google/genai";
import { Product } from '../types';

let aiInstance: GoogleGenAI | null = null;

function getAiInstance(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export const generateBannerWithAI = async (prompt: string) => {
  try {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: 'user',
          parts: [
            { text: `Genera una promoción para una app de delivery basada en este tema: "${prompt}". Devuelve un objeto JSON con: title (string: impactante, corto), subtitle (string: explicativo), badge (string: PROMO, HOT, NUEVO, etc), y un termino de busqueda en ingles para unsplash (ejemplo: burger, sushi, pizza, etc).` }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            badge: { type: Type.STRING },
            unsplashTerm: { type: Type.STRING }
          },
          required: ["title", "subtitle", "badge", "unsplashTerm"]
        }
      }
    });

    const data = JSON.parse(response.text);
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
    const ai = getAiInstance();
    const mimeType = base64Image.split(';')[0].split(':')[1] || 'image/jpeg';
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", // Using stable version
      contents: [
        {
          parts: [
            { text: `Analiza esta imagen o documento de un menú de restaurante o catálogo de productos. 
            Extrae TODOS los productos individuales.
            Para cada producto identifica:
            - name: Nombre claro del producto.
            - description: Descripción si existe (sino inventa una breve basada en el nombre).
            - price: Precio numérico (extrae solo el número, ignora símbolos de moneda).
            - category: Intenta clasificarlo (ej: Bebidas, Platos Principales, Postres, etc).
            
            IMPORTANTE: Devuelve un array JSON puro. Sé extremadamente preciso con los precios.` },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image.split(',')[1] || base64Image
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              price: { type: Type.NUMBER },
              category: { type: Type.STRING }
            },
            required: ["name", "price"]
          }
        }
      }
    });

    const products = JSON.parse(response.text);
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
