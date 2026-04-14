import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

const ANALYSIS_PROMPT = `Tu es un expert en techniques de vente et communication commerciale. Analyse cet enregistrement d'appel de prospection.

Identifie les deux locuteurs :
- VENDEUR : la personne qui prospecte (qui a effectué l'appel)
- PROSPECT : la personne contactée

Retourne UNIQUEMENT un JSON valide (sans markdown, sans \`\`\`json) avec cette structure exacte :

{
  "summary": "Résumé de l'appel en 3-4 phrases",
  "score_call": 7.5,
  "score_prospect": 6,
  "talk_ratio": { "salesperson": 45, "prospect": 55 },
  "questions_asked": 8,
  "filler_words": { "count": 12, "words": ["euh", "heu", "donc"] },
  "what_went_well": ["Point positif 1", "Point positif 2", "Point positif 3"],
  "what_went_wrong": ["Point négatif 1", "Point négatif 2"],
  "objections": ["Objection soulevée par le prospect 1", "Objection 2"],
  "objections_handled": ["Comment l'objection 1 a été gérée (bien/mal + explication)", "Objection 2 : ..."],
  "interest_signals": ["Signal d'intérêt détecté 1", "Signal 2"],
  "communication_style": "Description détaillée du style de communication du vendeur en 2-3 phrases",
  "top_3_improvements": ["Amélioration prioritaire 1", "Amélioration 2", "Amélioration 3"],
  "next_step": "Prochaine étape très concrète recommandée",
  "model_reformulations": [
    { "original": "Ce que le vendeur a dit exactement", "better": "Comment il aurait dû le formuler", "context": "Le contexte de cet échange" }
  ],
  "bant": { "budget": false, "authority": true, "need": true, "timing": false },
  "sentiment_timeline": { "start": "neutre", "middle": "positif", "end": "hésitant" },
  "follow_up_email": "Objet: [Objet de l'email]\\n\\nBonjour [Prénom],\\n\\n[Corps de l'email de suivi personnalisé basé sur l'appel]\\n\\nCordialement,\\n[Ton nom]",
  "missed_opportunities": ["Opportunité manquée 1", "Opportunité 2"],
  "key_topics": ["Sujet abordé 1", "Sujet 2", "Sujet 3"]
}

Règles importantes :
- score_call : note /10 de la qualité globale de l'appel du vendeur
- score_prospect : température du prospect /10 (10 = très chaud, prêt à signer ; 1 = pas du tout intéressé)
- talk_ratio : doit totaliser 100
- questions_asked : uniquement les questions du vendeur
- model_reformulations : donne au moins 1-2 exemples concrets tirés de l'appel réel
- follow_up_email : email complet, prêt à envoyer, personnalisé selon ce qui a été dit dans l'appel`;

async function uploadAudioToGemini(
  audioBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const boundary = 'boundary_' + Date.now();

  const metadata = JSON.stringify({
    file: { display_name: 'call_recording' },
  });

  const bodyStart = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`
  );
  const bodyEnd = Buffer.from(`\r\n--${boundary}--`);
  const body = Buffer.concat([bodyStart, audioBuffer, bodyEnd]);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'multipart',
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini Files API upload failed: ${err}`);
  }

  const data = await response.json();
  return data.file.name; // e.g. "files/abc123"
}

async function waitForFileActive(fileName: string): Promise<string> {
  for (let i = 0; i < 15; i++) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${GEMINI_API_KEY}`
    );
    const file = await response.json();
    if (file.state === 'ACTIVE') return file.uri;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('Timeout: le fichier audio n\'a pas été traité à temps');
}

async function analyzeWithGemini(fileUri: string, mimeType: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { file_data: { mime_type: mimeType, file_uri: fileUri } },
              { text: ANALYSIS_PROMPT },
            ],
          },
        ],
        generation_config: {
          temperature: 0.3,
          max_output_tokens: 4096,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini analysis failed: ${err}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// GET — liste des analyses de l'utilisateur
export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { data: analyses } = await supabase
    .from('call_analyses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return NextResponse.json({ analyses: analyses ?? [] });
}

// POST — upload + analyse d'un appel
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  // Vérification plan agence
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  if (profile?.plan !== 'agence') {
    return NextResponse.json(
      { error: 'Cette fonctionnalité est réservée au plan Agence' },
      { status: 403 }
    );
  }

  // Parse multipart form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Fichier audio invalide' }, { status: 400 });
  }

  const audioFile = formData.get('audio') as File | null;
  const prospectName = (formData.get('prospect_name') as string) || null;
  const prospectCompany = (formData.get('prospect_company') as string) || null;

  if (!audioFile) {
    return NextResponse.json({ error: 'Aucun fichier audio fourni' }, { status: 400 });
  }

  const allowedTypes = [
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave',
    'audio/ogg', 'audio/flac', 'audio/aac', 'audio/mp4',
    'audio/x-m4a', 'video/mp4',
  ];
  const mimeType = audioFile.type || 'audio/mpeg';
  if (!allowedTypes.includes(mimeType)) {
    return NextResponse.json(
      { error: `Format non supporté : ${mimeType}. Utilisez MP3, WAV, OGG, FLAC ou AAC.` },
      { status: 400 }
    );
  }

  // Insérer en DB avec status "processing"
  const { data: callRecord, error: insertError } = await supabase
    .from('call_analyses')
    .insert({
      user_id: user.id,
      prospect_name: prospectName,
      prospect_company: prospectCompany,
      status: 'processing',
    })
    .select()
    .single();

  if (insertError || !callRecord) {
    return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 });
  }

  try {
    // Convertir en Buffer
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    // Upload vers Gemini Files API
    const fileName = await uploadAudioToGemini(audioBuffer, mimeType);

    // Attendre que le fichier soit prêt
    const fileUri = await waitForFileActive(fileName);

    // Analyser avec Gemini
    const rawAnalysis = await analyzeWithGemini(fileUri, mimeType);

    // Parser le JSON
    let analysis;
    try {
      const cleaned = rawAnalysis.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      analysis = JSON.parse(cleaned);
    } catch {
      throw new Error('Réponse Gemini invalide : impossible de parser le JSON');
    }

    // Mettre à jour en DB
    await supabase
      .from('call_analyses')
      .update({
        analysis,
        status: 'done',
        duration_seconds: Math.round(audioFile.size / 16000), // estimation approximative
      })
      .eq('id', callRecord.id);

    return NextResponse.json({
      id: callRecord.id,
      analysis,
      status: 'done',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';

    await supabase
      .from('call_analyses')
      .update({ status: 'error', error_message: message })
      .eq('id', callRecord.id);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
