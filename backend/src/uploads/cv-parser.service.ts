import { Injectable, Logger } from '@nestjs/common';
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
    private openai: OpenAI;
    private readonly COMMON_SKILLS = [
        'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'Scala',
        'React', 'Angular', 'Vue', 'Next.js', 'Nuxt', 'Node.js', 'Express', 'NestJS', 'Django', 'Flask', 'Spring', 'Laravel',
        '.NET', 'ASP.NET', 'jQuery', 'Bootstrap', 'Tailwind', 'Material-UI',
        'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Oracle', 'SQL Server', 'SQLite', 'Cassandra', 'DynamoDB', 'Firebase',
        'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI', 'GitHub Actions', 'Terraform', 'Ansible',
        'Git', 'GitHub', 'GitLab', 'Jira', 'Confluence', 'Slack', 'Trello', 'Figma', 'Sketch', 'Adobe XD',
        'Agile', 'Scrum', 'Kanban', 'DevOps', 'CI/CD', 'TDD', 'BDD',
        'Communication', 'Leadership', 'Travail d\'équipe', 'Gestion de projet', 'Résolution de problèmes',
        'Autonomie', 'Créativité', 'Adaptabilité', 'Organisation', 'Esprit d\'équipe',
        'Team work', 'Problem solving', 'Project management', 'Time management', 'Critical thinking',
        'REST API', 'GraphQL', 'Microservices', 'Machine Learning', 'AI', 'Data Science', 'Big Data',
        'Cybersécurité', 'Blockchain', 'IoT', 'UX/UI', 'SEO', 'Testing', 'QA',
    ];

    constructor() {
        if (process.env.OPENAI_API_KEY) {
            this.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
        }
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
     * Analyse le texte du CV (OpenAI -> Fallback Keywords)
     */
    async parseCV(pdfBuffer: Buffer): Promise<ParsedCV> {
        const rawText = await this.extractTextFromPDF(pdfBuffer);

        if (!rawText || rawText.trim().length < 50) {
            throw new Error('PDF contains too little text to parse');
        }

        // Tenter OpenAI si la clé est présente
        if (this.openai) {
            try {
                this.logger.log('Parsing CV with OpenAI...');
                return await this.parseWithOpenAI(rawText);
            } catch (error) {
                this.logger.warn('OpenAI parsing failed, falling back to keyword extraction', error.message);
            }
        } else {
            this.logger.warn('No OpenAI API Key found, using keyword extraction');
        }

        return this.keywordParse(rawText);
    }

    /**
     * Parsing intelligent via OpenAI
     */
    private async parseWithOpenAI(text: string): Promise<ParsedCV> {
        const prompt = `
            You are an expert HR assistant. Extract the following information from the resume text provided below.
            Return ONLY a valid JSON object with these fields:
            - firstName: string
            - lastName: string
            - email: string (find the most likely candidate email)
            - phone: string (optional)
            - skills: string[] (technical and soft skills)
            - yearsExperience: number (total years of professional experience, estimate if necessary)
            - summary: string (a brief professional summary, max 50 words)

            Resume Text:
            ${text.substring(0, 3000)} // Limiting text to tokens
        `;

        const completion = await this.openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'gpt-3.5-turbo',
            temperature: 0.1,
        });

        const content = completion.choices[0].message.content;
        try {
            const parsed = JSON.parse(content || "{}");
            return {
                ...parsed,
                rawText: text
            };
        } catch (e) {
            throw new Error('Failed to parse OpenAI JSON response');
        }
    }

    /**
     * Parse avec extraction de données par regex et mots-clés (Fallback)
     */
    private keywordParse(rawText: string): ParsedCV {
        // ... (Keep existing keyword logic as copied below)
        const emailMatch = rawText.match(/[\w.-]+@[\w.-]+\.\w+/);
        const email = emailMatch?.[0] || `candidate_${Date.now()}@temp.com`;

        const phoneMatch = rawText.match(/(\+?[\d\s.-]{9,})/);
        const phone = phoneMatch?.[1]?.replace(/\s+/g, '').substring(0, 20);

        const { firstName, lastName } = this.extractName(rawText);
        const skills = this.extractSkills(rawText);
        const yearsExperience = this.estimateExperience(rawText);
        const summary = this.extractSummary(rawText);

        this.logger.log(`Parsed CV (Fallback): ${firstName} ${lastName}, ${skills.length} skills, ${yearsExperience} years exp`);

        return {
            firstName,
            lastName,
            email,
            phone,
            skills,
            yearsExperience,
            summary,
            rawText,
        };
    }

    /**
     * Extrait prénom et nom from text
     */
    private extractName(text: string): { firstName: string; lastName: string } {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        // Le nom est généralement dans les 5 premières lignes
        for (let i = 0; i < Math.min(5, lines.length); i++) {
            const line = lines[i];

            // Chercher un pattern "Prénom Nom" (deux mots en majuscules ou capitalisés)
            const nameMatch = line.match(/^([A-ZÀ-ÿ][a-zà-ÿ]+(?:[-\s][A-ZÀ-ÿ][a-zà-ÿ]+)?)\s+([A-ZÀ-ÿ][A-ZÀ-ÿ\s-]+)$/);
            if (nameMatch) {
                return {
                    firstName: nameMatch[1].trim(),
                    lastName: nameMatch[2].trim(),
                };
            }

            // Pattern alternatif: "NOM Prénom" (tout en majuscules puis capitalisé)
            const nameMatch2 = line.match(/^([A-ZÀ-ÿ\s-]+)\s+([A-ZÀ-ÿ][a-zà-ÿ]+)$/);
            if (nameMatch2 && nameMatch2[1].length > 2) {
                return {
                    firstName: nameMatch2[2].trim(),
                    lastName: nameMatch2[1].trim(),
                };
            }
        }

        return { firstName: 'Candidat', lastName: 'Inconnu' };
    }


    /**
     * Extrait les compétences du CV
     */
    private extractSkills(text: string): string[] {
        const textLower = text.toLowerCase();
        const foundSkills = new Set<string>();

        for (const skill of this.COMMON_SKILLS) {
            const skillLower = skill.toLowerCase();

            // Recherche avec variations
            const patterns = [
                skillLower,
                skillLower.replace(/\s/g, ''),
                skillLower.replace(/\./g, ''),
                skillLower.replace(/-/g, ''),
            ];

            if (patterns.some(pattern => textLower.includes(pattern))) {
                foundSkills.add(skill);
            }
        }

        return Array.from(foundSkills);
    }

    /**
     * Estime les années d'expérience
     */
    private estimateExperience(text: string): number {
        const textLower = text.toLowerCase();

        // Chercher des patterns comme "X ans d'expérience"
        const expMatch = text.match(/(\d+)\+?\s*ans?\s+(?:d'|d)?(?:expérience|experience)/i);
        if (expMatch) {
            return parseInt(expMatch[1]);
        }

        // Compter les années mentionnées dans l'expérience professionnelle
        const yearMatches = text.match(/20\d{2}|19\d{2}/g);
        if (yearMatches && yearMatches.length >= 2) {
            const years = yearMatches.map(y => parseInt(y)).sort();
            const oldestYear = years[0];
            const currentYear = new Date().getFullYear();
            return Math.min(Math.max(currentYear - oldestYear, 0), 50); // Cap à 50 ans
        }

        // Patterns comme "Depuis 2020"
        const sinceMatch = text.match(/(?:depuis|since)\s+(20\d{2})/i);
        if (sinceMatch) {
            const year = parseInt(sinceMatch[1]);
            return Math.max(new Date().getFullYear() - year, 0);
        }

        return 0;
    }

    /**
     * Extrait un résumé du CV
     */
    private extractSummary(text: string): string {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 20);

        // Chercher une section "Profil", "Résumé", "À propos", etc.
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toLowerCase();
            if (line.match(/profil|résumé|resume|summary|à propos|about|objectif|objective/)) {
                // Prendre les 2-3 lignes suivantes
                const summaryLines = lines.slice(i + 1, i + 4).join(' ');
                if (summaryLines.length > 30) {
                    return summaryLines.substring(0, 250);
                }
            }
        }

        // Fallback: prendre un bout du début (après le nom)
        return lines.slice(2, 5).join(' ').substring(0, 200);
    }
}
