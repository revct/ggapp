import React from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  Image,
  TouchableWithoutFeedback,
  NativeSyntheticEvent,
} from 'react-native';
import {CinemasHomeProps, CinemasHomeState} from './interface';
import Screen from 'components/Screen/Screen';
import Spinner from 'components/Spinner/Spinner';
import colors from 'configs/colors';
import {NavigationEventSubscription, ScrollView} from 'react-navigation';
import Axios, {Canceler} from 'axios';
import Carousel from 'react-native-snap-carousel';
import LinearGradient from 'react-native-linear-gradient';
import Text from 'components/Text/Text';
import {getStatusBarHeight} from 'react-native-status-bar-height';
import DealsSlider from 'components/DealsSlider/DealsSlider';
import {getNumberNth, DAYS} from 'utils/Misc';
import ViewPager, {
  ViewPagerOnPageSelectedEventData,
} from '@react-native-community/viewpager';
import PerformanceCarousel from 'components/PerformanceCarousel/PerformanceCarousel';
import FetchPerformanceList, {Performance} from 'api/FetchPerformanceList';
import CinemaSelector from 'components/CinemaSelector/CinemaSelector';
import {Cinema} from 'api/FetchCinemas';
import Logger from 'utils/Logger';
import RemoteConfigApi, {SuspensionNotice} from 'api/RemoteConfig.api';
import CinemasTokenApi from '../../api/CinemasToken.api';
import { CINEMAS_API_URL } from 'configs/api';


const placeholderFilmImage = require('../../assets/cinemas/placeholder-film.png');
const watermark = require('../../assets/home/watermark-480x406.png');
const {width} = Dimensions.get('screen');
const featuredCarouselItemWidth = width / (375 / 162);
const featuredCarouselItemHeight = featuredCarouselItemWidth * (206 / 162);

class CinemasHome extends React.Component<CinemasHomeProps, CinemasHomeState> {
  static navigationOptions = () => ({
    headerTitle: 'Movies',
    headerTintColor: colors.gray600,
    headerTitleContainerStyle: styles.headerContainer,
    headerTransparent: true,
    headerStyle: styles.header,
    headerTitleStyle: styles.headerTitle,
    headerBackTitle: ' ',
    headerRight: <Text />,
  });

  state: CinemasHomeState = {
    isFetching: false,
    featured: [],
    errorMessage: null,
    currentTab: 0,
    cinema: null,
    filmList:[],
  };

  viewpager: ViewPager | null = null;

  didFocus?: NavigationEventSubscription;

  mounted = false;

  schedules: Array<{day: string; date: Date}> = [];

  canceler?: Canceler;

  timeout: any;

  constructor(props: CinemasHomeProps) {
    super(props);
    this.setSchedules();
  }

  componentDidMount() {
    const {navigation} = this.props;
    this.mounted = true;
    this.fetchSuspensionNotice();
    this.didFocus = navigation.addListener('didFocus', this.handleDidFocus);
  }

