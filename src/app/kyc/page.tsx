"use client";

import { useState, useRef } from "react";
import { useAppContext } from "@/app/AppContext";
import { ShieldCheck, Upload, AlertCircle, Trash2, CheckCircle2 } from "lucide-react";
import { cn } from "@/utils/cn";

export default function KYCPage() {
  const { kycStatus, submitKYC, isLoggedIn } = useAppContext();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;

    setIsUploading(true);
    
    // Simulate parsing the file into a base64 string for the prototype
    const reader = new FileReader();
    reader.onload = (e) => {
       const result = e.target?.result as string;
       setTimeout(() => {
        submitKYC(result);
        setIsUploading(false);
        setFile(null);
      }, 1500);
    };
    reader.readAsDataURL(file);
  };

  if (!isLoggedIn) {
     return (
      <div className="max-w-2xl mx-auto mt-16 text-center">
         <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Please Login First</h2>
        <p className="text-slate-400">You need an account to submit KYC documents. Use the top bar to login.</p>
      </div>
     )
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Identity Verification (KYC)</h1>
        <p className="text-slate-400">
          To comply with regulatory standards and ensure a secure environment, we require a brief identity check.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
        
        {kycStatus === "approved" && (
          <div className="flex flex-col items-center text-center gap-4 py-8">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-emerald-400">Identity Verified</h2>
            <p className="text-slate-400">Your account is fully unrestricted. Thank you for helping us maintain a secure platform.</p>
          </div>
        )}

        {kycStatus === "pending" && (
          <div className="flex flex-col items-center text-center gap-4 py-8">
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center animate-pulse">
              <AlertCircle className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-amber-400">Verification Pending</h2>
            <p className="text-slate-400 max-w-md">
              Your document is currently under manual review by our admin team.
              <br/><br/>
              <span className="text-xs text-slate-500 italic">
                Note: In this prototype, go to the Admin Panel (top right) to review submissions.
              </span>
            </p>
          </div>
        )}

        {kycStatus === "none" && (
          <div className="space-y-6">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-200">
                <p className="font-semibold mb-1">Strict Privacy Notice</p>
                <p>
                  Documents uploaded here are temporarily held in volatile memory solely for verification purposes and are <strong>permanently deleted</strong> immediately after the review concludes. They are never stored on persistent storage.
                </p>
              </div>
            </div>

            <div 
              className={cn(
                "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors",
                file ? "border-emerald-500/50 bg-emerald-500/5" : "border-slate-700 hover:border-slate-500 bg-slate-950/50"
              )}
            >
              {file ? (
                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <p className="font-medium text-emerald-400">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button 
                    onClick={() => setFile(null)}
                    className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-slate-500 mb-4" />
                  <p className="font-medium mb-1">Upload a valid Government ID</p>
                  <p className="text-sm text-slate-400 mb-4">Passport, Driver's License, or National ID card (Image file)</p>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition-colors"
                  >
                    Select File
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Encrypting and Uploading...
                </>
              ) : (
                "Submit for Verification"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
