import React from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  Image,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Alert,
  TouchableOpacity,
  NativeSyntheticEvent,
} from 'react-native';
import {CinemasFilmProps, CinemasFilmState} from './interfaces';
import Screen from 'components/Screen/Screen';
import colors from 'configs/colors';
import Text from 'components/Text/Text';
import VectorIcon from 'components/VectorIcon/VectorIcon';
import LinearGradient from 'react-native-linear-gradient';
import DealsSlider from 'components/DealsSlider/DealsSlider';
import {
  displayAmount,
  getNumberNth,
  DAYS,
  MONTHS,
  parseTimeDate,
  sleep,
  padNumber,
  MONTHS_SHORT,
} from 'utils/Misc';
import {Cinema} from 'api/FetchCinemas';
import {withCart, CartItem} from 'contexts/CartContext';
import {getStatusBarHeight} from 'react-native-status-bar-height';
import {STORE_KEYS} from 'configs/async';
import {asyncGet} from 'utils/Async';
import ViewPager, {
  ViewPagerOnPageSelectedEventData,
} from '@react-native-community/viewpager';
import PerformanceTimeCarousel from 'components/PerformanceTimeCarousel/PerformanceTimeCarousel';
import {Performance} from 'api/FetchPerformanceList';
import OverlayLoader from 'components/OverlayLoader/OverlayLoader';
import Toast from 'utils/Toast';
import ReadCinemaProduct from 'api/ReadCinemaProduct';
import Axios, {Canceler} from 'axios';
import FindPerformance from 'api/FindPerformance.api';
const placeholderFilmImage = require('../../assets/cinemas/placeholder-film.png');
const watermark = require('../../assets/home/watermark-480x406.png');
const {width, height} = Dimensions.get('window');

class CinemasFilm extends React.Component<CinemasFilmProps, CinemasFilmState> {
  static navigationOptions = () => {
    return {
      headerTitle: '',
      headerStyles: styles.header,
      headerTintColor: 'rgba(255,255,255, 0.7)',
      headerTitleContainerStyle: styles.headerContainer,
      headerTransparent: true,
      headerStyle: styles.header,
      headerTitleStyle: styles.headerTitle,
      headerRight: <Text />,
    };
  };

  httpCanceler?: Canceler;

  viewpager: ViewPager | null = null;

  schedules: Array<{day: string; date: Date}> = [];

  state: CinemasFilmState = {
    isPending: false,
    time: null,
    cinema: null,
    info: null,
    quantity: 1,
    currentTab: 0,
    performance: null,
    errorMessage: null,
  };

  constructor(props: CinemasFilmProps) {
    super(props);
    this.setSchedules();
  }

  componentDidMount() {
    this.fetch();
  }

  componentWillUnmount() {
    if (this.httpCanceler) {
      this.httpCanceler();
    }
  }

  isDeal = () => {
    const {navigation} = this.props;
    return navigation.getParam('deal') ? true : false;
  };

  setSchedules = () => {
    const twentyFourHoursMs = 60 * 60 * 24 * 1000;
    // create first day
    this.schedules.push({day: 'Today', date: new Date()});
    // create second day
    this.schedules.push({
      day: 'Tomorrow',
      date: new Date(this.schedules[0].date.getTime() + twentyFourHoursMs),
    });
    // create third day
    this.schedules.push({
      day: 'Next Tomorrow',
      date: new Date(this.schedules[1].date.getTime() + twentyFourHoursMs),
    });
    this.schedules[2].day =
      DAYS[this.schedules[2].date.getDay()] +
      ', ' +
      getNumberNth(this.schedules[2].date.getDate()) +
      ', ' +
      MONTHS[this.schedules[2].date.getMonth()];
    // create fourth day
    this.schedules.push({
      day: 'Day Four',
      date: new Date(this.schedules[2].date.getTime() + twentyFourHoursMs),
    });
    this.schedules[3].day =
      DAYS[this.schedules[3].date.getDay()] +
      ', ' +
      getNumberNth(this.schedules[3].date.getDate()) +
      ', ' +
      MONTHS[this.schedules[3].date.getMonth()];
  };

