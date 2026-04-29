import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export function useSupabase() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<any[]>([]);
  const [userSettings, setUserSettings] = useState<any>(null);
  const [globalSettings, setGlobalSettings] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchOffers();
    } else {
      setOffers([]);
    }
  }, [user]);

  const fetchOffers = async () => {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Chyba při stahování nabídek:", error);
    }
    
    if (!error && data) {
      setOffers(data.map(row => row.full_data));
    }
  };

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/Cenotvor/' }
    });
  };

  const logOut = async () => {
    await supabase.auth.signOut();
  };

  const saveOffer = async (offer: any) => {
    if (!user) return;
    
    setOffers(prev => {
      const exists = prev.find(o => o.id === offer.id);
      if (exists) return prev.map(o => o.id === offer.id ? offer : o);
      return [offer, ...prev];
    });

    const { error } = await supabase.from('offers').upsert({
      id: offer.id,
      full_data: offer,
      user_id: user.id
    });

    if (error) {
      console.error("Kritická chyba DB:", error);
      alert("POZOR: Nabídka se neuložila do databáze! Chyba: " + error.message);
    } else {
      fetchOffers();
    }
  };

  const deleteOffer = async (id: string) => {
    if (!user) return;
    setOffers(prev => prev.filter(o => o.id !== id));
    await supabase.from('offers').delete().eq('id', id);
  };

  const softDeleteOffer = async (id: string) => {
    if (!user) return;
    const offerToUpdate = offers.find(o => o.id === id);
    if (offerToUpdate) {
      offerToUpdate.status = 'DELETED';
      await saveOffer(offerToUpdate);
    }
  };

  const saveSettings = async (settings: any) => {
    setUserSettings(settings);
  };

  return { 
    user, 
    loading, 
    signIn, 
    logOut, 
    offers, 
    saveOffer, 
    deleteOffer, 
    softDeleteOffer, 
    userSettings, 
    globalSettings, 
    saveSettings, 
    isAdmin: !!user 
  };
}