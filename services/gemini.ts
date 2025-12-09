
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { VideoScript, TestData, LearningPath, Presentation, QuestionType } from "../types";

const getClient = async (useVeo: boolean = false) => {
  let apiKey = process.env.API_KEY;
  
  if (useVeo) {
    const win = window as any;
    if (win.aistudio && typeof win.aistudio.hasSelectedApiKey === 'function' && await win.aistudio.hasSelectedApiKey()) {
        // Key is injected via environment
    } else if (win.aistudio && typeof win.aistudio.openSelectKey === 'function') {
       await win.aistudio.openSelectKey();
    }
  }

  return new GoogleGenAI({ apiKey: apiKey });
};

// --- VIDEO ---
export const generateVideoScript = async (topic: string, duration: number, language: string, style: string): Promise<VideoScript> => {
  const client = await getClient();
  const prompt = `
    Create a detailed educational video script for: "${topic}".
    Target Duration: ${duration} minutes. Language: ${language}. Style: ${style}.
    Return JSON.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING },
      totalDuration: { type: Type.STRING },
      summary: { type: Type.STRING },
      chapters: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            duration: { type: Type.STRING },
            content: { type: Type.STRING },
            visualCue: { type: Type.STRING },
          },
          required: ["title", "duration", "content", "visualCue"]
        }
      }
    },
    required: ["topic", "totalDuration", "chapters", "summary"]
  };

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  return JSON.parse(response.text || "{}") as VideoScript;
};

export const generateVeoPreview = async (prompt: string): Promise<string | null> => {
  try {
    const client = await getClient(true); 
    let operation = await client.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Educational animation: ${prompt}, clear visibility, 4k, photorealistic or animated style.`,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await client.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    return videoUri ? `${videoUri}&key=${process.env.API_KEY}` : null;
  } catch (e) {
    console.error("Veo generation failed", e);
    return null;
  }
};

// --- EBOOK ---
export const generateEbookContentStream = async (topic: string, onChunk: (text: string) => void) => {
  const client = await getClient();
  const prompt = `Write a multi-chapter ebook on: "${topic}". Include TOC, 3 Chapters, Summary. Format: Markdown.`;
  const stream = await client.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  for await (const chunk of stream) {
    if (chunk.text) onChunk(chunk.text);
  }
};

// --- NOTES ---
export const generateNotes = async (topic: string, detailLevel: string): Promise<string> => {
  const client = await getClient();
  const prompt = `Create revision notes for "${topic}". Level: ${detailLevel}. Markdown format. Include Key Concepts, Mnemonics, Formulas.`;
  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  return response.text || "";
};

// --- PPT ---
export const generatePPT = async (topic: string, slideCount: number): Promise<Presentation> => {
  const client = await getClient();
  const prompt = `Create a presentation on "${topic}" with ${slideCount} slides. Return JSON.`;
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING },
      slides: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
            speakerNotes: { type: Type.STRING },
            imageDescription: { type: Type.STRING }
          },
          required: ["title", "bullets", "speakerNotes", "imageDescription"]
        }
      }
    },
    required: ["topic", "slides"]
  };

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: schema }
  });

  return JSON.parse(response.text || "{}") as Presentation;
};

// --- TEST ---
export const generateTest = async (topic: string, difficulty: string, count: number): Promise<TestData> => {
  const client = await getClient();
  const prompt = `Generate a test on "${topic}". Difficulty: ${difficulty}. Questions: ${count}. Mix of MCQ and Short answer. Return JSON.`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      subject: { type: Type.STRING },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER },
            text: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["MCQ", "SHORT", "LONG"] },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING },
            difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] }
          },
          required: ["id", "text", "type", "explanation", "difficulty"]
        }
      }
    },
    required: ["title", "subject", "questions"]
  };

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: schema }
  });

  // Assign a temporary ID locally usually, but here we just return structure
  const data = JSON.parse(response.text || "{}");
  return { ...data, id: Date.now().toString(), settings: { timeLimitMinutes: 30, proctoring: false, adaptive: false, shuffleQuestions: false } } as TestData;
};

// --- DOUBT ---
export const resolveDoubt = async (question: string, imageBase64?: string): Promise<string> => {
  const client = await getClient();
  const model = 'gemini-2.5-flash';
  
  const parts: any[] = [{ text: question }];
  if (imageBase64) {
    parts.unshift({
      inlineData: { mimeType: 'image/jpeg', data: imageBase64 }
    });
  }

  const response = await client.models.generateContent({
    model,
    contents: { parts },
    config: { systemInstruction: "You are a helpful tutor. Provide step-by-step solutions." }
  });

  return response.text || "";
};

// --- LEARNING PATH ---
export const generateLearningPath = async (goal: string): Promise<LearningPath> => {
  const client = await getClient();
  const prompt = `Create a 5-day learning plan to achieve: "${goal}". Return JSON.`;
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      goal: { type: Type.STRING },
      schedule: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.INTEGER },
            topic: { type: Type.STRING },
            activities: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["day", "topic", "activities"]
        }
      }
    },
    required: ["goal", "schedule"]
  };

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: schema }
  });

  return JSON.parse(response.text || "{}") as LearningPath;
};

// --- CAREER PATH ---
export const generateCareerPath = async (interests: string): Promise<string> => {
  const client = await getClient();
  const prompt = `Suggest 3 career paths based on these interests/skills: "${interests}". Include required skills and college major. Markdown format.`;
  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  return response.text || "";
};
