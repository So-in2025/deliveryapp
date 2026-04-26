import { db, collection, getDocs, query, where, addDoc, serverTimestamp, setDoc, doc, updateDoc } from '../../firebase';
import { Store, Product, UserRole } from '../../types';

const DEMO_EMAIL = 'soinsoluciones2025@gmail.com';

export const setupDemoStore = async (showToast: (msg: string, type: 'success' | 'error' | 'info') => void) => {
  try {
    // 1. Find the user with the demo email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', DEMO_EMAIL));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      showToast('No se encontró el usuario soinsoluciones2025@gmail.com. Por favor, inicia sesión con ese correo primero.', 'error');
      return;
    }

    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;

    // 2. Check if the user already has a store
    const userData = userDoc.data();
    if (userData.ownedStoreId) {
      showToast('El usuario ya tiene una tienda vinculada.', 'info');
      // We could update it, but let's just proceed to ensure products are there
    }

    // 3. Create or Update the Store
    const storeId = userData.ownedStoreId || `demo-store-${Date.now()}`;
    const demoStore: Partial<Store> = {
      name: 'Delicias del Vecino - Tienda Demo',
      description: 'Bienvenido a la mejor experiencia culinaria local. Productos frescos y entrega inmediata.',
      category: 'Restaurante',
      image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=800',
      rating: 4.9,
      reviewsCount: 124,
      deliveryTime: '20-35 min',
      deliveryFee: 15.0,
      minOrder: 100.0,
      ownerId: userId,
      isActive: true,
      address: 'Centro Histórico, Calle Principal 123',
      coordinates: { lat: 19.4326, lng: -99.1332 }, // Mexico City center example
      products: [
        {
          id: 'p1',
          name: 'Hamburguesa Premium de la Casa',
          description: 'Carne angus de 200g, queso cheddar añejo, tocino ahumado y pan brioche artesanal.',
          price: 185.0,
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400',
          category: 'Hamburguesas',
          isAvailable: true
        },
        {
          id: 'p2',
          name: 'Pizza Napolitana Pro',
          description: 'Masa de fermentación lenta, salsa de tomate San Marzano y mozzarella de búfala.',
          price: 240.0,
          image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400',
          category: 'Pizzas',
          isAvailable: true
        },
        {
          id: 'p3',
          name: 'Bowl Energético Local',
          description: 'Quinoa, aguacate orgánico, garbanzos crujientes y aderezo de tahini casero.',
          price: 160.0,
          image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400',
          category: 'Saludable',
          isAvailable: true
        },
        {
          id: 'p4',
          name: 'Cerveza Artesanal "De Autor"',
          description: 'IPA local con notas cítricas y amargor equilibrado.',
          price: 85.0,
          image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&q=80&w=400',
          category: 'Bebidas',
          isAvailable: true
        }
      ],
      createdAt: serverTimestamp() as any
    };

    if (userData.ownedStoreId) {
       await updateDoc(doc(db, 'stores', storeId), demoStore);
    } else {
       await setDoc(doc(db, 'stores', storeId), { ...demoStore, id: storeId });
       await updateDoc(doc(db, 'users', userId), { 
         ownedStoreId: storeId,
         role: UserRole.MERCHANT 
       });
    }

    showToast('Tienda Demo configurada exitosamente para soinsoluciones2025@gmail.com', 'success');
  } catch (error) {
    console.error('Error seeding demo store:', error);
    showToast('Error al configurar la tienda demo', 'error');
  }
};
