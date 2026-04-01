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

export const extractProductsFromMenu = async (base64Image: string): Promise<Product[]> => {
  try {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: "Analiza esta imagen de un menú de restaurante o catálogo de productos. Extrae todos los productos, sus descripciones y sus precios. Devuelve el resultado como un array de objetos JSON con los campos: name (string), description (string), price (number). Si no hay descripción, deja el campo vacío. Asegúrate de que el precio sea un número puro." },
            {
              inlineData: {
                mimeType: "image/jpeg",
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
              price: { type: Type.NUMBER }
            },
            required: ["name", "price"]
          }
        }
      }
    });

    const products = JSON.parse(response.text);
    return products.map((p: any) => ({
      ...p,
      id: Math.random().toString(36).substr(2, 9),
      image: 'https://picsum.photos/seed/food/400/300' // Placeholder image
    }));
  } catch (error) {
    console.error('Error extracting products:', error);
    throw error;
  }
};
