import { NavigationScreenProp, NavigationParams } from "react-navigation";

export interface AuthMiddlewareProps {
  navigation: NavigationScreenProp<NavigationParams>,
  allowRedirect?: boolean,
  auth: {
    token: string | null
  }
}

export interface ComponentProps {
  navigation: NavigationScreenProp<NavigationParams>,
  auth: {
    token: string | null
  },
  children: React.ReactNode,
  [k:string]: any
}
