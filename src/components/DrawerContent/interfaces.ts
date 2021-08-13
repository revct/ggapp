import { DrawerContentComponentProps } from "react-navigation-drawer";

export interface DrawerContentProps extends DrawerContentComponentProps {
  liveChat: {
    dismiss: () => void,
    show: () => void,
  }
}

export interface DrawerContentState {
  isLoggingOut: boolean,
}
