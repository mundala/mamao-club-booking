const apiKey = process.env.API_KEY;
const hasValidKey = apiKey && apiKey !== '' && apiKey !== 'PLACEHOLDER_API_KEY';

export const generateBookingSouvenir = async (
  people: number,
  range: { start: Date; end: Date }
): Promise<string> => {
  if (!hasValidKey) {
    console.log('%c[SYS.GEMINI] NO API KEY — SOUVENIR GENERATION SKIPPED', 'color: #D71921; font-weight: bold; letter-spacing: 1px;');
    return '';
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: apiKey! });
    const startStr = range.start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const endStr = range.end.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = range.start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    const dateText = range.start.toDateString() === range.end.toDateString()
        ? startStr
        : `${startStr} - ${endStr}`;

    const prompt = `
      A hyper-minimalist, abstract digital receipt or souvenir for a "Mamao Club" reservation.
      Zen-tech aesthetic. Monochrome with a single red accent.
      Include the text "ADMIT 0${people}" in a raw industrial font.
      Include the date "${dateText}" clearly.
      Prominently feature the arrival time "${timeStr}".
      The vibe is "Nothing OS" meets Japanese cyber-noir.
      High contrast, artistic, data-visualization style.
      Add a barcode or QR code motif.
    `;

    // Using gemini-3-pro-image-preview for high quality output
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
            aspectRatio: "9:16",
            imageSize: "1K"
        }
      },
    });

    let imageUrl = '';
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          imageUrl = `data:image/png;base64,${base64EncodeString}`;
          break; // Found the image
        }
      }
    }
    return imageUrl;

  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    return '';
  }
};
