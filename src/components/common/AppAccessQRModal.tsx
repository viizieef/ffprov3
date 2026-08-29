import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useFarm } from '../../context/FarmContext';
import { 
  QrCode, 
  X, 
  Copy, 
  Check, 
  Download, 
  Printer, 
  Smartphone, 
  Globe, 
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Layers,
  Building2
} from 'lucide-react';

interface AppAccessQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUrl?: string;
}

export const AppAccessQRModal: React.FC<AppAccessQRModalProps> = ({
  isOpen,
  onClose,
  defaultUrl
}) => {
  const { farmProfile } = useFarm();
  const [copied, setCopied] = useState(false);
  const [stationLocation, setStationLocation] = useState('All Poultry Houses & Egg Sorting Room');
  
  // Resolve current app URL
  const currentOrigin = typeof window !== 'undefined' ? window.location.href.split('#')[0] : 'https://ais-pre-cupjad67n6ntomphx2p2z3-116744961637.asia-east1.run.app';
  const targetUrl = defaultUrl || currentOrigin;
  const [customUrl, setCustomUrl] = useState(targetUrl);
  const [showUrlEditor, setShowUrlEditor] = useState(false);

  const qrContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(customUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSVG = () => {
    if (!qrContainerRef.current) return;
    const svgElement = qrContainerRef.current.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `${farmProfile.name.toLowerCase().replace(/\s+/g, '_')}_access_qrcode.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  const handlePrintBadge = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-forest-950 via-slate-900 to-forest-900 p-5 sm:p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition cursor-pointer"
            aria-label="Close QR Access Modal"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-mint-400 text-forest-950 flex items-center justify-center font-black text-lg shadow-md shadow-mint-400/20 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-mint-400 uppercase tracking-wider px-2 py-0.5 rounded-md bg-forest-900/80 border border-mint-500/20">
                  Quick Mobile Access
                </span>
                <span className="text-[10px] text-slate-300 hidden sm:inline">&bull; Real-time Link</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                Scan QR Code for Instant Access
              </h2>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Main Visual QR Display Box */}
          <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-50 to-slate-100/70 rounded-2xl border border-slate-200 text-center">
            <div 
              ref={qrContainerRef}
              className="p-4 bg-white rounded-2xl shadow-md border border-slate-200/80 inline-block mb-3"
            >
              <QRCodeSVG
                value={customUrl}
                size={210}
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: "/favicon.ico",
                  x: undefined,
                  y: undefined,
                  height: 28,
                  width: 28,
                  excavate: true,
                }}
              />
            </div>

            <div className="space-y-1 max-w-sm">
              <p className="text-xs font-bold text-slate-900 flex items-center justify-center gap-1.5">
                <Smartphone className="w-4 h-4 text-forest-700" />
                <span>Open iOS / Android Camera to Scan</span>
              </p>
              <p className="text-[11px] text-slate-500">
                Staff can instantly open FarmFlow on their mobile phones to record egg counts, mortality, and feed stocks in real-time.
              </p>
            </div>
          </div>

          {/* Quick Access Link & Actions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-forest-700" />
                <span>Direct Access URL</span>
              </label>
              <button
                type="button"
                onClick={() => setShowUrlEditor(!showUrlEditor)}
                className="text-[11px] text-forest-700 hover:text-forest-900 font-semibold hover:underline cursor-pointer"
              >
                {showUrlEditor ? 'Hide Edit' : 'Edit URL'}
              </button>
            </div>

            {showUrlEditor ? (
              <input
                type="text"
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-forest-700 focus:outline-hidden"
              />
            ) : (
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-700 font-mono truncate flex-1 pl-1">
                  {customUrl}
                </p>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    copied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-forest-900 hover:bg-forest-950 text-white shadow-2xs'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Station / House Customization for Printable Poster */}
          <div className="p-3.5 bg-forest-50/60 rounded-xl border border-forest-100 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-forest-950 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-forest-700" />
                <span>Station Posting Label</span>
              </span>
              <span className="text-[10px] text-forest-700 font-medium">For printed signage</span>
            </div>
            <input
              type="text"
              value={stationLocation}
              onChange={e => setStationLocation(e.target.value)}
              placeholder="e.g., House 1 Entrance, Egg Sorting Room, Admin Office"
              className="w-full px-3 py-1.5 bg-white text-xs border border-forest-200 rounded-lg text-forest-950 focus:ring-2 focus:ring-forest-600 focus:outline-hidden"
            />
          </div>

          {/* Action Buttons: Download & Print */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handleDownloadSVG}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer border border-slate-200"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Download QR (SVG)</span>
            </button>

            <button
              type="button"
              onClick={handlePrintBadge}
              className="px-4 py-2.5 bg-forest-900 hover:bg-forest-950 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-mint-400" />
              <span>Print Station Poster</span>
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500 shrink-0">
          <span>New staff will see the <strong>Login & Registration</strong> page first upon scanning.</span>
        </div>
      </div>
    </div>
  );
};
