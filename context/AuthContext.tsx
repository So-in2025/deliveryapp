import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, User, loginWithGoogle, logout, db, doc, setDoc, updateDoc, messaging, getToken, onSnapshot, handleFirestoreError, OperationType } from '../firebase';
import { UserRole, UserProfile } from '../types';
import { useToast } from './ToastContext';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  loginEmail: (email: string, pass: string) => Promise<void>;
  registerEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPass: (email: string) => Promise<void>;
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

  // Automatic setup if permission already granted
  useEffect(() => {
    if (!messaging || !user || Capacitor.isNativePlatform()) return;
    
    if (Notification.permission === 'granted') {
      const setup = async () => {
        try {
          const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
          if (vapidKey) {
            const token = await getToken(messaging, { vapidKey });
            if (token && profile && profile.fcmToken !== token) {
              await updateDoc(doc(db, 'users', user.uid), { fcmToken: token });
            }
          }
        } catch (e) {
          console.error('Auto FCM setup error:', e);
        }
      };
      setup();
    }
  }, [user, messaging, profile]);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed:', currentUser);
      setUser(currentUser);

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (currentUser) {
        // Use onSnapshot for real-time profile updates
        const userDocRef = doc(db, 'users', currentUser.uid);
        unsubscribeProfile = onSnapshot(userDocRef, async (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as UserProfile;
            setProfile(data);
          } else {
            // Create profile if it doesn't exist
            const data: UserProfile = {
              uid: currentUser.uid,
              name: currentUser.displayName || 'Usuario',
              email: currentUser.email || '',
              role: UserRole.CLIENT,
            };
            if (currentUser.photoURL) {
              data.avatar = currentUser.photoURL;
            }
            try {
              await setDoc(userDocRef, data);
              // setProfile will be called by the next snapshot
            } catch (error) {
              handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
            }
          }
          setLoading(false);
          setIsAuthReady(true);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
          setLoading(false);
          setIsAuthReady(true);
        });
      } else {
        setProfile(null);
        setLoading(false);
        setIsAuthReady(true);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
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

  const loginEmail = async (email: string, pass: string) => {
    try {
      await import('../firebase').then(m => m.loginWithEmail(email, pass));
      showToast('Sesión iniciada correctamente', 'success');
    } catch (error: any) {
      console.error('Login email error:', error);
      let msg = 'Error al iniciar sesión';
      if (error.code === 'auth/user-not-found') msg = 'Usuario no encontrado';
      if (error.code === 'auth/wrong-password') msg = 'Contraseña incorrecta';
      showToast(msg, 'error');
      throw error;
    }
  };

  const registerEmail = async (email: string, pass: string, name: string) => {
    try {
      const { registerWithEmail, updateProfile, verifyEmail } = await import('../firebase');
      const userCredential = await registerWithEmail(email, pass);
      await updateProfile(userCredential.user, { displayName: name });
      try {
        await verifyEmail();
        showToast('Cuenta creada. Por favor verifica tu correo electrónico.', 'info');
      } catch (e) {
        console.warn('Verification email failed:', e);
        showToast('Cuenta creada correctamente', 'success');
      }
    } catch (error: any) {
      console.error('Register email error:', error);
      let msg = 'Error al crear cuenta';
      if (error.code === 'auth/email-already-in-use') msg = 'El correo ya está en uso';
      showToast(msg, 'error');
      throw error;
    }
  };

  const resetPass = async (email: string) => {
    try {
      const { resetPassword } = await import('../firebase');
      await resetPassword(email);
      showToast('Correo de recuperación enviado', 'info');
    } catch (error) {
      console.error('Reset password error:', error);
      showToast('Error al enviar correo de recuperación', 'error');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await logout();
      localStorage.removeItem('codex_user_role');
      showToast('Sesión cerrada', 'info');
    } catch (error) {
      console.error('Logout error:', error);
      showToast('Error al cerrar sesión', 'error');
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, loginEmail, registerEmail, resetPass, signOut, isAuthReady, requestNotificationPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
