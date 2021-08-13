import { ViewStyle } from "react-native";
import { NavigationFocusInjectedProps, NavigationParams } from "react-navigation";

export interface ScreenProps extends NavigationFocusInjectedProps<NavigationParams> {
  setRef?: (ref:any) => void
  isFocused: boolean,
  backgroundColor?: string,
  statusBarColor?: string,
  withPicker?: boolean,
  hideStatusBar?: boolean,
  style?:ViewStyle,
}

export interface ScreenState {

}
