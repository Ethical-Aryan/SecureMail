import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, Switch, TouchableOpacity,
  KeyboardAvoidingView, StyleSheet, Platform, Alert, Modal, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/theme';
import Input from '../../components/common/Input';
import useMail from '../../hooks/useMail';
import useApp from '../../hooks/useApp';
import { useTheme } from '../../context/ThemeContext';
import { validateComposeForm, validatePasskey } from '../../utils/validators';
import mailService from '../../services/mailService';

let DocumentPicker = null;
try {
  DocumentPicker = require('expo-document-picker');
} catch {
  console.log('[Compose] expo-document-picker not available.');
}

export default function ComposeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { sendEmail, isSending } = useMail();
  const { showToast } = useApp();

  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [plainBody, setPlainBody] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [passkey, setPasskey] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Active Formatting Toggles
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  // Link Items
  const [links, setLinks] = useState([]);
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Attachments
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState([]);

  // ------------------------------------------------------------------
  // Formatting Handlers
  // ------------------------------------------------------------------

  const toggleBold = useCallback(() => setIsBold((prev) => !prev), []);
  const toggleItalic = useCallback(() => setIsItalic((prev) => !prev), []);
  const toggleUnderline = useCallback(() => setIsUnderline((prev) => !prev), []);

  const handleOpenLinkModal = useCallback(() => {
    setLinkText('');
    setLinkUrl('');
    setLinkModalVisible(true);
  }, []);

  const handleInsertLink = useCallback(() => {
    let cleanUrl = linkUrl.trim();
    if (!cleanUrl) {
      showToast('Please enter a valid URL', 'warning');
      return;
    }

    if (cleanUrl.toLowerCase().startsWith('javascript:')) {
      showToast('JavaScript URLs are not permitted for security reasons.', 'error');
      return;
    }

    if (!/^(https?:\/\/|mailto:)/i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const label = linkText.trim() || cleanUrl;
    setLinks((prev) => [...prev, { label, url: cleanUrl }]);
    setLinkModalVisible(false);
    showToast('Hyperlink attached', 'success');
  }, [linkUrl, linkText, showToast]);

  const handleRemoveLink = useCallback((index) => {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ------------------------------------------------------------------
  // Build Final HTML Payload for Backend Transmission
  // ------------------------------------------------------------------

  const formattedHtmlBody = useMemo(() => {
    if (!plainBody) return '';

    let content = plainBody;

    if (isBold) content = `<b>${content}</b>`;
    if (isItalic) content = `<i>${content}</i>`;
    if (isUnderline) content = `<u>${content}</u>`;

    if (links.length > 0) {
      const linkHtmls = links.map((l) => `<p><a href="${l.url}">${l.label}</a></p>`).join('');
      content = `${content}\n<br/>${linkHtmls}`;
    }

    return content;
  }, [plainBody, isBold, isItalic, isUnderline, links]);

  // ------------------------------------------------------------------
  // Document Attachment Handler
  // ------------------------------------------------------------------

  const handlePickAttachment = useCallback(async () => {
    if (!DocumentPicker || !DocumentPicker.getDocumentAsync) {
      showToast('File picker is unavailable on this device.', 'warning');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        if (asset.size && asset.size > 10 * 1024 * 1024) {
          showToast('Attachment exceeds maximum size of 10MB', 'error');
          return;
        }

        setIsUploading(true);

        try {
          const uploadRes = await mailService.uploadAttachment(asset.uri, asset.name, asset.mimeType);
          setAttachments((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              name: uploadRes.attachment_name || asset.name,
              size: uploadRes.attachment_size || `${Math.round(asset.size / 1024)} KB`,
              uri: asset.uri,
            },
          ]);
          showToast('Attachment uploaded successfully', 'success');
        } catch {
          setAttachments((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              name: asset.name,
              size: asset.size ? `${Math.round(asset.size / 1024)} KB` : 'Attached',
              uri: asset.uri,
            },
          ]);
          showToast('Attachment added', 'info');
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      console.warn('Document picker error:', error);
      setIsUploading(false);
    }
  }, [showToast]);

  const handleRemoveAttachment = useCallback((id) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // ------------------------------------------------------------------
  // Send Email Handler
  // ------------------------------------------------------------------

  const handleSend = useCallback(async () => {
    const { valid, errors } = validateComposeForm({ recipient, subject, body: plainBody });

    if (isEncrypted) {
      const passkeyResult = validatePasskey(passkey);
      if (!passkeyResult.valid) {
        errors.passkey = passkeyResult.error;
      }
    }

    if (!valid || Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    const firstAttachment = attachments.length > 0 ? attachments[0] : null;

    const result = await sendEmail({
      recipientEmail: recipient,
      subject,
      body: formattedHtmlBody,
      isEncrypted,
      passkey: isEncrypted ? passkey : '',
      attachmentName: firstAttachment ? firstAttachment.name : null,
      attachmentSize: firstAttachment ? firstAttachment.size : null,
    });

    if (result.success) {
      showToast('Email sent successfully!', 'success');
      navigation.goBack();
    } else {
      showToast(result.error || 'Failed to send email', 'error');
    }
  }, [recipient, subject, plainBody, formattedHtmlBody, isEncrypted, passkey, attachments, sendEmail, showToast, navigation]);

  const handleDiscard = useCallback(() => {
    if (recipient || subject || plainBody || attachments.length > 0) {
      Alert.alert(
        'Discard Draft?',
        'Are you sure you want to discard this email?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [recipient, subject, plainBody, attachments, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleDiscard}
          style={styles.cancelBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.cancelText, { color: colors.textPrimary }]}>Cancel</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Compose</Text>

        <TouchableOpacity
          onPress={handleSend}
          disabled={isSending || isUploading}
          style={[
            styles.sendButton,
            { backgroundColor: colors.primary },
            (isSending || isUploading) && { backgroundColor: colors.textTertiary, shadowOpacity: 0 },
          ]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isSending || isUploading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Feather name="send" size={16} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Recipient Input */}
          <View style={styles.inputRow}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>To:</Text>
            <View style={styles.underlinedInputContainer}>
              <Input
                value={recipient}
                onChangeText={(text) => {
                  setRecipient(text);
                  if (fieldErrors.recipient) setFieldErrors((p) => ({ ...p, recipient: null }));
                }}
                placeholder="recipient@company.com"
                keyboardType="email-address"
                autoCapitalize="none"
                variant="underlined"
                error={fieldErrors.recipient}
              />
            </View>
          </View>

          {/* Subject Input */}
          <View style={styles.inputRow}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Subject:</Text>
            <View style={styles.underlinedInputContainer}>
              <Input
                value={subject}
                onChangeText={(text) => {
                  setSubject(text);
                  if (fieldErrors.subject) setFieldErrors((p) => ({ ...p, subject: null }));
                }}
                placeholder="Message subject"
                variant="underlined"
                error={fieldErrors.subject}
              />
            </View>
          </View>

          {/* Passkey Encryption Toggle Card */}
          <View style={[styles.encryptionCard, { backgroundColor: colors.card }, SHADOWS.sm]}>
            <View style={styles.encryptionRow}>
              <View style={styles.encryptionLeft}>
                <Text style={[styles.encryptionLabel, { color: colors.textPrimary }]}>Passkey Protection</Text>
                <Switch
                  value={isEncrypted}
                  onValueChange={setIsEncrypted}
                  trackColor={{ false: colors.border, true: '#C4B5FD' }}
                  thumbColor={isEncrypted ? colors.primary : '#F4F3F4'}
                  style={styles.switch}
                />
              </View>
            </View>

            <Text style={[styles.encryptionDescription, { color: colors.textSecondary }]}>
              {isEncrypted
                ? 'Message body will be encrypted with AES-256 GCM using your custom passkey.'
                : 'Enable to encrypt message payload with a shared secret passkey.'}
            </Text>

            {isEncrypted && (
              <View style={[styles.passkeySection, { borderTopColor: colors.border }]}>
                <Input
                  label="Encryption Passkey"
                  value={passkey}
                  onChangeText={(text) => {
                    setPasskey(text);
                    if (fieldErrors.passkey) setFieldErrors((p) => ({ ...p, passkey: null }));
                  }}
                  placeholder="Enter secret passkey"
                  icon="key"
                  secureTextEntry
                  error={fieldErrors.passkey}
                  containerStyle={styles.passkeyInput}
                />
              </View>
            )}
          </View>

          {/* Formatting Toolbar */}
          <View style={[styles.toolbar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              onPress={toggleBold}
              style={[
                styles.toolBtn,
                isBold && { backgroundColor: colors.primary + '20', borderRadius: BORDER_RADIUS.xs },
              ]}
            >
              <Feather name="bold" size={18} color={isBold ? colors.primary : colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleItalic}
              style={[
                styles.toolBtn,
                isItalic && { backgroundColor: colors.primary + '20', borderRadius: BORDER_RADIUS.xs },
              ]}
            >
              <Feather name="italic" size={18} color={isItalic ? colors.primary : colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleUnderline}
              style={[
                styles.toolBtn,
                isUnderline && { backgroundColor: colors.primary + '20', borderRadius: BORDER_RADIUS.xs },
              ]}
            >
              <Feather name="underline" size={18} color={isUnderline ? colors.primary : colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleOpenLinkModal} style={styles.toolBtn}>
              <Feather name="link" size={18} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handlePickAttachment} style={styles.toolBtn} disabled={isUploading}>
              {isUploading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Feather name="paperclip" size={18} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>

          {/* Embedded Hyperlinks Chips */}
          {links.length > 0 && (
            <View style={styles.attachmentContainer}>
              {links.map((link, idx) => (
                <View key={idx} style={[styles.attachmentChip, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                  <Feather name="link" size={12} color={colors.primary} style={styles.chipIcon} />
                  <Text style={[styles.chipText, { color: colors.primary }]} numberOfLines={1}>
                    {link.label}
                  </Text>
                  <TouchableOpacity onPress={() => handleRemoveLink(idx)} style={styles.chipRemoveBtn}>
                    <Feather name="x" size={12} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Attachment Chips Display */}
          {attachments.length > 0 && (
            <View style={styles.attachmentContainer}>
              {attachments.map((att) => (
                <View key={att.id} style={[styles.attachmentChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Feather name="file" size={14} color={colors.primary} style={styles.chipIcon} />
                  <Text style={[styles.chipText, { color: colors.textPrimary }]} numberOfLines={1}>
                    {att.name} ({att.size})
                  </Text>
                  <TouchableOpacity onPress={() => handleRemoveAttachment(att.id)} style={styles.chipRemoveBtn}>
                    <Feather name="x" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Clean Multiline Input (No raw HTML tags displayed) */}
          <View style={styles.bodyInputContainer}>
            <Input
              value={plainBody}
              onChangeText={(text) => {
                setPlainBody(text);
                if (fieldErrors.body) setFieldErrors((p) => ({ ...p, body: null }));
              }}
              placeholder="Write your email here..."
              multiline
              numberOfLines={6}
              error={fieldErrors.body}
              inputStyle={[
                styles.bodyInputText,
                {
                  color: colors.textPrimary,
                  fontWeight: isBold ? '700' : '400',
                  fontStyle: isItalic ? 'italic' : 'normal',
                  textDecorationLine: isUnderline ? 'underline' : 'none',
                },
              ]}
              style={styles.bodyInputWrapper}
            />
          </View>

          {/* Real-time Formatted Text Live Preview Card */}
          {plainBody.length > 0 && (isBold || isItalic || isUnderline || links.length > 0) && (
            <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.previewHeader}>
                <Feather name="eye" size={14} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.previewTitle, { color: colors.textSecondary }]}>Formatted Live Preview</Text>
              </View>

              <Text
                style={[
                  styles.previewText,
                  {
                    color: colors.textPrimary,
                    fontWeight: isBold ? '700' : '400',
                    fontStyle: isItalic ? 'italic' : 'normal',
                    textDecorationLine: isUnderline ? 'underline' : 'none',
                  },
                ]}
              >
                {plainBody}
              </Text>

              {links.length > 0 && (
                <View style={{ marginTop: SPACING.xs }}>
                  {links.map((l, i) => (
                    <Text key={i} style={[styles.linkPreviewText, { color: colors.primary }]}>
                      🔗 {l.label} ({l.url})
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Hyperlink Dialog Modal */}
      <Modal visible={linkModalVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Insert Hyperlink</Text>

            <Input
              label="Link Text"
              value={linkText}
              onChangeText={setLinkText}
              placeholder="e.g. Click Here"
              containerStyle={styles.modalInput}
            />

            <Input
              label="URL"
              value={linkUrl}
              onChangeText={setLinkUrl}
              placeholder="https://example.com"
              autoCapitalize="none"
              keyboardType="url"
              containerStyle={styles.modalInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setLinkModalVisible(false)}
                style={[styles.modalBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleInsertLink}
                style={[styles.modalBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
              >
                <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Insert</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  cancelBtn: {
    paddingVertical: SPACING.sm,
  },
  cancelText: {
    ...TYPOGRAPHY.bodySmallMedium,
  },
  headerTitle: {
    ...TYPOGRAPHY.h5,
    fontWeight: '700',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.colored,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxxxl,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  rowLabel: {
    ...TYPOGRAPHY.bodyMedium,
    marginRight: SPACING.md,
    marginTop: 10,
    width: 65,
  },
  underlinedInputContainer: {
    flex: 1,
    marginBottom: 0,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.md,
  },
  toolBtn: {
    padding: SPACING.sm,
    marginRight: SPACING.xs,
  },
  attachmentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  chipIcon: {
    marginRight: SPACING.xs,
  },
  chipText: {
    ...TYPOGRAPHY.caption,
    maxWidth: 160,
  },
  chipRemoveBtn: {
    marginLeft: SPACING.xs,
    padding: 2,
  },
  bodyInputContainer: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  bodyInputWrapper: {
    borderBottomWidth: 0,
  },
  bodyInputText: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
    lineHeight: 24,
  },
  previewCard: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  previewTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewText: {
    ...TYPOGRAPHY.body,
    fontSize: 15,
    lineHeight: 22,
  },
  linkPreviewText: {
    ...TYPOGRAPHY.caption,
    textDecorationLine: 'underline',
    marginTop: 2,
  },
  encryptionCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  encryptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  encryptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  encryptionLabel: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
  },
  switch: {
    transform: [{ scale: 0.9 }],
  },
  encryptionDescription: {
    ...TYPOGRAPHY.caption,
    marginTop: SPACING.xs,
  },
  passkeySection: {
    marginTop: SPACING.lg,
    borderTopWidth: 1,
    paddingTop: SPACING.lg,
  },
  passkeyInput: {
    marginBottom: SPACING.sm,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  modalCard: {
    width: '100%',
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.xl,
  },
  modalTitle: {
    ...TYPOGRAPHY.h5,
    fontWeight: '700',
    marginBottom: SPACING.lg,
  },
  modalInput: {
    marginBottom: SPACING.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.lg,
  },
  modalBtn: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginLeft: SPACING.md,
  },
  modalBtnText: {
    ...TYPOGRAPHY.bodySmallMedium,
    fontWeight: '600',
  },
});
