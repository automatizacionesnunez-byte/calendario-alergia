import { ollamaChat } from './_lib/ollama';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image } = req.body; // Expecting Base64 string

  if (!image) {
    return res.status(400).json({ error: 'No se ha detectado ninguna imagen' });
  }

  try {
    // Technical Recommendation: qwen3-vl:235b-instruct for surgical OCR
    const response = await ollamaChat({
      model: 'qwen3-vl:235b-instruct',
      messages: [
        {
          role: 'user',
          content: 'Extrae la información relevante de este informe médico o caja de medicamento. Devuelve un resumen estructurado en JSON con síntomas detectados y pautas de medicación.',
          images: [image.replace(/^data:image\/[a-z]+;base64,/, '')]
        }
      ],
      format: 'json',
      options: { temperature: 0.0, num_ctx: 32768 }
    });

    const content = response.message.content;
    const result = JSON.parse(content);

    return res.status(200).json({ result });

  } catch (error) {
    console.error('Error in OCR API:', error);
    return res.status(500).json({ 
      error: 'Error procesando la imagen con Ollama Vision', 
      details: error.message 
    });
  }
}
