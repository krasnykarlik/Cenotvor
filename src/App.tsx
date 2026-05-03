/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
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

const LOGO_BASE64 = "data:image/png;base64,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";

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
  
  // TAHOKOV se počítá do váhy pro zinek
  const matWeight = offerItems.reduce((sum, i) => {
    if (i.category === 'MATERIAL') return sum + (Number(i.quantity || 0) * Number(i.weightPerUnit || 0));
    if (i.category === 'TAHOKOV') return sum + Number(i.quantity || 0); // U tahokovu je Množství(quantity) přímo hmotnost
    return sum;
  }, 0);
  
  // TAHOKOV se NEPOČÍTÁ do ceny materiálu pro výpočet koeficientu práce
  const matPrice = offerItems.filter(i => i.category === 'MATERIAL').reduce((sum, i) => sum + (Number(i.quantity || 0) * Number(i.pricePerUnit || 0)), 0);

  return offerItems.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.pricePerUnit) || 0;
    
    switch (item.category) {
      case 'MATERIAL':
      case 'OTHER':
      case 'LAKOVANI_MOKRE':
      case 'LAKOVANI_PRASKOVE':
      case 'ZINEK_GALVANICKY':
        return sum + (qty * price);
      case 'TAHOKOV':
        return sum + price; // Tady je "price" rovnou finální celková částka, nenásobíme množstvím
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

const INITIAL_OFFER: Offer = {
  ...EMPTY_OFFER,
  id: generateId(),
  number: `#${new Date().getFullYear()}-001`,
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
      .filter(i => i.category === 'MATERIAL' || i.category === 'TAHOKOV')
      .reduce((sum, i) => {
         if (i.category === 'MATERIAL') {
            return sum + ((Number(i.quantity) || 0) * (Number(i.weightPerUnit) || 0));
         }
         if (i.category === 'TAHOKOV') {
            return sum + (Number(i.quantity) || 0); // Množství u tahokovu je rovnou hmotnost
         }
         return sum;
      }, 0);
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
      case 'LAKOVANI_MOKRE':
      case 'LAKOVANI_PRASKOVE':
      case 'ZINEK_GALVANICKY':
        return q * p;
      
      case 'TAHOKOV':
        return p; // Cena tahokovu se nenásobí množstvím
      
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
      newItem.unit = ''; // Prázdná MJ pro Tahokov
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
                        <td className="w-1/2 p-2 align-top border-r border-black relative" style={{ height: '160px' }}>
                          <div className="text-[12px] text-black space-y-0 leading-tight">
                            
                            {/* Ochranný padding pouze pro vrchní část vedle loga */}
                            <div className="pr-[160px]">
                              <p className="font-bold text-black mb-0.5">Kovovýroba Rohlík s.r.o.</p>
                              <p>K Hrnčířům 323</p>
                              <p>Šeberov, 149 00 Praha 4</p>
                            </div>
                            
                            <div className="h-3"></div>

                            <div className="space-y-0 text-black">
                              <p><span className="font-bold">IČO:</span> 06279589</p>
                              <p><span className="font-bold">DIČ:</span> CZ06279589</p>
                              <p className="font-bold">Plátce DPH</p>
                            </div>

                            {/* Přidáno whitespace-nowrap proti zalamování dlouhých adres */}
                            <div className="space-y-0 pt-2 text-black text-[11px] whitespace-nowrap">
                              <p><span className="font-bold uppercase">TELEFON:</span> +420 774 214 607</p>
                              <p><span className="font-bold uppercase">E-MAIL:</span> rohlik-vyroba@seznam.cz</p>
                              <p><span className="font-bold uppercase">WEB:</span> https://www.kovorohlik.cz/</p>
                            </div>
                          </div>
                          <img 
                            src={LOGO_BASE64} 
                            alt="Logo" 
                            className="absolute top-2 right-[40px] h-[60px] w-auto max-w-[120px] object-contain" 
                          />
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
                          categories: ['MATERIAL', 'PRACE', 'OTHER', 'TAHOKOV'] 
                        },
                        { 
                          label: 'Povrchová úprava', 
                          key: 'surface' as const,
                          categories: ['ZINEK_ZAROVY', 'ZINEK_GALVANICKY', 'LAKOVANI_MOKRE', 'LAKOVANI_PRASKOVE'] 
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
                              'MATERIAL': 'material', 'PRACE': 'material', 'OTHER': 'material', 'TAHOKOV': 'material',
                              'ZINEK_ZAROVY': 'surface', 'ZINEK_GALVANICKY': 'surface', 'LAKOVANI_MOKRE': 'surface', 'LAKOVANI_PRASKOVE': 'surface',
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
                              'MATERIAL': 'material', 'PRACE': 'material', 'OTHER': 'material', 'TAHOKOV': 'material',
                              'ZINEK_ZAROVY': 'surface', 'ZINEK_GALVANICKY': 'surface', 'LAKOVANI_MOKRE': 'surface', 'LAKOVANI_PRASKOVE': 'surface',
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
                              'MATERIAL': 'material', 'PRACE': 'material', 'OTHER': 'material', 'TAHOKOV': 'material',
                              'ZINEK_ZAROVY': 'surface', 'ZINEK_GALVANICKY': 'surface', 'LAKOVANI_MOKRE': 'surface', 'LAKOVANI_PRASKOVE': 'surface',
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
                                'MATERIAL': 'material', 'PRACE': 'material', 'OTHER': 'material', 'TAHOKOV': 'material',
                                'ZINEK_ZAROVY': 'surface', 'ZINEK_GALVANICKY': 'surface', 'LAKOVANI_MOKRE': 'surface', 'LAKOVANI_PRASKOVE': 'surface',
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
                                  (item.category === 'MATERIAL' || item.category === 'TAHOKOV') ? 'bg-amber-100 text-amber-700' :
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
                                    placeholder={(item.category === 'MATERIAL' || item.category === 'TAHOKOV') ? "Materiál/Tahokov..." : "Název položky..."}
                                    onFocus={() => setActiveAutocompleteId(item.id)}
                                      onBlur={() => setTimeout(() => setActiveAutocompleteId(null), 200)}
                                      onChange={(e) => updateItem(item.id, { title: e.target.value })}
                                    className="w-full font-medium text-slate-900 bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-300"
                                  />
                                  {(item.category === 'MATERIAL' || item.category === 'TAHOKOV') && activeAutocompleteId === item.id && (() => {
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
                              {(item.category === 'MATERIAL' || item.category === 'TAHOKOV') ? (
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
                          {item.unit && (
                            <div className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded inline-block min-w-[32px]">
                              {item.unit}
                            </div>
                          )}
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
                                  <input type="number" onFocus={handleNumericFocus} value={item.weightPerUnit === 0 ? '' : item.weightPerUnit} placeholder="0" onChange={(e) => updateItem(item.id, { weightPerUnit: Number(e.target.value) })} className="w-12 text-center text-slate-900 p-0 border-none bg-transparent focus:ring-0 font-medium" />
                                </div>
                                <div className="text-slate-400 font-bold">= {(Number(item.quantity || 0) * (Number(item.weightPerUnit) || 0)).toFixed(1)} kg</div>
                              </>
                            )}

                            {item.category === 'TAHOKOV' && (
                              <div className="flex flex-col items-center">
                                <label className="text-[9px] text-slate-400 uppercase">Hmotnost (kg)</label>
                                <input 
                                  type="number" 
                                  onFocus={handleNumericFocus} 
                                  value={item.quantity === 0 ? '' : item.quantity} 
                                  placeholder="0" 
                                  onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })} 
                                  className="w-16 text-center p-0 border-none bg-transparent focus:ring-0 font-bold" 
                                  title="Hmotnost pro výpočet žárového zinku"
                                />
                              </div>
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

                            {(['OTHER', 'LAKOVANI_MOKRE', 'LAKOVANI_PRASKOVE', 'ZINEK_GALVANICKY'].includes(item.category)) && (
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
                          ) : item.category === 'TAHOKOV' ? (
                            <span className="text-slate-400">—</span>
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
                          {item.category === 'TAHOKOV' ? (
                            <div className="flex items-center justify-end gap-1">
                              <input 
                                type="number"
                                onFocus={handleNumericFocus}
                                value={item.pricePerUnit === 0 ? '' : item.pricePerUnit}
                                placeholder="0"
                                onChange={(e) => updateItem(item.id, { pricePerUnit: Number(e.target.value) })}
                                className="w-24 text-right bg-transparent border-b border-slate-300 p-0 focus:ring-0 tabular-nums font-bold text-slate-900"
                              />
                              <span>{offer.currency === 'CZK' ? 'Kč' : offer.currency}</span>
                            </div>
                          ) : (
                            <>{getItemTotal(item).toLocaleString()} {offer.currency === 'CZK' ? 'Kč' : offer.currency}</>
                          )}
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