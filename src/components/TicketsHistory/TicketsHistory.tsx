import React from 'react';
import { TicketsHistoryProps, TicketsHistoryState, Ticket } from './interfaces';
import Screen from 'components/Screen/Screen';
import { StyleSheet, View, NativeSyntheticEvent, Image, Platform, TouchableWithoutFeedback, FlatList } from 'react-native';
import colors from 'configs/colors';
import Text from 'components/Text/Text';
import { sleep, rgba, MONTHS_SHORT, padNumber, parseTimeDate } from 'utils/Misc';
import { withUser } from 'contexts/UserContext';
import { STORE_KEYS } from 'configs/async';
import { asyncGet } from 'utils/Async';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import ViewPager, { ViewPagerOnPageSelectedEventData } from '@react-native-community/viewpager';
import BottomSafeArea from 'components/BottomSafeArea/BottomSafeArea';
import Spinner from 'components/Spinner/Spinner';
import Modal from 'react-native-modal';
import QRCode from 'react-native-qrcode-svg';
const placeholderImage = require('../../assets/cinemas/placeholder-film.png');
const qrCode = require('../../assets/tickets/qrcode-placholder.png');
const imageSize = 84;

class TicketHistory extends React.Component<TicketsHistoryProps, TicketsHistoryState> {
  static navigationOptions = () => {
    return {
      headerTitle: 'My Tickets',
      headerStyles: styles.header,
      headerTintColor: colors.gray600,
      headerTitleContainerStyle: styles.headerContainer,
      headerTransparent: true,
      headerStyle: styles.header,
      headerTitleStyle: styles.headerTitle,
      headerRight: <Text />,
    }
  };

