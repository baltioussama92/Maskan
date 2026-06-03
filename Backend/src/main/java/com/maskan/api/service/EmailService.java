package com.maskan.api.service;

import com.maskan.api.exception.EmailDeliveryException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;

@Service
@Slf4j
public class EmailService {

    private static final SecureRandom RANDOM = new SecureRandom();

        @Autowired
        private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    public String generateOtpCode() {
        int code = 100000 + RANDOM.nextInt(900000);
        return String.valueOf(code);
    }

    public void sendOtpEmail(String recipientEmail, String otpCode) {
        String normalizedSenderEmail = normalizeEmailValue(senderEmail);
        if (!StringUtils.hasText(normalizedSenderEmail) || !normalizedSenderEmail.contains("@")) {
            throw new IllegalArgumentException("Configuration email invalide (spring.mail.username)");
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(recipientEmail);
            helper.setFrom(normalizedSenderEmail);
            helper.setSubject("Votre code de vérification Maskan");
            helper.setText(buildOtpHtml(otpCode), true);
            mailSender.send(message);
            log.info("OTP safely dispatched to email: {}", recipientEmail);
        } catch (MessagingException | MailException exception) {
            log.error("SMTP CRITICAL FAILURE: Could not send email to {}. Root cause: {}", recipientEmail, exception.getMessage(), exception);
            String message = exception.getMessage();
            throw new EmailDeliveryException(
                    StringUtils.hasText(message)
                            ? "Impossible d'envoyer le code OTP par email: " + message
                            : "Impossible d'envoyer le code OTP par email",
                    exception
            );
        }
    }

    public void sendOtpHtmlEmail(String recipientEmail, String otpCode) {
        sendOtpEmail(recipientEmail, otpCode);
    }

          private String normalizeEmailValue(String rawEmail) {
            if (!StringUtils.hasText(rawEmail)) {
              return "";
            }

            String normalized = rawEmail.trim();
            while (normalized.length() >= 2 && ((normalized.startsWith("\"") && normalized.endsWith("\"")) || (normalized.startsWith("'") && normalized.endsWith("'")))) {
              normalized = normalized.substring(1, normalized.length() - 1).trim();
            }
            return normalized;
          }

    private String buildOtpHtml(String otpCode) {
        return "<!DOCTYPE html>\n" +
                "<html lang=\"fr\">\n" +
                "<head>\n" +
                "  <meta charset=\"UTF-8\">\n" +
                "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "</head>\n" +
                "<body style=\"margin:0;padding:0;background:#f5f2ee;font-family:Arial,sans-serif;color:#2b2b2b;\">\n" +
                "  <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"padding:32px 12px;\">\n" +
                "    <tr>\n" +
                "      <td align=\"center\">\n" +
                "        <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6ddd5;\">\n" +
                "          <tr>\n" +
                "            <td style=\"background:#A65B32;padding:24px 28px;color:#ffffff;\">\n" +
                "              <h1 style=\"margin:0;font-size:24px;line-height:1.2;\">Maskan</h1>\n" +
                "              <p style=\"margin:8px 0 0;font-size:14px;opacity:0.95;\">Verification de securite de votre compte</p>\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "          <tr>\n" +
                "            <td style=\"padding:26px 28px;\">\n" +
                "              <p style=\"margin:0 0 12px;font-size:15px;line-height:1.6;\">Bonjour,</p>\n" +
                "              <p style=\"margin:0 0 18px;font-size:15px;line-height:1.6;\">Utilisez ce code pour verifier votre adresse email sur la plateforme Maskan :</p>\n" +
                "              <div style=\"text-align:center;margin:16px 0 22px;\">\n" +
                "                <span style=\"display:inline-block;background:#f4e7de;color:#A65B32;font-size:32px;letter-spacing:6px;font-weight:700;padding:14px 22px;border-radius:10px;border:1px solid #e3cdbf;\">" + (otpCode == null ? "" : otpCode) + "</span>\n" +
                "              </div>\n" +
                "              <p style=\"margin:0 0 12px;font-size:14px;color:#5f5f5f;line-height:1.6;\">Ce code expire dans <strong>15 minutes</strong>.</p>\n" +
                "              <p style=\"margin:0;font-size:13px;color:#7a7a7a;line-height:1.6;\">Si vous n'etes pas a l'origine de cette demande, vous pouvez ignorer cet email.</p>\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "          <tr>\n" +
                "            <td style=\"background:#f9f6f3;padding:14px 28px;color:#7a6f67;font-size:12px;text-align:center;\">\n" +
                "              © Maskan - Plateforme de location immobiliere\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "        </table>\n" +
                "      </td>\n" +
                "    </tr>\n" +
                "  </table>\n" +
                "</body>\n" +
                "</html>";
    }

