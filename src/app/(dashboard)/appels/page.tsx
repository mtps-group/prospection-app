'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useToast } from '@/providers/ToastProvider';
import Link from 'next/link';
import {
  Upload, Mic, Loader2, CheckCircle, XCircle, AlertCircle,
  Phone, TrendingUp, TrendingDown, MessageSquare, Clock,
  Target, Zap, Mail, ChevronDown, ChevronUp, RotateCcw,
  User, Building2, Flame,
} from 'lucide-react';
import type { CallAnalysis, CallAnalysisResult } from '@/types';

// ── Helpers ────────────────────────────────────────────────────────────────

function ScoreBadge({ score, label, color }: { score: number; label: string; color: string }) {
  const pct = (score / 10) * 100;
  return (
    <div className={`rounded-2xl p-5 flex flex-col items-center gap-2 ${color}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <div className="relative h-20 w-20">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-20" />
          <circle
            cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeDasharray={`${pct} 100`}
            strokeLinecap="round"
            className="opacity-90"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-black">{score.toFixed(1)}</span>
      </div>
      <p className="text-xs opacity-60">/ 10</p>
    </div>
  );
}

function BANTBadge({ label, value }: { label: string; value: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
      {value ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {label}
    </div>
  );
}

function SentimentDot({ label, value }: { label: string; value: string }) {
  const color =
    value.includes('positif') || value.includes('chaud') ? 'bg-green-400' :
    value.includes('hésit') || value.includes('neutre') ? 'bg-amber-400' :
    'bg-red-400';
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`h-4 w-4 rounded-full ${color} ring-2 ring-white shadow`} />
      <p className="text-[10px] text-text-muted uppercase font-semibold tracking-wide">{label}</p>
      <p className="text-xs text-text-secondary capitalize">{value}</p>
    </div>
  );
}

// ── Analysis Display ────────────────────────────────────────────────────────

function AnalysisDisplay({ analysis, prospectName, prospectCompany }: {
  analysis: CallAnalysisResult;
  prospectName?: string | null;
  prospectCompany?: string | null;
}) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  return (
    <div className="space-y-6">

      {/* En-tête prospect + scores */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-text">Résultat de l'analyse</h2>
            {(prospectName || prospectCompany) && (
              <div className="flex items-center gap-3 mt-1 text-sm text-text-secondary">
                {prospectName && <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{prospectName}</span>}
                {prospectCompany && <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{prospectCompany}</span>}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <ScoreBadge
              score={analysis.score_call}
              label="Qualité appel"
              color="bg-blue-50 text-blue-600"
            />
            <ScoreBadge
              score={analysis.score_prospect}
              label="Température"
              color={analysis.score_prospect >= 7 ? 'bg-green-50 text-green-600' : analysis.score_prospect >= 4 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}
            />
          </div>
        </div>

        {/* Résumé */}
        <div className="rounded-xl bg-gray-50 p-4 text-sm text-text-secondary leading-relaxed">
          <p className="font-semibold text-text mb-1 text-xs uppercase tracking-wide">Résumé</p>
          {analysis.summary}
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-text">{analysis.talk_ratio.salesperson}%</p>
          <p className="text-xs text-text-muted mt-1">Temps de parole (toi)</p>
          <p className="text-xs text-text-muted">{analysis.talk_ratio.prospect}% prospect</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-text">{analysis.questions_asked}</p>
          <p className="text-xs text-text-muted mt-1">Questions posées</p>
          <p className="text-xs text-green-600 font-medium">{analysis.questions_asked >= 8 ? 'Excellent' : analysis.questions_asked >= 5 ? 'Bien' : 'À améliorer'}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-text">{analysis.filler_words.count}</p>
          <p className="text-xs text-text-muted mt-1">Mots de remplissage</p>
          {analysis.filler_words.words.length > 0 && (
            <p className="text-xs text-text-muted">"{analysis.filler_words.words.slice(0, 2).join('", "')}"</p>
          )}
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-text">{analysis.objections.length}</p>
          <p className="text-xs text-text-muted mt-1">Objections</p>
          <p className="text-xs text-text-muted">{analysis.interest_signals.length} signaux d'intérêt</p>
        </div>
      </div>

      {/* Bien / Pas bien */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
          <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4" /> Ce qui s'est bien passé
          </h3>
          <ul className="space-y-2">
            {analysis.what_went_well.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
          <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2 text-sm">
            <TrendingDown className="h-4 w-4" /> Points à améliorer
          </h3>
          <ul className="space-y-2">
            {analysis.what_went_wrong.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Objections + Signaux */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-text mb-3 flex items-center gap-2 text-sm">
            <MessageSquare className="h-4 w-4 text-orange-500" /> Objections détectées
          </h3>
          {analysis.objections.length === 0 ? (
            <p className="text-sm text-text-muted">Aucune objection majeure détectée.</p>
          ) : (
            <ul className="space-y-3">
              {analysis.objections.map((obj, i) => (
                <li key={i} className="text-sm">
                  <p className="font-medium text-text">{obj}</p>
                  {analysis.objections_handled[i] && (
                    <p className="text-xs text-text-muted mt-0.5 italic">{analysis.objections_handled[i]}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-text mb-3 flex items-center gap-2 text-sm">
            <Flame className="h-4 w-4 text-green-500" /> Signaux d'intérêt
          </h3>
          {analysis.interest_signals.length === 0 ? (
            <p className="text-sm text-text-muted">Aucun signal d'intérêt détecté.</p>
          ) : (
            <ul className="space-y-2">
              {analysis.interest_signals.map((signal, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-500" />
                  {signal}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* BANT + Sentiment */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-text mb-3 text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-indigo-500" /> Qualification BANT
          </h3>
          <div className="flex flex-wrap gap-2">
            <BANTBadge label="Budget" value={analysis.bant.budget} />
            <BANTBadge label="Autorité" value={analysis.bant.authority} />
            <BANTBadge label="Besoin" value={analysis.bant.need} />
            <BANTBadge label="Timing" value={analysis.bant.timing} />
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-text mb-3 text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-500" /> Évolution du sentiment
          </h3>
          <div className="flex items-center justify-between mt-2">
            <SentimentDot label="Début" value={analysis.sentiment_timeline.start} />
            <div className="h-px flex-1 mx-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" />
            <SentimentDot label="Milieu" value={analysis.sentiment_timeline.middle} />
            <div className="h-px flex-1 mx-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" />
            <SentimentDot label="Fin" value={analysis.sentiment_timeline.end} />
          </div>
        </div>
      </div>

      {/* Style de communication */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2 text-sm">
          <Mic className="h-4 w-4" /> Ton style de communication
        </h3>
        <p className="text-sm text-blue-700 leading-relaxed">{analysis.communication_style}</p>
      </div>

      {/* Top 3 améliorations */}
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
        <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2 text-sm">
          <Zap className="h-4 w-4" /> 3 priorités d'amélioration
        </h3>
        <div className="space-y-2">
          {analysis.top_3_improvements.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-amber-400 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-amber-800">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reformulations modèles */}
      {analysis.model_reformulations?.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-text mb-4 flex items-center gap-2 text-sm">
            <RotateCcw className="h-4 w-4 text-indigo-500" /> Reformulations modèles
          </h3>
          <div className="space-y-4">
            {analysis.model_reformulations.map((ref, i) => (
              <div key={i} className="rounded-xl bg-gray-50 p-4">
                {ref.context && <p className="text-xs text-text-muted mb-2 font-medium">{ref.context}</p>}
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-red-500 font-semibold mb-1 uppercase tracking-wide">Ce que tu as dit</p>
                    <p className="text-sm text-text-secondary italic bg-red-50 rounded-lg p-2">"{ref.original}"</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-500 font-semibold mb-1 uppercase tracking-wide">Comment le dire mieux</p>
                    <p className="text-sm text-green-800 bg-green-50 rounded-lg p-2">"{ref.better}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prochaine étape */}
      <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-5">
        <h3 className="font-bold text-primary mb-2 flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4" /> Prochaine étape recommandée
        </h3>
        <p className="text-text font-medium">{analysis.next_step}</p>
      </div>

      {/* Opportunités manquées */}
      {analysis.missed_opportunities?.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
          <h3 className="font-bold text-text-secondary mb-3 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-gray-400" /> Opportunités manquées
          </h3>
          <ul className="space-y-1.5">
            {analysis.missed_opportunities.map((item, i) => (
              <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">→</span>{item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Email de suivi */}
      {analysis.follow_up_email && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <button
            onClick={() => setShowEmail(!showEmail)}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-bold text-text flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-indigo-500" /> Email de suivi généré
            </h3>
            {showEmail ? <ChevronUp className="h-4 w-4 text-text-muted" /> : <ChevronDown className="h-4 w-4 text-text-muted" />}
          </button>
          {showEmail && (
            <div className="px-5 pb-5">
              <pre className="whitespace-pre-wrap text-sm text-text-secondary font-sans leading-relaxed bg-gray-50 rounded-xl p-4">
                {analysis.follow_up_email}
              </pre>
              <button
                onClick={() => navigator.clipboard.writeText(analysis.follow_up_email)}
                className="mt-2 text-xs text-primary hover:underline"
              >
                Copier l'email
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── History item ─────────────────────────────────────────────────────────────

function HistoryItem({ item, onLoad }: { item: CallAnalysis; onLoad: (item: CallAnalysis) => void }) {
  const date = new Date(item.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  return (
    <button
      onClick={() => onLoad(item)}
      className="w-full text-left rounded-xl border border-gray-100 bg-white p-4 hover:border-primary/30 hover:shadow-sm transition-all flex items-center gap-4"
    >
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
        <Phone className="h-4.5 w-4.5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-text text-sm truncate">
          {item.prospect_name || item.prospect_company || 'Appel sans nom'}
        </p>
        <p className="text-xs text-text-muted">{date}</p>
      </div>
      {item.analysis && (
        <div className="flex items-center gap-3 text-xs">
          <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 font-bold">
            Appel {item.analysis.score_call}/10
          </span>
          <span className={`rounded-full px-2 py-0.5 font-bold ${item.analysis.score_prospect >= 7 ? 'bg-green-100 text-green-700' : item.analysis.score_prospect >= 4 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
            Prospect {item.analysis.score_prospect}/10
          </span>
        </div>
      )}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AppelsPage() {
  const { profile } = useSupabase();
  const { addToast } = useToast();

  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [prospectName, setProspectName] = useState('');
  const [prospectCompany, setProspectCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<{ analysis: CallAnalysisResult; prospectName?: string | null; prospectCompany?: string | null } | null>(null);
  const [history, setHistory] = useState<CallAnalysis[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAgence = profile?.plan === 'agence';

  const loadHistory = useCallback(async () => {
    const res = await fetch('/api/call-analysis');
    if (res.ok) {
      const data = await res.json();
      setHistory(data.analyses || []);
    }
    setHistoryLoaded(true);
  }, []);

  useEffect(() => {
    if (isAgence) loadHistory();
  }, [isAgence, loadHistory]);

  const handleFile = (file: File) => {
    setSelectedFile(file);
    setCurrentAnalysis(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setCurrentAnalysis(null);

    try {
      const fd = new FormData();
      fd.append('audio', selectedFile);
      if (prospectName) fd.append('prospect_name', prospectName);
      if (prospectCompany) fd.append('prospect_company', prospectCompany);

      const res = await fetch('/api/call-analysis', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) {
        addToast(data.error || 'Erreur lors de l\'analyse', 'error');
        return;
      }

      setCurrentAnalysis({ analysis: data.analysis, prospectName: prospectName || null, prospectCompany: prospectCompany || null });
      addToast('Analyse terminée !', 'success');
      loadHistory();
    } catch {
      addToast('Erreur de connexion', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Paywall
  if (!isAgence) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-violet-500/30">
          <Mic className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-black text-text mb-3">Analyse d'appels IA</h1>
        <p className="text-text-secondary mb-8 leading-relaxed max-w-md mx-auto">
          Uploadez l'enregistrement de vos appels de prospection et obtenez une analyse complète : score, objections, signaux d'intérêt, style de communication et email de suivi automatique.
        </p>
        <div className="rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50 p-8 mb-8">
          <p className="font-bold text-violet-700 mb-4">Fonctionnalité exclusive plan Agence</p>
          <div className="grid grid-cols-2 gap-3 text-sm text-violet-600 max-w-sm mx-auto mb-6">
            {[
              'Score appel & prospect /10',
              'Transcription complète',
              'Objections détectées',
              'Signaux d\'intérêt',
              'Style de communication',
              'Email de suivi auto-rédigé',
            ].map((f) => (
              <div key={f} className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />{f}</div>
            ))}
          </div>
          <Link
            href="/abonnement"
            className="inline-block rounded-xl px-8 py-3 font-bold text-white shadow-lg shadow-violet-500/30 hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' }}
          >
            Passer au plan Agence — 179€/mois →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-text flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Mic className="h-5 w-5 text-white" />
          </div>
          Analyse d'appels IA
        </h1>
        <p className="text-text-secondary text-sm mt-1">Uploadez l'enregistrement d'un appel pour obtenir une analyse complète par IA.</p>
      </div>

      {/* Upload form */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
        {/* Zone drag & drop */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative rounded-xl border-2 border-dashed p-10 flex flex-col items-center gap-3 cursor-pointer transition-all ${
            dragging ? 'border-violet-400 bg-violet-50' :
            selectedFile ? 'border-green-400 bg-green-50' :
            'border-gray-200 hover:border-violet-300 hover:bg-gray-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {selectedFile ? (
            <>
              <CheckCircle className="h-10 w-10 text-green-500" />
              <p className="font-semibold text-green-700">{selectedFile.name}</p>
              <p className="text-xs text-green-600">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB · Cliquez pour changer</p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-text-muted" />
              <p className="font-semibold text-text">Glissez votre enregistrement ici</p>
              <p className="text-sm text-text-muted">MP3, WAV, OGG, AAC, FLAC · Max 50 MB</p>
              <p className="text-xs text-text-muted">ou cliquez pour sélectionner</p>
            </>
          )}
        </div>

        {/* Infos optionnelles */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Nom du prospect (optionnel)</label>
            <input
              type="text"
              value={prospectName}
              onChange={(e) => setProspectName(e.target.value)}
              placeholder="Jean Dupont"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Entreprise (optionnel)</label>
            <input
              type="text"
              value={prospectCompany}
              onChange={(e) => setProspectCompany(e.target.value)}
              placeholder="Boulangerie Martin"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selectedFile || loading}
          className="w-full rounded-xl py-3.5 font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20 hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Analyse en cours… (30-60 secondes)
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Mic className="h-5 w-5" /> Analyser l'appel
            </span>
          )}
        </button>
      </div>

      {/* Résultat de l'analyse en cours */}
      {currentAnalysis && (
        <AnalysisDisplay
          analysis={currentAnalysis.analysis}
          prospectName={currentAnalysis.prospectName}
          prospectCompany={currentAnalysis.prospectCompany}
        />
      )}

      {/* Historique */}
      {historyLoaded && history.filter(h => h.status === 'done').length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-text">Analyses précédentes</h2>
          {history.filter(h => h.status === 'done').map((item) => (
            <HistoryItem
              key={item.id}
              item={item}
              onLoad={(h) => {
                if (h.analysis) setCurrentAnalysis({ analysis: h.analysis, prospectName: h.prospect_name, prospectCompany: h.prospect_company });
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ))}
        </div>
      )}

    </div>
  );
}
