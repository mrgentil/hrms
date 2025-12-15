import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

export interface ParsedCV {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    skills: string[];
    yearsExperience: number;
    summary?: string;
    rawText: string;
}

@Injectable()
export class CVParserService {
    private readonly logger = new Logger(CVParserService.name);
    private openai: OpenAI | null = null;

    constructor(private configService: ConfigService) { }

    private getOpenAI(): OpenAI {
        if (!this.openai) {
            const apiKey = this.configService.get<string>('OPENAI_API_KEY');
            if (!apiKey) {
                throw new Error('OPENAI_API_KEY is not configured in .env file');
            }
            this.openai = new OpenAI({ apiKey });
        }
        return this.openai;
    }

    /**
     * Extrait le texte d'un PDF
     */
    async extractTextFromPDF(buffer: Buffer): Promise<string> {
        try {
            const data = await pdfParse(buffer);
            return data.text;
        } catch (error) {
            this.logger.error('Failed to extract text from PDF', error);
            throw new Error('Failed to extract text from PDF');
        }
    }

    /**
     * Analyse le texte du CV avec OpenAI
     */
    async parseCV(pdfBuffer: Buffer): Promise<ParsedCV> {
        const rawText = await this.extractTextFromPDF(pdfBuffer);

        if (!rawText || rawText.trim().length < 50) {
            throw new Error('PDF contains too little text to parse');
        }

        try {
            const response = await this.getOpenAI().chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `Tu es un expert en recrutement et analyse de CV (ATS). Analyse le texte brut du CV fourni et extrait les informations structurées en JSON.
Format de réponse attendu (JSON uniquement) :
{
    "firstName": "Prénom",
    "lastName": "Nom", 
    "email": "email@example.com",
    "phone": "Numéro de téléphone nettoyé",
    "skills": ["Compétence 1", "Compétence 2", "Technologie", "Soft Skill"],
    "yearsExperience": 3,
    "summary": "Résumé professionnel concis"
}
Règles d'extraction :
1. Prénom/Nom : Cherche en haut du CV. Si ambigu, utilise le prénom le plus probable.
2. Email : Extrais l'email exact.
3. Compétences : Liste exhaustive des technologies, outils, langues et soft skills trouvés (ex: "React", "Python", "Gestion de projet", "Anglais").
4. Expérience : Estime le nombre d'années total d'après l'historique (différence entre date début premier emploi pertinent et aujourd'hui). Arrondir à l'entier.
5. Si une info est introuvable, mets null. Ne pas inventer.`
                    },
                    {
                        role: 'user',
                        content: `Texte du CV :\n\n${rawText.substring(0, 10000)}` // Increased limit slightly to catch footer skills
                    }
                ],
                temperature: 0.1,
                max_tokens: 1500,
            });

            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No response from OpenAI');
            }

            // Extraire le JSON de la réponse
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No valid JSON in response');
            }

            const parsed = JSON.parse(jsonMatch[0]);

            return {
                firstName: parsed.firstName || 'Inconnu',
                lastName: parsed.lastName || 'Inconnu',
                email: parsed.email || `candidate_${Date.now()}@temp.com`,
                phone: parsed.phone || undefined,
                skills: Array.isArray(parsed.skills) ? parsed.skills : [],
                yearsExperience: typeof parsed.yearsExperience === 'number' ? parsed.yearsExperience : 0,
                summary: parsed.summary || undefined,
                rawText,
            };
        } catch (error) {
            this.logger.error('Failed to parse CV with OpenAI', error);

            // Fallback: essayer d'extraire quelques infos basiques
            return this.fallbackParse(rawText);
        }
    }

    /**
     * Parse minimal si OpenAI échoue
     */
    private fallbackParse(rawText: string): ParsedCV {
        const emailMatch = rawText.match(/[\w.-]+@[\w.-]+\.\w+/);
        const phoneMatch = rawText.match(/(\+?\d[\d\s.-]{8,})/);

        return {
            firstName: 'À',
            lastName: 'Compléter',
            email: emailMatch?.[0] || `candidate_${Date.now()}@temp.com`,
            phone: phoneMatch?.[1]?.replace(/\s+/g, '') || undefined,
            skills: [],
            yearsExperience: 0,
            summary: rawText.substring(0, 200),
            rawText,
        };
    }
}