    // ==== EVENT-DRIVEN EMAIL NOTIFICATIONS ====

    /**
     * Security Alert: Password changed
     */
    @Async
    public void sendPasswordChangedAlert(String recipientEmail) {
        String normalizedSenderEmail = normalizeEmailValue(senderEmail);
        if (!StringUtils.hasText(normalizedSenderEmail) || !normalizedSenderEmail.contains("@")) {
            throw new IllegalArgumentException("Configuration email invalide");
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(recipientEmail);
            helper.setFrom(normalizedSenderEmail);
            helper.setSubject("Alerte de securite - Mot de passe change");
            helper.setText(buildPasswordChangedHtml(), true);
            mailSender.send(message);
            log.info("Password changed alert sent to {}", recipientEmail);
        } catch (MessagingException | MailException exception) {
            log.error("Failed to send password changed alert to {}", recipientEmail, exception);
        }
    }

    /**
     * Inbox Alert: New direct message received
     */
    @Async
    public void sendNewMessageAlert(String recipientEmail, String senderName, String messageContent) {
        String normalizedSenderEmail = normalizeEmailValue(senderEmail);
        if (!StringUtils.hasText(normalizedSenderEmail) || !normalizedSenderEmail.contains("@")) {
            throw new IllegalArgumentException("Configuration email invalide");
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(recipientEmail);
            helper.setFrom(normalizedSenderEmail);
            helper.setSubject("Nouveau message de " + senderName);
            helper.setText(buildNewMessageHtml(senderName, messageContent), true);
            mailSender.send(message);
            log.info("New message alert sent to {}", recipientEmail);
        } catch (MessagingException | MailException exception) {
            log.error("Failed to send new message alert to {}", recipientEmail, exception);
        }
    }

    /**
     * Support Update: Admin replied to a support ticket
     */
    @Async
    public void sendSupportReplyAlert(String recipientEmail, String ticketSubject) {
        String normalizedSenderEmail = normalizeEmailValue(senderEmail);
        if (!StringUtils.hasText(normalizedSenderEmail) || !normalizedSenderEmail.contains("@")) {
            throw new IllegalArgumentException("Configuration email invalide");
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(recipientEmail);
            helper.setFrom(normalizedSenderEmail);
            helper.setSubject("Reponse a votre ticket de support");
            helper.setText(buildSupportReplyHtml(ticketSubject), true);
            mailSender.send(message);
            log.info("Support reply alert sent to {}", recipientEmail);
        } catch (MessagingException | MailException exception) {
            log.error("Failed to send support reply alert to {}", recipientEmail, exception);
        }
    }

    /**
     * Marketing/Platform: New property listing published or approved
     */
    @Async
    public void sendNewPropertyAlert(String recipientEmail, String propertyTitle, String propertyLocation) {
        String normalizedSenderEmail = normalizeEmailValue(senderEmail);
        if (!StringUtils.hasText(normalizedSenderEmail) || !normalizedSenderEmail.contains("@")) {
            throw new IllegalArgumentException("Configuration email invalide");
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(recipientEmail);
            helper.setFrom(normalizedSenderEmail);
            helper.setSubject("Nouvelle propriete: " + propertyTitle);
            helper.setText(buildNewPropertyHtml(propertyTitle, propertyLocation), true);
            mailSender.send(message);
            log.info("New property alert sent to {}", recipientEmail);
        } catch (MessagingException | MailException exception) {
            log.error("Failed to send new property alert to {}", recipientEmail, exception);
        }
    }

    // ==== HTML EMAIL TEMPLATES ====

