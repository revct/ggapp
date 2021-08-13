import React from 'react';
import {TextProps, Text as RNText, StyleSheet, TextStyle} from 'react-native';

interface StyleProps extends TextStyle {
  weight?: number | string;
}

interface Props extends TextProps {
  bold?: true | 'bold';
  light?: true | 'light';
  style?: StyleProps | Array<StyleProps | null | Array<StyleProps | null>>;
}

const Text: React.FC<Props> = function Text({bold, light, style, ...props}) {
  return (
    <RNText
      {...props}
      style={[
        style,
        styles.text,
        light ? styles.light : {},
        bold ? styles.bold : {},
      ]}
    />
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Avenir-Medium',
  },
  light: {
    fontFamily: 'Avenir-Light',
  },
  bold: {
    fontFamily: 'Avenir-Heavy',
  },
});

export default Text;
