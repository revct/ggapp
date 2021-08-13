import React from 'react';
import {
  BookingsHistoryProps,
  BookingsHistoryState,
  Booking,
} from './interfaces';
import Screen from 'components/Screen/Screen';
import {
  StyleSheet,
  View,
  NativeSyntheticEvent,
  Image,
  Platform,
  TouchableWithoutFeedback,
  FlatList,
  Dimensions,
} from 'react-native';
import colors from 'configs/colors';
import Text from 'components/Text/Text';
import {sleep, rgba, MONTHS_SHORT, padNumber, parseTimeDate, displayAmount} from 'utils/Misc';
import {withUser} from 'contexts/UserContext';
import {STORE_KEYS} from 'configs/async';
import {asyncGet} from 'utils/Async';
import {getStatusBarHeight} from 'react-native-status-bar-height';
import ViewPager, {
  ViewPagerOnPageSelectedEventData,
} from '@react-native-community/viewpager';
import BottomSafeArea from 'components/BottomSafeArea/BottomSafeArea';
import Spinner from 'components/Spinner/Spinner';
const {width} = Dimensions.get('window');
const placeholderImage = require('../../assets/cinemas/placeholder-film.png');
const imageDimension = 283 / 150;
const imageWidth = width - 64;
const imageHeight = imageWidth / imageDimension;

class BookingHistory extends React.Component<
  BookingsHistoryProps,
  BookingsHistoryState
