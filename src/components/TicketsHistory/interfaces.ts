import { NavigationStackScreenProps } from "react-navigation-stack";
import { NavigationParams } from "react-navigation";
import { UserInterface } from "contexts/UserContext";

export interface Ticket {
  id: number,
  name: string,
  cinema: string,
  quantity: number,
  image: string | null,
  reference: string,
  time: string,
  date: string,
  expiresAt: number,
  createdAt: number,
}

export interface TicketsHistoryProps extends NavigationStackScreenProps<NavigationParams> {
  user: UserInterface | null
}

export interface TicketsHistoryState {
  isPending: boolean,
  isRefreshing: boolean,
  completed: Array<Ticket>,
  upcoming: Array<Ticket>,
  currnetPage: number,
  openModel: boolean,
  selected: Ticket | null,
}