    private String buildPasswordChangedHtml() {
        return "<!DOCTYPE html>\n" +
                "<html lang=\"fr\">\n" +
                "<head>\n" +
                "  <meta charset=\"UTF-8\">\n" +
                "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "</head>\n" +
                "<body style=\"margin:0;padding:0;background:#f5f2ee;font-family:Arial,sans-serif;color:#2b2b2b;\">\n" +
                "  <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"padding:32px 12px;\">\n" +
                "    <tr>\n" +
                "      <td align=\"center\">\n" +
                "        <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6ddd5;\">\n" +
                "          <tr>\n" +
                "            <td style=\"background:linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);padding:28px 28px;color:#ffffff;\">\n" +
                "              <h1 style=\"margin:0;font-size:24px;line-height:1.2;\">Alerte de Securite</h1>\n" +
                "              <p style=\"margin:8px 0 0;font-size:14px;opacity:0.95;\">Votre mot de passe a ete modifie</p>\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "          <tr>\n" +
                "            <td style=\"padding:28px 28px;\">\n" +
                "              <p style=\"margin:0 0 12px;font-size:15px;line-height:1.6;color:#2b2b2b;\">Bonjour,</p>\n" +
                "              <p style=\"margin:0 0 18px;font-size:15px;line-height:1.6;color:#5f5f5f;\">\n" +
                "                Nous vous informons que le mot de passe de votre compte Maskan a ete change avec succes. Si vous n'etes pas a l'origine de cette modification, veuillez contacter immediatement notre equipe de support.\n" +
                "              </p>\n" +
                "              <div style=\"background:#fff3cd;border-left:4px solid #ffc107;padding:14px 14px;margin:16px 0 22px;border-radius:4px;\">\n" +
                "                <p style=\"margin:0;font-size:13px;color:#856404;\">\n" +
                "                  <strong>Conseil de securite:</strong> Ne partagez jamais votre mot de passe avec personne. Maskan ne vous le demandra jamais par email.\n" +
                "                </p>\n" +
                "              </div>\n" +
                "              <table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" style=\"width:100%;\">\n" +
                "                <tr>\n" +
                "                  <td align=\"center\" style=\"padding:16px 0;\">\n" +
                "                    <a href=\"https://maskan.com/security\" style=\"display:inline-block;background:#A65B32;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:700;\">Gerer ma securite</a>\n" +
                "                  </td>\n" +
                "                </tr>\n" +
                "              </table>\n" +
                "              <p style=\"margin:18px 0 0;font-size:13px;color:#7a7a7a;line-height:1.6;\">\n" +
                "                Des questions? <a href=\"https://maskan.com/support\" style=\"color:#A65B32;text-decoration:none;\">Contactez-nous</a>\n" +
                "              </p>\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "          <tr>\n" +
                "            <td style=\"background:#f9f6f3;padding:14px 28px;color:#7a6f67;font-size:12px;text-align:center;\">\n" +
                "              © Maskan - Plateforme de location immobiliere\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "        </table>\n" +
                "      </td>\n" +
                "    </tr>\n" +
                "  </table>\n" +
                "</body>\n" +
                "</html>";
    }

