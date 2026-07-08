import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS } from '../../theme/theme';
import { getInitials, getAvatarColor } from '../../utils/helpers';

const Avatar = memo(({
  email,
  initials: customInitials,
  size = 44,
  backgroundColor,
  textColor = COLORS.textInverse,
  style,
}) => {
  const displayInitials = customInitials || getInitials(email);
  const bgColor = backgroundColor || getAvatarColor(email);
  const fontSize = size * 0.38;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize,
            color: textColor,
          },
        ]}
      >
        {displayInitials}
      </Text>
    </View>
  );
});

Avatar.displayName = 'Avatar';

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default Avatar;
