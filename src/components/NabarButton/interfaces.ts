import { TextStyle, ImageSourcePropType, ImageStyle } from "react-native";

export default interface NabarButtonProps {
  color?: string,
  onPress?: () => void,
  position?: 'left' | 'right',
  icon?: string,
  size?: number,
  imageSource?: ImageSourcePropType,
}
