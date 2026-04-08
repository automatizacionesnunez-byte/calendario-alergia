import { ollamaChat } from './_lib/ollama';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symptoms, history } = req.body;

  if (!symptoms || Object.keys(symptoms).length === 0) {
    return res.status(400).json({ error: 'No se han proporcionado síntomas para analizar' });
  }

  try {
    const prompt = `
      Eres un asistente médico experto en alergología y asma. 
      Analiza el siguiente registro de síntomas estructurados de un usuario.
      Cada síntoma incluye un ID y su INTENSIDAD (mild/leve, moderate/moderado, strong/fuerte).
      
      DATOS:
      ${JSON.stringify(symptoms, null, 2)}

      Historial previo (si existe):
      ${JSON.stringify(history || {}, null, 2)}

      Debes devolver un JSON con:
      {
        "summary": "Resumen clínico detallado considerando la progresión de la intensidad.",
        "severity": "Baja | Media | Alta",
        "severity_score": 1-10 (siendo 10 lo más crítico),
        "advice": "Pautas específicas (ej: aumentar ventilación, uso de rescate, acudir a urgencias si es alta).",
        "stats": {
          "total_days": número,
          "asthma_count": número,
          "mucus_count": número,
          "itchy_eyes_count": número
        }
      }

      Importante: Pondera mucho si hay síntomas 'strong' (Fuerte), especialmente en asma.
      No añadas texto introductorio, solo devuelve el JSON puro.
    `;

    // Try primary reasoning model
    let response;
    try {
      response = await ollamaChat({
        model: 'deepseek-v3.1:671b',
        messages: [
          { role: 'system', content: 'Eres un experto en alergología y análisis de datos clínicos estructurados.' },
          { role: 'user', content: prompt }
        ]
      });
    } catch (error) {
      console.warn('Switching to fallback model deepseek-v3.2 due to error:', error.message);
      // Fallback to fast model deepseek-v3.2 (Safety Mode)
      response = await ollamaChat({
        model: 'deepseek-v3.2',
        messages: [
          { role: 'system', content: 'Eres un experto en alergología. Responde solo en JSON.' },
          { role: 'user', content: prompt }
        ]
      });
    }

    // Ollama chat response structure has a message field with content
    const content = response.message.content;
    const analysis = JSON.parse(content);

    return res.status(200).json({ analysis });

  } catch (error) {
    console.error('Error in analysis API:', error);
    return res.status(500).json({ 
      error: 'Error procesando el análisis con Ollama Cloud', 
      details: error.message 
    });
  }
}
