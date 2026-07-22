import React, { useState } from 'react';
import { AppSettings, LicenseData } from '../types';
import { buildLicenseData, HARDCODED_MASTER_KEYS } from '../utils/crypto';
import { ShieldAlert, ShieldCheck, Key, Copy, Check, Sparkles, Clock, AlertTriangle, Shield } from 'lucide-react';

interface LicenseGateProps {
  deviceId: string;
  clockWatermark: number;
  currentLicense: LicenseData | null;
  settings: AppSettings;
  onActivateLicense: (license: LicenseData) => void;
  onCloseModal?: () => void;
  isModalView?: boolean;
}

export const LicenseGate: React.FC<LicenseGateProps> = ({
  deviceId,
  clockWatermark,
  currentLicense,
  settings,
  onActivateLicense,
  onCloseModal,
  isModalView = false,
}) => {
  const [inputKey, setInputKey] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedDevice, setCopiedDevice] = useState(false);

  const copyDeviceId = () => {
    navigator.clipboard.writeText(deviceId);
    setCopiedDevice(true);
    setTimeout(() => setCopiedDevice(false), 2000);
  };

  const handleActivate = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!inputKey.trim()) {
      setErrorMsg('Please enter or paste a License Key.');
      return;
    }

    const license = buildLicenseData(inputKey.trim(), deviceId, clockWatermark);
    if (!license || !license.isValid) {
      setErrorMsg(
        license?.isExpired
          ? `License has expired and grace period has elapsed.`
          : 'Invalid License Key format or device mismatch signature.'
      );
      return;
    }

    setSuccessMsg(`Successfully activated ${license.payload.licenseType} License! Valid until ${new Date(license.payload.expiresAt).toLocaleDateString()}`);
    onActivateLicense(license);

    if (onCloseModal) {
      setTimeout(() => onCloseModal(), 1500);
    }
  };

  const handleMasterActivate = (type: 'USER' | 'ADMIN') => {
    setErrorMsg(null);
    const key = type === 'ADMIN' ? HARDCODED_MASTER_KEYS.ADMIN : HARDCODED_MASTER_KEYS.USER;
    setInputKey(key);
    const license = buildLicenseData(key, deviceId, clockWatermark);
    if (license) {
      onActivateLicense(license);
      setSuccessMsg(`Activated Master ${type} License Key (${key})!`);
    }
  };

  return (
    <div className={`p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-2xl mx-auto ${isModalView ? 'my-4' : 'my-8'}`}>
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <Key className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            License Key Activation
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Device-bound offline RSA-signed activation mechanism
          </p>
        </div>
      </div>

      {/* Current License Details if Active */}
      {currentLicense && currentLicense.isValid && (
        <div className={`p-4 rounded-xl border mb-6 ${
          currentLicense.isInGracePeriod
            ? 'bg-amber-50/80 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200'
            : currentLicense.payload.licenseType === 'ADMIN'
            ? 'bg-purple-50/80 border-purple-200 text-purple-900 dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-200'
            : 'bg-emerald-50/80 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>{currentLicense.payload.licenseType} License Active</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 font-semibold border border-current opacity-80">
              {currentLicense.daysRemaining} days left
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs opacity-90">
            <div>
              <span className="font-semibold">Holder:</span> {currentLicense.payload.holderName || 'Default'}
            </div>
            <div>
              <span className="font-semibold">Expires:</span> {new Date(currentLicense.payload.expiresAt).toLocaleDateString()}
            </div>
            <div>
              <span className="font-semibold">License ID:</span> {currentLicense.payload.licenseId}
            </div>
            <div>
              <span className="font-semibold">Status:</span> {currentLicense.isInGracePeriod ? 'Grace Period' : 'Fully Active'}
            </div>
          </div>
        </div>
      )}

      {/* Device ID Card */}
      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 mb-6">
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
          Your Unique Device Fingerprint (Device ID)
        </label>
        <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-sm text-slate-800 dark:text-slate-200">
          <span className="font-semibold tracking-wider">{deviceId}</span>
          <button
            onClick={copyDeviceId}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
          >
            {copiedDevice ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedDevice ? 'Copied' : 'Copy ID'}</span>
          </button>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
          Provide this Device ID to your system administrator to generate a personalized signed License Key.
        </p>
      </div>

      {/* License Input Form */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Enter License Key
          </label>
          <textarea
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            rows={3}
            placeholder="Paste your signed License Key string here (e.g. eyJsaWNlbnNlSWQi...)"
            className="w-full text-xs font-mono p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-medium">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            onClick={handleActivate}
            className="px-5 py-2.5 rounded-xl bg-[#5A6D5B] hover:bg-[#485749] text-white font-semibold text-xs transition-all shadow-md"
          >
            Verify & Activate Key
          </button>

          {/* Hardcoded Master Activation Keys */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleMasterActivate('ADMIN')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 text-xs font-semibold transition-colors border border-purple-200 dark:border-purple-800"
            >
              <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Master Admin Key</span>
            </button>
          </div>
        </div>

        {/* Master Admin Key Card Display */}
        <div className="p-3 bg-[#F5F2EA] dark:bg-[#282C28] rounded-xl border border-[#E8E2D2] dark:border-[#353B35] text-xs space-y-1">
          <div className="flex items-center justify-between font-mono font-bold text-[#3E4A3E] dark:text-[#F5F2EA]">
            <span>Admin License Key:</span>
            <span className="bg-white dark:bg-[#1E211E] px-2 py-0.5 rounded border border-[#E8E2D2] dark:border-[#353B35] text-[#C5A059] font-bold select-all">
              {HARDCODED_MASTER_KEYS.ADMIN}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