    private String buildNewMessageHtml(String senderName, String messageContent) {
        String displayName = (senderName != null ? senderName : "un utilisateur");
        String escapedContent = (messageContent != null ? messageContent.replace("<", "&lt;").replace(">", "&gt;") : "");
        return "<!DOCTYPE html>\n" +
                "<html lang=\"fr\">\n" +
                "<head>\n" +
                "  <meta charset=\"UTF-8\">\n" +
                "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "</head>\n" +
                "<body style=\"margin:0;padding:0;background:#f5f2ee;font-family:Arial,sans-serif;color:#2b2b2b;\">\n" +
                "  <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"padding:32px 12px;\">\n" +
                "    <tr>\n" +
                "      <td align=\"center\">\n" +
                "        <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6ddd5;\">\n" +
                "          <tr>\n" +
                "            <td style=\"background:linear-gradient(135deg, #42a5f5 0%, #1976d2 100%);padding:28px 28px;color:#ffffff;\">\n" +
                "              <h1 style=\"margin:0;font-size:24px;line-height:1.2;\">Nouveau Message</h1>\n" +
                "              <p style=\"margin:8px 0 0;font-size:14px;opacity:0.95;\">De " + displayName + "</p>\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "          <tr>\n" +
                "            <td style=\"padding:28px 28px;\">\n" +
                "              <p style=\"margin:0 0 12px;font-size:15px;line-height:1.6;color:#2b2b2b;\">Bonjour,</p>\n" +
                "              <p style=\"margin:0 0 18px;font-size:15px;line-height:1.6;color:#5f5f5f;\">\n" +
                "                <strong>" + displayName + "</strong> vous a envoye un message sur Maskan :\n" +
                "              </p>\n" +
                "              <div style=\"background:#f0f8ff;border-left:4px solid #42a5f5;padding:14px 14px;margin:16px 0 22px;border-radius:4px;overflow-wrap:break-word;\">\n" +
                "                <p style=\"margin:0;font-size:14px;color:#2b2b2b;white-space:pre-wrap;word-break:break-word;\">\n" +
                "                  " + escapedContent + "\n" +
                "                </p>\n" +
                "              </div>\n" +
                "              <div style=\"background:#e3f2fd;border-left:4px solid #42a5f5;padding:14px 14px;margin:16px 0 22px;border-radius:4px;\">\n" +
                "                <p style=\"margin:0;font-size:13px;color:#1565c0;\">\n" +
                "                  Repondez rapidement pour maintenir une bonne communication!\n" +
                "                </p>\n" +
                "              </div>\n" +
                "              <table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" style=\"width:100%;\">\n" +
                "                <tr>\n" +
                "                  <td align=\"center\" style=\"padding:16px 0;\">\n" +
                "                    <a href=\"https://maskan.com/messages\" style=\"display:inline-block;background:#42a5f5;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:700;\">Aller a mes messages</a>\n" +
                "                  </td>\n" +
                "                </tr>\n" +
                "              </table>\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "          <tr>\n" +
                "            <td style=\"background:#f9f6f3;padding:14px 28px;color:#7a6f67;font-size:12px;text-align:center;\">\n" +
                "              © Maskan - Plateforme de location immobiliere\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "        </table>\n" +
                "      </td>\n" +
                "    </tr>\n" +
                "  </table>\n" +
                "</body>\n" +
                "</html>";
    }

    private String buildSupportReplyHtml(String ticketSubject) {
        String subject = (ticketSubject != null ? ticketSubject : "Support");
        return "<!DOCTYPE html>\n" +
                "<html lang=\"fr\">\n" +
                "<head>\n" +
                "  <meta charset=\"UTF-8\">\n" +
                "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "</head>\n" +
                "<body style=\"margin:0;padding:0;background:#f5f2ee;font-family:Arial,sans-serif;color:#2b2b2b;\">\n" +
                "  <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"padding:32px 12px;\">\n" +
                "    <tr>\n" +
                "      <td align=\"center\">\n" +
                "        <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6ddd5;\">\n" +
                "          <tr>\n" +
                "            <td style=\"background:linear-gradient(135deg, #66bb6a 0%, #43a047 100%);padding:28px 28px;color:#ffffff;\">\n" +
                "              <h1 style=\"margin:0;font-size:24px;line-height:1.2;\">Reponse Support</h1>\n" +
                "              <p style=\"margin:8px 0 0;font-size:14px;opacity:0.95;\">L'equipe Maskan a repondu a votre ticket</p>\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "          <tr>\n" +
                "            <td style=\"padding:28px 28px;\">\n" +
                "              <p style=\"margin:0 0 12px;font-size:15px;line-height:1.6;color:#2b2b2b;\">Bonjour,</p>\n" +
                "              <p style=\"margin:0 0 18px;font-size:15px;line-height:1.6;color:#5f5f5f;\">\n" +
                "                Notre equipe de support a examine votre ticket et a fourni une reponse. Veuillez consulter les details ci-dessous.\n" +
                "              </p>\n" +
                "              <div style=\"background:#f1f8e9;border-left:4px solid #7cb342;padding:14px 14px;margin:16px 0 22px;border-radius:4px;\">\n" +
                "                <p style=\"margin:0;font-size:13px;color:#558b2f;\">\n" +
                "                  <strong>Ticket:</strong> " + subject + "\n" +
                "                </p>\n" +
                "              </div>\n" +
                "              <table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" style=\"width:100%;\">\n" +
                "                <tr>\n" +
                "                  <td align=\"center\" style=\"padding:16px 0;\">\n" +
                "                    <a href=\"https://maskan.com/support/tickets\" style=\"display:inline-block;background:#66bb6a;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:700;\">Voir mon ticket</a>\n" +
                "                  </td>\n" +
                "                </tr>\n" +
                "              </table>\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "          <tr>\n" +
                "            <td style=\"background:#f9f6f3;padding:14px 28px;color:#7a6f67;font-size:12px;text-align:center;\">\n" +
                "              © Maskan - Plateforme de location immobiliere\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "        </table>\n" +
                "      </td>\n" +
                "    </tr>\n" +
                "  </table>\n" +
                "</body>\n" +
                "</html>";
    }

