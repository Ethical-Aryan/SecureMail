import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, TextInput, Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme/theme';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import useMail from '../../hooks/useMail';
import { useTheme } from '../../context/ThemeContext';
import { formatFullDate } from '../../utils/helpers';

export default function EmailDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { email } = route.params;
  const { toggleStar, deleteEmail, decryptEmail } = useMail();

  const [isStarred, setIsStarred] = useState(email.starred);
  const [showDecryptModal, setShowDecryptModal] = useState(false);
  const [passkey, setPasskey] = useState('');
  const [decryptedBody, setDecryptedBody] = useState(null);
  const [decryptError, setDecryptError] = useState(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedAttachment, setDecryptedAttachment] = useState(null);

  const displayBody = decryptedBody || email.body;
  const displayAttachment = decryptedAttachment || email.attachment;
  const isLocked = email.locked && !decryptedBody;

  const handleToggleStar = useCallback(async () => {
    const newStarred = !isStarred;
    setIsStarred(newStarred);
    await toggleStar(email.id, isStarred);
  }, [email.id, isStarred, toggleStar]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Email',
      'Are you sure you want to permanently delete this email?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteEmail(email.id);
            if (result.success) {
              navigation.goBack();
            }
          },
        },
      ]
    );
  }, [email.id, deleteEmail, navigation]);

  const handleDecrypt = useCallback(async () => {
    if (!passkey.trim()) {
      setDecryptError('Please enter the passkey');
      return;
    }

    setIsDecrypting(true);
    setDecryptError(null);

    const result = await decryptEmail(email.id, passkey);
    setIsDecrypting(false);

    if (result.success && result.data?.body) {
      setDecryptedBody(result.data.body);
      if (result.data.attachment) {
        setDecryptedAttachment(result.data.attachment);
      }
      setShowDecryptModal(false);
      setPasskey('');
    } else {
      setDecryptError(result.error || 'Failed to decrypt email');
    }
  }, [passkey, email.id, decryptEmail]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleToggleStar}
            style={styles.headerBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather
              name="star"
              size={20}
              color={isStarred ? colors.warning : colors.textTertiary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDelete}
            style={styles.headerBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="trash-2" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sender Info */}
        <View style={styles.senderContainer}>
          <View style={styles.senderRow}>
            <Avatar email={email.senderEmail} initials={email.initials} size={48} />
            <View style={styles.senderInfo}>
              <View style={styles.senderNameRow}>
                <Text style={[styles.senderNameLabel, { color: colors.textSecondary }]}>From:</Text>
                <Text style={[styles.senderNameValue, { color: colors.textPrimary }]}>{email.sender}</Text>
              </View>
              <View style={styles.senderNameRow}>
                <Text style={[styles.senderNameLabel, { color: colors.textSecondary }]}>To:</Text>
                <Text style={[styles.senderNameValue, { color: colors.textPrimary }]}>
                  {email.owner_email || 'me@securemail.com'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Subject & Date */}
        <View style={styles.subjectContainer}>
          <Text style={[styles.subject, { color: colors.textPrimary }]}>{email.subject}</Text>
          <Text style={[styles.timeText, { color: colors.textTertiary }]}>{formatFullDate(email.time)}</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Encrypted Banner / Decrypt Button */}
        {email.locked && (
          <View style={[styles.encryptedBanner, { backgroundColor: isDark ? '#064E3B' : colors.successLight }]}>
            <Feather name="shield" size={20} color={colors.success} />
            <View style={styles.encryptedBannerTextContainer}>
              <Text style={[styles.encryptedBannerTitle, { color: colors.success }]}>
                {decryptedBody ? 'Message Decrypted' : 'End-to-End Encrypted Message'}
              </Text>
              <Text style={[styles.encryptedBannerDesc, { color: colors.success }]}>
                {decryptedBody
                  ? 'This message has been decrypted for this session.'
                  : 'This email is protected with AES-256 GCM encryption.'}
              </Text>
            </View>
          </View>
        )}

        {isLocked ? (
          <View style={styles.lockActionContainer}>
            <Button
              title="Decrypt Message"
              onPress={() => setShowDecryptModal(true)}
              variant="primary"
              icon="key"
              iconPosition="left"
            />
          </View>
        ) : (
          <View style={styles.bodyContainer}>
            {Array.isArray(displayBody) ? (
              displayBody.map((line, index) => (
                <Text key={index} style={[styles.bodyText, { color: colors.textPrimary }]}>
                  {line}
                </Text>
              ))
            ) : (
              <Text style={[styles.bodyText, { color: colors.textPrimary }]}>{displayBody}</Text>
            )}
          </View>
        )}

        {/* Attachment Section */}
        {displayAttachment && (
          <View style={styles.attachmentContainer}>
            <Text style={[styles.attachmentSectionTitle, { color: colors.textSecondary }]}>Attachment</Text>
            <View style={[styles.attachmentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.attachmentIconBox, { backgroundColor: colors.primaryLight + '30' }]}>
                <Feather name="paperclip" size={20} color={colors.primary} />
              </View>
              <View style={styles.attachmentInfo}>
                <Text style={[styles.attachmentName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {displayAttachment.name}
                </Text>
                <Text style={[styles.attachmentSize, { color: colors.textSecondary }]}>
                  {displayAttachment.size}
                </Text>
              </View>
              <TouchableOpacity style={styles.downloadBtn}>
                <Feather name="download" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Decrypt Modal */}
      <Modal
        visible={showDecryptModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDecryptModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={[styles.modalIconBox, { backgroundColor: `${colors.primary}15` }]}>
              <Feather name="key" size={24} color={colors.primary} />
            </View>

            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Enter Passkey</Text>
            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              This message is encrypted. Enter the passkey shared by the sender to decrypt.
            </Text>

            {decryptError && (
              <View style={[styles.decryptErrorBanner, { backgroundColor: colors.dangerLight }]}>
                <Feather name="alert-circle" size={14} color={colors.danger} />
                <Text style={[styles.decryptErrorText, { color: colors.danger }]}>{decryptError}</Text>
              </View>
            )}

            <View style={[styles.passkeyInputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
              <Feather name="key" size={18} color={colors.textTertiary} />
              <TextInput
                style={[styles.passkeyInput, { color: colors.textPrimary }]}
                value={passkey}
                onChangeText={(text) => { setPasskey(text); setDecryptError(null); }}
                placeholder="Enter passkey..."
                placeholderTextColor={colors.textTertiary}
                secureTextEntry
                autoFocus
                returnKeyType="go"
                onSubmitEditing={handleDecrypt}
              />
            </View>

            <Button
              title="Decrypt"
              onPress={handleDecrypt}
              loading={isDecrypting}
              icon="unlock"
              iconPosition="left"
            />

            <TouchableOpacity
              onPress={() => { setShowDecryptModal(false); setPasskey(''); setDecryptError(null); }}
              style={styles.cancelButton}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  headerBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  headerActions: {
    flexDirection: 'row',
  },
  scrollContent: {
    paddingBottom: SPACING.xxxxl,
  },
  senderContainer: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.md,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  senderInfo: {
    marginLeft: SPACING.md,
    justifyContent: 'center',
  },
  senderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  senderNameLabel: {
    ...TYPOGRAPHY.bodySmall,
    width: 45,
  },
  senderNameValue: {
    ...TYPOGRAPHY.bodySmallMedium,
  },
  subjectContainer: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
  },
  subject: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.sm,
  },
  timeText: {
    ...TYPOGRAPHY.captionMedium,
  },
  divider: {
    height: 1,
    marginVertical: SPACING.lg,
    marginHorizontal: SPACING.xl,
  },
  encryptedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.lg,
    marginHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  encryptedBannerTextContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  encryptedBannerTitle: {
    ...TYPOGRAPHY.bodySmallMedium,
    marginBottom: 4,
  },
  encryptedBannerDesc: {
    ...TYPOGRAPHY.caption,
    lineHeight: 18,
  },
  lockActionContainer: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
  },
  bodyContainer: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.md,
  },
  bodyText: {
    ...TYPOGRAPHY.body,
    lineHeight: 26,
    marginBottom: 8,
  },
  attachmentContainer: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xxl,
  },
  attachmentSectionTitle: {
    ...TYPOGRAPHY.captionBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  attachmentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  attachmentName: {
    ...TYPOGRAPHY.bodySmallMedium,
    fontWeight: '600',
  },
  attachmentSize: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  downloadBtn: {
    padding: SPACING.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  modalCard: {
    width: '100%',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  modalIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    ...TYPOGRAPHY.h4,
    marginBottom: SPACING.xs,
  },
  modalDescription: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  passkeyInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
  },
  passkeyInput: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: SPACING.sm,
    ...TYPOGRAPHY.bodySmall,
  },
  decryptErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    width: '100%',
    marginBottom: SPACING.md,
  },
  decryptErrorText: {
    ...TYPOGRAPHY.caption,
    marginLeft: SPACING.xs,
  },
  cancelButton: {
    marginTop: SPACING.lg,
    padding: SPACING.sm,
  },
  cancelText: {
    ...TYPOGRAPHY.buttonSmall,
  },
});
