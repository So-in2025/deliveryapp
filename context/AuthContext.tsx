import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, User, loginWithGoogle, logout, db, doc, getDoc, setDoc } from '../firebase';
import { UserRole, UserProfile } from '../types';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed:', currentUser);
      setUser(currentUser);
      if (currentUser) {
        // Fetch profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as UserProfile;
          // Auto-upgrade to ADMIN if email matches
          const isAdminEmail = currentUser.email === "ofeliaacevedo41@gmail.com";
          if (isAdminEmail && data.role !== UserRole.ADMIN) {
            const updatedProfile = { ...data, role: UserRole.ADMIN };
            await updateDoc(doc(db, 'users', currentUser.uid), { role: UserRole.ADMIN });
            setProfile(updatedProfile);
          } else {
            setProfile(data);
          }
        } else {
          // Create profile
          const isAdminEmail = currentUser.email === "ofeliaacevedo41@gmail.com";
          const newProfile: UserProfile = {
            uid: currentUser.uid,
            name: currentUser.displayName || 'Usuario',
            email: currentUser.email || '',
            avatar: currentUser.photoURL || undefined,
            role: isAdminEmail ? UserRole.ADMIN : UserRole.CLIENT,
          };
          await setDoc(doc(db, 'users', currentUser.uid), newProfile);
          setProfile(newProfile);
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
    <AuthContext.Provider value={{ user, profile, loading, login, signOut, isAuthReady }}>
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
