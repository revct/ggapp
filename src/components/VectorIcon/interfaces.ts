import {TextStyle} from 'react-native';

export type VectorIconType = 'mdi' | 'feather' | 'ion-icons' | 'font-awesome' | 'font-awesome-five';

export interface VectorIconProps {
  iconStyle?: TextStyle,
  style?: TextStyle | Array<TextStyle>,
  color?: string,
  size?: number,
  propStyle?: TextStyle | Array<TextStyle>,
  styleName?: string,
  type?: VectorIconType,
  name: string,
}
