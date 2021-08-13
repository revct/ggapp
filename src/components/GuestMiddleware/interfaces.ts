import { NavigationParams, NavigationScreenProp } from "react-navigation";

export interface GuestMiddlewareOptions {
  allowRedirect: false
}

export interface GuestMiddlewareProps {
  navigation: NavigationScreenProp<NavigationParams>
}
