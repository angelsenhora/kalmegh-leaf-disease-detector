/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Leaf, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  RefreshCw, 
  ChevronRight,
  Info,
  ShieldCheck,
  Sprout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { analyzeLeafImage, DetectionResult } from './services/geminiService';
import { cn } from './lib/utils';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check permissions.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setImage(dataUrl);
        stopCamera();
        setResult(null);
        setError(null);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    
    setIsAnalyzing(true);
    setError(null);
    try {
      const analysis = await analyzeLeafImage(image);
      setResult(analysis);
    } catch (err) {
      console.error(err);
      setError("Analysis failed. Please try again with a clearer image.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-1.5 rounded-lg">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">KalmeghCare AI</h1>
          </div>
          <div className="text-xs font-mono text-stone-500 uppercase tracking-widest bg-stone-100 px-2 py-1 rounded">
            v1.0.0-Beta
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-8">
        {/* Hero Section */}
        <section className="mb-12 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-stone-900 mb-4 tracking-tight"
          >
            Kalmegh Leaf Disease Detection
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-stone-600 max-w-xl mx-auto leading-relaxed"
          >
            Protect your <span className="italic font-serif">Andrographis paniculata</span> crops with instant AI-powered diagnosis and expert treatment recommendations.
          </motion.p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Input */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500 mb-4 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Capture or Upload
                </h3>
                
                <div className="aspect-square relative bg-stone-100 rounded-xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center overflow-hidden group">
                  {isCameraOpen ? (
                    <div className="absolute inset-0 z-20 bg-black">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4">
                        <button 
                          onClick={capturePhoto}
                          className="bg-white text-stone-900 px-6 py-2 rounded-full font-semibold shadow-lg hover:bg-stone-100 transition-colors"
                        >
                          Capture
                        </button>
                        <button 
                          onClick={stopCamera}
                          className="bg-stone-800 text-white px-6 py-2 rounded-full font-semibold shadow-lg hover:bg-stone-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : image ? (
                    <>
                      <img src={image} alt="Selected leaf" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button 
                          onClick={() => setImage(null)}
                          className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-8">
                      <div className="bg-white p-4 rounded-full shadow-sm inline-block mb-4">
                        <Upload className="w-8 h-8 text-stone-400" />
                      </div>
                      <p className="text-stone-600 font-medium mb-2">Select a leaf image</p>
                      <p className="text-stone-400 text-xs">JPG, PNG up to 10MB</p>
                    </div>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-stone-200 rounded-xl font-semibold text-stone-700 hover:bg-stone-50 transition-all active:scale-95"
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </button>
                  <button 
                    onClick={startCamera}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-stone-200 rounded-xl font-semibold text-stone-700 hover:bg-stone-50 transition-all active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    Camera
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>

                {image && !result && !isAnalyzing && (
                  <button 
                    onClick={handleAnalyze}
                    className="w-full mt-6 bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-900/10 hover:bg-emerald-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    Start AI Analysis
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}

                {isAnalyzing && (
                  <div className="w-full mt-6 bg-stone-100 text-stone-500 py-4 rounded-xl font-bold flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing Leaf...
                  </div>
                )}
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
              <h4 className="flex items-center gap-2 text-emerald-800 font-semibold mb-2">
                <Info className="w-4 h-4" />
                Tips for best results
              </h4>
              <ul className="text-sm text-emerald-700 space-y-2">
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  Ensure the leaf is well-lit and in focus.
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  Capture the leaf against a neutral background.
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  Include both healthy and symptomatic areas.
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-red-50 border border-red-100 p-6 rounded-2xl flex items-start gap-4"
                >
                  <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-red-900">Analysis Error</h4>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </motion.div>
              )}

              {result ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Result Header */}
                  <div className={cn(
                    "p-6 rounded-2xl border flex items-center justify-between",
                    result.disease.toLowerCase() === 'healthy' 
                      ? "bg-emerald-50 border-emerald-100" 
                      : "bg-amber-50 border-amber-100"
                  )}>
                    <div className="flex items-center gap-4">
                      {result.disease.toLowerCase() === 'healthy' ? (
                        <div className="bg-emerald-600 p-2 rounded-full">
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                      ) : (
                        <div className="bg-amber-600 p-2 rounded-full">
                          <AlertCircle className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">Diagnosis</p>
                        <h3 className="text-2xl font-bold text-stone-900">{result.disease}</h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">Confidence</p>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold",
                        result.confidence === 'High' ? "bg-emerald-200 text-emerald-800" :
                        result.confidence === 'Medium' ? "bg-amber-200 text-amber-800" :
                        "bg-red-200 text-red-800"
                      )}>
                        {result.confidence}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Observation
                    </h4>
                    <p className="text-stone-700 leading-relaxed">{result.description}</p>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-stone-500 mb-4 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Management Plan
                    </h4>
                    <div className="space-y-3">
                      {result.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
                          <div className="w-6 h-6 rounded-full bg-white border border-stone-200 flex items-center justify-center text-xs font-bold text-stone-500 shrink-0">
                            {i + 1}
                          </div>
                          <p className="text-sm text-stone-700">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Analysis */}
                  <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-stone-500 mb-4 flex items-center gap-2">
                      <Sprout className="w-4 h-4" />
                      Expert Pathologist Analysis
                    </h4>
                    <div className="markdown-body">
                      <Markdown>{result.rawAnalysis}</Markdown>
                    </div>
                  </div>

                  <button 
                    onClick={reset}
                    className="w-full py-4 rounded-xl border border-stone-200 font-semibold text-stone-600 hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Analyze Another Leaf
                  </button>
                </motion.div>
              ) : !isAnalyzing && !error && (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-2xl border border-stone-200 border-dashed">
                  <div className="bg-stone-50 p-6 rounded-full mb-6">
                    <Leaf className="w-12 h-12 text-stone-200" />
                  </div>
                  <h3 className="text-lg font-semibold text-stone-900 mb-2">Ready for Analysis</h3>
                  <p className="text-stone-500 text-sm max-w-xs">
                    Upload or capture a photo of a Kalmegh leaf to receive an instant AI-powered health report.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-stone-200 py-12 px-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-stone-900">KalmeghCare AI</span>
          </div>
          <p className="text-stone-400 text-sm text-center">
            Designed for agricultural research and medicinal plant protection.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-stone-400 hover:text-stone-600 transition-colors text-sm font-medium">Privacy</a>
            <a href="#" className="text-stone-400 hover:text-stone-600 transition-colors text-sm font-medium">Terms</a>
            <a href="#" className="text-stone-400 hover:text-stone-600 transition-colors text-sm font-medium">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

