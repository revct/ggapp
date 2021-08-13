import { NavigationStackScreenProps } from "react-navigation-stack";
import { NavigationParams } from "react-navigation";
import { UserInterface } from "contexts/UserContext";
import { PointsHistoryItem } from "api/GetPointsHistory";

export interface RewardsState {
  currentTab: number,
  points: number | null,
  isPending: boolean,
  isListPending: boolean,
  listErrorMessage: string | null,
  history: Array<PointsHistoryItem>
}

export interface RewardsProps extends NavigationStackScreenProps<NavigationParams>{
  user: UserInterface
}