  fetch = async () => {
    const {isPending} = this.state;
    const {navigation} = this.props;
    if (!navigation.getParam('id') || !navigation.getParam('cinema')) {
      return navigation.goBack();
    }
    if (isPending) {
      return;
    }
    this.setState({
      isPending: true,
      errorMessage: null,
    });
    await sleep(200);
    try {
      const performance = await FindPerformance(
        {
          id: navigation.getParam('id'),
          cinema: navigation.getParam('cinema'),
        },
        {canceler: this.httpCanceler},
      );

      this.setState(
        {
          performance: performance,
          isPending: false,
        },
        () => {
          if (this.isDeal()) {
            this.handlePerformanceTimeSelect(performance);
          }
        },
      );
    } catch (e) {
      let errorMessage = e.message;
      if (e.response && e.response.data) {
        errorMessage = e.response.data.detail;
      }
      if (/network/i.test(errorMessage)) {
        errorMessage = 'Please check your internet connection and try again.';
      }
      if (/not found/i.test(errorMessage)) {
        errorMessage = 'Movie not found.';
      }
      this.setState({
        isPending: false,
        errorMessage: errorMessage,
      });
    }
  };

  formatDate = (date: string | number) => {
    const d = new Date(date);
    return (
      MONTHS_SHORT[d.getMonth()] +
      ' ' +
      padNumber(d.getDate()) +
      ' ' +
      d.getFullYear()
    );
  };

  hasDealExpired() {
    const {performance} = this.state;
    if (!this.isDeal()) {
      return false;
    }
    if (!performance) {
      return false;
    }
    if (
      Date.now() >=
      new Date(performance.perfdate + 'T' + performance.start_time).getTime()
    ) {
      Alert.alert('Error', 'This deal has expired.');
      return true;
    }
    return false;
  }

  getRatingStar = (rating: number): string => {
    if (rating >= 4.8) {
      return 'md-star';
    }
    if (rating >= 2) {
      return 'md-star-half';
    }
    return 'md-star-outline';
  };

  handleCinemaChange = (cinema: Cinema | null) => {
    this.setState({cinema: cinema, time: null});
  };

  handleChangeQuantity(action: 'remove' | 'add' = 'add') {
    if (action === 'remove') {
      return this.setState(({quantity}) => ({
        quantity: quantity < 2 ? 1 : quantity - 1,
      }));
    }
    this.setState(({quantity}) => ({
      quantity: quantity + 1,
    }));
  }

  handlePerformanceTimeSelect = (item: Performance) => {
    const {navigation} = this.props;
    const cinema = navigation.getParam('cinema');
    const {isPending} = this.state;
    if (!cinema) {
      Alert.alert('Error', 'Please select a cinema and try again.');
      return navigation.goBack();
    }
    if (isPending || !item) {
      return;
    }
    this.setState(
      {
        isPending: true,
      },
      async () => {
        try {
          const info = await ReadCinemaProduct(
            {performanceId: item.id, site: cinema},
            {
              canceler: this.httpCanceler,
            },
          );
          this.setState({
            isPending: false,
            info: info,
            quantity: 1,
            time: item,
          });
        } catch (e) {
          if (Axios.isCancel(e)) {
            return;
          }
          let errorMessage = e.message;
          if (/network/gi.test(errorMessage)) {
            errorMessage =
              'Please check your network connection and try again.';
          }
          if (e.response && e.response.data) {
            errorMessage = e.response.data.detail || errorMessage;
          }
          this.setState({
            isPending: false,
            time: null,
          });
          Toast.alert(errorMessage);
        }
      },
    );
  };

  handlePageSelected = (
    ev: NativeSyntheticEvent<ViewPagerOnPageSelectedEventData>,
  ) => {
    const {nativeEvent} = ev;
    this.setState({
      currentTab: nativeEvent.position,
    });
  };

  handleSelectPage = (index: number) => {
    if (this.viewpager) {
      this.viewpager.setPageWithoutAnimation(index);
    }
  };

  addToCart = async () => {
    const {quantity, time, info, performance, isPending} = this.state;
    const {navigation, cart} = this.props;
    let cinema = await asyncGet(STORE_KEYS.SELECTED_CINEMA);
    if (isPending) {
      return;
    }
    // can't add if is a deal and has expired
    if (this.hasDealExpired()) {
      return Alert.alert('Error', 'This special offer has expired!');
    }
    // time is required
    if (!time || !info) {
      return Alert.alert('Attention', 'Please select your preferred time.', [
        {text: 'Ok'},
      ]);
    }
    // Please select cinema
    if (!cinema) {
      Alert.alert('Attention', 'Please select a cinema and try again.', [
        {text: 'Ok'},
      ]);
      return navigation.goBack();
    }
    // filminfo is required
    if (!performance) {
      Alert.alert('Attention', 'Please select the movie and try again.', [
        {text: 'Ok'},
      ]);
      return navigation.goBack();
    }
    // filminfo is required
    if (performance.stop_selling === 'Y') {
      Alert.alert(
        'Error',
        'This movie ticket is no loger available for the selected time.',
      );
      return navigation.goBack();
    }
    // get create new cart item
    const cartItem: CartItem = {
      name: time.film.title,
      caption: parseTimeDate(time.perfdate + 'T' + time.start_time),
      image: null,
      price: Number(info.unit_price),
      quantity: quantity,
      location: cinema.a.trim(),
      data: {
        ...time,
        cinema,
        prod_code: info.code,
      },
      type: 'ticket',
    };
    // add item to cart
    cart.add(cartItem);
  };

