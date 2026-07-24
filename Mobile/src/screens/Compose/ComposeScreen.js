import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Switch, TouchableOpacity,
  KeyboardAvoidingView, StyleSheet, Platform, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/theme';
import Input from '../../components/common/Input';
import useMail from '../../hooks/useMail';
import useApp from '../../hooks/useApp';
import { useTheme } from '../../context/ThemeContext';
import { validateComposeForm, validatePasskey } from '../../utils/validators';

export default function ComposeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
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
        'Are you sure you want to discard this email?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [recipient, subject, body, navigation]);

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
          disabled={isSending}
          style={[
            styles.sendButton,
            { backgroundColor: colors.primary },
            isSending && { backgroundColor: colors.textTertiary, shadowOpacity: 0 },
          ]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="send" size={16} color="#FFFFFF" />
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

          {/* Message Body Input */}
          <View style={styles.bodyInputContainer}>
            <Input
              value={body}
              onChangeText={(text) => {
                setBody(text);
                if (fieldErrors.body) setFieldErrors((p) => ({ ...p, body: null }));
              }}
              placeholder="Write your encrypted email here..."
              multiline
              numberOfLines={8}
              error={fieldErrors.body}
              inputStyle={[styles.bodyInputText, { color: colors.textPrimary }]}
              style={styles.bodyInputWrapper}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  encryptionCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
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
});
