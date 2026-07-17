import React, { memo, useState, useCallback } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme/theme';

const Input = memo(({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  rightIcon,
  onRightIconPress,
  secureTextEntry = false,
  error,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  editable = true,
  maxLength,
  style,
  inputStyle,
  containerStyle,
  variant = 'default', // 'default' | 'underlined'
  onFocus,
  onBlur,
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit,
  inputRef,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecureVisible, setIsSecureVisible] = useState(false);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (onFocus) onFocus();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (onBlur) onBlur();
  }, [onBlur]);

  const toggleSecure = useCallback(() => {
    setIsSecureVisible((prev) => !prev);
  }, []);

  const borderColor = error
    ? COLORS.danger
    : isFocused
    ? COLORS.inputFocusBorder
    : COLORS.inputBorder;

  const wrapperStyle = variant === 'underlined' 
    ? [styles.underlinedWrapper, { borderBottomColor: borderColor }, isFocused && styles.underlinedFocused]
    : [styles.inputWrapper, { borderColor }, isFocused && styles.focusedWrapper];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          ...wrapperStyle,
          error && styles.errorWrapper,
          multiline && styles.multilineWrapper,
          style,
        ]}
      >
        {icon && (
          <Feather
            name={icon}
            size={17}
            color={isFocused ? COLORS.primary : COLORS.textTertiary}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            multiline && styles.multilineInput,
            !editable && styles.disabledInput,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textTertiary}
          secureTextEntry={secureTextEntry && !isSecureVisible}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={editable}
          maxLength={maxLength}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={blurOnSubmit}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={toggleSecure}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Toggle password visibility"
          >
            <Feather
              name={isSecureVisible ? 'eye-off' : 'eye'}
              size={17}
              color={COLORS.textTertiary}
            />
          </TouchableOpacity>
        )}
        {rightIcon && !secureTextEntry && (
          <TouchableOpacity
            onPress={onRightIconPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name={rightIcon} size={17} color={COLORS.textTertiary} />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <View style={styles.errorRow}>
          <Feather name="alert-circle" size={12} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.bodySmallMedium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs + 2,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
  },
  focusedWrapper: {
    borderWidth: 1.5,
  },
  underlinedWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    paddingHorizontal: 0,
    paddingVertical: SPACING.xs,
  },
  underlinedFocused: {
    borderBottomWidth: 2,
  },
  errorWrapper: {
    borderColor: COLORS.danger,
    backgroundColor: '#FFF5F5',
  },
  multilineWrapper: {
    alignItems: 'flex-start',
    minHeight: 120,
  },
  leftIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textPrimary,
  },
  multilineInput: {
    paddingTop: 13,
    minHeight: 100,
  },
  disabledInput: {
    color: COLORS.textTertiary,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    marginLeft: SPACING.xs,
  },
});

export default Input;
