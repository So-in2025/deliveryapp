import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, User, loginWithGoogle, logout, db, doc, getDoc, setDoc, updateDoc, messaging, getToken } from '../firebase';
import { UserRole, UserProfile } from '../types';
import { useToast } from './ToastContext';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthReady: boolean;
  requestNotificationPermission: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { showToast } = useToast();

  const requestNotificationPermission = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        // Native Push Notifications via Capacitor
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }
        if (permStatus.receive !== 'granted') {
          showToast('Permiso de notificaciones denegado', 'error');
          return;
        }

        await PushNotifications.register();
        
        PushNotifications.addListener('registration', async (token) => {
          if (user) {
            await updateDoc(doc(db, 'users', user.uid), { fcmToken: token.value });
            setProfile(prev => prev ? { ...prev, fcmToken: token.value } : null);
            showToast('Notificaciones nativas activadas', 'success');
          }
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('Error on registration: ', error);
          showToast('Error al registrar notificaciones', 'error');
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push notification received: ', notification);
          // The native OS will show the notification, but we can also show a toast
          showToast(notification.title || 'Nueva Notificación', 'info');
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push notification action performed', notification.actionId, notification.inputValue);
        });

      } else {
        // Web Push Notifications via Firebase
        if (!messaging || !user) return;
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
          if (!vapidKey) {
            console.warn('VITE_FIREBASE_VAPID_KEY is not defined. Push notifications may not work.');
          }
          const token = await getToken(messaging, { vapidKey });
          if (token) {
            await updateDoc(doc(db, 'users', user.uid), { fcmToken: token });
            setProfile(prev => prev ? { ...prev, fcmToken: token } : null);
            showToast('Notificaciones web activadas', 'success');
          }
        } else {
          showToast('Permiso de notificaciones denegado', 'error');
        }
      }
    } catch (err) {
      console.error('Push Notification Error:', err);
      showToast('Error al configurar notificaciones', 'error');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed:', currentUser);
      setUser(currentUser);
      if (currentUser) {
        // Fetch profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        let data: UserProfile;
        if (userDoc.exists()) {
          data = userDoc.data() as UserProfile;
          // Auto-upgrade to ADMIN if email matches
          const isAdminEmail = currentUser.email === "ofeliaacevedo41@gmail.com";
          if (isAdminEmail && data.role !== UserRole.ADMIN) {
            data = { ...data, role: UserRole.ADMIN };
            await updateDoc(doc(db, 'users', currentUser.uid), { role: UserRole.ADMIN });
          }
          setProfile(data);
        } else {
          // Create profile
          const isAdminEmail = currentUser.email === "ofeliaacevedo41@gmail.com";
          data = {
            uid: currentUser.uid,
            name: currentUser.displayName || 'Usuario',
            email: currentUser.email || '',
            avatar: currentUser.photoURL || undefined,
            role: isAdminEmail ? UserRole.ADMIN : UserRole.CLIENT,
          };
          await setDoc(doc(db, 'users', currentUser.uid), data);
          setProfile(data);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      await loginWithGoogle();
      showToast('Sesión iniciada correctamente', 'success');
    } catch (error) {
      console.error('Login error:', error);
      showToast('Error al iniciar sesión', 'error');
    }
  };

  const signOut = async () => {
    try {
      await logout();
      showToast('Sesión cerrada', 'info');
    } catch (error) {
      console.error('Logout error:', error);
      showToast('Error al cerrar sesión', 'error');
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, signOut, isAuthReady, requestNotificationPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
