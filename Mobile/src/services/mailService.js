import api from './api';
import { API_ENDPOINTS } from '../constants/constants';

// ==============================================================
// Mail Service — Maps to Flask /api/emails/* endpoints
// ==============================================================

const mailService = {
  /**
   * GET /api/emails
   * Auth: JWT Required
   * Returns: Array of email objects
   * Status: 200 OK | 404 User not found
   */
  async getEmails() {
    const response = await api.get(API_ENDPOINTS.EMAILS.LIST);
    return response.data;
  },

  /**
   * POST /api/emails
   * Auth: JWT Required
   * Body: { recipient_email, subject, body, is_encrypted, passkey, attachment_name, attachment_size }
   * Returns: { message, recipient_email, recipient_row_id, sender_row_id }
   * Status: 201 Created | 400 Bad Request | 404 User not found
   */
  async composeEmail({ recipientEmail, subject, body, isEncrypted = false, passkey = '', attachmentName = null, attachmentSize = null }) {
    const response = await api.post(API_ENDPOINTS.EMAILS.COMPOSE, {
      recipient_email: recipientEmail.trim(),
      subject: subject.trim(),
      body: body.trim(),
      is_encrypted: isEncrypted,
      passkey: passkey || '',
      attachment_name: attachmentName,
      attachment_size: attachmentSize,
    });
    return response.data;
  },

  /**
   * PUT /api/emails/:id
   * Auth: JWT Required
   * Body: { is_read?, is_starred?, folder? }
   * Returns: { message }
   * Status: 200 OK | 400 No params | 403 Unauthorized | 404 Not found
   */
  async updateEmail(emailId, updates) {
    const body = {};
    if ('isRead' in updates) body.is_read = updates.isRead;
    if ('isStarred' in updates) body.is_starred = updates.isStarred;
    if ('folder' in updates) body.folder = updates.folder;

    const response = await api.put(API_ENDPOINTS.EMAILS.UPDATE(emailId), body);
    return response.data;
  },

  /**
   * DELETE /api/emails/:id
   * Auth: JWT Required
   * Returns: { message }
   * Status: 200 OK | 403 Unauthorized | 404 Not found
   */
  async deleteEmail(emailId) {
    const response = await api.delete(API_ENDPOINTS.EMAILS.DELETE(emailId));
    return response.data;
  },

  /**
   * POST /api/emails/:id/decrypt
   * Auth: JWT Required
   * Body: { passkey }
   * Returns: { status, body, attachment }
   * Status: 200 OK | 401 Wrong passkey | 403 Unauthorized | 404 Not found
   */
  async decryptEmail(emailId, passkey) {
    const response = await api.post(API_ENDPOINTS.EMAILS.DECRYPT(emailId), {
      passkey: passkey.trim(),
    });
    return response.data;
  },

  /**
   * Mark email as read
   */
  async markAsRead(emailId) {
    return this.updateEmail(emailId, { isRead: true });
  },

  /**
   * Toggle starred status
   */
  async toggleStar(emailId, currentStarred) {
    return this.updateEmail(emailId, { isStarred: !currentStarred });
  },

  /**
   * Move email to trash
   */
  async moveToTrash(emailId) {
    return this.updateEmail(emailId, { folder: 'trash' });
  },
};

export default mailService;
