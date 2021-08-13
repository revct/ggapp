import React from 'react';
import {StyleSheet, View, YellowBox} from 'react-native';
import {MenuProvider} from 'react-native-popup-menu';
import RootStack from 'navigation/RootStack';
import SplashScreen from 'react-native-splash-screen';
import remoteConfig from '@react-native-firebase/remote-config';
import {
  RestaurantMenuContextProvider,
  RestaurantMenu,
} from 'contexts/ReastaurantMenuContext';
import CartProvider from 'providers/CartProvider';
import UserProvider from 'providers/UserProvider';
import ToastProvider from 'providers/ToastProvider';
import LocationPovider from 'providers/LocationProvider';
import GeolocProvider from 'providers/GeolocProvider';
import DynamicConfigsProvider from 'providers/DyanmicConfigProvider';
import LiveChatProvider from 'providers/LiveChatProvider';
import CrashlyticsProvider from 'providers/CrashlyticProvider';
import Logger from 'utils/Logger';

interface AppProps {}

interface AppState {
  restaurantMenus: Array<RestaurantMenu>;
}

class App extends React.Component<AppProps, AppState> {
  state: AppState = {
    restaurantMenus: [],
  };

  constructor(props: AppProps) {
    super(props);
    YellowBox.ignoreWarnings(['Remote debugger', 'componentWillReceiveProps']);
  }

  componentDidMount() {
    setTimeout(() => {
      SplashScreen.hide();
    }, 1200);
    // reset remote configs
    this.resetRemoteConfigs();
  }

  async resetRemoteConfigs() {
    try {
      if (remoteConfig().lastFetchStatus === 'no_fetch_yet') {
        return;
      }
      await remoteConfig().fetch();
      await remoteConfig().activate();
    } catch (e) {
      Logger(e);
    }
  }

  handleSetRestaurantMenu = (list: Array<RestaurantMenu>) => {
    this.setState({restaurantMenus: list});
  };

  handleClearRestaurantMenu = () => {
    this.setState({restaurantMenus: []});
  };

  render() {
    const {restaurantMenus} = this.state;
    return (
      <CrashlyticsProvider>
        <ToastProvider>
          <MenuProvider>
            <DynamicConfigsProvider>
              <GeolocProvider>
                <LocationPovider>
                  <View style={styles.container}>
                    <CartProvider>
                      <UserProvider>
                        <RestaurantMenuContextProvider
                          value={{
                            setList: this.handleSetRestaurantMenu,
                            clearList: this.handleClearRestaurantMenu,
                            list: restaurantMenus,
                          }}>
                          <LiveChatProvider>
                            <RootStack />
                          </LiveChatProvider>
                        </RestaurantMenuContextProvider>
                      </UserProvider>
                    </CartProvider>
                  </View>
                </LocationPovider>
              </GeolocProvider>
            </DynamicConfigsProvider>
          </MenuProvider>
        </ToastProvider>
      </CrashlyticsProvider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
