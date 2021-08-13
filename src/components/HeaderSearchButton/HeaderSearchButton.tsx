import React from 'react';
import { TouchableWithoutFeedback, StyleSheet } from 'react-native';
import VectorIcon from 'components/VectorIcon/VectorIcon';
import HeaderSearchButtonProps from './interfaces';
import colors from 'configs/colors';

const HeaderSearchButton:React.FC<HeaderSearchButtonProps> = ({
  color,
  onPress
}) => {
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <VectorIcon
        name="md-search"
        size={24}
        color={color ? color : colors.gray600}
        style={styles.icon}
      />
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  icon: {
    margin: 8,
    marginRight: 16,
  }
})

export default HeaderSearchButton;
