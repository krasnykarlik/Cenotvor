/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { 
  FileText, 
  History, 
  Users, 
  Database, 
  Plus, 
  Trash2, 
  Download, 
  FileDown,
  Save, 
  X, 
  Sparkles, 
  Calendar, 
  CreditCard,
  User,
  UserPlus,
  RefreshCcw,
  Menu,
  Search,
  Building,
  Settings,
  StickyNote,
  Tag,
  Printer,
  ChevronLeft,
  ArrowUp,
  ArrowDown,
  Mail,
  CheckCircle2,
  Copy,
  Lock,
  Unlock,
  LayoutDashboard,
  Clock,
  LayoutDashboard,
  Clock,
  FileSignature
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { useFirebase } from './hooks/useFirebase';

// Types
type ItemCategory = 
  | 'MATERIAL' 
  | 'OTHER' 
  | 'ZINEK_ZAROVY' 
  | 'ZINEK_GALVANICKY' 
  | 'TAHOKOV' 
  | 'LAKOVANI_MOKRE' 
  | 'LAKOVANI_PRASKOVE' 
  | 'MONTAZ' 
  | 'PRACE' 
  | 'DOPRAVA';

const CATEGORY_NAMES: Record<ItemCategory, string> = {
  MATERIAL: 'Materiál',
  ZINEK_ZAROVY: 'Zinek žárový',
  ZINEK_GALVANICKY: 'Zinek galvanický',
  TAHOKOV: 'Tahokov',
  MONTAZ: 'Montáž',
  DOPRAVA: 'Doprava',
  PRACE: 'Práce',
  LAKOVANI_MOKRE: 'Lakování mokré',
  LAKOVANI_PRASKOVE: 'Lakování práškové',
  OTHER: 'Ostatní'
};

interface PriceListItem {
  title: string;
  unit: string;
  price: number;
  weight: number;
  rawValues?: string[]; // Store all columns for preview
}

interface OfferItem {
  id: string;
  category: ItemCategory;
  title: string;
  description: string;
  extraInfo?: string;
  // Common fields
  quantity: number;
  unit: string;
  pricePerUnit: number;
  // Specific fields
  weightPerUnit?: number; // for material
  persons?: number;       // for montaz
  hours?: number;         // for montaz
  km?: number;            // for doprava
  coefficient?: number;   // for prace
}

// Helper for safe UUID generation
const generateId = () => {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
};

interface Client {
  name: string;
  idNumber: string; // IČO
  dic?: string;     // DIČ
  address: string;
}

interface Offer {
  id: string;
  number: string;
  client: Client;
  items: OfferItem[];
  dateIssued: string;
  validUntil: string;
  currency: string;
  taxRate: number;
  status: 'DRAFT' | 'COMPLETED' | 'DELETED';
  preparedBy: string;
  receivedBy?: string;
  notes?: string;
  title?: string;
  groupTaxRates?: {
    material: number;
    surface: number;
    assembly: number;
    transport: number;
  };
}

// Helper to calculate total for any offer (used in history lists)
const calculateTotal = (offerItems: any[]) => {
  if (!offerItems || offerItems.length === 0) return 0;
  
  const materials = offerItems.filter(i => i.category === 'MATERIAL');
  const matWeight = materials.reduce((sum, i) => sum + (Number(i.quantity || 0) * (Number(i.weightPerUnit) || 0)), 0);
  const matPrice = materials.reduce((sum, i) => sum + (Number(i.quantity || 0) * Number(i.pricePerUnit || 0)), 0);

  return offerItems.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.pricePerUnit) || 0;
    
    switch (item.category) {
      case 'MATERIAL':
      case 'OTHER':
      case 'TAHOKOV':
      case 'LAKOVANI_MOKRE':
      case 'LAKOVANI_PRASKOVE':
      case 'ZINEK_GALVANICKY':
        return sum + (qty * price);
      case 'ZINEK_ZAROVY':
        return sum + (matWeight * price);
      case 'MONTAZ':
        return sum + ((Number(item.persons) || 1) * (Number(item.hours) || 0) * price);
      case 'DOPRAVA':
        return sum + ((Number(item.km) || 0) * price);
      case 'PRACE':
        return sum + ((matPrice * (Number(item.coefficient) || 1)) - matPrice);
      default:
        return sum + (qty * price);
    }
  }, 0);
};

// Initial Data - Dirty placeholder for testing
const INITIAL_OFFER: Offer = {
  id: generateId(),
  number: `#${new Date().getFullYear()}-001`,
  client: {
    name: 'Solar Systems s.r.o.',
    idNumber: '12345678',
    dic: 'CZ12345678',
    address: 'Průmyslová 12, Praha 10',
  },
  items: [
    {
      id: generateId(),
      category: 'MATERIAL',
      title: 'Ocelový profil L 50x50x5',
      description: 'Konstrukční ocel S235',
      quantity: 10,
      unit: 'm',
      weightPerUnit: 3.77,
      pricePerUnit: 45,
    },
  ],
  dateIssued: new Date().toISOString().split('T')[0],
  validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  currency: 'CZK',
  taxRate: 21,
  status: 'DRAFT',
  preparedBy: 'Antonín Rohlík ml.',
  receivedBy: '',
  notes: '',
  title: 'Instalace FVE - Rodinný dům',
  groupTaxRates: {
    material: 12,
    surface: 12,
    assembly: 21,
    transport: 21,
  }
};

// Clean Template for new offers
const EMPTY_OFFER: Offer = {
  id: '',
  number: '',
  client: {
    name: '',
    idNumber: '',
    dic: '',
    address: '',
  },
  items: [],
  dateIssued: new Date().toISOString().split('T')[0],
  validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  currency: 'CZK',
  taxRate: 21,
  status: 'DRAFT',
  preparedBy: '',
  receivedBy: '',
  notes: '',
  title: '',
  groupTaxRates: {
    material: 21,
    surface: 21,
    assembly: 21,
    transport: 21,
  }
};

// Helper for spreadsheet parsing (handles CSV and TSV)
const parseSpreadsheetData = (text: string) => {
  const allLines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  if (allLines.length === 0) return { items: [], headers: [] };

  // Detect delimiter by counting occurrences in headers
  // We check for Tab, Semicolon, and Comma
  const headerLine = allLines[0];
  const tabCount = (headerLine.match(/\t/g) || []).length;
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;

  let delimiter = ',';
  if (tabCount > 0 && tabCount >= semicolonCount && tabCount >= commaCount) delimiter = '\t';
  else if (semicolonCount > 0 && semicolonCount >= commaCount) delimiter = ';';

  console.log(`Detected delimiter: ${delimiter === '\t' ? 'TAB' : delimiter} (Tabs: ${tabCount}, Semicolons: ${semicolonCount}, Commas: ${commaCount})`);

  const rawHeaders = headerLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
  const headers = rawHeaders.map(h => h.toLowerCase());
  
  // Try to find indices based on keywords
  const titleIdx = headers.findIndex(h => h.includes('název') || h.includes('item') || h.includes('name') || h.includes('položka') || h.includes('výrobek'));
  const unitIdx = headers.findIndex(h => h.includes('mj') || h.includes('unit') || h.includes('jednotka'));
  const priceIdx = headers.findIndex(h => h.includes('cena') || h.includes('price') || h.includes('maloobchod') || h.includes('bez dph'));
  const weightIdx = headers.findIndex(h => h.includes('váha') || h.includes('weight') || h.includes('hmotnost') || h.includes('kg'));

  console.log('Header indices:', { titleIdx, unitIdx, priceIdx, weightIdx });

  if (titleIdx === -1) {
    // If we can't find title by keyword, but we have multiple columns, assume first column is title
    if (rawHeaders.length > 1) {
      console.warn('Could not find title header by keyword, defaulting to first column');
    } else {
      return { items: [], headers: rawHeaders };
    }
  }

  const items: PriceListItem[] = [];
  const startIdx = titleIdx === -1 && rawHeaders.length > 1 ? 0 : titleIdx;
  
  for (let i = 1; i < allLines.length; i++) {
    const cols = allLines[i].split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
    
    // Pick the best index for title
    const tIdx = titleIdx !== -1 ? titleIdx : 0;
    
    if (!cols[tIdx]) continue;
    
    // Parse price and weight, handling European decimal comma
    const rawPrice = priceIdx !== -1 ? cols[priceIdx] : '';
    const rawWeight = weightIdx !== -1 ? cols[weightIdx] : '';
    
    const price = parseFloat(rawPrice.replace(/\s/g, '').replace(',', '.') || '0') || 0;
    const weight = parseFloat(rawWeight.replace(/\s/g, '').replace(',', '.') || '0') || 0;
    
    items.push({
      title: cols[tIdx],
      unit: unitIdx !== -1 ? cols[unitIdx] : 'ks',
      price: price,
      weight: weight,
      rawValues: cols
    });
  }
  
  console.log(`Parsed ${items.length} items from spreadsheet`);
  return { items, headers: rawHeaders };
};

