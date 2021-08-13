import React from 'react';
import {
  ActivityIndicator,
  Platform,
  ActivityIndicatorProps,
} from 'react-native';
import colors from 'configs/colors';

export interface SpinnerProps extends ActivityIndicatorProps {
  size?: 'large' | 'small';
}

export const Spinner: React.FC<SpinnerProps> = function({
  color,
  size,
  ...props
}) {
  return (
    <ActivityIndicator
      {...props}
      color={Platform.select({
        android: color ? color : colors.accent,
        ios: color ? color : colors.gray700,
      })}
      size={size || 'small'}
    />
  );
};

export default Spinner;
