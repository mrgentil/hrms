import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

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
  private transporter: Transporter | null = null;
  private readonly fromEmail: string | null;
  private readonly fromName: string | null;
  private readonly enabled: boolean;
  private readonly fallbackEmail: string | null;

  constructor(private readonly configService: ConfigService) {
    const mailer = this.configService.get<string>('MAIL_MAILER', 'smtp');
    const host = this.configService.get<string>('MAIL_HOST');
    const port = Number(this.configService.get<string>('MAIL_PORT') ?? '0');
    const username = this.configService.get<string>('MAIL_USERNAME');
    const password = this.configService.get<string>('MAIL_PASSWORD');
    const encryption = (this.configService.get<string>('MAIL_ENCRYPTION') || '').toLowerCase();

    this.fromEmail = this.configService.get<string>('MAIL_FROM_ADDRESS') || username || null;
    this.fromName = this.configService.get<string>('MAIL_FROM_NAME') || null;
    this.fallbackEmail = this.configService.get<string>('CONTACT_TO_EMAIL') || null;

    if (mailer !== 'smtp') {
      this.enabled = false;
      this.logger.warn(`Unsupported mailer "${mailer}". Emails will be disabled.`);
      return;
    }

    if (!host || !username || !password || !this.fromEmail) {
      this.enabled = false;
      this.logger.warn('Mail configuration incomplete. Emails will be disabled.');
      return;
    }

    this.enabled = true;

    const secure = encryption === 'ssl' || encryption === 'tls' || port === 465;

    this.transporter = nodemailer.createTransport({
      host,
      port: port > 0 ? port : secure ? 465 : 587,
      secure,
      auth: {
        user: username,
        pass: password,
      },
    });
  }

  async sendMail(payload: SendMailPayload): Promise<void> {
    if (!this.enabled || !this.transporter) {
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
          ? `"${this.fromName}" <${this.fromEmail}>`
          : this.fromEmail;

      await this.transporter.sendMail({
        from: from ?? undefined,
        to: recipient,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
        attachments: payload.attachments,
      });
      this.logger.debug(`Email "${payload.subject}" sent to ${recipient}`);
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
}