  state: TicketsHistoryState = {
    isPending: false,
    isRefreshing: false,
    completed: [],
    upcoming: [],
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
      this.setState({ currnetPage: page })
    }
  }

  handlePageScroll = (ev: NativeSyntheticEvent<ViewPagerOnPageSelectedEventData>) => {
    const { nativeEvent } = ev;
    this.setState({
      currnetPage: nativeEvent.position,
    });
  }

  goToLogin = () => {
    const { navigation } = this.props;
    navigation.navigate('LogIn', {
      afterLogin: () => {
        navigation.goBack();
      }
    });
  }

  handleRefresh = () => {
    this.setState({
      isRefreshing: true
    }, this.fetch)
  }

  handleSelectTicket = (item: Ticket) => {
    this.setState({
      selected: item,
      openModel: true
    });
  }

  fetch = async () => {
    const { user } = this.props;
    // user is required ro be logged in
    if (!user) {
      return this.goToLogin()
    }
    // display pending state
    this.setState({ isPending: true });
    await sleep(1150);
    // get store key
    const storeKey = STORE_KEYS
      .TICKETS_HISTORY
      .replace('userId', String(user.id));
    // get items from the store
    let items: Array<Ticket> = await asyncGet(storeKey);
    if (!Array.isArray(items)) {
      items = [];
    }
    // set past and upcoming tickets
    this.setState({
      isPending: false,
      isRefreshing: false,
      completed: items.filter(item => (item.expiresAt <= Date.now())),
      upcoming: items.filter(item => (item.expiresAt > Date.now()))
    });
  };

  formatDate = (date: string | number, withTime: boolean = false) => {
    const d = new Date(date);
    return MONTHS_SHORT[d.getMonth()]
      + ' ' + padNumber(d.getDate())
      + ' ' + d.getFullYear()
      + (withTime
        ? ' @ ' + parseTimeDate(
          d.getFullYear()
          + '-' + padNumber(d.getMonth() + 1)
          + '-' + d.getDate()
          + 'T' + padNumber(d.getDate())
          + ':' + padNumber(d.getMinutes())
          + ':' + padNumber(d.getSeconds())
        )
        : '');
  }

  render() {
    return (
      <Screen>
        <View style={styles.container}>
          <View style={styles.containerInner}>
            {this.renderTabs()}
            <ViewPager
              ref={ref => this.viewpager = ref}
              style={styles.viewpager}
              initialPage={0}
              onPageScroll={this.handlePageScroll}
              scrollEnabled={false}>
              {this.renderPage('upcoming')}
              {this.renderPage('completed')}
            </ViewPager>
          </View>
        </View>
        {this.renderModal()}
      </Screen>
    );
  }

  renderModal() {
    const { openModel, selected } = this.state;
    const time = selected ? selected.time.split(':') : null;
    return (
      <Modal
        isVisible={openModel && selected ? true : false}
        animationIn='fadeInUp'
        animationOut='fadeOutDown'
        animationInTiming={300}
        animationOutTiming={200}
        style={styles.selectedModal}
        onBackdropPress={() => this.setState({ openModel: false })}
        backdropOpacity={0.2}>
        <View style={styles.ticketInfo}>
          <View style={styles.ticketInfoBg}>
            <View style={styles.ticketInfoBgInner} />
          </View>
          {selected ? (
            <View style={styles.qrCodeSectionContainer}>
              <View>
                <QRCode
                  value={selected ? selected.reference + ' / ' + selected.date + ' ' + selected.time : 'Genesis'}
                  size={152}
                />
              </View>
              <Text style={styles.selectedTicketId}>
                <Text style={styles.selectedTicketIdLabel} light>Ticket ID </Text>
                <Text style={styles.selectedTicketIdValue}>{selected.reference}</Text>
              </Text>
            </View>
          ) : null}
          {selected ? (
            <View style={styles.infoContainer}>
              <View style={styles.selectedTicketImageContainer}>
                <Image
                  source={selected.image ? { uri: selected.image } : placeholderImage}
                  style={styles.selectedTickerImage}
                  resizeMode='cover' />
              </View>
              <View style={styles.selectedTickerInfo}>
                <Text style={styles.ticketName} bold>{selected.name}</Text>
                <View style={styles.ticketMeta}>
                  <Text style={styles.ticketMetaLabel} light>Date</Text>
                  <Text style={styles.ticketMetaData}>{this.formatDate(selected.date)}</Text>
                </View>
                <View style={styles.ticketMeta}>
                  <Text style={styles.ticketMetaLabel} light>Time</Text>
                  <Text style={styles.ticketMetaData}>{time ? time[0] + ':' + time[1] : ''}</Text>
                </View>
                <View style={styles.ticketMeta}>
                  <Text style={styles.ticketMetaLabel} light>Cinema</Text>
                  <Text style={styles.ticketMetaData}>{selected.cinema}</Text>
                </View>
                <View style={styles.ticketMeta}>
                  <Text style={styles.ticketMetaLabel} light>Quantity</Text>
                  <Text style={styles.ticketMetaData}>{selected.quantity}</Text>
                </View>
                <View style={styles.ticketMeta}>
                  <Text style={styles.ticketMetaLabel} light>Expires</Text>
                  <Text style={styles.ticketMetaData}>{this.formatDate(selected.expiresAt, true)}</Text>
                </View>
              </View>
            </View>
          ) : null}
          <BottomSafeArea />
        </View>
      </Modal>
    );
  }

  renderPage(type: 'upcoming' | 'completed') {
    const { completed, upcoming } = this.state;
    const list: Array<Ticket> = type === 'completed' ? completed : type === 'upcoming' ? upcoming : [];
    return (
      <View style={styles.tabContent}>
        <View style={styles.tabContentInner}>
          <FlatList
            style={styles.flatList}
            data={list}
            renderItem={this.renderTicket}
            keyExtractor={(item) => String(item.id + item.reference)}
            ListFooterComponent={this.renderFooter}
            ListHeaderComponent={this.renderHeader(type)}
            ListEmptyComponent={this.renderEmpty(type)}
          />
        </View>
      </View>
    );
  }

  renderEmpty = (type: 'upcoming' | 'completed') => {
    const { isPending } = this.state;
    if (isPending) {
      return null
    }

    // return upcoming item empty list
    if (type === 'upcoming') {
      return (
        <Text style={styles.emptyMessage}>
          You have no upcoming movies.
          </Text>
      );
    }
    // return completed list empty message
    if (type === 'completed') {
      return (
        <Text style={styles.emptyMessage}>
          You have no completed movies.
        </Text>
      );
    }
    // return nothing by default
    return null;
  }

  renderHeader = (type: 'upcoming' | 'completed') => {
    const { isPending } = this.state;
    if (isPending) {
      return (
        <View style={styles.loaderContainer}>
          <Spinner />
        </View>
      );
    }
    return (
      <View style={styles.listHeader} />
    );
  }

  renderTicket = (props: { item: Ticket }) => {
    const { item } = props;
    const time = item.time.split(':');
    return (
      <TouchableWithoutFeedback onPress={this.handleSelectTicket.bind(this, item)}>
        <View style={styles.ticket}>
          <View style={styles.ticketBg}>
            <View style={styles.ticketBgInner} />
          </View>
          <View style={styles.ticketImageContainer}>
            <Image
              source={qrCode}
              style={styles.qrCode}
              resizeMode='cover' />
            <View style={styles.ticketImageContainerInner}>
              <Image
                source={item.image ? { uri: item.image } : placeholderImage}
                style={styles.ticketImage}
                resizeMode='cover' />
            </View>
          </View>
          <View style={styles.ticketInner}>
            <Text style={styles.ticketName} numberOfLines={1} bold>{item.name}</Text>
            <Text style={styles.ticketMeta}>
              <Text style={styles.ticketMetaLabel} light>Date: </Text>
              <Text style={styles.ticketMetaData}>{this.formatDate(item.date)}</Text>
            </Text>
            <Text style={styles.ticketMeta}>
              <Text style={styles.ticketMetaLabel}>Time: </Text>
              <Text style={styles.ticketMetaData}>{time[0] + ':' + time[1]}</Text>
            </Text>
            <Text style={styles.ticketMeta}>
              <Text style={styles.ticketMetaLabel}>Ticket ID: </Text>
              <Text style={styles.ticketMetaData}>{item.reference}</Text>
            </Text>
            <Text style={styles.ticketMeta}>
              <Text style={styles.ticketMetaLabel}>Quantity: </Text>
              <Text style={styles.ticketMetaData}>{item.quantity}</Text>
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  renderTabs() {
    const { currnetPage } = this.state;
    return (
      <View style={styles.tabs}>
        <TouchableWithoutFeedback onPress={() => this.selectPage(0)}>
          <View style={styles.tab}>
            <Text style={[
              styles.tabText,
              currnetPage === 0 ? styles.tabtextActive : {},
            ]}>Upcoming</Text>
            <View style={[
              styles.tabIndicator,
              currnetPage === 0 ? styles.tabIndicatorActivity : {},
            ]} />
          </View>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={() => this.selectPage(1)}>
          <View style={styles.tab}>
            <Text style={[
              styles.tabText,
              currnetPage === 1 ? styles.tabtextActive : {},
            ]}>Completed</Text>
            <View style={[
              styles.tabIndicator,
              currnetPage === 1 ? styles.tabIndicatorActivity : {},
            ]} />
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  }

  renderFooter = () => {
    return (
      <BottomSafeArea />
    );
  }
}

const styles = StyleSheet.create({
  selectedTicketIdValue: {
    fontSize: 14,
    color: colors.black,
  },
  selectedTicketIdLabel: {
    fontSize: 14,
    color: rgba('#060606', 0.5),
  },
  selectedTicketId: {
    marginTop: 16,
    textAlign: 'center',
  },
  qrCodeSectionContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  selectedTickerInfo: {
    flex: 1,
    paddingRight: 16,
  },
  selectedTickerImage: {
    width: 64,
    height: 64,
    overflow: 'hidden',
  },
  selectedTicketImageContainer: {
    left: -16,
    width: 64,
    height: 64,
    borderRadius: 4,
    overflow: 'hidden',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketInfoBgInner: {
    flexGrow: 1,
    backgroundColor: colors.white,
  },
  ticketInfoBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: colors.white,
    borderTopRightRadius: 16,
    borderTopLeftRadius: 16,
    overflow: "hidden",
  },
  ticketInfo: {
    marginHorizontal: 56,
    paddingTop: 40,
  },
  selectedModal: {
    margin: 0,
    justifyContent: 'flex-end',
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
    backgroundColor: colors.white
  },
  tabContentInner: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  ticketMetaData: {
    fontSize: 10,
    color: '#060606',
    marginLeft: 4,
  },
  ticketMetaLabel: {
    color: rgba('#060606', 0.5),
    fontSize: 10,
    paddingRight: 4,
  },
  ticketMeta: {
    marginBottom: 4,
    flexDirection: 'row',
  },
  ticketName: {
    fontSize: 12,
    color: '#060606',
    marginBottom: 4,
  },
  ticketInner: {
    flex: 1,
    paddingVertical: 16,
    marginLeft: 16,
  },
  qrCode: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: imageSize,
    height: imageSize,
  },
  ticketImage: {
    width: imageSize,
    height: imageSize,
    resizeMode: 'cover',
  },
  ticketImageContainerInner: {
    width: imageSize,
    height: imageSize,
    borderRadius: 8,
    overflow: 'hidden',
  },
  ticketImageContainer: {
    width: imageSize + 32,
    height: imageSize,
    marginVertical: 16,
    overflow: 'hidden',
  },
  ticketBgInner: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    borderRadius: 8,
    backgroundColor: colors.white,
    ...Platform.select({
      android: {
      },
      ios: {
        overflow: 'hidden'
      }
    })
  },
  ticketBg: {
    position: 'absolute',
    left: 56,
    top: 0,
    bottom: 0,
    right: 32,
    borderRadius: 8,
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    ...Platform.select({
      android: {
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.gray300,
      },
      ios: {}
    })
  },
  ticket: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    alignItems: 'center',
    marginVertical: 8,
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

export default withUser(TicketHistory);
