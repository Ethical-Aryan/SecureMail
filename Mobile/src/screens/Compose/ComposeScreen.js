import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Switch, TouchableOpacity,
  KeyboardAvoidingView, StyleSheet, StatusBar, Platform, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/theme';
import Input from '../../components/common/Input';
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
        <TouchableOpacity onPress={handleDiscard} style={styles.headerLeftBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Message</Text>
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
          <View style={styles.inputRow}>
            <Text style={styles.rowLabel}>To:</Text>
            <Input
              value={recipient}
              onChangeText={(t) => { setRecipient(t); setFieldErrors((p) => ({ ...p, recipient: null })); }}
              placeholder=""
              keyboardType="email-address"
              error={fieldErrors.recipient}
              autoCapitalize="none"
              variant="underlined"
              containerStyle={styles.underlinedInputContainer}
            />
          </View>

          {/* Subject */}
          <View style={styles.inputRow}>
            <Text style={styles.rowLabel}>Subject:</Text>
            <Input
              value={subject}
              onChangeText={(t) => { setSubject(t); setFieldErrors((p) => ({ ...p, subject: null })); }}
              placeholder=""
              error={fieldErrors.subject}
              maxLength={255}
              variant="underlined"
              containerStyle={styles.underlinedInputContainer}
            />
          </View>

          {/* Body */}
          <Input
            value={body}
            onChangeText={(t) => { setBody(t); setFieldErrors((p) => ({ ...p, body: null })); }}
            placeholder="Write your message..."
            multiline
            numberOfLines={12}
            error={fieldErrors.body}
            variant="underlined"
            containerStyle={styles.bodyInputContainer}
            style={styles.bodyInputWrapper}
            inputStyle={styles.bodyInputText}
          />

          {/* Encryption Toggle */}
          <View style={styles.encryptionCard}>
            <View style={styles.encryptionRow}>
              <View style={styles.encryptionLeft}>
                <Text style={styles.encryptionLabel}>Encrypt Message</Text>
                <Switch
                  value={isEncrypted}
                  onValueChange={setIsEncrypted}
                  trackColor={{ false: COLORS.border, true: '#C4B5FD' }}
                  thumbColor={isEncrypted ? COLORS.primary : '#F4F3F4'}
                  ios_backgroundColor={COLORS.border}
                  style={styles.switch}
                />
              </View>
            </View>
            <Text style={styles.encryptionDescription}>
              Passkey will be securely shared with recipient.
            </Text>

            {isEncrypted && (
              <View style={styles.passkeySection}>
                <Input
                  label="Passkey"
                  value={passkey}
                  onChangeText={(t) => { setPasskey(t); setFieldErrors((p) => ({ ...p, passkey: null })); }}
                  placeholder="Enter a passkey"
                  secureTextEntry
                  error={fieldErrors.passkey}
                  containerStyle={styles.passkeyInput}
                />
              </View>
            )}
          </View>
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
    paddingVertical: SPACING.md,
  },
  headerLeftBtn: {
    paddingVertical: SPACING.sm,
  },
  cancelText: {
    ...TYPOGRAPHY.bodySmallMedium,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    ...TYPOGRAPHY.h5,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.colored,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.textTertiary,
    shadowOpacity: 0,
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
    color: COLORS.textSecondary,
    marginRight: SPACING.md,
    marginTop: 10,
    width: 65,
  },
  underlinedInputContainer: {
    flex: 1,
    marginBottom: 0,
  },
  bodyInputContainer: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxxl,
  },
  bodyInputWrapper: {
    borderBottomWidth: 0,
  },
  bodyInputText: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textPrimary,
  },
  encryptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
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
    justifyContent: 'space-between',
    flex: 1,
  },
  encryptionLabel: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  switch: {
    transform: [{ scale: 0.9 }],
  },
  encryptionDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
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
});
