import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private openai: OpenAI;

    // Liste de compétences communes (techniques et soft skills)
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
     * Extracts skills from a job description using OpenAI with keyword fallback.
     */
    async extractSkillsFromText(description: string): Promise<string[]> {
        if (!description || description.trim().length === 0) {
            throw new Error('La description est vide. Veuillez d\'abord saisir une description du poste.');
        }

        // 1. Try OpenAI if available
        if (this.openai) {
            try {
                this.logger.log(`Extracting skills via OpenAI...`);
                return await this.extractWithOpenAI(description);
            } catch (error) {
                this.logger.warn('OpenAI extraction failed, falling back to keyword matching', error.message);
            }
        }

        // 2. Fallback to keyword matching
        return this.keywordExtraction(description);
    }

    private async extractWithOpenAI(description: string): Promise<string[]> {
        const prompt = `
            Extract all technical and soft skills from the following job description.
            Return ONLY a JSON array of strings (e.g. ["React", "Teamwork", "Python"]).
            Do not include any other text.
            Job Description:
            ${description.substring(0, 3000)}
        `;

        const completion = await this.openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'gpt-3.5-turbo',
            temperature: 0.2,
        });

        const content = completion.choices[0].message.content;
        try {
            const parsed = JSON.parse(content || "[]");
            if (Array.isArray(parsed)) {
                return parsed;
            }
            throw new Error('Response is not an array');
        } catch (e) {
            throw new Error('Failed to parse OpenAI JSON response');
        }
    }

    private keywordExtraction(description: string): string[] {
        try {
            this.logger.log(`Extracting skills from description using keyword matching...`);

            const descriptionLower = description.toLowerCase();
            const foundSkills = new Set<string>();

            // Rechercher chaque compétence dans la description
            for (const skill of this.COMMON_SKILLS) {
                const skillLower = skill.toLowerCase();

                // Recherche avec des variations (avec/sans tirets, espaces, etc.)
                const patterns = [
                    skillLower,
                    skillLower.replace(/\s/g, ''),  // Sans espaces
                    skillLower.replace(/\./g, ''),  // Sans points
                    skillLower.replace(/-/g, ''),   // Sans tirets
                ];

                if (patterns.some(pattern => descriptionLower.includes(pattern))) {
                    foundSkills.add(skill);
                }
            }

            const skills = Array.from(foundSkills);

            if (skills.length === 0) {
                this.logger.warn('No skills found in description');
                // Don't throw here, just return empty so user can add manually
                return [];
            }

            this.logger.log(`Successfully extracted ${skills.length} skills: ${skills.join(', ')}`);
            return skills;
        } catch (error) {
            this.logger.error('Failed to extract skills', error);
            throw new Error(`Erreur lors de l'extraction: ${error.message || 'Erreur inconnue'}`);
        }
    }
}
