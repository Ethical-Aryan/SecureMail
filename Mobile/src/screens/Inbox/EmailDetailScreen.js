import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Alert, TextInput, Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme/theme';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import useMail from '../../hooks/useMail';
import { formatFullDate } from '../../utils/helpers';

export default function EmailDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
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

    if (result.success) {
      setDecryptedBody(result.data.body);
      if (result.data.attachment) {
        setDecryptedAttachment(result.data.attachment);
      }
      setShowDecryptModal(false);
      setPasskey('');
    } else {
      setDecryptError(result.error || 'Incorrect passkey');
    }
    setIsDecrypting(false);
  }, [email.id, passkey, decryptEmail]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleToggleStar} style={styles.headerBtn}>
            <Feather
              name="star"
              size={24}
              color={isStarred ? COLORS.warning : COLORS.textTertiary}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerBtn}>
            <Feather name="trash-2" size={24} color={COLORS.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Feather name="more-vertical" size={24} color={COLORS.textTertiary} />
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
            <Avatar email={email.senderEmail} initials={email.initials} size={42} />
            <View style={styles.senderInfo}>
              <View style={styles.senderNameRow}>
                <Text style={styles.senderNameLabel}>From: </Text>
                <Text style={styles.senderNameValue}>{email.sender}</Text>
              </View>
              <View style={styles.senderNameRow}>
                <Text style={styles.senderNameLabel}>To: </Text>
                <Text style={styles.senderNameValue}>Me</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Subject & Time */}
        <View style={styles.subjectContainer}>
          <Text style={styles.subject}>{email.subject}</Text>
          <Text style={styles.timeText}>Sent: {formatFullDate(email.time)}</Text>
        </View>

        <View style={styles.divider} />

        {/* Encrypted Lock Banner */}
        {(email.locked || decryptedBody) && (
          <View style={styles.encryptedBanner}>
            <Feather name={decryptedBody ? "unlock" : "shield"} size={20} color={COLORS.success} />
            <View style={styles.encryptedBannerTextContainer}>
              <Text style={styles.encryptedBannerTitle}>
                {decryptedBody ? "Decrypted Message" : "Encrypted Message"}
              </Text>
              <Text style={styles.encryptedBannerDesc}>
                This message is protected by end-to-end encryption. Only you can read it.
              </Text>
            </View>
          </View>
        )}

        {isLocked && (
          <View style={styles.lockActionContainer}>
            <Button
              title="Enter Passkey to View"
              onPress={() => setShowDecryptModal(true)}
              icon="lock"
              iconPosition="left"
            />
          </View>
        )}

        {/* Email Body */}
        {!isLocked && (
          <View style={styles.bodyContainer}>
            {Array.isArray(displayBody) ? (
              displayBody.map((line, index) => (
                <Text key={index} style={styles.bodyText}>
                  {line || '\n'}
                </Text>
              ))
            ) : (
              <Text style={styles.bodyText}>{displayBody}</Text>
            )}
          </View>
        )}

        {/* Attachment */}
        {displayAttachment && !isLocked && (
          <View style={styles.attachmentContainer}>
            <View style={styles.attachmentIcon}>
              <Feather name="file-text" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.attachmentInfo}>
              <Text style={styles.attachmentName}>{displayAttachment.name}</Text>
              <Text style={styles.attachmentSize}>{displayAttachment.size}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Decrypt Modal */}
      <Modal
        visible={showDecryptModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDecryptModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + SPACING.xxl }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Enter Passkey</Text>
            <Text style={styles.modalDescription}>
              This message is encrypted. Enter the passkey shared by the sender to decrypt.
            </Text>

            {decryptError && (
              <View style={styles.decryptErrorBanner}>
                <Feather name="alert-circle" size={14} color={COLORS.danger} />
                <Text style={styles.decryptErrorText}>{decryptError}</Text>
              </View>
            )}

            <View style={styles.passkeyInputWrapper}>
              <Feather name="key" size={18} color={COLORS.textTertiary} />
              <TextInput
                style={styles.passkeyInput}
                value={passkey}
                onChangeText={(text) => { setPasskey(text); setDecryptError(null); }}
                placeholder="Enter passkey..."
                placeholderTextColor={COLORS.textTertiary}
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
              <Text style={styles.cancelText}>Cancel</Text>
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
    backgroundColor: COLORS.background,
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
    color: COLORS.textSecondary,
    width: 45,
  },
  senderNameValue: {
    ...TYPOGRAPHY.bodySmallMedium,
    color: COLORS.textPrimary,
  },
  subjectContainer: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
  },
  subject: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  timeText: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.textTertiary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.lg,
    marginHorizontal: SPACING.xl,
  },
  encryptedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.successLight,
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
    color: COLORS.success,
    marginBottom: 4,
  },
  encryptedBannerDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
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
    color: COLORS.textPrimary,
    lineHeight: 26,
    marginBottom: 8,
  },
  attachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.md,
  },
  attachmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  attachmentName: {
    ...TYPOGRAPHY.bodySmallMedium,
    color: COLORS.textPrimary,
  },
  attachmentSize: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.lg,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SPACING.xxl,
  },
  modalTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  modalDescription: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  decryptErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerLight,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  decryptErrorText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.danger,
    marginLeft: SPACING.sm,
  },
  passkeyInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
  },
  passkeyInput: {
    flex: 1,
    paddingVertical: 14,
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  cancelText: {
    ...TYPOGRAPHY.buttonSmall,
    color: COLORS.textSecondary,
  },
});
