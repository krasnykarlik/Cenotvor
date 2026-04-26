import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  // Data actions
  saveOffer: (offer: any) => Promise<void>;
  deleteOffer: (id: string) => Promise<void>;
  softDeleteOffer: (id: string) => Promise<void>;
  offers: any[];
  userSettings: any | null;
  globalSettings: any | null;
  saveSettings: (settings: any) => Promise<void>;
  isAdmin: (u: User | null) => boolean;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<any[]>([]);
  const [userSettings, setUserSettings] = useState<any | null>(null);
  const [globalSettings, setGlobalSettings] = useState<any | null>(null);

  const isAdmin = (u: User | null) => u?.email === 'krasnykarlik@gmail.com';

  useEffect(() => {
    let unsubscribeGlobal: (() => void) | undefined;
    let unsubscribeSettings: (() => void) | undefined;
    let unsubscribeOffers: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Listen for global settings (accessible to all authenticated)
        const globalSettingsRef = doc(db, 'settings', 'config');
        unsubscribeGlobal = onSnapshot(globalSettingsRef, (snap) => {
          if (snap.exists()) {
            setGlobalSettings(snap.data());
          }
        });

        // Sync user profile
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }

        // Listen for user-specific settings
        const settingsRef = doc(db, 'users', user.uid, 'settings', 'current');
        unsubscribeSettings = onSnapshot(settingsRef, (snap) => {
          if (snap.exists()) {
            setUserSettings(snap.data());
          }
        });

        // Listen for offers
        const offersRef = collection(db, 'offers');
        
        let q;
        if (isAdmin(user)) {
          q = query(offersRef, orderBy('updatedAt', 'desc'));
        } else {
          q = query(offersRef, where('userId', '==', user.uid), orderBy('updatedAt', 'desc'));
        }
        
        unsubscribeOffers = onSnapshot(q, (snap) => {
          const loadedOffers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setOffers(loadedOffers);
        });
      } else {
        setOffers([]);
        setUserSettings(null);
        setGlobalSettings(null);
        if (unsubscribeGlobal) unsubscribeGlobal();
        if (unsubscribeSettings) unsubscribeSettings();
        if (unsubscribeOffers) unsubscribeOffers();
      }
      setLoading(false);
    });

    return () => {
      if (unsubscribeGlobal) unsubscribeGlobal();
      if (unsubscribeSettings) unsubscribeSettings();
      if (unsubscribeOffers) unsubscribeOffers();
      unsubscribeAuth();
    };
  }, []);

  const signIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        // User closed the popup, no need to show an error message
        console.log('Login popup closed by user');
      } else {
        console.error('Login failed:', error);
        alert('Přihlášení se nezdařilo. Zkuste to prosím znovu.');
      }
    }
  };

  const logOut = async () => {
    await signOut(auth);
  };

  const saveOffer = async (offer: any) => {
    if (!user) return;
    const offerRef = doc(db, 'offers', offer.id);
    const offerSnap = await getDoc(offerRef);
    
    // Base data to save
    const offerData: any = {
      ...offer,
      userId: user.uid,
      updatedAt: serverTimestamp(),
      status: offer.status || 'DRAFT'
    };

    if (!offerSnap.exists()) {
      // For new documents, we need createdAt
      offerData.createdAt = serverTimestamp();
      await setDoc(offerRef, offerData);
    } else {
      // For updates, we use updateDoc to only change specified fields
      // and let the rules handle updatedAt = request.time
      // We explicitly exclude createdAt to avoid validation issues if not needed
      const { createdAt, ...updateData } = offerData;
      await updateDoc(offerRef, updateData);
    }
  };

  const deleteOffer = async (id: string) => {
    if (!user) {
      alert("Chyba: Nejste přihlášen k cloudu.");
      return;
    }
    try {
      await deleteDoc(doc(db, 'offers', id));
      alert("Trvalé smazání proběhlo v pořádku.");
    } catch (error: any) {
      console.error("Delete failed:", error);
      alert("Definitivní smazání selhalo: " + error.message);
      throw error;
    }
  };

  const softDeleteOffer = async (id: string) => {
    if (!user) {
      alert("Upozornění: Nejste přihlášen, operace neproběhne v cloudu.");
      return;
    }
    try {
      const offerRef = doc(db, 'offers', id);
      const offerSnap = await getDoc(offerRef);
      
      if (!offerSnap.exists()) {
        // Just purely local, resolve it as ok
        return;
      }

      await updateDoc(offerRef, { 
        status: 'DELETED',
        updatedAt: serverTimestamp(),
        userId: user.uid
      });
      alert("Nabídka přesunuta do koše úspěšně.");
    } catch (error: any) {
      console.error("Error in softDeleteOffer:", error);
      alert("Nepodařilo se smazat nabídku. Přesný důvod: " + error.message);
      throw error;
    }
  };

  const saveSettings = async (settings: any) => {
    if (!user) return;
    
    // Save to personal settings
    const settingsRef = doc(db, 'users', user.uid, 'settings', 'current');
    await setDoc(settingsRef, settings, { merge: true });

    // If admin, also save to global config
    if (isAdmin(user)) {
      const globalRef = doc(db, 'settings', 'config');
      await setDoc(globalRef, settings, { merge: true });
    }
  };

  return (
    <FirebaseContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      logOut, 
      saveOffer, 
      deleteOffer, 
      softDeleteOffer,
      offers, 
      userSettings,
      globalSettings,
      saveSettings,
      isAdmin
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
