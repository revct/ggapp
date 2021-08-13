import { NavigationScreenProp, NavigationParams } from "react-navigation";

export interface ScreenComponentProps {
  navigation?: NavigationScreenProp<NavigationParams>,
  auth?: {
    token: string | null
  },
  children: React.ReactNode,
  navigationOptions?: any,
  [k:string]: any
}
