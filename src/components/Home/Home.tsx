import React from 'react';
import Screen from 'components/Screen/Screen';
import {
  StyleSheet,
  Dimensions,
  View,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import colors from 'configs/colors';
import {HomeProps} from './interfaces';
import {NavigationStackScreenProps} from 'react-navigation-stack';
import {darken} from 'utils/Misc';
import Text from 'components/Text/Text';
import {UserContext} from 'contexts/UserContext';
const brandIcon = require('../../assets/home/genesis_icon_trans_white.png');
const restaurantIcon = require('../../assets/home/restaurant-icon.png');
const hotelIcon = require('../../assets/home/hotel-icon.png');
const cinemaIcon = require('../../assets/home/cinema-icon.png');
const userImage = require('../../assets/general/user.png');
const {width} = Dimensions.get('screen');
const topSectionSize = width * 0.85;
const avatarSize = 32;

class Home extends React.Component<HomeProps> {
  static navigationOptions = (props: NavigationStackScreenProps) => ({
    headerTitle: null,
    headerTintColor: colors.gray600,
    headerTitleContainerStyle: styles.headerContainer,
    headerTransparent: true,
    headerStyle: styles.header,
    headerTitleStyle: styles.headerTitle,
    headerLeft: <MenuTrigger onPress={() => props.navigation.openDrawer()} />,
  });

  render() {
    return (
      <Screen
        statusBarColor={Platform.select({
          android: darken('#FEFDFD', 0.014),
          ios: colors.accent,
        })}
        backgroundColor="#FEFDFD">
        {this.renderTopSection()}
        {this.renderBottomSection()}
     </Screen>
    );
  }

  renderTopSection() {
    return (
      <View style={styles.topSection}>
        <View style={styles.topSectionCurve}>
          <View style={styles.topSectionCurveInner}>
            <View style={styles.topSectionCurveMain} />
          </View>
        </View>
        <Image source={brandIcon} style={styles.brandIcon} />
      </View>
    );
  }

  renderBottomSection() {
    const {navigation} = this.props;
    return (
      <View style={styles.bottomSection}>
        <View style={styles.menu}>
          <NavItem
            icon={restaurantIcon}
            onPress={() => navigation.navigate('RestaurantLocations')}>
            RESTAURANT
          </NavItem>
          <NavItem
            icon={hotelIcon}
            onPress={() => navigation.navigate('HotelsHome')}>
            HOTEL
          </NavItem>
          <NavItem
            icon={cinemaIcon}
            onPress={() => navigation.navigate('CinemasHome')}>
            CINEMAS
          </NavItem>
        </View>
      </View>
    );
  }
}

const NavItem: React.FC<{onPress: () => void; icon?: any}> = function NavItem({
  onPress,
  children,
  icon,
}) {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.menuNav}>
        {icon ? (
          <View style={styles.menuNavIconContainer}>
            <Image source={icon} style={styles.menuNavIcon} />
          </View>
        ) : null}
        <Text bold style={styles.menuNavLabel}>
          {children}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const MenuTrigger: React.FC<{onPress: () => void}> = function MenuTrigger({
  onPress,
}) {
  const formatAvatarUrl = React.useCallback((url: string) => {
    if (url.substr(0, 4) !== 'http') {
      return 'http:' + url;
    }
    return url;
  }, []);
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatarContainerInner}>
          <UserContext.Consumer>
            {({user}) =>
              user && user.avatar_url ? (
                <Image
                  source={{uri: formatAvatarUrl(user.avatar_url)}}
                  style={styles.avatar}
                />
              ) : (
                <Image source={userImage} style={styles.avatar} />
              )
            }
          </UserContext.Consumer>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  menuNavIcon: {
    width: 20,
    height: 20,
    resizeMode: 'center',
  },
  menuNavIconContainer: {
    width: 20,
    height: 20,
    marginBottom: 6,
  },
  avatar: {
    width: avatarSize * 0.85,
    height: avatarSize * 0.85,
    resizeMode: 'stretch',
  },
  avatarContainerInner: {
    width: avatarSize * 0.85,
    height: avatarSize * 0.85,
    overflow: 'hidden',
    borderRadius: (avatarSize * 0.85) / 2,
  },
  avatarContainer: {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    overflow: 'hidden',
    margin: 8,
    marginLeft: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuNavLabel: {
    color: colors.black,
    fontSize: 12,
  },
  menuNav: {},
  menu: {
    marginTop: 16,
    marginHorizontal: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bottomSection: {
    flex: 1,
    paddingTop: topSectionSize * 1.3 * 0.2,
  },
  topSectionCurveMain: {
    flex: 1,
    backgroundColor: colors.accent,
  },
  topSectionCurveInner: {
    width: width,
    height: topSectionSize * 1.3,
    borderRadius: (topSectionSize * 1) / 2,
    borderBottomRightRadius: topSectionSize,
    borderBottomLeftRadius: topSectionSize,
    transform: [{scaleX: 1.8}],
    overflow: 'hidden',
  },
  topSectionCurve: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    right: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandIcon: {
    width: width * 0.79,
    height: width * 0.79,
    resizeMode: 'stretch',
    marginTop: 64,
  },
  topSection: {
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
    height: topSectionSize,
  },
  header: {
    borderBottomWidth: 0,
    elevation: 0,
  },
  headerContainer: {
    justifyContent: 'center',
  },
  headerTitle: {},
});

export default Home;