  render() {
    const {performance} = this.state;
    let filmList = this.props.navigation.getParam('filmList');
    const filmItem = performance && performance.film? filmList.find(film=>film.id== performance.film.id):null;
    const imageUrl = filmItem? filmItem.imageurl.trim() : '';
    // const imageUrl = performance && performance.film.imageurl
    //     ? performance.film.imageurl.trim()
    //     : '';
    return (
      <Screen statusBarColor={Platform.select({ios: 'black'})}>
        <View style={styles.container}>
          <View style={styles.backgroundImageContainer}>
            <Image
              source={
                imageUrl && imageUrl !== 'n/a'
                  ? {uri: imageUrl}
                  : placeholderFilmImage
              }
              resizeMode="cover"
              style={styles.backgroundImage}
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)']}
              start={{x: 0.5, y: 0}}
              style={styles.backgroundVeil}
            />
          </View>
          {this.renderTitle()}
          {this.renderMainSection()}
        </View>
      </Screen>
    );
  }

  renderTitle() {
    const {performance} = this.state;
    return (
      <View style={styles.titleContainer}>
        <Text style={styles.title} bold>
          {performance ? performance.film.title : ''}
        </Text>
        {/* <View style={styles.metaInfo}>
          <Text style={styles.metaText}>
            ({performance ? performance.points || 2000 : 0})
          </Text>
          <Text style={styles.metaText}>
            +{performance ? performance.reward || 60 : 0}
          </Text>
          <Image source={coins} resizeMode='stretch' style={styles.coins} />
        </View> */}
      </View>
    );
  }

  renderMainSection() {
    const {quantity, isPending, info, performance, errorMessage} = this.state;
    const releaseDate = [];
    return (
      <View style={styles.mainSection}>
        <View style={styles.mainSectionInner}>
          <ScrollView
            style={styles.mainSectionContent}
            contentContainerStyle={styles.mainSectionContentContainer}>
            <View style={{minHeight: 200}}>
              <Image source={watermark} style={styles.watermark} />
              {performance ? (
                <>
                  <Text style={styles.descriptionLabel} bold>
                    Description
                  </Text>
                  <Text style={styles.description} light>
                    {performance ? performance.film.synopsis : ''}
                  </Text>
                </>
              ) : null}

              {performance ? (
                <View style={styles.performance}>
                  <View style={styles.performanceItem}>
                    <Text style={styles.performanceItemContent}>
                      Running Time: {performance.film.runtime}
                    </Text>
                  </View>
                  <View style={styles.performanceItem}>
                    <Text style={styles.performanceItemContent}>
                      Genre: Sci-fi
                    </Text>
                  </View>
                  {releaseDate.length >= 3 ? (
                    <View style={styles.performanceItem}>
                      <Text style={styles.performanceItemContent}>
                        Released:
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
              {this.isDeal() ? (
                this.renderDealTime()
              ) : performance ? (
                <View style={{marginBottom: 24}}>
                  {this.renderDateSelector()}
                  <ViewPager
                    ref={ref => (this.viewpager = ref)}
                    initialPage={0}
                    style={styles.viewpager}
                    onPageSelected={this.handlePageSelected}
                    scrollEnabled={false}>
                    {this.schedules.map(this.renderTab)}
                  </ViewPager>
                </View>
              ) : null}

              <View style={[styles.performance, {alignItems: 'center'}]}>
                <View>
                  {info ? (
                    <Text style={styles.filmPrice}>
                      Price: {displayAmount(Number(info.unit_price) * quantity)}
                    </Text>
                  ) : null}
                  {/* <CinemaSelector onChange={this.handleCinemaChange} /> */}
                </View>
                {this.renderQuantitySelector()}
              </View>
              {!performance && errorMessage ? (
                <View style={styles.errorMessage}>
                  <Text style={styles.errorMaessageText}>{errorMessage}</Text>
                  <TouchableWithoutFeedback onPress={this.fetch}>
                    <Text style={styles.errorMessageRetryButton}>
                      Try Again
                    </Text>
                  </TouchableWithoutFeedback>
                </View>
              ) : null}
              {performance ? (
                <View style={styles.addToCartButtonContainer}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    disabled={isPending}
                    onPress={this.addToCart}>
                    <View style={styles.addToCartButton}>
                      <Text style={styles.addToCartButtonLabel}>
                        Add To Cart
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ) : null}

              <OverlayLoader isVisible={isPending} animated={false} />
            </View>
            <View style={styles.dealsContainer}>
              <DealsSlider />
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  renderDealTime = () => {
    const {performance} = this.state;
    if (!performance) {
      return null;
    }
    return (
      <View style={styles.dealDateTime}>
        <Text style={[styles.selectedDate, styles.datePerfDate]}>
          {this.formatDate(performance.perfdate)}
        </Text>
        <View style={styles.datePerfTime}>
          <Text style={styles.datePerfTimeTime} light>
            {parseTimeDate(performance.perfdate + 'T' + performance.start_time)}
          </Text>
        </View>
      </View>
    );
  };

  renderDateSelector() {
    const {currentTab, performance} = this.state;
    const date = this.schedules[currentTab];
    if (!date || !performance) {
      return null;
    }
    return (
      <View style={styles.dateSelector}>
        <TouchableWithoutFeedback
          disabled={!performance ? true : false}
          onPress={() =>
            this.handleSelectPage(
              currentTab <= 0 ? this.schedules.length - 1 : currentTab - 1,
            )
          }>
          <View style={styles.dateSelectorButton}>
            <VectorIcon
              name="ios-arrow-back"
              color={'rgba(0,0,0,0.33)'}
              size={14}
            />
          </View>
        </TouchableWithoutFeedback>
        <Text style={styles.selectedDate} light>
          {date.day}
        </Text>
        <TouchableWithoutFeedback
          disabled={!performance ? true : false}
          onPress={() =>
            this.handleSelectPage(
              currentTab >= this.schedules.length - 1 ? 0 : currentTab + 1,
            )
          }>
          <View style={styles.dateSelectorButton}>
            <VectorIcon
              name="ios-arrow-forward"
              color={'rgba(0,0,0,0.33)'}
              size={14}
            />
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  }

  renderTab = (item: {day: string; date: Date}, index: number) => {
    const {time, performance} = this.state;
    const {navigation} = this.props;
    const cinema = navigation.getParam('cinema');
    if (!cinema) {
      return null;
    }
    return (
      <View style={styles.tabs} key={index}>
        <PerformanceTimeCarousel
          date={item.date}
          selected={time}
          filmId={performance ? performance.film.id : 0}
          onSelect={this.handlePerformanceTimeSelect}
          cinema={cinema}
        />
      </View>
    );
  };

  renderScheduleTabNavs = () => {
    return (
      <View style={styles.tabNavs}>
        {this.schedules.map(this.renderScheduleTabNav)}
      </View>
    );
  };

  renderScheduleTabNav = (item: {day: string; date: Date}, index: number) => {
    const {currentTab} = this.state;
    return (
      <TouchableWithoutFeedback
        key={index}
        onPress={() => this.handleSelectPage(index)}>
        <View style={styles.tabNavsItem}>
          <View
            style={[
              styles.tabIndicator,
              currentTab === index ? styles.tabIndicatorActive : null,
            ]}
          />
          <Text
            style={[
              styles.tabItemLabel,
              currentTab === index ? styles.tabItemLabelActive : null,
            ]}>
            {item.day}
          </Text>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  renderQuantitySelector() {
    const {quantity, info, performance} = this.state;

    if (!performance) {
      return null;
    }

    return (
      <View
        style={[
          styles.quantitySelector,
          !info ? styles.quantitySelectorInactive : null,
        ]}>
        <Text style={styles.quantitySelectorLabel}>Order: </Text>
        <View style={styles.quantitySelectorControls}>
          <TouchableWithoutFeedback
            disabled={!info ? true : false}
            onPress={() => this.handleChangeQuantity('remove')}>
            <View style={[styles.quantityButton]}>
              <VectorIcon name="md-remove" color={colors.accent} />
            </View>
          </TouchableWithoutFeedback>
          <Text style={styles.quantity}>{quantity}</Text>
          <TouchableWithoutFeedback
            disabled={!info ? true : false}
            onPress={() => this.handleChangeQuantity('add')}>
            <View style={styles.quantityButton}>
              <VectorIcon name="md-add" color={colors.accent} />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  errorMessage: {
    alignItems: 'center',
    marginTop: 64,
  },
  errorMaessageText: {
    textAlign: 'center',
    fontSize: 14,
  },
  errorMessageRetryButton: {
    padding: 4,
    color: colors.accent,
  },
  datePerfTimeTime: {
    color: colors.white,
    fontSize: 12,
  },
  datePerfTime: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    marginHorizontal: 8,
    borderRadius: 4,
    height: 24,
    justifyContent: 'center',
  },
  datePerfDate: {
    marginBottom: 8,
  },
  dealDateTime: {
    alignItems: 'center',
    marginVertical: 16,
  },
  coins: {
    width: 16,
    height: 16 / (71 / 67),
    resizeMode: 'stretch',
    marginLeft: 4,
  },
  selectedDate: {
    color: colors.black,
    fontSize: 12,
    marginHorizontal: 16,
    width: 200,
    textAlign: 'center',
  },
  dateSelectorButton: {
    padding: 8,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  tabs: {
    flex: 1,
  },
  viewpager: {
    flex: 1,
    height: 24,
  },
  tabItemLabelActive: {
    color: colors.black,
  },
  tabItemLabel: {
    color: colors.gray600,
    fontSize: 11,
    textAlign: 'center',
  },
  tabIndicatorActive: {
    backgroundColor: colors.accent,
  },
  tabIndicator: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.gray400,
  },
  tabNavsItem: {
    flexGrow: 1,
    padding: 8,
  },
  tabNavs: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  addToCartButtonContainer: {
    paddingHorizontal: 32,
    marginTop: 8,
  },
  addToCartButtonDisabled: {
    backgroundColor: colors.gray500,
  },
  addToCartButton: {
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartButtonLabel: {
    color: colors.white,
  },
  cinemaSelectorLabel: {
    color: colors.black,
    marginLeft: 8,
  },
  quantitySelectorLabel: {
    color: colors.gray900,
    fontWeight: '500',
    fontSize: 12,
  },
  quantityButton: {
    paddingHorizontal: 10,
  },
  quantity: {
    fontSize: 16,
  },
  quantitySelectorInactive: {
    opacity: 0.4,
  },
  quantitySelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  quantitySelectorControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  performanceItemContent: {
    fontSize: 10,
    lineHeight: 12,
    color: '#000000',
    textAlign: 'center',
  },
  performanceItem: {
    flexGrow: 1,
    backgroundColor: colors.gray200,
    paddingVertical: 8,
    paddingHorizontal: 2,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  filmPrice: {
    textAlign: 'left',
    fontSize: 14,
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 4,
    color: colors.black,
  },
  performance: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  dealsContainer: {
    marginBottom: getStatusBarHeight(true) > 20 ? 80 + 32 : 64 + 32,
  },
  description: {
    fontSize: 13,
    lineHeight: 16,
    color: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 32,
    textAlign: 'left',
    marginBottom: 16,
  },
  descriptionLabel: {
    textAlign: 'center',
    color: colors.accent,
    marginTop: 24,
    marginBottom: 16,
    fontSize: 16,
  },
  mainSectionContentContainer: {
    flexGrow: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  mainSectionContent: {
    flex: 1,
  },
  mainSectionInner: {
    flex: 1,
    backgroundColor: colors.white,
  },
  mainSection: {
    flex: 1,
    backgroundColor: colors.white,
    overflow: 'hidden',
    borderTopLeftRadius: 64,
    borderTopRightRadius: 64,
  },
  metaText: {
    color: colors.white,
    fontSize: 14,
    marginRight: 4,
  },
  metaIcon: {
    marginRight: 4,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: colors.white,
    fontSize: 18,
    lineHeight: 22,
    marginBottom: 8,
  },
  titleContainer: {
    height: height * 0.35,
    justifyContent: 'flex-end',
    paddingHorizontal: 32,
    paddingTop: 24,
  },
  container: {
    flex: 1,
  },
  backgroundImageContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    height: 0,
  },
  backgroundVeil: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    width: width,
    height: height * 0.5,
  },
  backgroundImage: {
    resizeMode: 'cover',
    width: width,
    height: height * 0.5,
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
  watermark: {
    position: 'absolute',
    right: 0,
    top: 64,
    width: width * 0.8,
    height: (width * 0.8) / (480 / 406),
    resizeMode: 'stretch',
  },
});

export default withCart(CinemasFilm);