export default function App() {
  const { 
    user, 
    loading: firebaseLoading, 
    signIn, 
    logOut, 
    offers, 
    userSettings, 
    globalSettings,
    saveOffer, 
    deleteOffer, 
    softDeleteOffer, 
    saveSettings,
    isAdmin 
  } = useFirebase();
  const [offer, setOffer] = useState<Offer>(() => {
    const saved = localStorage.getItem('cenotvurce_current_offer');
    if (saved) {
      const parsed = JSON.parse(saved) as Offer;
      // Migration: Ensure all items have a category
      parsed.items = parsed.items.map(item => ({
        ...item,
        category: item.category || 'OTHER'
      }));
      return parsed;
    }
    return INITIAL_OFFER;
  });
  
  const [priceList, setPriceList] = useState<PriceListItem[]>(() => {
    const saved = localStorage.getItem('cenotvurce_pricelist');
    return saved ? JSON.parse(saved) : [];
  });

  const [priceHeaders, setPriceHeaders] = useState<string[]>(() => {
    const saved = localStorage.getItem('cenotvurce_priceheaders');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [sheetUrl, setSheetUrl] = useState(() => {
    return localStorage.getItem('cenotvurce_sheet_url') || '';
  });

  const [lastSync, setLastSync] = useState<number>(() => {
    return Number(localStorage.getItem('cenotvurce_last_sync')) || 0;
  });

  const [preparers, setPreparers] = useState<string[]>(() => {
    const saved = localStorage.getItem('cenotvurce_preparers');
    return saved ? JSON.parse(saved) : ['Antonín Rohlík ml.'];
  });

  const [defaultValidityDays, setDefaultValidityDays] = useState<number>(() => {
    const saved = localStorage.getItem('cenotvurce_validity_days');
    return saved ? Number(saved) : 14;
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [showPriceList, setShowPriceList] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showValiditySettings, setShowValiditySettings] = useState(false);
  const [newPreparerName, setNewPreparerName] = useState('');
  const [showNewPreparerInput, setShowNewPreparerInput] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: string, title: string } | null>(null);
  const [showSoftDeleteConfirm, setShowSoftDeleteConfirm] = useState<{ id: string, title: string } | null>(null);
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);
  const [activeAutocompleteId, setActiveAutocompleteId] = useState<string | null>(null);
  const [activeMainView, setActiveMainView] = useState<'DASHBOARD' | 'EDITOR' | 'DRAFTS' | 'COMPLETED' | 'DELETED'>('DASHBOARD');
  const [pendingNavigation, setPendingNavigation] = useState<'DASHBOARD' | 'EDITOR' | 'DRAFTS' | 'COMPLETED' | 'DELETED' | 'NEW_OFFER' | null>(null);
  const [isEditorLocked, setIsEditorLocked] = useState(false);
  const [showNewOfferConfirm, setShowNewOfferConfirm] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  // ARES state
  const [aresQuery, setAresQuery] = useState('');
  const [aresResults, setAresResults] = useState<any[]>([]);
  const [isAresSearching, setIsAresSearching] = useState(false);
  const [customerEntryMode, setCustomerEntryMode] = useState<'ARES' | 'MANUAL'>('ARES');
  
  // Sort State
  const [sortConfig, setSortConfig] = useState<{
    key: 'date' | 'client' | 'title' | 'number' | 'amount';
    direction: 'asc' | 'desc';
  }>({ key: 'date', direction: 'desc' });

  // Sheet Metal Calculator State
  const [calcLength, setCalcLength] = useState<number>(2.5);
  const [calcWidth, setCalcWidth] = useState<number>(1.25);
  const [calcNeeded, setCalcNeeded] = useState<number>(0);

  const calcArea = calcLength * calcWidth;
  const calcRatio = calcArea > 0 ? Math.ceil((calcNeeded / calcArea) * 100) / 100 : 0;

  // Persistence
  useEffect(() => {
    localStorage.setItem('cenotvurce_current_offer', JSON.stringify(offer));
  }, [offer]);

  useEffect(() => {
    localStorage.setItem('cenotvurce_pricelist', JSON.stringify(priceList));
  }, [priceList]);

  useEffect(() => {
    localStorage.setItem('cenotvurce_priceheaders', JSON.stringify(priceHeaders));
  }, [priceHeaders]);

  useEffect(() => {
    localStorage.setItem('cenotvurce_sheet_url', sheetUrl);
  }, [sheetUrl]);

  useEffect(() => {
    localStorage.setItem('cenotvurce_last_sync', lastSync.toString());
  }, [lastSync]);

  useEffect(() => {
    localStorage.setItem('cenotvurce_preparers', JSON.stringify(preparers));
  }, [preparers]);

  useEffect(() => {
    localStorage.setItem('cenotvurce_validity_days', defaultValidityDays.toString());
  }, [defaultValidityDays]);

  // Automatic sync check
  useEffect(() => {
    if (!sheetUrl || isSyncing) return;
    
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    if (now - lastSync > ONE_WEEK) {
      console.log("Starting automated weekly sync...");
      syncPriceList();
    }
  }, [sheetUrl]); // Check on mount if URL exists

  const sortedOffers = useMemo(() => {
    let filtered = activeMainView === 'DRAFTS' 
      ? offers.filter(o => o.status === 'DRAFT' || !o.status) 
      : activeMainView === 'COMPLETED'
      ? offers.filter(o => o.status === 'COMPLETED')
      : offers.filter(o => o.status === 'DELETED');

    const sorted = [...filtered].sort((a, b) => {
      const { key, direction } = sortConfig;
      let valA: any = '';
      let valB: any = '';

      switch (key) {
        case 'date':
          valA = a.createdAt?.seconds || a.updatedAt?.seconds || 0;
          valB = b.createdAt?.seconds || b.updatedAt?.seconds || 0;
          break;
        case 'client':
          valA = (a.client?.name || '').toLowerCase();
          valB = (b.client?.name || '').toLowerCase();
          break;
        case 'title':
          valA = (a.title || '').toLowerCase();
          valB = (b.title || '').toLowerCase();
          break;
        case 'number':
          valA = (a.number || '').toLowerCase();
          valB = (b.number || '').toLowerCase();
          break;
        case 'amount':
          valA = calculateTotal(a.items);
          valB = calculateTotal(b.items);
          break;
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [offers, activeMainView, sortConfig]);

  const toggleSort = (key: 'date' | 'client' | 'title' | 'number' | 'amount') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const SortIndicator = ({ column }: { column: 'date' | 'client' | 'title' | 'number' | 'amount' }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const syncPriceList = async () => {
    if (!sheetUrl) return;
    setIsSyncing(true);
    try {
      const response = await fetch(sheetUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      const { items, headers } = parseSpreadsheetData(text);
      if (items.length > 0) {
        setPriceList(items);
        setPriceHeaders(headers);
        setLastSync(Date.now());
        alert(`Synchronizace úspěšná. Bylo načteno ${items.length} položek.`);
      } else {
        alert("V tabulce nebyly nalezeny žádné platné položky. Zkontrolujte prosím hlavičky sloupců (Název, MJ, Cena, Váha).");
      }
    } catch (e) {
      console.error("Sync failed", e);
      alert("Synchronizace selhala. Zkontrolujte prosím URL adresu a zda je tabulka publikována (Soubor -> Sdílet -> Publikovat na web -> Formát: .csv).");
    } finally {
      setIsSyncing(false);
    }
  };

  const searchAres = async (q: string) => {
    if (!q || q.length < 3) {
      setAresResults([]);
      return;
    }
    
    setIsAresSearching(true);
    try {
      const response = await fetch('/api/ares/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      const data = await response.json();
      setAresResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("ARES Search Error:", error);
      setAresResults([]);
    } finally {
      setIsAresSearching(false);
    }
  };

  const selectAresResult = (result: any) => {
    updateClient({
      name: result.obchodniJmeno,
      idNumber: result.ico,
      dic: result.dic,
      address: result.address.full
    });
    setAresResults([]);
    setAresQuery('');
  };

  const addPreparer = () => {
    if (newPreparerName.trim()) {
      setPreparers([...preparers, newPreparerName.trim()]);
      updateOffer({ preparedBy: newPreparerName.trim() });
      setNewPreparerName('');
      setShowNewPreparerInput(false);
    }
  };

  const updateOfferValidity = (days: number) => {
    setDefaultValidityDays(days);
    const date = new Date(offer.dateIssued);
    if (!isNaN(date.getTime())) {
      const validUntil = new Date(date.getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      updateOffer({ validUntil });
    }
  };

  // Global Context derived from labels
  const totalMaterialWeight = useMemo(() => {
    return offer.items
      .filter(i => i.category === 'MATERIAL')
      .reduce((sum, i) => sum + (i.quantity * (i.weightPerUnit || 0)), 0);
  }, [offer.items]);

  const totalMaterialPrice = useMemo(() => {
    return offer.items
      .filter(i => i.category === 'MATERIAL')
      .reduce((sum, i) => sum + (i.quantity * i.pricePerUnit), 0);
  }, [offer.items]);

  // Item Specific Calculations
  const getItemTotal = (item: OfferItem): number => {
    switch (item.category) {
      case 'MATERIAL':
      case 'OTHER':
      case 'TAHOKOV':
      case 'LAKOVANI_MOKRE':
      case 'LAKOVANI_PRASKOVE':
      case 'ZINEK_GALVANICKY':
        return item.quantity * item.pricePerUnit;
      
      case 'ZINEK_ZAROVY':
        // kilo se berou dle množství materiálu
        return totalMaterialWeight * item.pricePerUnit;
      
      case 'MONTAZ':
        // osoby * hodiny * sazba
        return (item.persons || 1) * (item.hours || 0) * item.pricePerUnit;
      
      case 'DOPRAVA':
        // km * sazba
        return (item.km || 0) * item.pricePerUnit;
      
      case 'PRACE':
        // (cena materiálu * koeficient) - cena materiálu
        return (totalMaterialPrice * (item.coefficient || 1)) - totalMaterialPrice;
      
      default:
        return item.quantity * item.pricePerUnit;
    }
  };

  const subtotal = useMemo(() => {
    return offer.items.reduce((sum, item) => sum + getItemTotal(item), 0);
  }, [offer.items, totalMaterialWeight, totalMaterialPrice]);

  const formatPrice = (price: number) => {
    return price.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Kč';
  };

  useEffect(() => {
    if (!firebaseLoading && user && offers.length > 0) {
      const isMigrated = localStorage.getItem('offers_sequential_migrated_v1');
      if (!isMigrated) {
        // ... (existing logic)
        localStorage.setItem('offers_sequential_migrated_v1', 'true');
      }

      // One-off fix for Karlik
      const isRenumberedDrafts = localStorage.getItem('drafts_renumbered_2026_002_003');
      if (!isRenumberedDrafts) {
        const drafts = offers.filter(o => o.status === 'DRAFT' || !o.status);
        const sortedDrafts = [...drafts].sort((a, b) => {
          const ta = a.createdAt?.seconds || 0;
          const tb = b.createdAt?.seconds || 0;
          return ta - tb;
        });

        const updates: any[] = [];
        if (sortedDrafts[0] && sortedDrafts[0].number !== '#2026-002') {
          updates.push({ ...sortedDrafts[0], number: '#2026-002' });
        }
        if (sortedDrafts[1] && sortedDrafts[1].number !== '#2026-003') {
          updates.push({ ...sortedDrafts[1], number: '#2026-003' });
        }

        if (updates.length > 0) {
          Promise.all(updates.map(u => saveOffer(u))).then(() => {
            localStorage.setItem('drafts_renumbered_2026_002_003', 'true');
          });
        } else {
          localStorage.setItem('drafts_renumbered_2026_002_003', 'true');
        }
      }
    }
  }, [firebaseLoading, user, offers, saveOffer]);

  const tax = useMemo(() => {
    return (subtotal * offer.taxRate) / 100;
  }, [subtotal, offer.taxRate]);

  const total = subtotal + tax;

  // Handlers
  const addItem = (category: ItemCategory = 'OTHER') => {
    const newItem: OfferItem = {
      id: generateId(),
      category,
      title: '',
      description: '',
      quantity: 1,
      unit: 'ks',
      pricePerUnit: 0,
    };

    // Apply defaults based on category
    if (category === 'ZINEK_ZAROVY') {
      newItem.title = 'Zinek žárový';
      newItem.unit = 'kg';
      newItem.pricePerUnit = 28;
    } else if (category === 'MONTAZ') {
      newItem.title = 'Montáž';
      newItem.unit = 'h';
      newItem.pricePerUnit = 750;
      newItem.persons = 1;
      newItem.hours = 0;
    } else if (category === 'DOPRAVA') {
      newItem.title = 'Doprava';
      newItem.unit = 'km';
      newItem.pricePerUnit = 25;
      newItem.km = 0;
    } else if (category === 'PRACE') {
      newItem.title = 'Práce';
      newItem.coefficient = 2.6;
    } else if (category === 'MATERIAL') {
      newItem.title = 'Materiál';
      newItem.unit = 'm';
      newItem.weightPerUnit = 0;
    } else if (category === 'TAHOKOV') {
      newItem.title = 'Tahokov';
      newItem.unit = 'kg';
    } else if (category === 'LAKOVANI_MOKRE') {
      newItem.title = 'Lakování mokré';
    } else if (category === 'LAKOVANI_PRASKOVE') {
      newItem.title = 'Lakování práškové';
    } else if (category === 'ZINEK_GALVANICKY') {
      newItem.title = 'Zinek galvanický';
    }

    setOffer(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const removeItem = (id: string) => {
    setOffer(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  };

  const updateItem = (id: string, updates: Partial<OfferItem>) => {
    setOffer(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, ...updates } : item)
    }));
  };

  const updateOffer = (updates: Partial<Offer>) => {
    setOffer(prev => ({ ...prev, ...updates }));
  };

  const updateClient = (updates: Partial<Client>) => {
    setOffer(prev => ({ ...prev, client: { ...prev.client, ...updates } }));
  };

  const generateNextOfferNumber = () => {
    const currentYear = new Date().getFullYear();
    const prefix = `#${currentYear}-`;
    
    // Ignore DELETED offers for numbering purposes
    const currentYearOffers = offers.filter(o => o.number?.startsWith(prefix) && o.status !== 'DELETED');
    
    if (currentYearOffers.length === 0) {
      return `${prefix}001`;
    }
    
    const numbers = currentYearOffers.map(o => {
      const parts = o.number.split('-');
      if (parts.length > 1) {
        const numPart = parts[1];
        const num = parseInt(numPart, 10);
        // Ignore likely random collisions from old generation logic (numbers > 999)
        return (isNaN(num) || num > 999) ? 0 : num;
      }
      return 0;
    });
    
    const maxNumber = Math.max(...numbers);
    const nextNumber = maxNumber + 1;
    
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  };

  const doResetOffer = () => {
    setOffer({
      ...EMPTY_OFFER,
      id: generateId(),
      number: generateNextOfferNumber(),
      client: { ...EMPTY_OFFER.client },
      items: [],
      groupTaxRates: { ...EMPTY_OFFER.groupTaxRates }
    });
    setIsEditorLocked(false);
    setActiveMainView('EDITOR');
    setShowExportPreview(false);
    setShowNewOfferConfirm(false);
  };

  const executeNavigation = (targetView: 'DASHBOARD' | 'EDITOR' | 'DRAFTS' | 'COMPLETED' | 'DELETED' | 'NEW_OFFER') => {
    if (targetView === 'NEW_OFFER') {
      doResetOffer();
    } else {
      setActiveMainView(targetView);
      setShowExportPreview(false);
    }
    setIsSidebarOpen(false);
    setShowNewOfferConfirm(false);
    setPendingNavigation(null);
  };

  const requestNavigation = (targetView: 'DASHBOARD' | 'EDITOR' | 'DRAFTS' | 'COMPLETED' | 'DELETED' | 'NEW_OFFER') => {
    // Intercept if in EDITOR, not locked, and clicking anywhere else
    if (activeMainView === 'EDITOR' && !isEditorLocked && targetView !== 'EDITOR') {
      setPendingNavigation(targetView);
      setShowNewOfferConfirm(true);
    } else {
      executeNavigation(targetView);
    }
  };

  // Keep compatibility variable for exact clicks 
  const handleNewOfferClick = () => {
    requestNavigation('NEW_OFFER');
  };

  const resetOffer = (skipConfirm: boolean = false) => {
    if (skipConfirm) {
      doResetOffer();
    } else {
      requestNavigation('NEW_OFFER');
    }
  };

  // Handle Save to Cloud
  const handleCloudSave = async () => {
    if (!user) {
      alert("Pro ukládání do cloudu se musíte nejdříve přihlásit.");
      signIn();
      return;
    }
    try {
      await saveOffer(offer);
      alert("Nabídka byla úspěšně uložena do cloudu.");
    } catch (e) {
      console.error("Cloud save failed", e);
      alert("Chyba při ukládání do cloudu.");
    }
  };

  // Sync with Firestore Settings
  useEffect(() => {
    // Apply user settings first
    if (userSettings) {
      if (userSettings.preparers) setPreparers(userSettings.preparers);
      if (userSettings.defaultValidityDays) setDefaultValidityDays(userSettings.defaultValidityDays);
      if (userSettings.sheetUrl) setSheetUrl(userSettings.sheetUrl);
      if (userSettings.lastSync) setLastSync(userSettings.lastSync);
    }
    
    // Global settings (broadcasted by admin) take priority for shared resources
    if (globalSettings) {
      if (globalSettings.sheetUrl) setSheetUrl(globalSettings.sheetUrl);
      // We can also sync preparers globally if admin manages them
      if (globalSettings.preparers && isAdmin(user)) {
         // for admin we use their own list, but for others we could inherit
      }
    }
  }, [userSettings, globalSettings, user]);

  // Sync settings to cloud when changed
  useEffect(() => {
    if (user) {
      saveSettings({
        preparers,
        defaultValidityDays,
        sheetUrl,
        lastSync
      });
    }
  }, [preparers, defaultValidityDays, sheetUrl, lastSync, user]);

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans text-slate-800 antialiased bg-slate-50 relative">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 
        transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white">
              <FileText className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg text-white tracking-tight text-nowrap">Cenotvor</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 hover:bg-slate-800 rounded-md">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 text-sm">
          <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Hlavní</div>
          <button 
            onClick={() => requestNavigation('DASHBOARD')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${activeMainView === 'DASHBOARD' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800'}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Přehled
          </button>
          <button 
            onClick={() => requestNavigation('NEW_OFFER')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${activeMainView === 'EDITOR' && !showExportPreview ? 'bg-slate-800 text-white' : 'hover:bg-slate-800'}`}
          >
            <Plus className="w-4 h-4" />
            Nová nabídka
          </button>
          
          <div className="pt-4 px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            Historie nabídek
          </div>
          <button 
            onClick={() => requestNavigation('DRAFTS')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${activeMainView === 'DRAFTS' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800'}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${activeMainView === 'DRAFTS' ? 'bg-amber-400' : 'bg-slate-600'}`} />
            Rozpracované
          </button>
          <button 
            onClick={() => requestNavigation('COMPLETED')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${activeMainView === 'COMPLETED' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800'}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${activeMainView === 'COMPLETED' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            Dokončené
          </button>
          <button 
            onClick={() => requestNavigation('DELETED')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${activeMainView === 'DELETED' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800'}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${activeMainView === 'DELETED' ? 'bg-red-400' : 'bg-slate-600'}`} />
            Smazané
          </button>
          
          <div className="pt-4 px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nástroje</div>
          <button 
            onClick={() => setShowCalculator(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors text-left"
          >
            <Database className="w-4 h-4" />
            Kalkulátor plechů
          </button>
          <button 
            onClick={() => setShowPriceList(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors text-left"
          >
            <Database className="w-4 h-4" />
            Synchronizace ceníku
          </button>
        </nav>
        
        <div className="p-4 border-t border-slate-800 mt-auto bg-slate-900/50">
          {user ? (
            <>
              <div className="flex items-center gap-3 px-3 mb-4">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-white leading-none truncate flex items-center gap-1.5">
                    {user.displayName || 'Uživatel'}
                    {user.email === 'krasnykarlik@gmail.com' && (
                      <span className="bg-emerald-500/20 text-emerald-400 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold">SU</span>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 truncate">{user.email}</span>
                </div>
              </div>
              <button 
                onClick={logOut}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors text-xs font-semibold"
              >
                Odhlásit se
              </button>
            </>
          ) : (
            <button 
              onClick={signIn}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors text-xs font-bold"
            >
              <User className="w-4 h-4" />
              Přihlásit se
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {showExportPreview ? (
          <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden">
            {/* Export Header */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0 relative z-10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowExportPreview(false)}
                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="hidden sm:inline font-medium">Zpět k editoru</span>
                </button>
                <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block"></div>
                <h2 className="text-lg font-bold text-slate-900 hidden sm:block">Náhled cenové nabídky</h2>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  disabled={isGeneratingPDF}
                  onClick={async () => {
                    try {
                      setIsGeneratingPDF(true);
                      
                      // CRITICAL: Scroll to top and wait for UI to settle
                      window.scrollTo(0, 0);
                      await new Promise(resolve => setTimeout(resolve, 100));

                      // Update status to COMPLETED locally
                      const completedOffer = { ...offer, status: 'COMPLETED' as const };
                      setOffer(completedOffer);
                      
                      // Save to cloud if authenticated
                      if (user) {
                        try {
                          await saveOffer(completedOffer);
                        } catch (err) {
                           console.error("Failed to mark offer as COMPLETED:", err);
                        }
                      }
                      
                      // Fallback to natively bulletproof browser printing
                      // 1) Isolate the exact element we want without touching its original DOM position
                      const originalElement = pdfRef.current;
                      if (!originalElement) return;

                      // Create isolated print container
                      const printContainer = document.createElement('div');
                      printContainer.style.width = '210mm';
                      printContainer.style.background = 'white';
                      // Match the print styles we had previously applied with Tailwind
                      printContainer.style.margin = '0 auto';
                      
                      const clone = originalElement.cloneNode(true) as HTMLElement;
                      // Strip shadow for printing
                      clone.className = clone.className.replace(/shadow-\[.*?\]/g, '').replace('shadow-md', '').replace('shadow-lg', '');
                      clone.style.boxShadow = 'none';
                      // Strip explicit max width so it fills container
                      clone.className = clone.className.replace('max-w-[210mm]', 'w-full');
                      
                      printContainer.appendChild(clone);
                      document.body.appendChild(printContainer);

                      try {
                        // Let browser paint
                        setTimeout(() => {
                           window.print();
                           // Cleanup after print dialog closes
                           setTimeout(() => {
                             if (document.body.contains(printContainer)) {
                               document.body.removeChild(printContainer);
                             }
                           }, 100);
                        }, 250);
                      } catch (err) {
                        console.error("Print generation failed:", err);
                        alert('Tisk selhal. Zkuste to prosím znovu.');
                        if (document.body.contains(printContainer)) {
                           document.body.removeChild(printContainer);
                        }
                      }
                    } catch (err) {
                      console.error("PDF generation failed:", err);
                      alert('Generování PDF selhalo. Zkuste to prosím znovu.');
                    } finally {
                      setIsGeneratingPDF(false);
                    }
                  }}
                  className={`px-4 py-2 text-white text-sm font-bold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all shadow-sm ${isGeneratingPDF ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 overflow-hidden relative'}`}
                >
                  <FileDown className={`w-4 h-4 ${isGeneratingPDF ? 'animate-bounce' : ''}`} />
                  {isGeneratingPDF ? 'Generuji...' : 'Stáhnout PDF'}
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 lg:p-8 flex justify-center bg-slate-50 print:bg-white print:p-0">
              {/* Paper Layout */}
              <div 
                ref={pdfRef}
                id="pdf-layout-container"
                className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-[0_4px_30px_rgba(0,0,0,0.05)] print:shadow-none p-[15mm] flex flex-col font-sans relative"
              >
                
                <div className="flex justify-between items-baseline border-b border-black pb-2 mb-2 px-2">
                  <h1 className="text-2xl font-bold text-black tracking-tight">CENOVÁ NABÍDKA</h1>
                  <div className="text-2xl font-bold text-black tabular-nums">{offer.number}</div>
                </div>

                <div className="px-2 mt-2 mb-2">
                  <table className="w-full border-collapse border border-black border-spacing-0" style={{ tableLayout: 'fixed' }}>
                    <tbody>
                      <tr>
                        <td className="w-1/2 bg-[#f1f5f9] h-8 px-2 align-middle border-r border-b border-black">
                          <span className="text-[10px] uppercase font-bold text-black tracking-widest leading-none">Zhotovitel:</span>
                        </td>
                        <td className="w-1/2 bg-[#f1f5f9] h-8 px-2 align-middle border-b border-black">
                          <span className="text-[10px] uppercase font-bold text-black tracking-widest leading-none">Objednatel:</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="w-1/2 p-2 align-top border-r border-black" style={{ height: '160px' }}>
                          <div className="flex justify-between gap-2">
                            <div className="text-[12px] text-black space-y-0 leading-tight">
                              <p className="font-bold text-black mb-0.5">Kovovýroba Rohlík s.r.o.</p>
                              <p>K Hrnčířům 323</p>
                              <p>Šeberov, 149 00 Praha 4</p>
                              
                              <div className="py-2 space-y-0 text-black">
                                <p><span className="font-bold">IČO:</span> 06279589</p>
                                <p><span className="font-bold">DIČ:</span> CZ06279589</p>
                                <p className="font-bold">Plátce DPH</p>
                              </div>

                              <div className="space-y-0 pt-1 text-black text-[11px]">
                                <p><span className="font-bold uppercase">TELEFON:</span> +420 774 214 607</p>
                                <p><span className="font-bold uppercase">E-MAIL:</span> rohlik-vyroba@seznam.cz</p>
                                <p><span className="font-bold uppercase">WEB:</span> https://www.kovorohlik.cz/</p>
                              </div>
                            </div>
                            <img src="/logo.png" alt="Logo" className="h-[84px] w-auto max-w-[160px] object-contain self-start shrink-0" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          </div>
                        </td>
                        <td className="w-1/2 p-2 align-top border-black" style={{ height: '160px' }}>
                          <div className="text-[12px] text-black space-y-0 leading-tight">
                            <p className="font-bold text-black mb-0.5">{offer.client.name}</p>
                            <div className="whitespace-pre-line">
                              {(() => {
                                if (!offer.client.address) return "—";
                                const parts = offer.client.address.split(/[,;]\s*/).map(p => p.trim()).filter(Boolean);
                                if (parts.length >= 2) {
                                  return (
                                    <>
                                      <p>{parts[0]}</p>
                                      <p>{parts.slice(1).join(', ')}</p>
                                    </>
                                  );
                                }
                                return <p>{offer.client.address}</p>;
                              })()}
                            </div>
                            
                            <div className="py-2 space-y-0 text-black">
                              {offer.client.idNumber && (
                                 <p><span className="font-bold">IČO:</span> {offer.client.idNumber}</p>
                              )}
                              {offer.client.dic && (
                                 <p><span className="font-bold">DIČ:</span> {offer.client.dic}</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Project Title implementation - Using table for max stability */}
                <div className="px-2 mt-2 mb-6">
                  <table className="w-full border-collapse border border-black border-spacing-0" style={{ tableLayout: 'fixed' }}>
                    <tbody>
                      <tr>
                        <td className="w-full bg-white h-8 px-2 align-middle">
                          <p className="text-[12px] text-black leading-none m-0">
                            <span className="font-bold uppercase tracking-widest text-[10px] mr-2 text-black">Název akce:</span>
                            <span className="uppercase text-black">{offer.title || '— Název akce —'}</span>
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex-1">
                  <table className="w-full border-separate border-spacing-0">
                    <thead>
                      <tr className="text-left">
                        <th className="py-2.5 px-6 text-[10px] font-bold uppercase tracking-widest text-black border-b border-black">Položka</th>
                        <th className="py-2.5 px-6 text-[10px] font-bold uppercase tracking-widest text-black border-b border-black text-right">Základ bez DPH</th>
                        <th className="py-2.5 px-6 text-[10px] font-bold uppercase tracking-widest text-black border-b border-black text-center w-32">DPH</th>
                        <th className="py-2.5 px-6 text-[10px] font-bold uppercase tracking-widest text-black border-b border-black text-right">Celkem včetně DPH</th>
                      </tr>
                    </thead>
                    <tbody className="text-[12px]">
                      {[
                        { 
                          label: 'Materiál + výroba', 
                          key: 'material' as const,
                          categories: ['MATERIAL', 'PRACE', 'OTHER'] 
                        },
                        { 
                          label: 'Povrchová úprava', 
                          key: 'surface' as const,
                          categories: ['ZINEK_ZAROVY', 'ZINEK_GALVANICKY', 'TAHOKOV', 'LAKOVANI_MOKRE', 'LAKOVANI_PRASKOVE'] 
                        },
                        { 
                          label: 'Montáž', 
                          key: 'assembly' as const,
                          categories: ['MONTAZ'] 
                        },
                        { 
                          label: 'Doprava', 
                          key: 'transport' as const,
                          categories: ['DOPRAVA'] 
                        }
                      ].map((group, idx, arr) => {
                        const sumBase = offer.items
                          .filter(item => group.categories.includes(item.category))
                          .reduce((acc, item) => acc + (getItemTotal(item)), 0);
                        
                        const rate = offer.groupTaxRates?.[group.key] ?? 21;
                        const taxAmount = sumBase * (rate / 100);
                        const totalWithTax = sumBase + taxAmount;
                        
                        const isLast = idx === arr.length - 1;

                        return (
                          <tr key={group.key} className="group">
                            <td className="py-2.5 px-6 font-semibold text-black border-b border-black">{group.label}</td>
                            <td className="py-2.5 px-6 text-right font-medium tabular-nums border-b border-black text-black">
                              {formatPrice(sumBase)}
                            </td>
                            <td className="py-1 px-1 border-b border-black text-center">
                              <div className="flex flex-col items-center justify-center">
                                {isGeneratingPDF ? (
                                  <span className="text-[10px] font-bold text-black leading-none">{rate} %</span>
                                ) : (
                                  <select 
                                    value={rate}
                                    onChange={(e) => {
                                      const newRates = { ...offer.groupTaxRates, [group.key]: Number(e.target.value) };
                                      updateOffer({ groupTaxRates: newRates as any });
                                    }}
                                    className="text-[10px] font-bold border-none bg-[#f8fafc] text-slate-700 rounded p-1 h-6 focus:ring-1 focus:ring-blue-500 print:appearance-none cursor-pointer text-center"
                                  >
                                    <option value={0}>0 %</option>
                                    <option value={12}>12 %</option>
                                    <option value={21}>21 %</option>
                                  </select>
                                )}
                                <span className="text-[10px] font-medium text-black tabular-nums leading-none mt-1">
                                  {formatPrice(taxAmount)}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-6 text-right font-bold tabular-nums border-b border-black text-black">
                              {formatPrice(totalWithTax)}
                            </td>
                          </tr>
                        );
                      })}
                      
                      {/* Subtotal Row - Cleaner */}
                      <tr className="bg-[#f1f5f9]">
                        <td className="py-2.5 px-6 text-[10px] font-bold text-black uppercase tracking-widest border-b border-black">Celkový součet</td>
                        <td className="py-2.5 px-6 text-right text-black font-bold text-[12px] tabular-nums border-b border-black">
                          {formatPrice(offer.items.reduce((acc, item) => acc + (getItemTotal(item)), 0))}
                        </td>
                        <td className="py-2.5 px-6 text-center text-black font-bold text-[12px] tabular-nums border-b border-black">
                          {formatPrice(offer.items.reduce((acc, item) => {
                            const mapping: Record<string, keyof NonNullable<Offer['groupTaxRates']>> = {
                              'MATERIAL': 'material', 'PRACE': 'material', 'OTHER': 'material',
                              'ZINEK_ZAROVY': 'surface', 'ZINEK_GALVANICKY': 'surface', 'TAHOKOV': 'surface', 'LAKOVANI_MOKRE': 'surface', 'LAKOVANI_PRASKOVE': 'surface',
                              'MONTAZ': 'assembly',
                              'DOPRAVA': 'transport'
                            };
                            const groupKey = mapping[item.category] || 'material';
                            const rate = offer.groupTaxRates?.[groupKey] ?? 21;
                            return acc + (getItemTotal(item) * (rate / 100));
                          }, 0))}
                        </td>
                        <td className="py-2.5 px-6 text-right text-black font-bold text-[12px] tabular-nums border-b border-black">
                          {formatPrice(offer.items.reduce((acc, item) => {
                            const mapping: Record<string, keyof NonNullable<Offer['groupTaxRates']>> = {
                              'MATERIAL': 'material', 'PRACE': 'material', 'OTHER': 'material',
                              'ZINEK_ZAROVY': 'surface', 'ZINEK_GALVANICKY': 'surface', 'TAHOKOV': 'surface', 'LAKOVANI_MOKRE': 'surface', 'LAKOVANI_PRASKOVE': 'surface',
                              'MONTAZ': 'assembly',
                              'DOPRAVA': 'transport'
                            };
                            const groupKey = mapping[item.category] || 'material';
                            const rate = offer.groupTaxRates?.[groupKey] ?? 21;
                            const base = getItemTotal(item);
                            return acc + base + (base * (rate / 100));
                          }, 0))}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="mt-8 mx-2" style={{ minHeight: '160px' }}>
                    {offer.notes && (
                      <table className="w-full border-collapse border border-black" style={{ tableLayout: 'fixed' }}>
                        <tbody>
                          <tr>
                            <td className="bg-[#f1f5f9] h-8 px-2 align-middle border-b border-black">
                              <span className="text-[10px] uppercase font-bold text-black tracking-widest leading-none">Poznámka:</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2 align-top" style={{ minHeight: '130px' }}>
                              <p className="text-[11px] text-black leading-tight whitespace-pre-line">
                                {offer.notes}
                              </p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                  
                  {/* Dividing line at a fixed vertical offset - matching top header style and spacing */}
                  <div className="border-b border-black mt-2 mb-2 px-2"></div>
                </div>

                <div className="mt-2 space-y-6">
                  <div className="grid grid-cols-2 gap-12 text-sm">
                    <div className="bg-[#f8fafc] p-3 space-y-1">
                      <div className="flex items-baseline gap-2 border-b border-black pb-0.5">
                        <span className="text-[10px] font-bold text-black uppercase tracking-widest min-w-[120px]">Datum vystavení:</span>
                        <div className="text-[10px] text-black font-normal">{new Date(offer.dateIssued).toLocaleDateString('cs-CZ')}</div>
                      </div>
                      <div className="flex items-baseline gap-2 border-b border-black pb-0.5">
                        <span className="text-[10px] font-bold text-black uppercase tracking-widest min-w-[120px]">Datum platnosti:</span>
                        <div className="text-[10px] text-black font-normal">{new Date(offer.validUntil).toLocaleDateString('cs-CZ')}</div>
                      </div>
                      <div className="flex items-baseline gap-2 border-b border-black pb-0.5">
                        <span className="text-[10px] font-bold text-black uppercase tracking-widest min-w-[120px]">Vyhotovil:</span>
                        <div className="text-[10px] text-black font-normal">{offer.preparedBy}</div>
                      </div>
                      <div className="flex items-baseline gap-2 border-b border-black pb-0.5">
                        <span className="text-[10px] font-bold text-black uppercase tracking-widest min-w-[120px]">Převzal:</span>
                        <div className="text-[10px] text-black font-normal flex-1 h-3.5">
                          {offer.receivedBy}
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#f8fafc] p-3 space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-black uppercase tracking-wider pb-0.5">
                        <span>Základ bez DPH:</span>
                        <span className="text-black font-normal tabular-nums">
                          {formatPrice(offer.items.reduce((acc, item) => acc + getItemTotal(item), 0))}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-black uppercase tracking-wider pb-0.5">
                        <span>DPH celkem:</span>
                        <span className="text-black font-normal tabular-nums">
                          {formatPrice(offer.items.reduce((acc, item) => {
                            const mapping: Record<string, keyof NonNullable<Offer['groupTaxRates']>> = {
                              'MATERIAL': 'material', 'PRACE': 'material', 'OTHER': 'material',
                              'ZINEK_ZAROVY': 'surface', 'ZINEK_GALVANICKY': 'surface', 'TAHOKOV': 'surface', 'LAKOVANI_MOKRE': 'surface', 'LAKOVANI_PRASKOVE': 'surface',
                              'MONTAZ': 'assembly',
                              'DOPRAVA': 'transport'
                            };
                            const groupKey = mapping[item.category] || 'material';
                            const rate = offer.groupTaxRates?.[groupKey] ?? 21;
                            return acc + (getItemTotal(item) * (rate / 100));
                          }, 0))}
                        </span>
                      </div>
                      <div className="h-px bg-black my-1"></div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-bold text-black uppercase">K ÚHRADĚ:</span>
                          <span className="text-xl font-black text-black tabular-nums tracking-tight">
                            {formatPrice(offer.items.reduce((acc, item) => {
                              const mapping: Record<string, keyof NonNullable<Offer['groupTaxRates']>> = {
                                'MATERIAL': 'material', 'PRACE': 'material', 'OTHER': 'material',
                                'ZINEK_ZAROVY': 'surface', 'ZINEK_GALVANICKY': 'surface', 'TAHOKOV': 'surface', 'LAKOVANI_MOKRE': 'surface', 'LAKOVANI_PRASKOVE': 'surface',
                                'MONTAZ': 'assembly',
                                'DOPRAVA': 'transport'
                              };
                              const groupKey = mapping[item.category] || 'material';
                              const rate = offer.groupTaxRates?.[groupKey] ?? 21;
                              const base = getItemTotal(item);
                              return acc + base + (base * (rate / 100));
                            }, 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Removed footer content to ensure single page and better alignment */}
                </div>

              </div>
            </div>
          </div>
        ) : activeMainView === 'DASHBOARD' ? (
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0 relative z-10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md mr-1"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold text-slate-900">Přehled</h1>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-4 lg:p-12 relative z-0">
              <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 lg:p-12 mb-8 text-white shadow-xl">
                  <h2 className="text-3xl lg:text-4xl font-bold mb-4">Vítejte v Cenotvorovi</h2>
                  <p className="text-slate-300 text-lg max-w-2xl">
                    Co si přejete udělat? Vyberte z následujících možností.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button 
                    onClick={() => requestNavigation('NEW_OFFER')}
                    className="flex flex-col items-center justify-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group"
                  >
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Plus className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Nová nabídka</h3>
                    <p className="text-slate-500 text-center">Vytvořit zcela novou cenovou nabídku</p>
                  </button>
                  
                  <button 
                    onClick={() => requestNavigation('DRAFTS')}
                    className="flex flex-col items-center justify-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group"
                  >
                    <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Clock className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Rozpracované</h3>
                    <p className="text-slate-500 text-center">Pokračovat v rozdělaných nabídkách ({offers.filter(o => o.status === 'DRAFT' || !o.status).length})</p>
                  </button>

                  <button 
                    onClick={() => requestNavigation('COMPLETED')}
                    className="flex flex-col items-center justify-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group"
                  >
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Dokončené</h3>
                    <p className="text-slate-500 text-center">Prohlédnout historii vygenerovaných nabídek ({offers.filter(o => o.status === 'COMPLETED').length})</p>
                  </button>
                  
                  <button 
                    onClick={() => requestNavigation('DELETED')}
                    className="flex flex-col items-center justify-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group"
                  >
                    <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Trash2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Smazané</h3>
                    <p className="text-slate-500 text-center">Zobrazit nebo obnovit nabídky v koši ({offers.filter(o => o.status === 'DELETED').length})</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : activeMainView === 'DRAFTS' || activeMainView === 'COMPLETED' || activeMainView === 'DELETED' ? (
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0 relative z-10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md mr-1"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setActiveMainView('DASHBOARD')}
                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="hidden sm:inline font-medium">Zpět na přehled</span>
                </button>
                <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block"></div>
                <h1 className="text-sm lg:text-xl font-bold text-slate-900">
                  {activeMainView === 'DRAFTS' ? 'Rozpracované nabídky' : activeMainView === 'COMPLETED' ? 'Dokončené nabídky' : 'Smazané nabídky'}
                </h1>
              </div>
            </header>
            
            <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
              <div className="max-w-5xl mx-auto space-y-4">
                {(activeMainView === 'DRAFTS' 
                  ? offers.filter(o => o.status === 'DRAFT' || !o.status) 
                  : activeMainView === 'COMPLETED'
                  ? offers.filter(o => o.status === 'COMPLETED')
                  : offers.filter(o => o.status === 'DELETED')
                ).length === 0 ? (
                  <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <History className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Žádné nabídky</h3>
                    <p className="text-slate-500 max-w-xs mx-auto">V této sekci zatím nemáte uložené žádné nabídky.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-widest border-b border-slate-100">
                        <tr>
                          <th 
                            className="px-6 py-4 font-bold cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => toggleSort('date')}
                          >
                            <div className="flex items-center">
                              Datum vytvoření
                              <SortIndicator column="date" />
                            </div>
                          </th>
                          <th 
                            className="px-6 py-4 font-bold cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => toggleSort('client')}
                          >
                            <div className="flex items-center">
                              Zákazník
                              <SortIndicator column="client" />
                            </div>
                          </th>
                          <th 
                            className="px-6 py-4 font-bold cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => toggleSort('title')}
                          >
                            <div className="flex items-center">
                              Název akce
                              <SortIndicator column="title" />
                            </div>
                          </th>
                          <th 
                            className="px-6 py-4 font-bold cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => toggleSort('number')}
                          >
                            <div className="flex items-center">
                              Číslo nabídky
                              <SortIndicator column="number" />
                            </div>
                          </th>
                          <th 
                            className="px-6 py-4 font-bold text-right cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => toggleSort('amount')}
                          >
                            <div className="flex items-center justify-end">
                              Částka bez DPH
                              <SortIndicator column="amount" />
                            </div>
                          </th>
                          <th className="px-6 py-4 w-24"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {sortedOffers.map((o) => {
                          const handleRowClick = () => {
                            try {
                              const mappedOffer: Offer = {
                                id: o.id,
                                number: o.number || '',
                                client: {
                                  name: o.client?.name || '',
                                  idNumber: o.client?.idNumber || '',
                                  dic: o.client?.dic || '',
                                  address: o.client?.address || ''
                                },
                                items: (o.items || []).map((item: any) => ({
                                  ...item,
                                  id: item.id || generateId(),
                                  category: item.category || 'OTHER',
                                  title: item.title || '',
                                  quantity: Number(item.quantity) || 0,
                                  unit: item.unit || 'ks',
                                  pricePerUnit: Number(item.pricePerUnit) || 0,
                                })),
                                dateIssued: o.dateIssued || new Date().toISOString().split('T')[0],
                                validUntil: o.validUntil || new Date().toISOString().split('T')[0],
                                currency: o.currency || 'CZK',
                                taxRate: Number(o.taxRate) || 21,
                                status: o.status || 'DRAFT',
                                preparedBy: o.preparedBy || '',
                                receivedBy: o.receivedBy || '',
                                notes: o.notes || '',
                                title: o.title || '',
                                groupTaxRates: o.groupTaxRates || INITIAL_OFFER.groupTaxRates
                              };

                              setOffer(mappedOffer);
                              setIsEditorLocked(mappedOffer.status === 'COMPLETED' || mappedOffer.status === 'DELETED');
                              setActiveMainView('EDITOR');
                              setShowExportPreview(false);
                              setIsSidebarOpen(false);
                            } catch (err) {
                              console.error("Offer mapping failed:", err);
                            }
                          };

                          return (
                            <motion.tr 
                              key={o.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="group hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none"
                            >
                              <td className="px-6 py-4 cursor-pointer" onClick={handleRowClick}>
                                <span className="text-xs text-slate-500 font-medium">
                                  {new Date(o.createdAt?.seconds * 1000 || o.updatedAt?.seconds * 1000 || Date.now()).toLocaleDateString('cs-CZ')}
                                </span>
                              </td>
                              <td className="px-6 py-4 cursor-pointer" onClick={handleRowClick}>
                                <span className="text-xs font-semibold text-slate-700">
                                  {o.client?.name || '---'}
                                </span>
                              </td>
                              <td className="px-6 py-4 cursor-pointer" onClick={handleRowClick}>
                                <span className="text-sm font-bold text-slate-900 line-clamp-1">
                                  {o.title || 'Bezejmenná akce'}
                                </span>
                              </td>
                              <td className="px-6 py-4 cursor-pointer" onClick={handleRowClick}>
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">
                                  {o.number || '---'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right cursor-pointer" onClick={handleRowClick}>
                                <span className="text-sm font-bold text-slate-900 tabular-nums">
                                  {calculateTotal(o.items).toLocaleString('cs-CZ')} Kč
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right bg-white relative z-10 w-24">
                                <div className="flex items-center justify-end gap-1">
                                  {(activeMainView === 'COMPLETED' || activeMainView === 'DELETED') && (
                                    <button
                                      onClick={async (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        try {
                                          const newId = generateId();
                                          const mappedOffer: Offer = {
                                            id: newId,
                                            number: generateNextOfferNumber(),
                                            client: {
                                              name: o.client?.name || '',
                                              idNumber: o.client?.idNumber || '',
                                              dic: o.client?.dic || '',
                                              address: o.client?.address || ''
                                            },
                                            items: (o.items || []).map((item: any) => ({
                                              ...item,
                                              id: generateId(),
                                              quantity: Number(item.quantity) || 0,
                                              pricePerUnit: Number(item.pricePerUnit) || 0,
                                            })),
                                            dateIssued: new Date().toISOString().split('T')[0],
                                            validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                            currency: o.currency || 'CZK',
                                            taxRate: Number(o.taxRate) || 21,
                                            status: 'DRAFT',
                                            preparedBy: o.preparedBy || '',
                                            receivedBy: o.receivedBy || '',
                                            notes: o.notes || '',
                                            title: (o.title ? `${o.title} (Kopie)` : 'Kopie nabídky'),
                                            groupTaxRates: o.groupTaxRates || INITIAL_OFFER.groupTaxRates
                                          };
                                          
                                          await saveOffer(mappedOffer);
                                          setOffer(mappedOffer);
                                          setIsEditorLocked(false);
                                          setActiveMainView('EDITOR');
                                          setShowExportPreview(false);
                                          setIsSidebarOpen(false);
                                        } catch (err) {
                                          console.error("Duplication failed:", err);
                                        }
                                      }}
                                      className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors group/copy"
                                      title="Zkopírovat do nové zakázky"
                                    >
                                      <Copy className="w-5 h-5 text-slate-300 group-hover/copy:text-blue-500 transition-colors" />
                                    </button>
                                  )}
                                  <button
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (activeMainView === 'DELETED') {
                                        setShowDeleteConfirm({ id: o.id, title: o.title || o.number });
                                      } else {
                                        setShowSoftDeleteConfirm({ id: o.id, title: o.title || o.number });
                                      }
                                    }}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors group/del"
                                    title={activeMainView === 'DELETED' ? "Definitivně smazat" : "Přesunout do smazaných"}
                                  >
                                    <Trash2 className="w-5 h-5 text-slate-300 group-hover/del:text-red-500 transition-colors" />
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0 relative z-10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md mr-1"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-4">
                  <h1 className="text-sm lg:text-xl font-bold text-slate-900 leading-none">Tvorba cenové nabídky</h1>
                  <span className="w-fit px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] lg:text-xs font-medium border border-blue-100">
                    {offer.number}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 lg:gap-3">
                  <button 
                    onClick={async () => {
                      if (offer.status === 'DELETED') {
                        setShowDeleteConfirm({ id: offer.id, title: offer.title || offer.number });
                      } else {
                        setShowSoftDeleteConfirm({ id: offer.id, title: offer.title || offer.number, fromEditor: true } as any);
                      }
                    }}
                    className="px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-medium text-red-600 hover:bg-red-50 rounded-md border border-red-100 transition-colors items-center gap-2 flex"
                  >
                    <Trash2 className="w-4 h-4" />
                    {offer.status === 'DELETED' ? 'Definitivně smazat' : 'Smazat'}
                  </button>
              </div>
            </header>

        {isEditorLocked && offer.status === 'COMPLETED' && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 lg:px-8 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 relative z-10 w-full overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-amber-900">Vyplněná nabídka je uzamčena</span>
                <span className="text-xs text-amber-700">Tato nabídka byla dokončena. Odemkněte ji pouze v případě nutnosti úprav stejného dokumentu.</span>
              </div>
            </div>
            <button
               onClick={() => {
                 setShowUnlockConfirm(true);
               }}
               className="px-4 py-2 bg-white border border-amber-300 text-amber-700 hover:bg-amber-100 hover:text-amber-800 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shrink-0 shadow-sm"
            >
              <Unlock className="w-4 h-4"/>
              Odemknout pro úpravy
            </button>
          </div>
        )}

        {isEditorLocked && offer.status === 'DELETED' && (
          <div className="bg-red-50 border-b border-red-200 px-4 lg:px-8 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 relative z-10 w-full overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-red-100 rounded-lg text-red-600 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-red-900">Nabídka je smazaná</span>
                <span className="text-xs text-red-700">Tento dokument se nachází v koši a nelze jej již upravovat. Můžete jej ale zkopírovat do nové nabídky.</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 p-4 lg:p-8 flex flex-col xl:flex-row gap-8 items-start overflow-y-auto min-h-0 text-slate-900">
          {/* Left Column: Items + Notes */}
          <div className="w-full xl:w-2/3 2xl:w-3/4 space-y-6 flex flex-col shrink-0 min-w-0">
            <fieldset disabled={isEditorLocked} className="space-y-6 m-0 p-0 border-none min-w-0 w-full group/locked">
            {/* Project Title Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/30">
                <Tag className="w-4 h-4 text-slate-400" />
                <h3 className="font-semibold text-slate-900">Název akce</h3>
              </div>
              <div className="p-5">
                <input 
                  type="text"
                  value={offer.title || ''}
                  onChange={(e) => updateOffer({ title: e.target.value })}
                  placeholder="Zadejte název akce/projektu..."
                  className="w-full text-lg font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Items Section */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col shrink-0 min-w-0">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-slate-400" />
                Položky nabídky
              </h3>
              <div className="flex gap-2 flex-wrap">
                <select 
                  onChange={(e) => {
                    const cat = e.target.value as ItemCategory;
                    if (cat) addItem(cat);
                    e.target.value = "";
                  }}
                  className="text-xs font-medium bg-white border border-slate-200 rounded-md px-3 py-1.5 text-blue-600 hover:border-blue-300 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">+ Přidat položku...</option>
                  <option value="MATERIAL">Materiál</option>
                  <option value="ZINEK_ZAROVY">Zinek žárový</option>
                  <option value="ZINEK_GALVANICKY">Zinek galvanický</option>
                  <option value="TAHOKOV">Tahokov</option>
                  <option value="MONTAZ">Montáž</option>
                  <option value="DOPRAVA">Doprava</option>
                  <option value="PRACE">Práce</option>
                  <option value="LAKOVANI_MOKRE">Lakování mokré</option>
                  <option value="LAKOVANI_PRASKOVE">Lakování práškové</option>
                  <option value="OTHER">Ostatní</option>
                </select>
              </div>
            </div>
            
            <div className="min-h-[400px]">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-3 font-semibold">Popis / Specifikace</th>
                    <th className="px-4 py-3 font-semibold text-center">MJ</th>
                    <th className="px-4 py-3 font-semibold w-56 text-center">Výpočtová pole</th>
                    <th className="px-4 py-3 font-semibold w-24 text-right">Cena/MJ</th>
                    <th className="px-6 py-3 font-semibold w-32 text-right">Celkem</th>
                    <th className="px-4 py-3 font-semibold w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence initial={false}>
                    {offer.items.map((item) => (
                      <motion.tr 
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="group hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 group/row">
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                  item.category === 'MATERIAL' ? 'bg-amber-100 text-amber-700' :
                                  item.category === 'MONTAZ' ? 'bg-emerald-100 text-emerald-700' :
                                  item.category === 'DOPRAVA' ? 'bg-purple-100 text-purple-700' :
                                  item.category === 'PRACE' ? 'bg-blue-100 text-blue-700' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {CATEGORY_NAMES[item.category] || item.category}
                                </span>
                                <div className="relative flex-1">
                                  <input 
                                    type="text"
                                    value={item.title || ''}
                                    placeholder="Název položky..."
                                    onFocus={() => setActiveAutocompleteId(item.id)}
                                      onBlur={() => setTimeout(() => setActiveAutocompleteId(null), 200)}
                                      onChange={(e) => updateItem(item.id, { title: e.target.value })}
                                    className="w-full font-medium text-slate-900 bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-300"
                                  />
                                  {/* Autocomplete for Material */}
                                  {item.category === 'MATERIAL' && activeAutocompleteId === item.id && (() => {
                                    const filtered = priceList.filter(p => !item.title || p.title.toLowerCase().includes(item.title.toLowerCase())).slice(0, 10);
                                    return (
                                      <div className="absolute z-[100] left-0 top-full mt-1 w-[280px] sm:w-[500px] bg-white border border-slate-200 rounded-lg shadow-2xl overflow-hidden border-t-4 border-t-blue-500">
                                        <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-100 flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                          <span>Ceník ({priceList.length} položek)</span>
                                          {isSyncing && <span className="text-blue-500 animate-pulse">Synchronizace...</span>}
                                        </div>
                                        <div className="max-h-64 overflow-y-auto">
                                          {priceList.length === 0 ? (
                                            <div className="p-4 text-center">
                                              <p className="text-xs text-slate-500 mb-2">Ceník je prázdný.</p>
                                              <button 
                                                onMouseDown={(e) => {
                                                  e.preventDefault();
                                                  syncPriceList();
                                                }}
                                                className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
                                              >
                                                Synchronizovat nyní
                                              </button>
                                            </div>
                                          ) : filtered.length === 0 ? (
                                            <div className="p-4 text-center text-xs text-slate-500">
                                              Nebylo nic nalezeno pro "{item.title}"
                                            </div>
                                          ) : (
                                            filtered.map((p, idx) => (
                                              <button
                                                key={idx}
                                                onMouseDown={(e) => {
                                                  e.preventDefault();
                                                  updateItem(item.id, { 
                                                    title: p.title, 
                                                    unit: p.unit, 
                                                    pricePerUnit: p.price, 
                                                    weightPerUnit: p.weight,
                                                    extraInfo: p.rawValues?.[1] || '' 
                                                  });
                                                  setActiveAutocompleteId(null);
                                                }}
                                                className="w-full text-left px-4 py-3 text-xs hover:bg-blue-50/50 border-b border-slate-100 last:border-0 transition-colors"
                                              >
                                                <div className="font-bold text-slate-900 mb-0.5 whitespace-normal leading-snug">{p.title}</div>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                                  <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium">{p.price} Kč</span>
                                                  <span className="text-slate-300">•</span>
                                                  <span>{p.weight} kg/{p.unit}</span>
                                                  {p.rawValues?.[1] && (
                                                    <>
                                                      <span className="text-slate-300">•</span>
                                                      <span className="italic text-blue-600 truncate">{p.rawValues[1]}</span>
                                                    </>
                                                  )}
                                                </div>
                                              </button>
                                            ))
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            <div className="flex items-center gap-2">
                              {item.category === 'MATERIAL' ? (
                                <span className="text-[10px] text-slate-500 italic">
                                  {item.extraInfo || ''}
                                </span>
                              ) : (
                                <div className="flex items-center gap-1.5 w-full">
                                  <label className="text-[9px] text-slate-300 font-semibold uppercase shrink-0">Komentář:</label>
                                  <input 
                                    type="text"
                                    value={item.description || ''}
                                    placeholder="..."
                                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
                                    className="w-full text-[10px] text-slate-500 bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-200"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded inline-block min-w-[32px]">
                            {item.unit}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-3 text-xs">
                            {item.category === 'MATERIAL' && (
                              <>
                                <div className="flex flex-col items-center">
                                  <label className="text-[9px] text-slate-400 uppercase">Množství (MJ)</label>
                                  <input type="number" value={item.quantity || 0} onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })} className="w-12 text-center p-0 border-none bg-transparent focus:ring-0 font-medium" />
                                </div>
                                <div className="text-slate-300">×</div>
                                <div className="flex flex-col items-center">
                                  <label className="text-[9px] text-slate-400 uppercase">Kg/MJ</label>
                                  <div className="w-12 text-center text-slate-900 font-medium">{item.weightPerUnit || 0}</div>
                                </div>
                                <div className="text-slate-400 font-bold">= {(item.quantity * (item.weightPerUnit || 0)).toFixed(1)} kg</div>
                              </>
                            )}

                            {item.category === 'ZINEK_ZAROVY' && (
                              <div className="flex flex-col items-center">
                                <label className="text-[9px] text-slate-400 uppercase italic">Váha materiálu</label>
                                <div className="font-bold text-slate-900">{totalMaterialWeight.toFixed(1)} kg</div>
                              </div>
                            )}

                            {item.category === 'MONTAZ' && (
                              <>
                                <div className="flex flex-col items-center">
                                  <label className="text-[9px] text-slate-400 uppercase">Lidí</label>
                                  <input type="number" value={item.persons || 0} onChange={(e) => updateItem(item.id, { persons: Number(e.target.value) })} className="w-10 text-center p-0 border-none bg-transparent focus:ring-0 font-medium" />
                                </div>
                                <div className="text-slate-300">×</div>
                                <div className="flex flex-col items-center">
                                  <label className="text-[9px] text-slate-400 uppercase">Hodin</label>
                                  <input type="number" value={item.hours || 0} onChange={(e) => updateItem(item.id, { hours: Number(e.target.value) })} className="w-10 text-center p-0 border-none bg-transparent focus:ring-0 font-medium" />
                                </div>
                                <div className="text-slate-400 font-bold">= {(item.persons || 0) * (item.hours || 0)} h</div>
                              </>
                            )}

                            {item.category === 'DOPRAVA' && (
                              <div className="flex flex-col items-center">
                                <label className="text-[9px] text-slate-400 uppercase">Vzdálenost (km)</label>
                                <input type="number" value={item.km || 0} onChange={(e) => updateItem(item.id, { km: Number(e.target.value) })} className="w-16 text-center p-0 border-none bg-transparent focus:ring-0 font-bold" />
                              </div>
                            )}

                            {item.category === 'PRACE' && (
                              <div className="flex flex-col items-center">
                                <label className="text-[9px] text-slate-400 uppercase italic">Koeficient</label>
                                <select 
                                  value={[2.6, 4.2, 6.5].includes(item.coefficient || 0) ? item.coefficient : 0} 
                                  onChange={(e) => updateItem(item.id, { coefficient: Number(e.target.value) })}
                                  className="text-xs font-bold bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                                >
                                  <option value={2.6}>2,6</option>
                                  <option value={4.2}>4,2</option>
                                  <option value={6.5}>6,5</option>
                                  <option value={0}>Individual</option>
                                </select>
                                {(![2.6, 4.2, 6.5].includes(item.coefficient || 0) || item.coefficient === 0) && (
                                  <input 
                                    type="number" 
                                    step="0.1"
                                    value={!item.coefficient ? '' : item.coefficient}
                                    placeholder="?" 
                                    onChange={(e) => updateItem(item.id, { coefficient: Number(e.target.value) })}
                                    className="w-12 text-center text-[10px] p-0 border-b border-slate-200 bg-transparent focus:ring-0"
                                  />
                                )}
                              </div>
                            )}

                            {(['OTHER', 'TAHOKOV', 'LAKOVANI_MOKRE', 'LAKOVANI_PRASKOVE', 'ZINEK_GALVANICKY'].includes(item.category)) && (
                              <div className="flex flex-col items-center">
                                <label className="text-[9px] text-slate-400 uppercase">Množství (MJ)</label>
                                <input type="number" value={item.quantity || 0} onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })} className="w-12 text-center p-0 border-none bg-transparent focus:ring-0 font-bold" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          {item.category === 'PRACE' ? (
                            <span className="tabular-nums font-medium text-slate-900">
                              {getItemTotal(item).toLocaleString()}
                            </span>
                          ) : (
                            <input 
                              type="number"
                              value={item.pricePerUnit || 0}
                              onChange={(e) => updateItem(item.id, { pricePerUnit: Number(e.target.value) })}
                              className="w-full text-right bg-transparent border-none p-0 focus:ring-0 tabular-nums font-medium"
                            />
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold tabular-nums text-slate-900 text-nowrap">
                          {getItemTotal(item).toLocaleString()} {offer.currency === 'CZK' ? 'Kč' : offer.currency}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-slate-50/30 border-t border-slate-100 mt-auto">
              <div className="flex flex-col gap-2 max-w-sm ml-auto">
                <div className="flex justify-between text-lg font-bold text-slate-900 pt-3 border-t border-slate-200">
                  <span>Celkem k úhradě bez DPH:</span>
                  <span className="tabular-nums">
                    {subtotal.toLocaleString()} {offer.currency === 'CZK' ? 'Kč' : offer.currency}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Notes Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/30">
              <StickyNote className="w-4 h-4 text-slate-400" />
              <h3 className="font-semibold text-slate-900">Poznámky</h3>
            </div>
            <div className="p-6">
              <textarea
                value={offer.notes || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const lines = val.split('\n');
                  
                  // Limit lines and characters per line
                  const limitedLines = lines.slice(0, 10).map(line => line.substring(0, 80));
                  updateOffer({ notes: limitedLines.join('\n') });
                }}
                placeholder="Zadejte doplňující poznámky k nabídce... (max. 10 řádků, 80 znaků na řádek)"
                className="w-full h-32 text-sm text-slate-600 bg-transparent border-none p-0 focus:ring-0 resize-none placeholder:italic placeholder:text-slate-300"
              />
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                <span>Limit: 80 znaků / řádek</span>
                <span>{(offer.notes?.split('\n').length || 0)} / 10 řádků</span>
              </div>
            </div>
          </div>
          </fieldset>
        </div>

        {/* Details Sidebar */}
          <div className="w-full xl:w-1/3 2xl:w-1/4 space-y-6 shrink-0 pb-8">
            <fieldset disabled={isEditorLocked} className="space-y-6 m-0 p-0 border-none min-w-0 w-full group/locked">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                Zákazník
              </h3>
              <div className="space-y-4">
                {/* ARES Search and Manual Entry Toggle */}
                <div className="flex flex-col gap-3">
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setCustomerEntryMode('ARES')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${customerEntryMode === 'ARES' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <Search className="w-3 h-3" />
                      Hledat v ARES
                    </button>
                    <button 
                      onClick={() => {
                        setCustomerEntryMode('MANUAL');
                        setAresQuery('');
                        setAresResults([]);
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${customerEntryMode === 'MANUAL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <UserPlus className="w-3 h-3" />
                      Zadat ručně
                    </button>
                  </div>

                  {customerEntryMode === 'ARES' && (
                    <div className="relative">
                      <div className="relative">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isAresSearching ? 'text-blue-500' : 'text-slate-400'}`} />
                        <input 
                          type="text"
                          placeholder="IČO nebo název firmy..."
                          value={aresQuery}
                          onChange={(e) => {
                            setAresQuery(e.target.value);
                            searchAres(e.target.value);
                          }}
                          className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                        />
                        {isAresSearching && (
                          <RefreshCcw className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-500 animate-spin" />
                        )}
                      </div>

                      <AnimatePresence>
                        {aresResults.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto"
                          >
                            {aresResults.map((res, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  selectAresResult(res);
                                  setAresResults([]);
                                  setAresQuery('');
                                }}
                                className="w-full p-3 text-left hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-none flex flex-col gap-0.5"
                              >
                                <div className="text-xs font-bold text-slate-900 line-clamp-1">{res.obchodniJmeno}</div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                  <span className="font-medium">IČO: {res.ico}</span>
                                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                  <span className="line-clamp-1">{res.address.mesto}</span>
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {customerEntryMode === 'MANUAL' && (
                    <button 
                      onClick={() => {
                        updateClient({ name: '', idNumber: '', dic: '', address: '' });
                      }}
                      className="w-full py-2 text-[10px] font-bold text-slate-400 hover:text-red-500 border border-dashed border-slate-200 rounded-xl hover:border-red-200 hover:bg-red-50/50 transition-all"
                    >
                      Smazat všechny údaje
                    </button>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 space-y-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-blue-400 uppercase tracking-wider ml-0.5">Jméno / Firma</label>
                    <input 
                      type="text"
                      value={offer.client.name || ''}
                      placeholder="..."
                      onChange={(e) => updateClient({ name: e.target.value })}
                      className="w-full text-sm font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-300"
                    />
                  </div>
                  <div className="flex flex-col gap-2 pt-2 border-t border-blue-100/50">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-0.5">IČO</label>
                        <input 
                          type="text"
                          value={offer.client.idNumber || ''}
                          placeholder="---"
                          onChange={(e) => updateClient({ idNumber: e.target.value })}
                          className="w-full text-xs text-slate-600 bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-300 font-medium"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-0.5">DIČ</label>
                        <input 
                          type="text"
                          value={offer.client.dic || ''}
                          placeholder="---"
                          onChange={(e) => updateClient({ dic: e.target.value })}
                          className="w-full text-xs text-slate-600 bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-300 font-medium"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 pt-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-0.5">Adresa</label>
                      <textarea 
                        value={offer.client.address || ''}
                        placeholder="..."
                        onChange={(e) => updateClient({ address: e.target.value })}
                        rows={1}
                        className="w-full text-xs text-slate-500 bg-transparent border-none p-0 focus:ring-0 resize-none overflow-hidden placeholder:text-slate-300 leading-relaxed"
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = `${target.scrollHeight}px`;
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Detaily nabídky
                </h3>
                <button 
                  onClick={() => setShowValiditySettings(true)}
                  className="p-1.5 hover:bg-slate-100 rounded-md transition-colors text-slate-400 hover:text-slate-600"
                  title="Nastavení platnosti"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    Datum vystavení
                  </label>
                  <input 
                    type="date"
                    value={offer.dateIssued || ''}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      const validUntil = new Date(new Date(newDate).getTime() + defaultValidityDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                      updateOffer({ dateIssued: newDate, validUntil });
                    }}
                    className="text-sm bg-slate-50 border-slate-200 rounded-md focus:ring-blue-500 focus:border-blue-500 py-1.5"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    Platnost nabídky
                  </label>
                  <input 
                    type="date"
                    value={offer.validUntil || ''}
                    onChange={(e) => updateOffer({ validUntil: e.target.value })}
                    className={`text-sm bg-slate-50 border-slate-200 rounded-md focus:ring-blue-500 focus:border-blue-500 py-1.5 ${new Date(offer.validUntil) < new Date() ? 'text-red-600 font-medium' : ''}`}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3 h-3" />
                    Vyhotovil
                  </label>
                  {showNewPreparerInput ? (
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={newPreparerName}
                        onChange={(e) => setNewPreparerName(e.target.value)}
                        placeholder="Jméno osoby..."
                        className="flex-1 text-sm bg-slate-50 border-slate-200 rounded-md focus:ring-blue-500 focus:border-blue-500 py-1.5 px-3"
                        autoFocus
                      />
                      <button 
                        onClick={addPreparer}
                        className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setShowNewPreparerInput(false)}
                        className="p-1.5 bg-slate-200 text-slate-600 rounded-md hover:bg-slate-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select 
                        value={offer.preparedBy || ''}
                        onChange={(e) => updateOffer({ preparedBy: e.target.value })}
                        className="flex-1 text-sm bg-slate-50 border-slate-200 rounded-md focus:ring-blue-500 focus:border-blue-500 py-1.5"
                      >
                        {preparers.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => setShowNewPreparerInput(true)}
                        className="p-1.5 bg-slate-100 text-slate-400 rounded-md hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        title="Přidat osobu"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3 h-3" />
                    Převzal
                  </label>
                  <input 
                    type="text"
                    value={offer.receivedBy || ''}
                    onChange={(e) => updateOffer({ receivedBy: e.target.value })}
                    placeholder="Nepovinné..."
                    className="text-sm bg-slate-50 border-slate-200 rounded-md focus:ring-blue-500 focus:border-blue-500 py-1.5 px-3"
                  />
                </div>
              </div>
            </div>
            </fieldset>
            
            <div className="mt-8 flex flex-col gap-3">
              {!isEditorLocked && (
                <button 
                  onClick={async () => {
                    const draftOffer = { ...offer, status: 'DRAFT' };
                    setOffer(draftOffer);
                    if (!user) {
                      alert("Pro uložení se musíte nejdříve přihlásit (tlačítko vlevo dole).");
                      signIn();
                      return;
                    }
                    try {
                      await saveOffer(draftOffer);
                      executeNavigation('DRAFTS');
                    } catch (e) {
                      console.error("Save failed", e);
                      alert("Chyba při ukládání.");
                    }
                  }}
                  className="w-full py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Uložit rozpracované
                </button>
              )}

              <button 
                onClick={() => setShowExportPreview(true)}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Přejít k exportu
              </button>
            </div>
          </div>
        </div>
        </>
        )}

        {/* Validity Settings Modal */}
        {showValiditySettings && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    <Settings className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Nastavení platnosti</h3>
                </div>
                <button onClick={() => setShowValiditySettings(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Výchozí délka platnosti (dny)</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range"
                      min="1"
                      max="60"
                      value={defaultValidityDays}
                      onChange={(e) => updateOfferValidity(Number(e.target.value))}
                      className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <span className="w-12 text-center font-bold text-slate-900">{defaultValidityDays}</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  Změna se projeví u aktuální nabídky a bude uložena pro všechny příští nabídky.
                </p>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <button 
                  onClick={() => setShowValiditySettings(false)}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
                >
                  Hotovo
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Calculator Modal */}
        {showCalculator && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    <Database className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Kalkulátor plechů</h3>
                </div>
                <button onClick={() => setShowCalculator(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl gap-4 border border-slate-100">
                    <span className="text-sm text-slate-600 font-medium tracking-tight">Délka plechu (m):</span>
                    <input 
                      type="number" 
                      value={calcLength || ''} 
                      onChange={(e) => setCalcLength(Number(e.target.value))}
                      className="w-24 text-right text-sm font-bold bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl gap-4 border border-slate-100">
                    <span className="text-sm text-slate-600 font-medium tracking-tight">Šířka plechu (m):</span>
                    <input 
                      type="number" 
                      value={calcWidth || ''} 
                      onChange={(e) => setCalcWidth(Number(e.target.value))}
                      className="w-24 text-right text-sm font-bold bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="flex justify-between items-center px-4 py-1">
                    <span className="text-sm text-slate-600 font-medium tracking-tight">Plocha plechu (m²):</span>
                    <span className="text-sm font-bold text-slate-900">{calcArea.toFixed(3)} m²</span>
                  </div>
                  
                  <div className="py-2">
                    <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl gap-4 border border-blue-100">
                      <span className="text-sm text-blue-700 font-bold tracking-tight">Potřebuji (m²):</span>
                      <input 
                        type="number" 
                        value={calcNeeded || ''} 
                        onChange={(e) => setCalcNeeded(Number(e.target.value))}
                        className="w-24 text-right text-sm font-bold bg-white border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="border-t-2 border-slate-100 pt-6 mt-2">
                    <div className="flex justify-between items-center p-4 bg-slate-900 rounded-2xl">
                      <span className="text-sm font-bold text-slate-400 tracking-tight">Poměr tabule MJ:</span>
                      <span className="text-2xl font-black text-white">{calcRatio.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <button 
                  onClick={() => setShowCalculator(false)}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
                >
                  Zavřít
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* PriceList Modal */}
        {showPriceList && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Synchronizace ceníku</h3>
                  <p className="text-sm text-slate-500">
                    Poslední aktualizace: {lastSync > 0 ? new Date(lastSync).toLocaleDateString('cs-CZ') : 'Nikdy'}
                  </p>
                </div>
                <button onClick={() => setShowPriceList(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                      <RefreshCcw className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-blue-900 mb-1">
                        Interval synchronizace je nastaven na 7 dnů.
                      </p>
                      <p className="text-blue-700 leading-relaxed">
                        Další automatická synchronizace bude provedena: <span className="font-bold text-blue-900">{lastSync > 0 ? new Date(lastSync + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('cs-CZ') : 'Při příštím spuštění'}</span>.
                      </p>
                      <p className="text-blue-700 leading-relaxed mt-1">
                        V případě potřeby můžete ceny synchronizovat ručně tlačítkem níže.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">URL adresa publikovaného CSV</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={sheetUrl}
                        onChange={(e) => setSheetUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
                        className="flex-1 text-sm bg-slate-50 border-slate-200 rounded-lg focus:ring-blue-500 py-2 px-3 transition-all"
                      />
                      <button 
                        onClick={syncPriceList}
                        disabled={isSyncing || !sheetUrl}
                        className={`px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-all ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        Sync
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">
                      V Google tabulce: Soubor - Sdílet - Publikovat na web - Formát: .csv nebo .tsv
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Náhled ceníku ({priceList.length} položek)</label>
                  <div className="border border-slate-100 rounded-xl overflow-x-auto bg-slate-50 max-h-64">
                    <table className="w-full text-left text-[10px]">
                      <thead className="bg-slate-200 text-slate-600 font-bold uppercase text-[9px] sticky top-0">
                        <tr>
                          {priceHeaders.length > 0 ? (
                            priceHeaders.slice(0, -1).map((header, i) => (
                              <th key={i} className="px-3 py-2 whitespace-nowrap">{header}</th>
                            ))
                          ) : (
                            <>
                              <th className="px-3 py-2">Název</th>
                              <th className="px-3 py-2">Cena</th>
                              <th className="px-3 py-2">Váha</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {priceList.length > 0 ? (
                          priceList.slice(0, 15).map((p, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              {p.rawValues && p.rawValues.length > 0 ? (
                                p.rawValues.slice(0, -1).map((val, i) => (
                                  <td key={i} className={`px-3 py-1.5 ${i === 0 ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                                    {val}
                                  </td>
                                ))
                              ) : (
                                <>
                                  <td className="px-3 py-1.5 text-slate-900 font-medium">{p.title}</td>
                                  <td className="px-3 py-1.5 text-slate-500">{p.price} {offer.currency}</td>
                                  <td className="px-3 py-1.5 text-slate-500">{p.weight} kg</td>
                                </>
                              )}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="px-3 py-8 text-center text-slate-400">Žádná data nejsou synchronizována</td>
                          </tr>
                        )}
                        {priceList.length > 10 && (
                          <tr>
                            <td colSpan={3} className="px-3 py-2 text-center text-slate-400 bg-white">...a dalších {priceList.length - 10} položek</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {priceHeaders.length === 0 && priceList.length > 0 && (
                    <p className="text-[10px] text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100 italic">
                      Tip: Pro zobrazení všech sloupců v náhledu (včetně MJ atd.) proveďte novou synchronizaci tlačítkem Sync výše.
                    </p>
                  )}
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <button 
                  onClick={() => setShowPriceList(false)}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                >
                  Hotovo
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Soft Delete Modal */}
        {showSoftDeleteConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Přesunout do koše?</h3>
                <p className="text-slate-500 text-sm mb-6">
                  Opravdu chcete nabídku <span className="font-bold text-slate-700">{showSoftDeleteConfirm.title}</span> přesunout do koše?
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowSoftDeleteConfirm(null)}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm"
                  >
                    Zrušit
                  </button>
                  <button 
                    onClick={async () => {
                      const idToDelete = showSoftDeleteConfirm.id;
                      const fromEditor = (showSoftDeleteConfirm as any).fromEditor;
                      setShowSoftDeleteConfirm(null);
                      try {
                        await softDeleteOffer(idToDelete);
                        if (fromEditor) {
                          setActiveMainView('DRAFTS');
                          resetOffer(true);
                        }
                      } catch (err) {
                        console.error("Soft delete modal caught error", err);
                      }
                    }}
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 text-sm"
                  >
                    Do koše
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Unlock Confirmation Modal */}
        {showUnlockConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                  <Unlock className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Odemknout nabídku?</h3>
                <p className="text-slate-500 text-sm mb-6">
                  Opravdu chcete upravit tuto dokončenou nabídku?<br/><br/>
                  (Pokud chcete začít tvořit novou nabídku a vycházet z této, použijte raději tlačítko <b>Kopírovat</b> v seznamu nabídek!)
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowUnlockConfirm(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm"
                  >
                    Zrušit
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditorLocked(false);
                      setShowUnlockConfirm(false);
                    }}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 text-sm"
                  >
                    Odemknout
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Smazat nabídku?</h3>
                <p className="text-slate-500 text-sm mb-6">
                  Opravdu chcete smazat nabídku <span className="font-bold text-slate-700">{showDeleteConfirm.title}</span>? Tuto akci nelze vrátit.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm"
                  >
                    Zrušit
                  </button>
                  <button 
                    onClick={async () => {
                      const idToDelete = showDeleteConfirm.id;
                      setShowDeleteConfirm(null);
                      try {
                        await deleteOffer(idToDelete);
                        if (offer.id === idToDelete) {
                          resetOffer(true);
                        }
                      } catch (err) {
                        // Error is already alerted inside deleteOffer natively
                        console.error("Hard delete modal caught error", err);
                      }
                    }}
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 text-sm"
                  >
                    Smazat
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Navigation/New Offer Confirmation Modal */}
        {showNewOfferConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2 text-center">Neuložené úpravy</h3>
                <p className="text-slate-500 text-sm mb-6 text-center">
                  Máte rozeditovanou nabídku. Přejete si tuto rozpracovanou nabídku uložit nebo zahodit před pokračováním?
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={async () => {
                      if (!user) {
                        alert("Pro uložení se musíte přihlásit.");
                        signIn();
                        return;
                      }
                      try {
                        await saveOffer({ ...offer, status: 'DRAFT' });
                        executeNavigation(pendingNavigation || 'NEW_OFFER');
                      } catch (err) {
                        console.error('Save failed', err);
                        alert('Chyba při ukládání.');
                      }
                    }}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
                  >
                    {pendingNavigation === 'NEW_OFFER' ? 'Uložit a začít novou' : 'Uložit a opustit editor'}
                  </button>
                  <button 
                    onClick={() => executeNavigation(pendingNavigation || 'NEW_OFFER')}
                    className="w-full py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold hover:bg-red-100 transition-all"
                  >
                    {pendingNavigation === 'NEW_OFFER' ? 'Zahodit tuto a začít novou' : 'Zahodit a opustit editor'}
                  </button>
                  <button 
                    onClick={() => {
                      setShowNewOfferConfirm(false);
                      setPendingNavigation(null);
                    }}
                    className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Zrušit a pokračovat v úpravách
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
