/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef } from 'react';
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
  User,
  UserPlus,
  RefreshCcw,
  Menu,
  Search,
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
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSupabase } from './hooks/useSupabase';

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
    address: 'Průmyslová 12\nPraha 10, 100 00 Praha',
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

  const headerLine = allLines[0];
  const tabCount = (headerLine.match(/\t/g) || []).length;
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;

  let delimiter = ',';
  if (tabCount > 0 && tabCount >= semicolonCount && tabCount >= commaCount) delimiter = '\t';
  else if (semicolonCount > 0 && semicolonCount >= commaCount) delimiter = ';';

  const rawHeaders = headerLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
  const headers = rawHeaders.map(h => h.toLowerCase());
  
  const titleIdx = headers.findIndex(h => h.includes('název') || h.includes('item') || h.includes('name') || h.includes('položka') || h.includes('výrobek'));
  const unitIdx = headers.findIndex(h => h.includes('mj') || h.includes('unit') || h.includes('jednotka'));
  const priceIdx = headers.findIndex(h => h.includes('cena') || h.includes('price') || h.includes('maloobchod') || h.includes('bez dph'));
  const weightIdx = headers.findIndex(h => h.includes('váha') || h.includes('weight') || h.includes('hmotnost') || h.includes('kg'));

  if (titleIdx === -1) {
    if (rawHeaders.length === 1) {
      return { items: [], headers: rawHeaders };
    }
  }

  const items: PriceListItem[] = [];
  const startIdx = titleIdx === -1 && rawHeaders.length > 1 ? 0 : titleIdx;
  
  for (let i = 1; i < allLines.length; i++) {
    const cols = allLines[i].split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
    const tIdx = titleIdx !== -1 ? titleIdx : 0;
    
    if (!cols[tIdx]) continue;
    
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
  
  return { items, headers: rawHeaders };
};

