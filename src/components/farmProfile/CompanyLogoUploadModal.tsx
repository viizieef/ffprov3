import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Check, 
  Trash2, 
  Link as LinkIcon, 
  Sparkles, 
  AlertCircle,
  Building2
} from 'lucide-react';

interface CompanyLogoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogoUrl?: string;
  farmName: string;
  onSaveLogo: (logoUrl: string) => void;
}

const PRESET_LOGOS = [
  {
    id: 'cobb-ross',
    name: 'PS Breeder Crest',
    url: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=400&q=80',
    description: 'Parent Stock Operations'
  },
  {
    id: 'poultry-shield',
    name: 'Agri-Industrial Seal',
    url: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=400&q=80',
    description: 'Biosecure Poultry Facility'
  },
  {
    id: 'gold-egg',
    name: 'Golden Hatchery Badge',
    url: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=400&q=80',
    description: 'Hatching Egg Production'
  },
  {
    id: 'pasture-green',
    name: 'Eco-Farm Emblem',
    url: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=400&q=80',
    description: 'Poultry Agro Complex'
  }
];

export const CompanyLogoUploadModal: React.FC<CompanyLogoUploadModalProps> = ({
  isOpen,
  onClose,
  currentLogoUrl = '',
  farmName,
  onSaveLogo
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [selectedLogo, setSelectedLogo] = useState<string>(currentLogoUrl);
  const [urlInput, setUrlInput] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleProcessFile = (file: File) => {
    setErrorMessage(null);
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, JPEG, WEBP, or SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedLogo(reader.result);
        setFileDetails({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`
        });
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read the image file. Please try another image.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setErrorMessage(null);
    setSelectedLogo(urlInput.trim());
    setFileDetails(null);
  };

  const handleSave = () => {
    onSaveLogo(selectedLogo);
    onClose();
  };

  const handleRemove = () => {
    setSelectedLogo('');
    setFileDetails(null);
    onSaveLogo('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-forest-950 text-white flex items-center justify-between border-b border-forest-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mint-400 text-forest-950 flex items-center justify-center font-black">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Upload Company Logo</h3>
              <p className="text-xs text-mint-400/90 font-medium">Farm Identity & Visual Branding for {farmName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-forest-300 hover:text-white hover:bg-forest-900 rounded-xl transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Method Tabs */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-white text-forest-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Image</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'url'
                  ? 'bg-white text-forest-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Image URL</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'presets'
                  ? 'bg-white text-forest-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-mint-600" />
              <span>Farm Emblems</span>
            </button>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tab 1: Upload File with Drag and Drop */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center min-h-[160px] ${
                  isDragging
                    ? 'border-mint-500 bg-mint-50/50 scale-[0.99]'
                    : 'border-slate-300 hover:border-mint-500 hover:bg-slate-50/80 bg-slate-50/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-white text-forest-900 border border-slate-200 shadow-xs flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 text-forest-900" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  Click to select or drag & drop company logo
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports PNG, JPG, JPEG, SVG or WEBP (Max 5MB)
                </p>
              </div>

              {fileDetails && (
                <div className="p-3 bg-mint-50/60 border border-mint-200/80 rounded-xl text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <ImageIcon className="w-4 h-4 text-forest-800 shrink-0" />
                    <span className="font-semibold text-forest-950 truncate">{fileDetails.name}</span>
                    <span className="text-forest-700 text-[11px] font-mono">({fileDetails.size})</span>
                  </div>
                  <span className="text-forest-700 font-bold flex items-center gap-1 shrink-0">
                    <Check className="w-3.5 h-3.5" /> Ready
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: URL */}
          {activeTab === 'url' && (
            <form onSubmit={handleApplyUrl} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Web-Hosted Logo Image Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/farm-logo.png"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-mint-500 focus:border-mint-500 outline-hidden"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-forest-950 hover:bg-forest-900 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    Load Preview
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Ensure the link is publicly accessible (HTTPS supported).
              </p>
            </form>
          )}

          {/* Tab 3: Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 font-medium">
                Choose a pre-configured poultry breeding crest or emblem:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {PRESET_LOGOS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedLogo(preset.url);
                      setFileDetails(null);
                      setErrorMessage(null);
                    }}
                    className={`p-3 rounded-2xl border text-left transition flex items-center gap-3 ${
                      selectedLogo === preset.url
                        ? 'border-mint-500 bg-mint-50/50 ring-2 ring-mint-400'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{preset.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{preset.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live Preview Display */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Logo Live Preview</span>
              {selectedLogo && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLogo('');
                    setFileDetails(null);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Selection</span>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
              {/* Main Avatar Scale */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-18 h-18 rounded-2xl bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center p-1 shadow-xs">
                  {selectedLogo ? (
                    <img
                      src={selectedLogo}
                      alt="Logo preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain rounded-xl"
                      onError={() => setErrorMessage('Could not render image. Please check format or URL.')}
                    />
                  ) : (
                    <span className="text-xs font-bold text-slate-400 text-center px-2">No Logo</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Header Scale</span>
              </div>

              {/* Sidebar Scale */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-xl bg-forest-950 p-1 border border-forest-800 flex items-center justify-center shadow-xs">
                  {selectedLogo ? (
                    <img
                      src={selectedLogo}
                      alt="Sidebar logo preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain rounded-lg bg-white/95"
                    />
                  ) : (
                    <span className="text-mint-400 font-black text-xs">FF</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Sidebar Scale</span>
              </div>

              {/* Brand Text Preview */}
              <div className="min-w-0 text-center sm:text-left flex-1 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-4">
                <p className="text-xs text-slate-400 font-medium">Application Header Display</p>
                <p className="text-sm font-bold text-slate-900 truncate">{farmName}</p>
                <p className="text-[11px] text-mint-600 font-semibold">Official Poultry Enterprise</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {currentLogoUrl ? (
            <button
              type="button"
              onClick={handleRemove}
              className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Current Logo</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-mint-400 hover:bg-mint-300 text-forest-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Save & Apply Logo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
