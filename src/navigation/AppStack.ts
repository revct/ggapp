import {createDrawerNavigator} from 'react-navigation-drawer';
import {createStackNavigator} from 'react-navigation-stack';
import {createBottomTabNavigator} from 'react-navigation-tabs';
import Home from 'components/Home/Home';
import RestaurantsHome from 'components/RestaurantsHome/RestaurantsHome';
import RestaurantLocations from 'components/RestaurantLocations/RestaurantLocations';
import RestaurantMenu from 'components/RestaurantMenu/RestaurantMenu';
import RestaurantMeal from 'components/RestaurantMeal/RestaurantMeal';
import SpecialOffers from 'components/SpecialOffers/SpecialOffers';
import CinemasHome from 'components/CinemasHome/CinemasHome';
import CinemasFilm from 'components/CinemasFilm/CinemasFilm';
import HotelsHome from 'components/HotelsHome/HotelsHome';
import HotelRooms from 'components/HotelRooms/HotelRooms';
import HotelRoom from 'components/HotelRoom/HotelRoom';
import Tab from 'components/Tab/Tab';
import SignUp from 'components/SignUp/SignUp';
import LogIn from 'components/Login/Login';
import ForgotPassword from 'components/ForgotPassword/ForgotPassword';
import {NavigationState} from 'react-navigation';
import RestaurantCheckout from 'components/RestaurantCheckout/RestaurantCheckout';
import MonnifyPayment from 'components/MonnifyPayment/MonnifyPayment';
import DrawerContent from 'components/DrawerContent/DrawerContent';
import {Dimensions} from 'react-native';
import {rgba} from 'utils/Misc';
import colors from 'configs/colors';
import Profile from 'components/Profile/Profile';
import Rewards from 'components/Rewards/Rewards';
import BuyPoints from '/components/BuyPoints/BuyPoints';
import CinemaCheckout from 'components/CinemaCheckout/CinemaCheckout';
import TicketsHistory from 'components/TicketsHistory/TicketsHistory';
import HotelCheckout from 'components/HotelCheckout/HotelCheckout';
import BookingHistory from 'components/BookingHistory/BookingHistory';
import ResetPassword from 'components/ResetPassword/ResetPassword';
import MonnifyPointTopupPayment from 'components/BuyPoints/MonnifyPointTopupPayment';
import AddLoyaltyPoints from 'components/BuyPoints/AddLoyaltyPoints';
import VerifyMonnifyPointTopup from 'components/BuyPoints/VerifyMonnifyPointTopup';

interface NavState extends NavigationState {
  routeName: string;
}

export function getCurrentRouteName(navState: NavState): string {
  if (Array.isArray(navState.routes) && navState.routes.length) {
    return getCurrentRouteName(navState.routes[navState.routes.length - 1]);
  }
  return navState.routeName;
}

const Stack = createStackNavigator(
  {
    Home: Home,
    RestaurantsHome: RestaurantsHome,
    RestaurantLocations: RestaurantLocations,
    RestaurantMenu: RestaurantMenu,
    RestaurantMeal: RestaurantMeal,
    SpecialOffers: SpecialOffers,
    CinemasHome: CinemasHome,
    CinemasFilm: CinemasFilm,
    HotelsHome: HotelsHome,
    HotelRooms: HotelRooms,
    HotelRoom: HotelRoom,
    LogIn: LogIn,
    SignUp: SignUp,
    ForgotPassword: ForgotPassword,
    ResetPassword: ResetPassword,
    RestaurantCheckout: RestaurantCheckout,
    MonnifyPayment: MonnifyPayment,
    MonnifyPointTopupPayment:MonnifyPointTopupPayment,
    Profile: Profile,
    AddLoyaltyPoints: AddLoyaltyPoints,
    Rewards: Rewards,
    BuyPoints:BuyPoints,
    VerifyPointTopup:VerifyMonnifyPointTopup,
    CinemaCheckout: CinemaCheckout,
    HotelCheckout: HotelCheckout,
    TicketsHistory: TicketsHistory,
    BookingHistory: BookingHistory,
  },
  {
    initialRouteName: 'Home',
    headerBackTitleVisible: false,
  },
);

const TabNavigation = createBottomTabNavigator(
  {
    app: {
      screen: Stack,
      navigationOptions: ({navigation}) => {
        const options = {tabBarVisible: true};
        const NoTabBarScreens = [
          'LogIn',
          'SignUp',
          'ForgotPassword',
          'RestaurantCheckout',
          'CinemaCheckout',
          'HotelCheckout',
          'MonnifyPayment',
        ];
        let routeName = getCurrentRouteName(navigation.state);
        if (NoTabBarScreens.indexOf(routeName) !== -1) {
          options.tabBarVisible = false;
        }
        return options;
      },
    },
  },
  {
    tabBarComponent: Tab,
  },
);

export default createDrawerNavigator(
  {
    Stack: TabNavigation,
  },
  {
    initialRouteName: 'Stack',
    overlayColor: rgba(colors.white, 0),
    contentComponent: DrawerContent,
    drawerBackgroundColor: 'rgba(0,0,0,0)',
    drawerWidth: Dimensions.get('window').width * 0.588,
  },
);
