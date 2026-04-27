import { db, collection, getDocs, query, where, addDoc, serverTimestamp, setDoc, doc, updateDoc } from '../../firebase';
import { Store, Product, UserRole } from '../../types';

const ADMIN_EMAILS = [
  'soinsoluciones2025@gmail.com',
  'daniel.acevedo3134@gmail.com'
];

export const setupDemoStore = async (showToast: (msg: string, type: 'success' | 'error' | 'info') => void, currentUserEmail?: string | null) => {
  try {
    const targetEmail = (currentUserEmail && ADMIN_EMAILS.includes(currentUserEmail)) ? currentUserEmail : 'soinsoluciones2025@gmail.com';
    
    // 1. Find the user with the target email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', targetEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      showToast(`No se encontró el usuario ${targetEmail}. Por favor, inicia sesión con ese correo primero.`, 'error');
      return;
    }

    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;

    // Angel de la Independencia, CDMX coordinates
    const storeLat = 19.427050;
    const storeLng = -99.167645;
    const userLat = 19.428500; // Very close
    const userLng = -99.168500;

    // 2. Check if the user already has a store
    const userData = userDoc.data();
    
    // 3. Create or Update the Store
    const storeId = userData.ownedStoreId || `demo-store-${Date.now()}`;
    const demoStore: Partial<Store> = {
      name: 'Tienda Demo - Cercana',
      description: 'Tienda configurada para demostraciones reales. Gestión completa y seguimiento activo.',
      category: 'Restaurante',
      image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=800',
      rating: 4.8,
      reviewsCount: 124,
      deliveryTimeMin: 15,
      deliveryTimeMax: 30,
      deliveryFee: 15.0,
      ownerId: userId,
      isActive: true,
      isOpen: true,
      address: 'Centro Histórico, Calle de la Demo 101',
      lat: storeLat,
      lng: storeLng,
      products: [
        {
          id: 'p1',
          name: 'Hamburguesa Premium de la Casa',
          description: 'Carne angus de 200g, queso cheddar añejo, tocino ahumado y pan brioche artesanal.',
          price: 185.0,
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400',
          category: 'Comida',
          isAvailable: true
        },
        {
          id: 'p2',
          name: 'Tacos al Pastor (Orden de 5)',
          description: 'Carne marinada artesanalmente, piña, cilantro y cebolla. Incluye salsas especiales.',
          price: 95.0,
          image: 'https://images.unsplash.com/photo-1593504049359-74330189a345?auto=format&fit=crop&q=80&w=400',
          category: 'Comida',
          isAvailable: true
        },
        {
          id: 'p3',
          name: 'Ensalada César con Pollo',
          description: 'Lechuga orejona fresca, aderezo césar artesanal, croutones y pechuga a la plancha.',
          price: 145.0,
          image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&q=80&w=400',
          category: 'Comida',
          isAvailable: true
        },
        {
          id: 'p4',
          name: 'Jarrito de Fruta Fresca',
          description: 'Aguas frescas elaboradas con fruta natural del día. 1 Litro.',
          price: 45.0,
          image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=400',
          category: 'Bebidas',
          isAvailable: true
        }
      ],
      createdAt: serverTimestamp() as any
    };

    // Use setDoc with merge to avoid "No document to update" errors
    await setDoc(doc(db, 'stores', storeId), { ...demoStore, id: storeId }, { merge: true });

    // 4. Fully configure the user as both Merchant, Driver and Admin
    await updateDoc(doc(db, 'users', userId), { 
      ownedStoreId: storeId,
      role: UserRole.ADMIN, // Set as ADMIN so they can see everything
      isDriver: true,
      isApprovedDriver: true,
      isOnline: true,
      lat: userLat,
      lng: userLng,
      phone: '5512345678',
      vehicleType: 'MOTO',
      vehiclePlate: 'DEMO-123',
      vehicleInsurance: 'INS-999',
      driverLicense: 'LIC-000'
    });

    // 5. Ensure the email is in the global admin list
    const configRef = doc(db, 'config', 'global');
    try {
      const configSnap = await getDocs(query(collection(db, 'config'), where('__name__', '==', 'global')));
      if (!configSnap.empty) {
        const configData = configSnap.docs[0].data();
        const adminEmails = configData.adminEmails || [];
        if (!adminEmails.includes(targetEmail)) {
          await updateDoc(configRef, {
            adminEmails: [...adminEmails, targetEmail]
          });
        }
      } else {
        // Create it if it doesn't exist
        await setDoc(configRef, {
          adminEmails: [targetEmail],
          platformCommissionPct: 0.15,
          baseDeliveryFee: 35,
          centerCoordinates: { lat: 19.4326, lng: -99.1332 }
        });
      }
    } catch (e) {
      console.warn('Could not update global config admins, might not have permissions yet', e);
    }

    showToast(`Perfil completo (Admin/Comercio/Repartidor) configurado exitosamente para ${targetEmail}`, 'success');
  } catch (error) {
    console.error('Error seeding demo store:', error);
    showToast('Error al configurar la tienda demo', 'error');
  }
};
