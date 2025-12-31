import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

interface Attachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
}

interface SendMailPayload {
  to?: string | null;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Attachment[];
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;
  private readonly fromEmail: string | null;
  private readonly fromName: string | null;
  private readonly enabled: boolean;
  private readonly fallbackEmail: string | null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');

    // Resend requires a verified domain or use their testing domain
    this.fromEmail = this.configService.get<string>('MAIL_FROM_ADDRESS') || 'onboarding@resend.dev';
    this.fromName = this.configService.get<string>('MAIL_FROM_NAME') || 'Efficia';
    this.fallbackEmail = this.configService.get<string>('CONTACT_TO_EMAIL') || null;

    if (!apiKey) {
      this.enabled = false;
      this.logger.warn('RESEND_API_KEY not found. Emails will be disabled.');
      return;
    }

    try {
      this.resend = new Resend(apiKey);
      this.enabled = true;
      this.logger.log('MailService initialized with Resend');
    } catch (error) {
      this.enabled = false;
      this.logger.error('Failed to initialize Resend', error);
    }
  }

  async sendMail(payload: SendMailPayload): Promise<void> {
    if (!this.enabled || !this.resend) {
      this.logger.warn(
        `Mail service disabled. Skipping email "${payload.subject}" (target: ${payload.to ?? 'n/a'}).`,
      );
      return;
    }

    try {
      const recipient = payload.to?.trim() || this.fallbackEmail;
      if (!recipient) {
        this.logger.warn(
          `No recipient email provided for "${payload.subject}". Email not sent.`,
        );
        return;
      }

      const from =
        this.fromName && this.fromEmail
          ? `${this.fromName} <${this.fromEmail}>`
          : this.fromEmail || 'onboarding@resend.dev';

      this.logger.debug(`Sending email "${payload.subject}" to ${recipient} via Resend...`);

      const { data, error } = await this.resend.emails.send({
        from: from,
        to: recipient,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
        attachments: payload.attachments as any,
      } as any);

      if (error) {
        this.logger.error(`Resend API Error: ${error.name} - ${error.message}`);
        throw new Error(error.message);
      }

      this.logger.log(`Email sent successfully. ID: ${data?.id}`);
    } catch (error) {
      this.logger.error('Failed to send email', error instanceof Error ? error.stack : error);
    }
  }
  async sendInterviewInvitation(
    candidate: { email: string; firstName: string; lastName: string },
    interview: { date: Date; type: string; interviewerName?: string; interviewerRole?: string; jobTitle?: string }
  ): Promise<void> {
    const isToday = new Date().toDateString() === interview.date.toDateString();
    const dateStr = interview.date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = interview.date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const isVisio = interview.type === 'VISIO';
    const contextText = isToday ? "aujourd’hui" : `le ${dateStr}`;

    // Logic for link/location
    const detailsText = isVisio
      ? "Le lien de connexion vous sera communiqué tout à l’heure."
      : "L'entretien se déroulera dans nos locaux.";

    // Subject with Object prefix as requested ("avec objet etc")
    const subject = `Objet : Confirmation d'entretien - ${candidate.firstName} ${candidate.lastName}`;

    // Format Job Title Context if available
    const jobContext = interview.jobTitle
      ? `Suite à votre candidature pour le poste de <strong>${interview.jobTitle}</strong>, `
      : "";

    const html = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <p style="font-size: 16px; color: #374151;">Bonjour Mr/Mme <strong>${candidate.firstName} ${candidate.lastName}</strong>,</p>
        
        <p style="font-size: 16px; color: #374151;">Nous espérons que ce mail vous trouvera bien portant.</p>
        
        <p style="font-size: 16px; color: #374151;">
            ${jobContext}nous confirmons votre entretien ${isVisio ? "en ligne" : ""} <strong>${contextText} à partir de ${timeStr}</strong>.
        </p>
        
        <p style="font-size: 16px; color: #374151;">${detailsText}</p>
        
        <br/>
        <p style="font-size: 16px; color: #374151;">Merci de votre intérêt à rejoindre <strong>notre équipe</strong>.</p>
        
        <br/>
        <p style="font-size: 16px; color: #374151;">Cordialement,</p>
        
        <div style="margin-top: 20px; border-left: 4px solid #4f46e5; padding-left: 15px;">
            <p style="font-size: 16px; font-weight: bold; color: #111827; margin: 0;">${interview.interviewerName || "L'équipe RH"}</p>
            <p style="font-size: 14px; color: #6b7280; margin: 4px 0 0 0;">${interview.interviewerRole || "Service Recrutement"}</p>
        </div>
      </div>
    `;

    await this.sendMail({
      to: candidate.email,
      subject,
      html,
    });
  }
  async sendRejectionEmail(
    candidate: { email: string; firstName: string; lastName: string },
    jobTitle: string
  ): Promise<void> {
    const subject = `Votre candidature pour le poste de ${jobTitle}`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #4b5563;">Bonjour ${candidate.firstName},</h2>
        
        <p>Nous vous remercions de l'intérêt que vous portez à notre entreprise et au poste de <strong>${jobTitle}</strong>.</p>
        
        <p>Malheureusement, après une étude attentive de votre dossier, nous avons le regret de vous informer que nous ne donnerons pas suite à votre candidature pour le moment.</p>
        
        <p>Nous nous permettons toutefois de conserver votre CV dans notre vivier de talents pour d'éventuelles futures opportunités correspondant à votre profil.</p>
        
        <p>Nous vous souhaitons une excellente continuation dans vos recherches.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        
        <p style="color: #6b7280; font-size: 12px;">Groupe Gentil - Service Recrutement</p>
      </div>
    `;

    await this.sendMail({
      to: candidate.email,
      subject,
      html,
    });
  }
  async sendTrainingStatusEmail(
    user: { email: string; firstName: string; lastName: string },
    training: { title: string; status: 'APPROVED' | 'REJECTED'; reason?: string }
  ): Promise<void> {
    const isApproved = training.status === 'APPROVED';
    const subject = isApproved
      ? `Objet : Inscription approuvée - Formation ${training.title}`
      : `Objet : Mise à jour de votre inscription - ${training.title}`;

    const html = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <p style="font-size: 16px; color: #374151;">Bonjour <strong>${user.firstName} ${user.lastName}</strong>,</p>
        
        <p style="font-size: 16px; color: #374151;">
            ${isApproved
        ? `Nous avons le plaisir de vous informer que votre demande d'inscription pour la formation <strong>"${training.title}"</strong> a été <strong>approuvée</strong>.`
        : `Nous vous informons qu'après étude de votre dossier, nous ne pouvons pas donner suite à votre demande d'inscription pour la formation <strong>"${training.title}"</strong> pour le moment.`
      }
        </p>

        ${!isApproved && training.reason ? `<p style="font-size: 16px; color: #374151; background: #f9fafb; padding: 15px; border-radius: 8px;"><strong>Motif :</strong> ${training.reason}</p>` : ''}
        
        ${isApproved ? `<p style="font-size: 16px; color: #374151;">Vous pouvez dès maintenant consulter les détails de cette formation et votre planning depuis votre espace collaborateur.</p>` : ''}
        
        <br/>
        <p style="font-size: 16px; color: #374151;">Cordialement,</p>
        
        <div style="margin-top: 20px; border-left: 4px solid #4f46e5; padding-left: 15px;">
            <p style="font-size: 16px; font-weight: bold; color: #111827; margin: 0;">Service Formation & Développement</p>
            <p style="font-size: 14px; color: #6b7280; margin: 4px 0 0 0;">Groupe Gentil</p>
        </div>
      </div>
    `;

    await this.sendMail({
      to: user.email,
      subject,
      html,
    });
  }

  async sendCampaignLaunchedEmail(
    user: { email: string | null; firstName: string; lastName: string },
    campaign: {
      title: string;
      description: string | null;
      type: string;
      start_date: Date;
      end_date: Date;
      self_review_deadline: Date | null;
      manager_review_deadline: Date | null;
    }
  ): Promise<void> {
    const subject = `Nouvelle campagne d'évaluation : ${campaign.title}`;

    const formattedStartDate = campaign.start_date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const formattedEndDate = campaign.end_date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    const html = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4f46e5; font-size: 28px; margin: 0;">📊 Nouvelle Campagne d'Évaluation</h1>
        </div>
        
        <p style="font-size: 16px; color: #374151;">Bonjour <strong>${user.firstName} ${user.lastName}</strong>,</p>
        
        <p style="font-size: 16px; color: #374151;">
          Une nouvelle campagne d'évaluation des performances a été lancée :
        </p>
        
        <div style="background: #f9fafb; border-left: 4px solid #4f46e5; padding: 20px; margin: 25px 0; border-radius: 8px;">
          <h2 style="color: #111827; font-size: 20px; margin: 0 0 10px 0;">${campaign.title}</h2>
          ${campaign.description ? `<p style="color: #6b7280; margin: 0;">${campaign.description}</p>` : ''}
        </div>
        
        <div style="margin: 25px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px; background: #f3f4f6; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">📅 Période</td>
              <td style="padding: 12px; background: #f9fafb; color: #374151; border-bottom: 1px solid #e5e7eb;">
                ${formattedStartDate} - ${formattedEndDate}
              </td>
            </tr>
            ${campaign.self_review_deadline ? `
            <tr>
              <td style="padding: 12px; background: #f3f4f6; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">⏰ Auto-évaluation</td>
              <td style="padding: 12px; background: #f9fafb; color: #374151; border-bottom: 1px solid #e5e7eb;">
                Avant le ${campaign.self_review_deadline.toLocaleDateString('fr-FR')}
              </td>
            </tr>
            ` : ''}
            ${campaign.manager_review_deadline ? `
            <tr>
              <td style="padding: 12px; background: #f3f4f6; font-weight: bold; color: #374151;">👔 Évaluation manager</td>
              <td style="padding: 12px; background: #f9fafb; color: #374151;">
                Avant le ${campaign.manager_review_deadline.toLocaleDateString('fr-FR')}
              </td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <p style="font-size: 16px; color: #374151;">
          Votre évaluation a été créée. Veuillez vous connecter à votre espace pour <strong>définir vos objectifs</strong> et compléter votre auto-évaluation.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${frontendUrl}/performance/campaigns" 
             style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Accéder à la campagne
          </a>
        </div>
        
        <br/>
        <p style="font-size: 16px; color: #374151;">Cordialement,</p>
        
        <div style="margin-top: 20px; border-left: 4px solid #4f46e5; padding-left: 15px;">
          <p style="font-size: 16px; font-weight: bold; color: #111827; margin: 0;">Service RH</p>
          <p style="font-size: 14px; color: #6b7280; margin: 4px 0 0 0;">Gestion des Performances</p>
        </div>
      </div>
    `;

    await this.sendMail({
      to: user.email,
      subject,
      html,
    });
  }

  async sendUserInvitation(
    user: { email: string; fullName: string },
    token: string
  ): Promise<void> {
    const subject = `Bienvenue chez Efficia - Configurez votre compte`;
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const setupUrl = `${frontendUrl}/setup-password?token=${token}`;

    const html = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${frontendUrl}/images/logo/logo.svg" alt="Efficia Logo" style="height: 40px; margin-bottom: 20px;" />
          <h1 style="color: #4f46e5; font-size: 28px; margin: 0;">👋 Bienvenue !</h1>
        </div>
        
        <p style="font-size: 16px; color: #374151;">Bonjour <strong>${user.fullName}</strong>,</p>
        
        <p style="font-size: 16px; color: #374151;">
          Un compte a été créé pour vous sur la plateforme Efficia HRMS.
        </p>
        
        <p style="font-size: 16px; color: #374151;">
          Pour finaliser la configuration de votre compte et accéder à vos services, veuillez définir votre mot de passe en cliquant sur le bouton ci-dessous :
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${setupUrl}" 
             style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Définir mon mot de passe
          </a>
        </div>

        <p style="font-size: 14px; color: #6b7280;">
          Si le bouton ne fonctionne pas, vous pouvez copier et coller le lien suivant dans votre navigateur :<br/>
          <a href="${setupUrl}" style="color: #4f46e5; word-break: break-all;">${setupUrl}</a>
        </p>
        
        <p style="font-size: 14px; color: #9ca3af; margin-top: 20px;">
          Ce lien expirera dans 24 heures. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.
        </p>
        
        <br/>
        <p style="font-size: 16px; color: #374151;">À très bientôt,</p>
        
        <div style="margin-top: 20px; border-left: 4px solid #4f46e5; padding-left: 15px;">
          <p style="font-size: 16px; font-weight: bold; color: #111827; margin: 0;">L'équipe RH</p>
          <p style="font-size: 14px; color: #6b7280; margin: 4px 0 0 0;">Efficia</p>
        </div>
      </div>
    `;

    await this.sendMail({
      to: user.email,
      subject,
      html,
    });
  }
}
