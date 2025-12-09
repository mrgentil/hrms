/**
 * Helper pour générer des templates d'email professionnels
 */

export interface EmailTemplateOptions {
  appName: string;
  appUrl?: string;
  primaryColor?: string;
  logoUrl?: string;
}

const DEFAULT_PRIMARY_COLOR = '#465fff';

/**
 * Génère le wrapper HTML pour un email
 */
export function generateEmailWrapper(
  content: string,
  options: EmailTemplateOptions,
): string {
  const { appName, appUrl = '#', primaryColor = DEFAULT_PRIMARY_COLOR, logoUrl } = options;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; -webkit-font-smoothing: antialiased;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -20)} 100%); padding: 32px 40px; text-align: center;">
              ${logoUrl ? `<img src="${logoUrl}" alt="${appName}" style="max-height: 48px; margin-bottom: 8px;">` : ''}
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">
                ${appName}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">
                      — L'équipe ${appName}
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Unsubscribe -->
        <table role="presentation" style="max-width: 600px; margin: 16px auto 0;">
          <tr>
            <td style="text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                © ${new Date().getFullYear()} ${appName}. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Template pour les notifications de commentaire
 */
export function generateCommentNotificationEmail(
  options: EmailTemplateOptions & {
    recipientName: string;
    authorName: string;
    taskTitle: string;
    projectName: string;
    commentContent: string;
    isReply: boolean;
    replyToName?: string;
    attachmentNames?: string[];
    taskUrl?: string;
  },
): string {
  const {
    recipientName,
    authorName,
    taskTitle,
    projectName,
    commentContent,
    isReply,
    replyToName,
    attachmentNames = [],
    taskUrl = '#',
    primaryColor = DEFAULT_PRIMARY_COLOR,
  } = options;

  const title = isReply 
    ? `${authorName} a répondu à ${replyToName || 'un commentaire'}`
    : `Nouveau commentaire de ${authorName}`;

  // Nettoyer le contenu (retirer les lignes de PJ si présentes car on les affiche séparément)
  const cleanContent = commentContent
    .split('\n')
    .filter(line => !line.startsWith('📎'))
    .join('\n')
    .trim();

  const content = `
    <div style="margin-bottom: 24px;">
      <h2 style="color: #1e293b; margin: 0 0 8px 0; font-size: 20px; font-weight: 600;">
        💬 ${title}
      </h2>
      <p style="color: #64748b; margin: 0; font-size: 14px;">
        Sur la tâche "<strong style="color: #334155;">${taskTitle}</strong>" 
        ${projectName ? `dans le projet "<strong style="color: #334155;">${projectName}</strong>"` : ''}
      </p>
    </div>
    
    <p style="color: #475569; margin: 0 0 24px 0; font-size: 15px; line-height: 1.6;">
      Bonjour <strong>${recipientName}</strong>,
    </p>
    
    <!-- Commentaire -->
    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid ${primaryColor};">
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -20)} 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 16px; margin-right: 12px;">
          ${authorName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p style="margin: 0; font-weight: 600; color: #1e293b; font-size: 14px;">${authorName}</p>
          <p style="margin: 0; color: #94a3b8; font-size: 12px;">à l'instant</p>
        </div>
      </div>
      <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
        ${escapeHtml(cleanContent)}
      </p>
    </div>
    
    ${attachmentNames.length > 0 ? `
    <!-- Pièces jointes -->
    <div style="background-color: #fefce8; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #854d0e; font-size: 13px;">
        📎 ${attachmentNames.length} pièce(s) jointe(s) :
      </p>
      <ul style="margin: 0; padding-left: 20px; color: #a16207; font-size: 13px;">
        ${attachmentNames.map(name => `<li style="margin: 4px 0;">${escapeHtml(name)}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
    
    <!-- Bouton -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${taskUrl}" style="display: inline-block; background: linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -20)} 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 14px ${primaryColor}40;">
        Voir la tâche →
      </a>
    </div>
    
    <p style="color: #94a3b8; margin: 0; font-size: 13px; text-align: center;">
      Connectez-vous pour voir ou répondre au commentaire.
    </p>
  `;

  return generateEmailWrapper(content, options);
}

/**
 * Template générique pour les notifications
 */
export function generateNotificationEmail(
  options: EmailTemplateOptions & {
    recipientName: string;
    title: string;
    message: string;
    ctaText?: string;
    ctaUrl?: string;
    icon?: string;
  },
): string {
  const {
    recipientName,
    title,
    message,
    ctaText = 'Voir plus',
    ctaUrl = '#',
    icon = '🔔',
    primaryColor = DEFAULT_PRIMARY_COLOR,
  } = options;

  const content = `
    <div style="margin-bottom: 24px;">
      <h2 style="color: #1e293b; margin: 0; font-size: 20px; font-weight: 600;">
        ${icon} ${title}
      </h2>
    </div>
    
    <p style="color: #475569; margin: 0 0 24px 0; font-size: 15px; line-height: 1.6;">
      Bonjour <strong>${recipientName}</strong>,
    </p>
    
    <p style="color: #334155; margin: 0 0 32px 0; font-size: 15px; line-height: 1.7;">
      ${message}
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -20)} 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 14px ${primaryColor}40;">
        ${ctaText} →
      </a>
    </div>
  `;

  return generateEmailWrapper(content, options);
}

// Helpers
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return `#${(
    0x1000000 +
    (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 0 ? 0 : B) : 255)
  )
    .toString(16)
    .slice(1)}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');
}
