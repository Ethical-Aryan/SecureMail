import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Switch, TouchableOpacity,
  KeyboardAvoidingView, StyleSheet, StatusBar, Platform, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/theme';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import useMail from '../../hooks/useMail';
import useApp from '../../hooks/useApp';
import { validateComposeForm, validatePasskey } from '../../utils/validators';

export default function ComposeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { sendEmail, isSending } = useMail();
  const { showToast } = useApp();

  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [passkey, setPasskey] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleSend = useCallback(async () => {
    const { valid, errors } = validateComposeForm({ recipient, subject, body });

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

    const result = await sendEmail({
      recipientEmail: recipient,
      subject,
      body,
      isEncrypted,
      passkey: isEncrypted ? passkey : '',
    });

    if (result.success) {
      showToast('Email sent successfully!', 'success');
      navigation.goBack();
    } else {
      showToast(result.error || 'Failed to send email', 'error');
    }
  }, [recipient, subject, body, isEncrypted, passkey, sendEmail, showToast, navigation]);

  const handleDiscard = useCallback(() => {
    if (recipient || subject || body) {
      Alert.alert(
        'Discard Draft?',
        'You have unsaved changes. Are you sure you want to discard this email?',
        [
          { text: 'Keep Writing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [recipient, subject, body, navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDiscard} style={styles.headerBtn}>
          <Feather name="x" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compose</Text>
        <TouchableOpacity
          onPress={handleSend}
          disabled={isSending}
          style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
        >
          <Feather name="send" size={18} color="#FFFFFF" />
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
          {/* To */}
          <Input
            label="To"
            value={recipient}
            onChangeText={(t) => { setRecipient(t); setFieldErrors((p) => ({ ...p, recipient: null })); }}
            placeholder="recipient@email.com"
            icon="user"
            keyboardType="email-address"
            error={fieldErrors.recipient}
            autoCapitalize="none"
          />

          {/* Subject */}
          <Input
            label="Subject"
            value={subject}
            onChangeText={(t) => { setSubject(t); setFieldErrors((p) => ({ ...p, subject: null })); }}
            placeholder="Enter subject"
            icon="type"
            error={fieldErrors.subject}
            maxLength={255}
          />

          {/* Body */}
          <Input
            label="Message"
            value={body}
            onChangeText={(t) => { setBody(t); setFieldErrors((p) => ({ ...p, body: null })); }}
            placeholder="Write your message..."
            multiline
            numberOfLines={8}
            error={fieldErrors.body}
          />

          {/* Encryption Toggle */}
          <View style={styles.encryptionCard}>
            <View style={styles.encryptionRow}>
              <View style={styles.encryptionLeft}>
                <View style={styles.encryptionIcon}>
                  <Feather name="lock" size={18} color={isEncrypted ? COLORS.primary : COLORS.textTertiary} />
                </View>
                <View>
                  <Text style={styles.encryptionLabel}>Encrypt Message</Text>
                  <Text style={styles.encryptionDescription}>
                    Add passkey protection to this email
                  </Text>
                </View>
              </View>
              <Switch
                value={isEncrypted}
                onValueChange={setIsEncrypted}
                trackColor={{ false: COLORS.border, true: '#C4B5FD' }}
                thumbColor={isEncrypted ? COLORS.primary : '#F4F3F4'}
                ios_backgroundColor={COLORS.border}
              />
            </View>

            {isEncrypted && (
              <View style={styles.passkeySection}>
                <Input
                  label="Passkey"
                  value={passkey}
                  onChangeText={(t) => { setPasskey(t); setFieldErrors((p) => ({ ...p, passkey: null })); }}
                  placeholder="Enter a passkey for this message"
                  icon="key"
                  secureTextEntry
                  error={fieldErrors.passkey}
                  containerStyle={styles.passkeyInput}
                />
                <View style={styles.passkeyHint}>
                  <Feather name="info" size={12} color={COLORS.textTertiary} />
                  <Text style={styles.passkeyHintText}>
                    Share this passkey with the recipient separately
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Send Button */}
          <Button
            title={isSending ? 'Sending...' : 'Send Secure Email'}
            onPress={handleSend}
            loading={isSending}
            icon="send"
            iconPosition="left"
            style={styles.sendButtonFull}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  headerTitle: {
    ...TYPOGRAPHY.h5,
    color: COLORS.textPrimary,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.textTertiary,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxxxl,
  },
  encryptionCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  encryptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  encryptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  encryptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  encryptionLabel: {
    ...TYPOGRAPHY.bodySmallMedium,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  encryptionDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  passkeySection: {
    marginTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACING.lg,
  },
  passkeyInput: {
    marginBottom: SPACING.sm,
  },
  passkeyHint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passkeyHintText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    marginLeft: SPACING.xs,
  },
  sendButtonFull: {
    marginTop: SPACING.sm,
  },
});
