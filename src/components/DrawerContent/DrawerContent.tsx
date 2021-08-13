import React from 'react';
import { DrawerContentProps, DrawerContentState } from './interfaces';
import { View, StyleSheet, ScrollView, TouchableOpacity, TouchableWithoutFeedback, Image } from 'react-native';
import Text from 'components/Text/Text';
import colors from 'configs/colors';
import { UserContext } from 'contexts/UserContext';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import VectorIcon from 'components/VectorIcon/VectorIcon';
import Spinner from 'components/Spinner/Spinner';
import { withLiveChat } from 'contexts/LiveChatContext';
const defaultAvatar = require('../../assets/general/avatar.png');
const menus = [
  {key: 'my-profile', label: 'My Profile'},
  {key: 'ticket-history', label: 'My Tickets'},
  // {key: 'saved-items', label: 'Saved Items'},
  {key: 'rewards', label: 'Rewards'},
  {key: 'top-points', label: 'Top Up Points'},
  {key: 'customer-care', label: 'Customer Care'},
  {key: 'booking-history', label: 'Booking History'},
  // {key: 'notifications', label: 'Notifications'},
]

class DrawerContent extends React.Component<DrawerContentProps, DrawerContentState> {

  static contextType = UserContext;

  state: DrawerContentState = {
    isLoggingOut: false,
  }

  handleButtonPress = () => {
    const { user, removeUser } = this.context;
    const { navigation } = this.props;
    if (!user) {
      navigation.closeDrawer();
      return navigation.navigate('LogIn');
    }
    this.setState({
      isLoggingOut: true,
    }, async () => {
      await removeUser();
      if (navigation.state.isDrawerOpen) {
        navigation.closeDrawer();
      }
      this.setState({
        isLoggingOut: false,
      });
    });
  }

  handleMenuPress = (menu: string) => {
    const { navigation, liveChat } = this.props;
    const { user } = this.context;
    navigation.closeDrawer();
    switch (menu) {
      case 'my-profile':
        if (!user) {
          return navigation.navigate('LogIn', {
            afterLogin: () => {
              navigation.navigate('Profile');
            }
          });
        }
        navigation.navigate('Profile')
        break;
      case 'rewards':
        if (!user) {
          return navigation.navigate('LogIn', {
            afterLogin: () => {
              navigation.navigate('Rewards');
            }
          });
        }
        navigation.navigate('Rewards')
        break;
      case 'top-points':
        if (!user) {
          return navigation.navigate('LogIn', {
            afterLogin: () => {
              navigation.navigate('BuyPoints',{user});
            }
          });
        }
        navigation.navigate('BuyPoints',{user})
        break;
      case 'ticket-history':
        if (!user) {
          return navigation.navigate('LogIn', {
            afterLogin: () => {
              navigation.navigate('TicketsHistory');
            }
          });
        }
        navigation.navigate('TicketsHistory')
        break;
      case 'booking-history':
        if (!user) {
          return navigation.navigate('LogIn', {
            afterLogin: () => {
              navigation.navigate('BookingHistory');
            },
          });
        }
        navigation.navigate('BookingHistory')
        break;
      case 'customer-care':
        return liveChat.show();
    }
  }

  getDisplayName() {
    const { user } = this.context;
    if (!user) {
      return '';
    }
    const username = user.username.split('-');
    if (username[0] === 'twitter'
      || username[0] === 'facebook'
      || username[0] === 'google'
    ) {
      return user.first_name;
    }
    return user.username;
  }

  getAvatar() {
    const { user } = this.context;
    if (!user || !user.avatar_url) {
      return null;
    }

    if ((user.avatar_url.substr(0, 4)) !== 'http') {
      return 'http:' + user.avatar_url;
    }

    return user.avatar_url;
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.containerInner}>
          <View style={styles.containerInnerInner}>
            <ScrollView bounces={false} style={styles.content} contentContainerStyle={styles.contentContainer}>
              {this.renderMain()}
              {this.renderBottom()}
            </ScrollView>
          </View>
        </View>
      </View>
    );
  }

  renderMain() {
    const { user } = this.context;
    return (
      <View style={styles.main}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarContainerInner}>
            <Image
              source={user && this.getAvatar() ? { uri: this.getAvatar() } : defaultAvatar}
              style={styles.avatar}
              resizeMode='cover'
            />
          </View>
        </View>
        {user ? (
          <Text style={styles.username}>{this.getDisplayName()}</Text>
        ) : null}
        <View style={styles.menusContainer}>
          {menus.map(this.renderMenu)}
        </View>
      </View>
    );
  }

  renderMenu = (item: { key: string, label: string }, index: number) => {
    return (
      <TouchableWithoutFeedback onPress={() => this.handleMenuPress(item.key)} key={index}>
        <View style={styles.menu}>
          <Text style={styles.menuLabel} light>{item.label}</Text>
          <VectorIcon
            name='ios-arrow-forward'
            color={colors.black}
            size={16}
          />
        </View>
      </TouchableWithoutFeedback>
    );
  }

  renderBottom() {
    const { user } = this.context;
    const { isLoggingOut } = this.state;
    return (
      <View style={styles.footer}>
        <TouchableOpacity
          disabled={isLoggingOut}
          activeOpacity={0.8}
          onPress={this.handleButtonPress}>
          <View style={styles.button}>
            {!isLoggingOut ? (
              <VectorIcon
                name='ios-power'
                color={colors.white}
                size={16}
              />
            ) : null}
            {isLoggingOut
              ? (<Spinner color={colors.white} />)
              : !user
                ? (<Text style={styles.buttonText}>Log In</Text>)
                : (<Text style={styles.buttonText}>Log Out</Text>)
            }
          </View>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  username: {
    fontSize: 14,
    color: colors.black,
    textAlign: 'center',
    marginTop: 4,
  },
  menusContainer: {
    marginTop: 24,
  },
  avatarContainerInner: {
    width: 68,
    height: 68,
    borderRadius: 68 / 2,
    overflow: 'hidden'
  },
  avatarContainer: {
    width: 68,
    height: 68,
    alignSelf: 'center',
  },
  avatar: {
    width: 68,
    height: 68,
    resizeMode: 'cover',
  },
  menuLabel: {
    flex: 2,
    fontSize: 14,
  },
  menu: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    paddingLeft: 40,
    paddingRight: 16,
    backgroundColor: colors.white,
  },
  buttonText: {
    color: colors.white,
    fontSize: 14,
    marginLeft: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    height: 40,
  },
  main: {
    marginTop: getStatusBarHeight(true) + 32
  },
  footer: {
    marginBottom: 36,
  },
  contentContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingRight: 8,
  },
  containerInner: {
    flex: 1,
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  containerInnerInner: {
    flex: 1,
    overflow: 'hidden',
  }
});

export default withLiveChat(DrawerContent);