  componentWillUnmount() {
    // set to unmounted
    this.mounted = false;
    // remove focus event listener
    if (this.didFocus) {
      this.didFocus.remove();
    }
    // cancel fetch
    if (this.canceler) {
      this.canceler();
    }
  }

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
      getNumberNth(this.schedules[2].date.getDate());
    // create fourth day
    this.schedules.push({
      day: 'Day Four',
      date: new Date(this.schedules[2].date.getTime() + twentyFourHoursMs),
    });
    this.schedules[3].day =
      DAYS[this.schedules[3].date.getDay()] +
      ', ' +
      getNumberNth(this.schedules[3].date.getDate());
  };

  fetchSuspensionNotice = async () => {
    const {suspensionNotice} = this.state;
    if (suspensionNotice !== undefined) {
      return this.fetch();
    }
    try {
      const notices = await RemoteConfigApi<SuspensionNotice>(
        'suspension_notice',
      );
      this.setState({
        suspensionNotice: (notices && notices.cinema) || null,
      });
      this.fetch();
    } catch (e) {
      Logger(e);
    }
  };

  handleDidFocus = () => {
    // fetch films
    this.fetchSuspensionNotice();
  };

  handlePerformanceSelect = (item: Performance) => {
    const {cinema} = this.state;
    const {navigation} = this.props;
    if (!cinema) {
      return;
    }
    navigation.navigate('CinemasFilm', {id: item.id, cinema: cinema.tsite, filmList:this.state.filmList});
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

  handleCinemaChange = (cinema: Cinema) => {
    if (this.canceler) {
      this.canceler();
    }
    this.setState(
      {
        cinema: cinema,
        featured: [],
      },
      this.fetch,
    );
  };

  handleWillFetchMovies = () => {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(this.fetch, 100);
  };

  fetch = () => {
    this.fetchFilmList();
    const {isFetching, cinema} = this.state;
    if (!this.mounted || isFetching || !cinema) {
      return;
    }
    this.setState(
      {
        isFetching: true,
        errorMessage: null,
      },
      async () => {
        try {
          // get films
          const data = await FetchPerformanceList(
            {cinema: cinema.tsite},
            {canceler: this.canceler},
          );
          // update add data to component state
          this.setState({
            isFetching: false,
            featured: data.results.reduce(
              (all: Array<Performance>, item: Performance) => {
                // skip item if already there
                if (
                  all.findIndex(i => i.film.title === item.film.title) !== -1
                ) {
                  return all;
                }
                // add item to the list
                all.push(item);
                // return the list
                return all;
              },
              [],
            ),
          });
        } catch (e) {
          if (Axios.isCancel(e)) {
            return;
          }
          this.setState({
            isFetching: false,
            errorMessage: e.message,
          });
        }
      },
    );
  };


  fetchFilmList = async () => {
    try{
      const token = await CinemasTokenApi();
      let response = await Axios.get(`${CINEMAS_API_URL+ this.state.cinema.tsite +"/film/"}`,{
        headers:{
          Authorization: "Token "+ token.data,
        }
      })   
      // console.log(response.data)
      if(response.data.results){
        this.setState({
          filmList:response.data.results
        })
      }
    }catch(err){
      let errorMessage = "Could not get currently showing movies";
      this.setState({
        errorMessage: errorMessage,
      });
    }
      
  }



  render() {
    return (
      <Screen>
        {this.renderFeatured()}
        {this.renderSchedulesSection()}
      </Screen>
    );
  }

  renderFeatured() {
    const {navigation} = this.props;
    const {isFetching, featured, suspensionNotice} = this.state;

    if (suspensionNotice) {
      return (
        <View style={[styles.featuredSection, styles.featuredSectionNotice]}>
          <Text bold style={styles.notice}>
            {suspensionNotice}
          </Text>
        </View>
      );
    }

    // return null if no featured film was returned
    if (!isFetching && !featured.length) {
      return <View style={styles.featuredSection} />;
    }

    // display a loading indicator
    if (isFetching && !featured.length) {
      return (
        <View style={styles.featuredSection}>
          <View style={styles.featuredLoader}>
            <Spinner />
          </View>
        </View>
      );
    }

    // display a carusel of featured films
    return (
      <View style={styles.featuredSection}>
        <Carousel
          itemWidth={featuredCarouselItemWidth}
          itemHeight={featuredCarouselItemHeight}
          sliderWidth={width}
          data={featured}
          renderItem={this.renderFeaturedFilm}
          inactiveSlideOpacity={0.6}
          inactiveSlideScale={0.9}
          loop={featured.length > 1}
          autoplay={navigation.isFocused()}
          autoplayDelay={7000}
          autoplayInterval={7000}
        />
      </View>
    );
  }

  renderFeaturedFilm = (props: {item: Performance; index: number}) => {
    const {item} = props;
    const filmItem = this.state.filmList.find(film=>film.id==item.film.id);
    const imageUrl = filmItem? filmItem.imageurl.trim() : '';
    // const imageUrl = item.film.imageurl ? item.film.imageurl.trim() : '';
    return (
      <View style={styles.featuredFilm}>
        <TouchableWithoutFeedback
          onPress={() => this.handlePerformanceSelect(item)}>
          <View style={styles.featuredFilmContent}>
            <Image
              source={
                imageUrl && imageUrl !== 'n/a'
                  ? {uri: imageUrl}
                  : placeholderFilmImage
              }
              style={styles.featuredFilmImage}
              resizeMode="cover"
            />
            <View style={styles.featuredFilmMain}>
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)']}
                start={{x: 0.5, y: 0}}
                style={styles.featuredFilmInfo}>
                <Text style={styles.featuredFilmTitle}>{item.film.title}</Text>
                {item.film.synopsis.trim() ? (
                  <Text style={styles.featuredFilmSynopsis} numberOfLines={1}>
                    {item.film.synopsis}
                  </Text>
                ) : null}
              </LinearGradient>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  };

  renderSchedulesSection() {
    return (
      <View style={styles.scheduleSection}>
        <View style={styles.scheduleSectionInner}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {this.renderCinemaSelector()}
            {this.renderSchedules()}
            <View
              style={{
                marginBottom: getStatusBarHeight(true) > 20 ? 80 + 32 : 64 + 32,
              }}>
              <DealsSlider />
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  renderCinemaSelector() {
    return (
      <View style={styles.cinemaSelector}>
        <Text style={styles.cinemaSelectorText} bold>
          Select Cinema
        </Text>
        <View style={styles.cinemaSelectorList}>
          <CinemaSelector onChange={this.handleCinemaChange} />
        </View>
      </View>
    );
  }

  renderSchedules() {
    return (
      <View style={styles.scheduleSectionMain}>
        <Image source={watermark} style={styles.watermark} />
        <Text style={styles.scheduleSectionTitle}>Now Showing</Text>
        {this.renderScheduleTabNavs()}
        <ViewPager
          ref={ref => (this.viewpager = ref)}
          initialPage={0}
          style={styles.viewpager}
          onPageSelected={this.handlePageSelected}
          scrollEnabled={false}>
          {this.schedules.map(this.renderTab)}
        </ViewPager>
      </View>
    );
  }

  renderTab = (item: {day: string; date: Date}, index: number) => {
    const {cinema} = this.state;
    return (
      <View style={styles.tabs} key={index}>
        {cinema ? (
          <PerformanceCarousel
            onWillFetch={this.handleWillFetchMovies}
            date={item.date}
            onSelect={this.handlePerformanceSelect}
            cinema={cinema ? cinema.tsite : undefined}
          />
        ) : null}
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
}

const styles = StyleSheet.create({
  featuredSectionNotice: {
    justifyContent: 'center',
  },
  notice: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginHorizontal: 24,
  },
  cinemaSelectorList: {
    width: 156,
  },
  cinemaSelectorText: {
    textAlign: 'center',
    marginBottom: 8,
    color: colors.black,
    fontSize: 14,
  },
  cinemaSelector: {
    flex: 1,
    marginTop: 24,
    alignItems: 'center',
  },
  tabs: {
    flex: 1,
  },
  viewpager: {
    flex: 1,
    minHeight: 200,
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
  },
  loaderLabel: {
    color: colors.gray600,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  schedulesLoader: {
    marginTop: 16,
    alignItems: 'center',
  },
  errorRetryLabel: {
    color: colors.accent,
    fontSize: 12,
    textAlign: 'center',
    padding: 8,
  },
  errorMessageContainer: {
    alignItems: 'center',
  },
  errorMessage: {
    color: colors.gray600,
    textAlign: 'center',
    fontSize: 16,
    marginTop: 16,
  },
  scheduleSectionTitle: {
    color: colors.accent,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  scheduleSectionMain: {
    marginTop: 32,
    marginBottom: 16,
  },
  scheduleSectionContentContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    flexGrow: 1,
  },
  scheduleSectionInner: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  scheduleSection: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopRightRadius: 64,
    borderTopLeftRadius: 64,
    overflow: 'hidden',
  },
  headerContainer: {},
  header: {},
  headerTitle: {
    color: colors.black,
    fontWeight: '400',
    textAlign: 'center',
    alignSelf: 'center',
    flex: 1,
  },
  featuredSection: {
    height: featuredCarouselItemHeight + 32,
    paddingVertical: 16,
    marginTop: getStatusBarHeight(true) + 56,
  },
  featuredLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredFilm: {
    width: featuredCarouselItemWidth,
    padding: 8,
  },
  featuredFilmContent: {
    width: featuredCarouselItemWidth - 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  featuredFilmImage: {
    width: featuredCarouselItemWidth - 16,
    height: featuredCarouselItemHeight - 16,
    resizeMode: 'cover',
  },
  featuredFilmMain: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  featuredFilmInfo: {
    paddingVertical: 8,
    paddingBottom: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  featuredFilmTitle: {
    marginBottom: 4,
    color: colors.white,
    fontSize: 14,
    textAlign: 'center',
  },
  featuredFilmSynopsis: {
    color: colors.white,
    fontSize: 11,
    textAlign: 'center',
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

export default CinemasHome;