export default function App() {
  const { 
    user, 
    loading: supabaseLoading, 
    signIn, 
    logOut, 
    offers, 
    userSettings, 
    globalSettings,
    saveOffer, 
    deleteOffer, 
    softDeleteOffer, 
    saveSettings
  } = useSupabase(); 

  const [offer, setOffer] = useState<Offer>(() => {
    const saved = localStorage.getItem('cenotvurce_current_offer');
    if (saved) {
      const parsed = JSON.parse(saved) as Offer;
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
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<{id: string, message: string, type: 'success'|'error'|'info'}[]>([]);

  const addToast = (message: string, type: 'success'|'error'|'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };
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
    key: 'date' | 'client' | 'title' | 'number' | 'amount' | 'preparedBy';
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
  }, [sheetUrl]);

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
        case 'preparedBy':
          valA = (a.preparedBy || '').toLowerCase();
          valB = (b.preparedBy || '').toLowerCase();
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

  const toggleSort = (key: 'date' | 'client' | 'title' | 'number' | 'amount' | 'preparedBy') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const SortIndicator = ({ column }: { column: 'date' | 'client' | 'title' | 'number' | 'amount' | 'preparedBy' }) => {
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
        addToast(`Synchronizace úspěšná. Bylo načteno ${items.length} položek.`, 'success');
      } else {
        addToast("V tabulce nebyly nalezeny žádné platné položky. Zkontrolujte prosím hlavičky sloupců (Název, MJ, Cena, Váha).", 'error');
      }
    } catch (e) {
      console.error("Sync failed", e);
      addToast("Synchronizace selhala. Zkontrolujte prosím URL adresu a zda je tabulka publikována.", 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const searchAres = async (q: string) => {
    const query = q.trim();
    if (!query || query.length < 3) {
      setAresResults([]);
      return;
    }
    
    setIsAresSearching(true);
    try {
      const isIco = /^\d+$/.test(query);
      let mappedResults = [];

      const mapAresAddress = (s: any) => {
          const sidlo = s.sidlo || {};
          
          const ulice = sidlo.nazevUlice || sidlo.nazevObce || '';
          const cisloDom = sidlo.cisloDomovni || '';
          const cisloOr = sidlo.cisloOrientacni || '';
          
          let cislo = '';
          if (cisloDom && cisloOr) cislo = `${cisloDom}/${cisloOr}`;
          else if (cisloDom) cislo = `${cisloDom}`;
          else if (cisloOr) cislo = `${cisloOr}`;
          
          let radek1 = ulice;
          if (ulice && cislo && !ulice.includes(cislo.toString())) {
            radek1 = `${ulice} ${cislo}`;
          } else if (!ulice && cislo) {
            radek1 = cislo;
          }

          let psc = (sidlo.psc || sidlo.kodPsc || '').toString();
          if (psc.length === 5) psc = psc.replace(/(\d{3})(\d{2})/, '$1 $2');
          
          const obec = sidlo.nazevObce || '';
          const castObce = sidlo.nazevCastiObce || '';
          const mestskaCast = sidlo.nazevMestskeCastiObvodu || '';
          
          const mestoFinal = mestskaCast && mestskaCast !== obec ? mestskaCast : obec;

          let radek2Parts = [];
          if (castObce && castObce !== mestoFinal && castObce !== obec) {
              radek2Parts.push(castObce);
          }
          if (psc || mestoFinal) {
              radek2Parts.push(`${psc} ${mestoFinal}`.trim());
          }
          
          let radek2 = radek2Parts.join(', ');

          if (!radek1 && !radek2 && sidlo.textAdresy) {
            return sidlo.textAdresy;
          }

          return `${radek1}\n${radek2}`.trim();
      };

      if (isIco) {
        const response = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${query}`);
        if (response.ok) {
          const s = await response.json();
          mappedResults = [{
            obchodniJmeno: s.obchodniJmeno,
            ico: s.ico,
            dic: s.dic || s.dicSkDph || '', 
            address: {
              full: mapAresAddress(s),
              mesto: s.sidlo?.nazevObce || ''
            }
          }];
        }
      } else {
        const response = await fetch('https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/vyhledat', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ obchodniJmeno: query })
        });
        
        if (response.ok) {
          const data = await response.json();
          const subjekty = data.ekonomickeSubjekty || [];
          mappedResults = subjekty.map((s: any) => ({
            obchodniJmeno: s.obchodniJmeno,
            ico: s.ico,
            dic: s.dic || s.dicSkDph || '',
            address: {
              full: mapAresAddress(s),
              mesto: s.sidlo?.nazevObce || ''
            }
          }));
        }
      }

      setAresResults(mappedResults);
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

  const totalMaterialWeight = useMemo(() => {
    return offer.items
      .filter(i => i.category === 'MATERIAL')
      .reduce((sum, i) => sum + ((Number(i.quantity) || 0) * (Number(i.weightPerUnit) || 0)), 0);
  }, [offer.items]);

  const totalMaterialPrice = useMemo(() => {
    return offer.items
      .filter(i => i.category === 'MATERIAL')
      .reduce((sum, i) => sum + ((Number(i.quantity) || 0) * (Number(i.pricePerUnit) || 0)), 0);
  }, [offer.items]);

  const getItemTotal = (item: OfferItem): number => {
    const q = Number(item.quantity) || 0;
    const p = Number(item.pricePerUnit) || 0;
    switch (item.category) {
      case 'MATERIAL':
      case 'OTHER':
      case 'TAHOKOV':
      case 'LAKOVANI_MOKRE':
      case 'LAKOVANI_PRASKOVE':
      case 'ZINEK_GALVANICKY':
        return q * p;
      
      case 'ZINEK_ZAROVY':
        return totalMaterialWeight * p;
      
      case 'MONTAZ':
        return (Number(item.persons) || 1) * (Number(item.hours) || 0) * p;
      
      case 'DOPRAVA':
        return (Number(item.km) || 0) * p;
      
      case 'PRACE':
        return (totalMaterialPrice * (Number(item.coefficient) || 1)) - totalMaterialPrice;
      
      default:
        return q * p;
    }
  };

  const subtotal = useMemo(() => {
    return offer.items.reduce((sum, item) => sum + getItemTotal(item), 0);
  }, [offer.items, totalMaterialWeight, totalMaterialPrice]);

  const formatPrice = (price: number) => {
    return price.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Kč';
  };

  const tax = useMemo(() => {
    return (subtotal * offer.taxRate) / 100;
  }, [subtotal, offer.taxRate]);

  const total = subtotal + tax;

  const addItem = (category: ItemCategory = 'OTHER') => {
    const newItem: OfferItem = {
      id: generateId(),
      category,
      title: '',
      description: '',
      quantity: 0,
      unit: 'ks',
      pricePerUnit: 0,
    };

    if (category === 'ZINEK_ZAROVY') {
      newItem.title = 'Zinek žárový';
      newItem.unit = 'kg';
      newItem.pricePerUnit = 28;
    } else if (category === 'MONTAZ') {
      newItem.title = 'Montáž';
      newItem.unit = 'h';
      newItem.pricePerUnit = 750;
      newItem.persons = 0;
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
      newItem.title = '';
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
    
    const currentYearOffers = offers.filter(o => o.number?.startsWith(prefix) && o.status !== 'DELETED');
    
    if (currentYearOffers.length === 0) {
      return `${prefix}001`;
    }
    
    const numbers = currentYearOffers.map(o => {
      const parts = o.number.split('-');
      if (parts.length > 1) {
        const numPart = parts[1];
        const num = parseInt(numPart, 10);
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
      preparedBy: preparers.length > 0 ? preparers[0] : '', 
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
    if (activeMainView === 'EDITOR' && !isEditorLocked && targetView !== 'EDITOR') {
      setPendingNavigation(targetView);
      setShowNewOfferConfirm(true);
    } else {
      executeNavigation(targetView);
    }
  };

  const resetOffer = (skipConfirm: boolean = false) => {
    if (skipConfirm) {
      doResetOffer();
    } else {
      requestNavigation('NEW_OFFER');
    }
  };

  useEffect(() => {
    if (userSettings) {
      setPreparers(prev => userSettings.preparers && JSON.stringify(prev) !== JSON.stringify(userSettings.preparers) ? userSettings.preparers : prev);
      setDefaultValidityDays(prev => userSettings.defaultValidityDays !== undefined && prev !== userSettings.defaultValidityDays ? userSettings.defaultValidityDays : prev);
      setLastSync(prev => userSettings.lastSync !== undefined && prev !== userSettings.lastSync ? userSettings.lastSync : prev);
      
      if (!globalSettings?.sheetUrl && userSettings.sheetUrl) {
         setSheetUrl(prev => prev !== userSettings.sheetUrl ? userSettings.sheetUrl : prev);
      }
    }
    
    if (globalSettings) {
      if (globalSettings.sheetUrl) {
         setSheetUrl(prev => prev !== globalSettings.sheetUrl ? globalSettings.sheetUrl : prev);
      }
    }
  }, [userSettings, globalSettings]);

  useEffect(() => {
    if (user && userSettings) {
      const needsSave = 
        JSON.stringify(preparers) !== JSON.stringify(userSettings.preparers) ||
        defaultValidityDays !== userSettings.defaultValidityDays ||
        sheetUrl !== userSettings.sheetUrl ||
        lastSync !== userSettings.lastSync;
        
      if (needsSave) {
        saveSettings({
          preparers,
          defaultValidityDays,
          sheetUrl,
          lastSync
        });
      }
    }
  }, [preparers, defaultValidityDays, sheetUrl, lastSync, user, userSettings]);

  const handleNumericFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  if (supabaseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
         <RefreshCcw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
               <FileText className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">Cenotvor</h1>
          <p className="text-center text-slate-500 text-sm mb-8">Přihlaste se pro přístup ke svým cenovým nabídkám.</p>

          <button 
            onClick={signIn}
            className="w-full py-3 bg-white text-slate-700 border border-slate-200 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
               <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
               <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
               <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
               <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
             </svg>
             Přihlásit se přes Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans text-slate-800 antialiased bg-slate-50 relative">
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
          {user && (
            <>
              <div className="flex items-center gap-3 px-3 mb-4">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center">
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt={user.email || ''} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-white leading-none truncate flex items-center gap-1.5">
                    {user.user_metadata?.full_name || 'Přihlášen'}
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
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {showExportPreview ? (
          <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden">
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
                      
                      const completedOffer = { ...offer, status: 'COMPLETED' as const };
                      setOffer(completedOffer);
                      setIsEditorLocked(true); 
                      
                      if (user) {
                        try {
                          await saveOffer(completedOffer);
                        } catch (err) {
                           console.error("Failed to mark offer as COMPLETED:", err);
                        }
                      }
                      
                      const originalElement = pdfRef.current;
                      if (!originalElement) {
                        setIsGeneratingPDF(false);
                        return;
                      }

                      // NATIVE BROWSER PRINT LOGIC
                      const originalTitle = document.title;
                      const cleanNumber = offer.number.replace('#', '');
                      document.title = `CN_${cleanNumber}`;

                      const style = document.createElement('style');
                      style.innerHTML = `
                        @media print {
                          body > :not(#print-mount) {
                            display: none !important;
                          }
                          #print-mount {
                            display: block !important;
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 210mm;
                            background: white;
                          }
                          @page {
                            size: A4 portrait;
                            margin: 0mm;
                          }
                          * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                          }
                        }
                      `;
                      document.head.appendChild(style);

                      const printMount = document.createElement('div');
                      printMount.id = 'print-mount';
                      
                      const clone = originalElement.cloneNode(true) as HTMLElement;
                      clone.classList.remove('shadow-[0_4px_30px_rgba(0,0,0,0.05)]');
                      clone.classList.remove('min-h-[297mm]');
                      clone.style.boxShadow = 'none';
                      
                      printMount.appendChild(clone);
                      document.body.appendChild(printMount);

                      setTimeout(() => {
                        window.print();
                        
                        document.title = originalTitle;
                        if (document.body.contains(printMount)) {
                          document.body.removeChild(printMount);
                        }
                        if (document.head.contains(style)) {
                          document.head.removeChild(style);
                        }
                        setIsGeneratingPDF(false);
                      }, 150);

                    } catch (err) {
                      console.error("Print generation failed:", err);
                      addToast('Generování tisku selhalo. Zkuste to prosím znovu.', 'error');
                      setIsGeneratingPDF(false);
                    }
                  }}
                  className={`px-4 py-2 text-white text-sm font-bold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all shadow-sm ${isGeneratingPDF ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 overflow-hidden relative'}`}
                >
                  <Printer className={`w-4 h-4 ${isGeneratingPDF ? 'animate-pulse' : ''}`} />
                  {isGeneratingPDF ? 'Příprava...' : 'Vytisknout / PDF'}
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 lg:p-8 flex justify-center bg-slate-50 print:bg-white print:p-0">
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
                        {/* ZHOTOVITEL */}
                        <td className="w-1/2 p-2 align-top border-r border-black" style={{ height: '160px' }}>
                          <div className="flex justify-between gap-2">
                            <div className="text-[12px] text-black space-y-0 leading-tight">
                              <p className="font-bold text-black mb-0.5">Kovovýroba Rohlík s.r.o.</p>
                              <p>K Hrnčířům 323</p>
                              <p>Šeberov, 149 00 Praha 4</p>
                              
                              <div className="h-3"></div>

                              <div className="space-y-0 text-black">
                                <p><span className="font-bold">IČO:</span> 06279589</p>
                                <p><span className="font-bold">DIČ:</span> CZ06279589</p>
                                <p className="font-bold">Plátce DPH</p>
                              </div>

                              <div className="space-y-0 pt-2 text-black text-[11px]">
                                <p><span className="font-bold uppercase">TELEFON:</span> +420 774 214 607</p>
                                <p><span className="font-bold uppercase">E-MAIL:</span> rohlik-vyroba@seznam.cz</p>
                                <p><span className="font-bold uppercase">WEB:</span> https://www.kovorohlik.cz/</p>
                              </div>
                            </div>
                            <img 
                              src="https://krasnykarlik.github.io/Cenotvor/logo.png" 
                              alt="Logo" 
                              className="h-[100px] w-auto max-w-[160px] object-contain self-start shrink-0" 
                            />
                          </div>
                        </td>

                        {/* OBJEDNATEL */}
                        <td className="w-1/2 p-2 align-top border-black" style={{ height: '160px' }}>
                          <div className="text-[12px] text-black space-y-0 leading-tight">
                            <p className="font-bold text-black mb-0.5">{offer.client.name || "—"}</p>
                            
                            <div className="leading-tight">
                              {offer.client.address ? offer.client.address.split('\n').map((line, i) => (
                                <p key={i}>{line}</p>
                              )) : <p>—</p>}
                            </div>
                            
                            <div className="h-3"></div>
                            
                            <div className="space-y-0 text-black">
                              {offer.client.idNumber ? (
                                 <p><span className="font-bold">IČO:</span> {offer.client.idNumber}</p>
                              ) : <p><span className="font-bold">IČO:</span> —</p>}
                              
                              {offer.client.dic ? (
                                 <p><span className="font-bold">DIČ:</span> {offer.client.dic}</p>
                              ) : null}
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
                            className="px-6 py-4 font-bold cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => toggleSort('preparedBy' as any)}
                          >
                            <div className="flex items-center">
                              Vyhotovil
                              <SortIndicator column="preparedBy" />
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
                                  weightPerUnit: Number(item.weightPerUnit) || 0,
                                  persons: Number(item.persons) || 0,
                                  hours: Number(item.hours) || 0,
                                  km: Number(item.km) || 0,
                                  coefficient: Number(item.coefficient) || 0,
                                  extraInfo: item.extraInfo || '',
                                  description: item.description || ''
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
                              <td className="px-6 py-4 cursor-pointer" onClick={handleRowClick}>
                                <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                  {o.preparedBy || '---'}
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
                                              weightPerUnit: Number(item.weightPerUnit) || 0,
                                              persons: Number(item.persons) || 0,
                                              hours: Number(item.hours) || 0,
                                              km: Number(item.km) || 0,
                                              coefficient: Number(item.coefficient) || 0,
                                              extraInfo: item.extraInfo || '',
                                              description: item.description || ''
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
          <div className="w-full xl:w-2/3 2xl:w-3/4 space-y-6 flex flex-col shrink-0 min-w-0">
            <fieldset disabled={isEditorLocked} className="space-y-6 m-0 p-0 border-none min-w-0 w-full group/locked">
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
                    <th className="px-4 py-3 font-semibold w-10">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedItemIds.size > 0 && selectedItemIds.size === offer.items.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItemIds(new Set(offer.items.map(i => i.id)));
                          } else {
                            setSelectedItemIds(new Set());
                          }
                        }}
                      />
                    </th>
                    <th className="px-2 py-3 font-semibold text-left">
                      {selectedItemIds.size > 0 ? (
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOffer(prev => ({ ...prev, items: prev.items.filter(i => !selectedItemIds.has(i.id)) }));
                            const deletedCount = selectedItemIds.size;
                            setSelectedItemIds(new Set());
                            addToast(`Smazáno ${deletedCount} položek.`, 'success');
                          }}
                          className="text-red-500 hover:text-red-700 flex items-center gap-1 shrink-0"
                        >
                          <Trash2 size={14} /> Smazat vybrané
                        </button>
                      ) : (
                        "Popis / Specifikace"
                      )}
                    </th>
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
                        className={`group hover:bg-slate-50/50 transition-colors ${selectedItemIds.has(item.id) ? 'bg-blue-50/50' : ''}`}
                      >
                        <td className="px-4 py-4 w-10">
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedItemIds.has(item.id)}
                            onChange={(e) => {
                              const newSet = new Set(selectedItemIds);
                              if (e.target.checked) newSet.add(item.id);
                              else newSet.delete(item.id);
                              setSelectedItemIds(newSet);
                            }}
                          />
                        </td>
                        <td className="px-2 py-4">
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
                                    placeholder={item.category === 'MATERIAL' ? "Materiál..." : "Název položky..."}
                                    onFocus={() => setActiveAutocompleteId(item.id)}
                                      onBlur={() => setTimeout(() => setActiveAutocompleteId(null), 200)}
                                      onChange={(e) => updateItem(item.id, { title: e.target.value })}
                                    className="w-full font-medium text-slate-900 bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-300"
                                  />
                                  {item.category === 'MATERIAL' && activeAutocompleteId === item.id && (() => {
                                    const searchParts = (item.title || '').toLowerCase().split(/\s+/).filter(Boolean);
                                    const filtered = priceList.filter(p => {
                                      const titleLower = (p.title || '').toLowerCase();
                                      return searchParts.length === 0 || searchParts.every(part => titleLower.includes(part));
                                    }).slice(0, 10);
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
                                  <input type="number" onFocus={handleNumericFocus} value={item.quantity === 0 ? '' : item.quantity} placeholder="0" onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })} className="w-12 text-center p-0 border-none bg-transparent focus:ring-0 font-medium" />
                                </div>
                                <div className="text-slate-300">×</div>
                                <div className="flex flex-col items-center">
                                  <label className="text-[9px] text-slate-400 uppercase">Kg/MJ</label>
                                  <div className="w-12 text-center text-slate-900 font-medium">{item.weightPerUnit || 0}</div>
                                </div>
                                <div className="text-slate-400 font-bold">= {(Number(item.quantity || 0) * (Number(item.weightPerUnit) || 0)).toFixed(1)} kg</div>
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
                                  <input type="number" onFocus={handleNumericFocus} value={item.persons === 0 ? '' : item.persons} placeholder="0" onChange={(e) => updateItem(item.id, { persons: Number(e.target.value) })} className="w-10 text-center p-0 border-none bg-transparent focus:ring-0 font-medium" />
                                </div>
                                <div className="text-slate-300">×</div>
                                <div className="flex flex-col items-center">
                                  <label className="text-[9px] text-slate-400 uppercase">Hodin</label>
                                  <input type="number" onFocus={handleNumericFocus} value={item.hours === 0 ? '' : item.hours} placeholder="0" onChange={(e) => updateItem(item.id, { hours: Number(e.target.value) })} className="w-10 text-center p-0 border-none bg-transparent focus:ring-0 font-medium" />
                                </div>
                                <div className="text-slate-400 font-bold">= {(Number(item.persons || 0)) * (Number(item.hours || 0))} h</div>
                              </>
                            )}

                            {item.category === 'DOPRAVA' && (
                              <div className="flex flex-col items-center">
                                <label className="text-[9px] text-slate-400 uppercase">Vzdálenost (km)</label>
                                <input type="number" onFocus={handleNumericFocus} value={item.km === 0 ? '' : item.km} placeholder="0" onChange={(e) => updateItem(item.id, { km: Number(e.target.value) })} className="w-16 text-center p-0 border-none bg-transparent focus:ring-0 font-bold" />
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
                                    onFocus={handleNumericFocus}
                                    value={!item.coefficient && item.coefficient !== 0 ? '' : item.coefficient}
                                    placeholder="0" 
                                    onChange={(e) => updateItem(item.id, { coefficient: Number(e.target.value) })}
                                    className="w-12 text-center text-[10px] p-0 border-b border-slate-200 bg-transparent focus:ring-0"
                                  />
                                )}
                              </div>
                            )}

                            {(['OTHER', 'TAHOKOV', 'LAKOVANI_MOKRE', 'LAKOVANI_PRASKOVE', 'ZINEK_GALVANICKY'].includes(item.category)) && (
                              <div className="flex flex-col items-center">
                                <label className="text-[9px] text-slate-400 uppercase">Množství (MJ)</label>
                                <input type="number" onFocus={handleNumericFocus} value={item.quantity === 0 ? '' : item.quantity} placeholder="0" onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })} className="w-12 text-center p-0 border-none bg-transparent focus:ring-0 font-bold" />
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
                              onFocus={handleNumericFocus}
                              value={item.pricePerUnit === 0 ? '' : item.pricePerUnit}
                              placeholder="0"
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

          <div className="w-full xl:w-1/3 2xl:w-1/4 space-y-6 shrink-0 pb-8">
            <fieldset disabled={isEditorLocked} className="space-y-6 m-0 p-0 border-none min-w-0 w-full group/locked">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                Zákazník
              </h3>
              <div className="space-y-4">
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
                        rows={2}
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
                    setOffer(draftOffer as Offer);
                    if (!user) {
                      addToast("Pro uložení se musíte nejdříve přihlásit (tlačítko vlevo dole).", 'info');
                      signIn();
                      return;
                    }
                    try {
                      await saveOffer(draftOffer);
                      executeNavigation('DRAFTS');
                    } catch (e) {
                      console.error("Save failed", e);
                      addToast("Chyba při ukládání.", 'error');
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
                      onFocus={handleNumericFocus}
                      value={calcLength === 0 ? '' : calcLength} 
                      placeholder="0"
                      onChange={(e) => setCalcLength(Number(e.target.value))}
                      className="w-24 text-right text-sm font-bold bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl gap-4 border border-slate-100">
                    <span className="text-sm text-slate-600 font-medium tracking-tight">Šířka plechu (m):</span>
                    <input 
                      type="number" 
                      onFocus={handleNumericFocus}
                      value={calcWidth === 0 ? '' : calcWidth} 
                      placeholder="0"
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
                        onFocus={handleNumericFocus}
                        value={calcNeeded === 0 ? '' : calcNeeded} 
                        placeholder="0"
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
                      
                      if (fromEditor && !user) {
                        addToast("Pro uložení do cloudu se musíte nejdříve přihlásit.", 'info');
                        signIn();
                        return;
                      }

                      try {
                        if (fromEditor) {
                          await saveOffer({ ...offer, status: 'DELETED' });
                          setActiveMainView('DRAFTS');
                          resetOffer(true);
                        } else {
                          await softDeleteOffer(idToDelete);
                        }
                        addToast("Nabídka přesunuta do koše.", "success");
                      } catch (err) {
                        console.error("Soft delete modal caught error", err);
                        addToast("Nepodařilo se přesunout do koše.", "error");
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
                        addToast("Nabídka smazána.", "success");
                      } catch (err) {
                        console.error("Hard delete modal caught error", err);
                        addToast("Nepodařilo se smazat nabídku.", "error");
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
                        addToast("Pro uložení se musíte přihlásit.", 'info');
                        signIn();
                        return;
                      }
                      try {
                        await saveOffer({ ...offer, status: 'DRAFT' });
                        executeNavigation(pendingNavigation || 'NEW_OFFER');
                      } catch (err) {
                        console.error('Save failed', err);
                        addToast('Chyba při ukládání.', 'error');
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

        {/* Global Toasts */}
        <div className="fixed bottom-4 right-4 z-[300] flex flex-col gap-2 pointer-events-none">
          <AnimatePresence>
            {toasts.map(toast => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
                  toast.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                    : toast.type === 'error'
                      ? 'bg-red-50 text-red-900 border-red-200'
                      : 'bg-white text-slate-800 border-slate-200'
                }`}
              >
                {toast.type === 'success' && <CheckCircle size={18} className="text-emerald-500" />}
                {toast.type === 'error' && <AlertTriangle size={18} className="text-red-500" />}
                {toast.type === 'info' && <Info size={18} className="text-blue-500" />}
                <p className="text-sm font-medium">{toast.message}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}