    private String buildNewPropertyHtml(String propertyTitle, String propertyLocation) {
        String title = (propertyTitle != null ? propertyTitle : "Nouvelle propriete");
        String location = (propertyLocation != null ? propertyLocation : "Localisation");
        return "<!DOCTYPE html>\n" +
                "<html lang=\"fr\">\n" +
                "<head>\n" +
                "  <meta charset=\"UTF-8\">\n" +
                "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "</head>\n" +
                "<body style=\"margin:0;padding:0;background:#f5f2ee;font-family:Arial,sans-serif;color:#2b2b2b;\">\n" +
                "  <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"padding:32px 12px;\">\n" +
                "    <tr>\n" +
                "      <td align=\"center\">\n" +
                "        <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6ddd5;\">\n" +
                "          <tr>\n" +
                "            <td style=\"background:linear-gradient(135deg, #A65B32 0%, #8B4513 100%);padding:28px 28px;color:#ffffff;\">\n" +
                "              <h1 style=\"margin:0;font-size:24px;line-height:1.2;\">Nouvelle Propriete</h1>\n" +
                "              <p style=\"margin:8px 0 0;font-size:14px;opacity:0.95;\">Une nouvelle annonce vous interesse!</p>\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "          <tr>\n" +
                "            <td style=\"padding:28px 28px;\">\n" +
                "              <p style=\"margin:0 0 12px;font-size:15px;line-height:1.6;color:#2b2b2b;\">Bonjour,</p>\n" +
                "              <p style=\"margin:0 0 18px;font-size:15px;line-height:1.6;color:#5f5f5f;\">\n" +
                "                Une nouvelle propriete correspond a votre recherche sur Maskan. Decouvrez cette annonce maintenant!\n" +
                "              </p>\n" +
                "              <div style=\"background:#fff8e1;border-left:4px solid #fbc02d;padding:14px 14px;margin:16px 0 22px;border-radius:4px;\">\n" +
                "                <p style=\"margin:0;font-size:14px;color:#f57f17;font-weight:700;\">\n" +
                "                  " + title + "\n" +
                "                </p>\n" +
                "                <p style=\"margin:6px 0 0;font-size:13px;color:#f57f17;\">\n" +
                "                  " + location + "\n" +
                "                </p>\n" +
                "              </div>\n" +
                "              <table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" style=\"width:100%;\">\n" +
                "                <tr>\n" +
                "                  <td align=\"center\" style=\"padding:16px 0;\">\n" +
                "                    <a href=\"https://maskan.com/properties\" style=\"display:inline-block;background:#A65B32;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:700;\">Voir la propriete</a>\n" +
                "                  </td>\n" +
                "                </tr>\n" +
                "              </table>\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "          <tr>\n" +
                "            <td style=\"background:#f9f6f3;padding:14px 28px;color:#7a6f67;font-size:12px;text-align:center;\">\n" +
                "              © Maskan - Plateforme de location immobiliere\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "        </table>\n" +
                "      </td>\n" +
                "    </tr>\n" +
                "  </table>\n" +
                "</body>\n" +
                "</html>";
    }
}
