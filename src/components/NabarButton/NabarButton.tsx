import React from 'react';
import { TouchableWithoutFeedback, StyleSheet, Image } from 'react-native';
import VectorIcon from 'components/VectorIcon/VectorIcon';
import colors from 'configs/colors';
import NavbarButtonProps from './interfaces';

const NavbarButton:React.FC<NavbarButtonProps> = ({
  color,
  onPress,
  position,
  icon,
  size,
  imageSource,
}) => {
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      { icon ? (
        <VectorIcon
          name={icon}
          size={size}
          color={color}
          style={[styles.icon, position === 'right' ? styles.right : {}]}
        />
      ) : imageSource ? (
        <Image
          source={imageSource}
          width={size}
          height={size}
          resizeMode='stretch'
          style={[styles.image, position === 'right' ? styles.right : {}, {
            width: size,
            height: size,
          }]}
        />
      ) : null }
    </TouchableWithoutFeedback>
  );
}

NavbarButton.defaultProps = {
  position: 'left',
  color: colors.gray600,
  size: 24,
};

const styles = StyleSheet.create({
  icon: {
    margin: 8,
    marginLeft: 32,
  },
  right: {
    marginLeft: 8,
    marginRight: 32,
  },
  image: {
    margin: 8,
    marginLeft: 32,
    resizeMode: 'stretch'
  }
})

export default NavbarButton;