> {
  static navigationOptions = () => {
    return {
      headerTitle: 'Booking History',
      headerStyles: styles.header,
      headerTintColor: colors.gray600,
      headerTitleContainerStyle: styles.headerContainer,
      headerTransparent: true,
      headerStyle: styles.header,
      headerTitleStyle: styles.headerTitle,
      headerRight: <Text />,
    };
  };

  state: BookingsHistoryState = {
    isPending: false,
    isRefreshing: false,
    completed: [],
    booked: [],
    currnetPage: 0,
    openModel: false,
    selected: null,
  };

  viewpager: ViewPager | null = null;

  componentDidMount() {
    this.fetch();
  }

  selectPage = (page: number) => {
    if (this.viewpager) {
      this.viewpager.setPageWithoutAnimation(page);
      this.setState({currnetPage: page});
    }
  };

  handlePageScroll = (
    ev: NativeSyntheticEvent<ViewPagerOnPageSelectedEventData>,
  ) => {
    const {nativeEvent} = ev;
    this.setState({
      currnetPage: nativeEvent.position,
    });
  };

  goToLogin = () => {
    const {navigation} = this.props;
    navigation.navigate('LogIn', {
      afterLogin: () => {
        navigation.goBack();
      },
    });
  };

  handleRefresh = () => {
    this.setState(
      {
        isRefreshing: true,
      },
      this.fetch,
    );
  };

  handleSelectBooking = (item: Booking) => {
    this.setState({
      selected: item,
      openModel: true,
    });
  };

  fetch = async () => {
    const {user} = this.props;
    // user is required ro be logged in
    if (!user) {
      return this.goToLogin();
    }
    // display pending state
    this.setState({isPending: true});
    await sleep(1150);
    // get store key
    const storeKey = STORE_KEYS.BOOKING_HISTORY.replace(
      'userId',
      String(user.id),
    );
    // get items from the store
    let items: Array<Booking> = await asyncGet(storeKey);
    if (!Array.isArray(items)) {
      items = [];
    }
    // set past and booked tickets
    this.setState({
      isPending: false,
      isRefreshing: false,
      completed: items.filter(item => item.expiresAt <= Date.now()),
      booked: items.filter(item => item.expiresAt > Date.now()),
    });
  };

  formatDate = (date: string | number, withTime: boolean = false) => {
    const d = new Date(date);
    return (
      MONTHS_SHORT[d.getMonth()] +
      ' ' +
      padNumber(d.getDate()) +
      ' ' +
      d.getFullYear() +
      (withTime
        ? ' @ ' +
          parseTimeDate(
            d.getFullYear() +
              '-' +
              padNumber(d.getMonth() + 1) +
              '-' +
              d.getDate() +
              'T' +
              padNumber(d.getDate()) +
              ':' +
              padNumber(d.getMinutes()) +
              ':' +
              padNumber(d.getSeconds()),
          )
        : '')
    );
  };

  render() {
    return (
      <Screen>
        <View style={styles.container}>
          <View style={styles.containerInner}>
            {this.renderTabs()}
            <ViewPager
              ref={ref => (this.viewpager = ref)}
              style={styles.viewpager}
              initialPage={0}
              onPageScroll={this.handlePageScroll}
              scrollEnabled={false}>
              {this.renderPage('booked')}
              {this.renderPage('completed')}
            </ViewPager>
          </View>
        </View>
      </Screen>
    );
  }

  renderPage(type: 'booked' | 'completed') {
    const {completed, booked} = this.state;
    const list: Array<Booking> =
      type === 'completed' ? completed : type === 'booked' ? booked : [];
    return (
      <View style={styles.tabContent}>
        <View style={styles.tabContentInner}>
          <FlatList
            style={styles.flatList}
            data={list}
            renderItem={this.renderBooking}
            keyExtractor={item => String(item.id + item.reference)}
            ListFooterComponent={this.renderFooter}
            ListHeaderComponent={this.renderHeader}
            ListEmptyComponent={this.renderEmpty(type)}
          />
        </View>
      </View>
    );
  }

  renderEmpty = (type: 'booked' | 'completed') => {
    const {isPending} = this.state;
    if (isPending) {
      return null;
    }

    // return booked item empty list
    if (type === 'booked') {
      return (
        <Text style={styles.emptyMessage}>You have no incomplete booking.</Text>
      );
    }
    // return completed list empty message
    if (type === 'completed') {
      return (
        <Text style={styles.emptyMessage}>You have no completed booking.</Text>
      );
    }
    // return nothing by default
    return null;
  };

  renderHeader = () => {
    const {isPending} = this.state;
    if (isPending) {
      return (
        <View style={styles.loaderContainer}>
          <Spinner />
        </View>
      );
    }
    return <View style={styles.listHeader} />;
  };

  renderBooking = (props: {item: Booking}) => {
    const {item} = props;
    return (
      <TouchableWithoutFeedback
        onPress={this.handleSelectBooking.bind(this, item)}>
        <View style={styles.booking}>
          <View style={styles.bookingInner}>
            <View style={styles.bookingInnerInner}>
              <Image
                resizeMode="cover"
                style={styles.bookingImage}
                source={item.image ? {uri: item.image} : placeholderImage}
              />
              <View style={styles.bookingInfo}>
                <View style={styles.bookingMetaTop}>
                  <View style={styles.bookingMainInfo}>
                    <Text style={styles.bookingHotelName} bold>
                      {item.hotelName}
                    </Text>
                    <Text style={styles.bookingRoom}>{item.roomName}</Text>
                  </View>
                  <Text style={styles.bookingReservationId} bold>
                    ID: {item.reservationId}
                  </Text>
                </View>
                <View style={styles.bookingMeta}>
                  <Text light style={styles.bookingPrice}>
                    {displayAmount(item.price || 0)} / night
                  </Text>
                  <Text style={styles.bookingState}>
                    {item.expiresAt > Date.now() ? 'Booked' : 'Completed'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  renderTabs() {
    const {currnetPage} = this.state;
    return (
      <View style={styles.tabs}>
        <TouchableWithoutFeedback onPress={() => this.selectPage(0)}>
          <View style={styles.tab}>
            <Text
              style={[
                styles.tabText,
                currnetPage === 0 ? styles.tabtextActive : {},
              ]}>
              Booked
            </Text>
            <View
              style={[
                styles.tabIndicator,
                currnetPage === 0 ? styles.tabIndicatorActivity : {},
              ]}
            />
          </View>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={() => this.selectPage(1)}>
          <View style={styles.tab}>
            <Text
              style={[
                styles.tabText,
                currnetPage === 1 ? styles.tabtextActive : {},
              ]}>
              Completed
            </Text>
            <View
              style={[
                styles.tabIndicator,
                currnetPage === 1 ? styles.tabIndicatorActivity : {},
              ]}
            />
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  }

  renderFooter = () => {
    return <BottomSafeArea />;
  };
}

const styles = StyleSheet.create({
  bookingState: {
    flex: 1,
    fontSize: 12,
    color: colors.accent,
    lineHeight: 17,
    textAlign: 'right',
  },
  bookingPrice: {
    flex: 1,
    fontSize: 12,
    color: '#9196b2',
    lineHeight: 17,
    textAlign: 'left',
  },
  bookingMetaTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bookingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingMainInfo: {
    flex: 1,
  },
  bookingRoom: {
    fontSize: 12,
    color: '#444c6c',
    lineHeight: 17,
    textAlign: 'left',
    marginBottom: 8,
  },
  bookingReservationId: {
    fontSize: 12,
    color: '#444c6c',
    lineHeight: 17,
    textAlign: 'right',
    marginBottom: 0,
  },
  bookingHotelName: {
    fontSize: 10,
    color: rgba('#444c6c', 0.6),
    lineHeight: 15,
    textAlign: 'left',
    marginBottom: 0,
  },
  bookingInfo: {
    padding: 16,
  },
  bookingImage: {
    width: imageWidth,
    height: imageHeight,
  },
  bookingInnerInner: {
    backgroundColor: colors.white,
    ...Platform.select({
      ios: {
        overflow: 'hidden',
        borderRadius: 5,
        backgroundColor: colors.white,
      },
      android: {},
    }),
  },
  bookingInner: {
    ...Platform.select({
      ios: {
        borderRadius: 5,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
      },
      android: {},
    }),
  },
  booking: {
    marginHorizontal: 32,
    marginBottom: 8,
    marginTop: 5,
    ...Platform.select({
      ios: {},
      android: {
        backgroundColor: colors.white,
        overflow: 'hidden',
        elevation: 3,
        borderRadius: 5,
      },
    }),
  },
  emptyMessage: {
    textAlign: 'center',
    marginHorizontal: 40,
    color: colors.gray500,
    marginTop: 8,
  },
  listHeader: {
    marginTop: 16,
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 56,
  },
  viewpager: {
    flex: 1,
  },
  flatList: {
    flex: 1,
    backgroundColor: colors.white,
  },
  tabContentInner: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  tabIndicatorActivity: {
    backgroundColor: colors.accent,
  },
  tabIndicator: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    right: 0,
    height: 2,
    backgroundColor: rgba('#979797', 0.28),
  },
  tabtextActive: {
    color: colors.black,
  },
  tabText: {
    color: rgba('#060606', 0.5),
    fontSize: 13,
    textAlign: 'center',
  },
  tab: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
  },
  tabs: {
    height: 40,
    flexDirection: 'row',
    marginTop: 24,
    paddingHorizontal: 64,
  },
  containerInner: {
    flex: 1,
  },
  container: {
    flex: 1,
    marginTop: getStatusBarHeight(true) + 56,
    backgroundColor: colors.white,
    borderTopLeftRadius: 64,
    borderTopRightRadius: 64,
    overflow: 'hidden',
  },
  headerContainer: {},
  header: {
    backgroundColor: 'rgba(0,0,0,0)',
    borderBottomWidth: 0,
    elevation: 0,
  },
  headerTitle: {
    color: colors.black,
    fontWeight: '400',
    textAlign: 'center',
    alignSelf: 'center',
    flex: 1,
  },
});

export default withUser(BookingHistory);
