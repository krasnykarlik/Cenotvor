import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Načtení klíčů z vašeho .env souboru
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Chybí Supabase klíče v souboru .env!');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export function useSupabase() {
  // Prozatím vytvoříme falešného uživatele, aby aplikace nepadala.
  // Databáze je teď díky našemu RLS pravidlu dočasně odemčená pro zápis.
  const [user, setUser] = useState<any>({
    displayName: 'Lokální Uživatel',
    email: 'admin@local.cz',
    photoURL: null
  });
  
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<any[]>([]);
  const [userSettings, setUserSettings] = useState<any>(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  // Funkce pro načtení všech nabídek z databáze
  const fetchOffers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('offers')
      .select('*');
      
    if (error) {
      console.error('Chyba při načítání ze Supabase:', error);
    } else if (data) {
      // Data máme uložená ve sloupci full_data jako JSON, 
      // Supabase nám je automaticky převede na objekty
      const parsedOffers = data.map(row => row.full_data);
      setOffers(parsedOffers);
    }
    setLoading(false);
  };

  // Funkce pro uložení/aktualizaci nabídky
  const saveOffer = async (offer: any) => {
    // Okamžitá aktualizace na obrazovce (aby aplikace působila rychle)
    setOffers(prev => {
      const exists = prev.find(o => o.id === offer.id);
      if (exists) return prev.map(o => o.id === offer.id ? offer : o);
      return [...prev, offer];
    });

    // Odeslání do databáze na pozadí
    const { error } = await supabase
      .from('offers')
      .upsert({
        id: offer.id,
        number: offer.number,
        title: offer.title || '',
        client_name: offer.client?.name || '',
        status: offer.status || 'DRAFT',
        full_data: offer,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Chyba při ukládání:', error);
      fetchOffers(); // V případě chyby vrátíme data do původního stavu
      throw error;
    }
  };

  // Přesun do koše (status DELETED)
  const softDeleteOffer = async (id: string) => {
    const offerToUpdate = offers.find(o => o.id === id);
    if (offerToUpdate) {
        const updatedOffer = { ...offerToUpdate, status: 'DELETED' };
        await saveOffer(updatedOffer);
    }
  };

  // Úplné smazání z databáze
  const deleteOffer = async (id: string) => {
    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    setOffers(prev => prev.filter(o => o.id !== id));
  };

  // Nastavení (zatím ukládáme lokálně)
  const saveSettings = async (settings: any) => {
    setUserSettings(settings);
    localStorage.setItem('local_settings', JSON.stringify(settings));
  };

  const signIn = async () => {
    alert("Zatím jedeme bez přihlašování, databáze je odemčená!");
  };

  const logOut = async () => {
    alert("Odhlášení v testovacím režimu nic nedělá.");
  };

  return {
    user,
    loading,
    signIn,
    logOut,
    offers,
    userSettings,
    globalSettings: null,
    saveOffer,
    deleteOffer,
    softDeleteOffer,
    saveSettings,
    isAdmin: true
  };
}