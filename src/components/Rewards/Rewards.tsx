import React from 'react';
import {RewardsProps, RewardsState} from './interfaces';
import Screen from 'components/Screen/Screen';
import {
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  NativeSyntheticEvent,
  ScrollView,
  FlatList,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import ViewPager, {
  ViewPagerOnPageSelectedEventData,
} from '@react-native-community/viewpager';
import {getStatusBarHeight} from 'react-native-status-bar-height';
import colors from 'configs/colors';
import Text from 'components/Text/Text';
import {rgba, sleep} from 'utils/Misc';
import BottomSafeArea from 'components/BottomSafeArea/BottomSafeArea';
import GetTotalPoints from 'api/GetTotalPoints';
import {withUser} from 'contexts/UserContext';
import Axios, {Canceler} from 'axios';
import Spinner from 'components/Spinner/Spinner';
import GetPointsHistory, {PointsHistoryItem} from 'api/GetPointsHistory';
import VectorIcon from 'components/VectorIcon/VectorIcon';
const coinImage = require('../../assets/rewards/reward-188x210.jpg');
const coinImageDimension = 164 / 151;
const coinImageWithPercentage = 144 / 375;
const {width} = Dimensions.get('window');

class Rewards extends React.Component<RewardsProps, RewardsState> {
  static navigationOptions = () => {
    return {
      headerTitle: 'Rewards',
      headerTintColor: colors.gray600,
      headerTitleContainerStyle: styles.headerContainer,
      headerTransparent: true,
      headerStyle: styles.header,
      headerTitleStyle: styles.headerTitle,
      headerBackTitle: ' ',
      headerRight: <Text />,
    };
  };

  viewpager: ViewPager | null = null;

  cancelGetPoints?: Canceler;
  cancelGetHistory?: Canceler;

  state: RewardsState = {
    currentTab: 0,
    points: null,
    isPending: false,
    isListPending: false,
    listErrorMessage: null,
    history: [],
  };

  componentDidMount() {
    this.getCoins();
    this.getHistory();
  }

  componentWillUnmount() {
    if (this.cancelGetPoints) {
      this.cancelGetPoints();
    }
    if (this.cancelGetHistory) {
      this.cancelGetHistory();
    }
  }

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
      this.viewpager.setPage(index);
    }
  };

  getActivityStatusColor = (type: 'add' | 'remove') => {
    if (type === 'remove') {
      return colors.danger;
    }
    return colors.success;
  };

  getCoins = async () => {
    try {
      this.setState({isPending: true});
      await sleep(100);
      const points = await GetTotalPoints({canceler: this.cancelGetPoints});
      this.setState({points: points, isPending: false});
    } catch (e) {
      if (Axios.isCancel(e) || e.message === 'cancelled') {
        return;
      }
      this.setState({isPending: false});
    }
  };

  getHistory = async () => {
    try {
      this.setState({isListPending: true, listErrorMessage: null});
      await sleep(100);
      const history = await GetPointsHistory({canceler: this.cancelGetHistory});
      this.setState({history: history, isListPending: false});
    } catch (e) {
      if (Axios.isCancel(e) || e.message === 'cancelled') {
        return;
      }
      let errorMessage = e.message;
      if (e.response && e.response.data) {
        errorMessage = e.response.data.message;
      }
      if (/network/gi.test(errorMessage)) {
        errorMessage = 'Please check your internet connection and try again.';
      }
      this.setState({
        isListPending: false,
        listErrorMessage: errorMessage,
      });
    }
  };

  render() {
    return (
      <Screen backgroundColor="#fbf5f6">
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.imageContainer}>
              <Image
                source={coinImage}
                style={styles.coinImage}
                resizeMode="stretch"
              />
            </View>
            {this.renderPoints()}
            <View style={styles.navigations}>{navs.map(this.renderNav)}</View>
            <ViewPager
              ref={ref => (this.viewpager = ref)}
              initialPage={0}
              style={styles.viewpager}
              onPageSelected={this.handlePageSelected}>
              {this.renderActivities()}
              {/* {this.renderEarn()} */}
              {/* {this.renderUse()} */}
            </ViewPager>
          </View>
        </View>
      </Screen>
    );
  }

  renderPoints() {
    const {points, isPending} = this.state;
    if (!isPending && typeof points !== 'number') {
      return (
        <View style={styles.coins}>
          <Text style={styles.coinsNumberError}>
            <Text>Failed to load your coins, {'\n'}</Text>
            <Text style={{color: colors.accent}} onPress={this.getCoins}>
              Try again
            </Text>
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.coins}>
        {isPending ? (
          <View style={styles.coinsNumberSpinner}>
            <Spinner color={colors.black} size='small' />
          </View>
        ) : (
          <Text style={styles.coinsNumber}>{points}</Text>
        )}
        <Text
          light
          style={[styles.coinsLabel, isPending ? {marginBottom: 0} : {}]}>
          Coins
        </Text>
      </View>
    );
  }

  renderNav = (nav: string, index: number) => {
    const {currentTab} = this.state;
    return (
      <TouchableWithoutFeedback
        key={index}
        onPress={() => this.handleSelectPage(index)}>
        <View style={styles.navigationItem}>
          <Text
            style={[
              styles.navigationItemText,
              index === currentTab ? styles.navigationItemTextActive : {},
            ]}>
            {nav}
          </Text>
          <View
            style={[
              styles.activeIndicator,
              currentTab === index ? styles.activeIndicatorActive : {},
            ]}
          />
        </View>
      </TouchableWithoutFeedback>
    );
  };

  renderActivities() {
    const {history} = this.state;
    return (
      <View style={styles.viewpagerPage}>
        <FlatList
          renderItem={this.renderActivity}
          data={history}
          keyExtractor={item => item.id}
          ListHeaderComponent={this.renderActivitiesHeader}
          ListEmptyComponent={this.renderActivitiesEmpty}
          ListFooterComponent={this.renderActivitiesFooter}
        />
      </View>
    );
  }

  renderActivitiesEmpty = () => {
    const {isListPending, listErrorMessage} = this.state;
    if (isListPending || listErrorMessage) {
      return null;
    }
    return (
      <Text style={styles.emptyListMessage}>
        You have no points activity yet.
      </Text>
    );
  };

  renderActivitiesHeader = () => {
    const {isListPending, listErrorMessage} = this.state;
    if (isListPending) {
      return (
        <View style={styles.listLoaderContainer}>
          <Spinner />
        </View>
      );
    }
    if (listErrorMessage) {
      return (
        <View style={styles.listError}>
          <VectorIcon name="md-alert" size={24} color={colors.gray700} />
          <Text style={styles.listErrorMessage}>
            {typeof listErrorMessage === 'string'
              ? listErrorMessage
              : 'An error occurred, please try again.'}
          </Text>
          <TouchableWithoutFeedback onPress={this.getHistory}>
            <Text style={styles.listErrorMessageTryAgain}>Try Again</Text>
          </TouchableWithoutFeedback>
        </View>
      );
    }
    return null;
  };

  renderActivitiesFooter = () => {
    return <BottomSafeArea />;
  };

  renderActivity = (props: {item: PointsHistoryItem; index: number}) => {
    const {item} = props;
    const dt = new Date(item.createdAt);
    return (
      <TouchableWithoutFeedback>
        <View style={styles.activity}>
          <View style={styles.activityInner}>
            <View style={styles.activityImageContainer}>
              <View style={styles.activityImageContainerInner} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activeTitle}>
                {item.action === 'add' ? 'ADDED' : 'USED'}
              </Text>
              <Text style={styles.activeDate}>
                {DAYS[dt.getDay()] +
                  ' ' +
                  dt.getDate() +
                  ' ' +
                  MONTHS[dt.getMonth()] +
                  ', ' +
                  dt.getFullYear()}
              </Text>
            </View>
            <Text
              style={[
                styles.activityPoints,
                {color: item.action === 'add' ? colors.success : colors.danger},
              ]}>
              {item.point} Points
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  renderEarn() {
    return (
      <View style={styles.viewpagerPage}>
        <ScrollView
          style={styles.viewpagerPageContent}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.earnText} light>
            - Lorem Ipsum is simply dummy text of the printing and typesetting
            industry. Lorem Ipsum has been the industry's standard dummy text
          </Text>
          <Text style={styles.earnText} light>
            - Ever since the 1500s, when an unknown printer took a galley of
            type and scrambled it to make a type specimen book. It has survived
            not only five centuries, but also the leap into electronic
            typesetting.
          </Text>
          <Text style={styles.earnText} light>
            - Remaining essentially unchanged. It was popularised in the 1960s
            with the release of Letraset sheets containing
          </Text>
          <Text style={styles.earnText} light>
            - Lorem Ipsum passages, and more recently with desktop publishing
            software like Aldus PageMaker including versions of Lorem I
          </Text>
          <BottomSafeArea />
        </ScrollView>
      </View>
    );
  }

  renderUse() {
    return (
      <View style={styles.viewpagerPage}>
        <ScrollView
          style={styles.viewpagerPageContent}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.earnText} light>
            - Lorem Ipsum is simply dummy text of the printing and typesetting
            industry. Lorem Ipsum has been the industry's standard dummy text
          </Text>
          <Text style={styles.earnText} light>
            - Ever since the 1500s, when an unknown printer took a galley of
            type and scrambled it to make a type specimen book. It has survived
            not only five centuries, but also the leap into electronic
            typesetting.
          </Text>
          <Text style={styles.earnText} light>
            - Remaining essentially unchanged. It was popularised in the 1960s
            with the release of Letraset sheets containing
          </Text>
          <Text style={styles.earnText} light>
            - Lorem Ipsum passages, and more recently with desktop publishing
            software like Aldus PageMaker including versions of Lorem I
          </Text>
          <BottomSafeArea />
        </ScrollView>
      </View>
    );
  }
}

const navs = [
  // "Activities",
  // "Earn Points",
  // "Use Points"
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
];

const styles = StyleSheet.create({
  listErrorMessageTryAgain: {
    padding: 16,
    color: colors.accent,
    fontSize: 12,
  },
  listErrorMessage: {
    marginTop: 8,
    textAlign: 'center',
    color: colors.gray700,
    fontSize: 14,
  },
  listError: {
    alignItems: 'center',
    marginVertical: 32,
    marginHorizontal: 32,
  },
  emptyListMessage: {
    marginVertical: 32,
    textAlign: 'center',
    color: colors.gray700,
    fontSize: 12,
  },
  listLoaderContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  coinsLabel: {
    color: colors.black,
    fontSize: 14,
    marginBottom: 6,
  },
  coinsNumberError: {
    color: colors.black,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  coinsNumberSpinner: {
    marginRight: 8,
  },
  coinsNumber: {
    color: colors.black,
    fontSize: 28,
    marginRight: 4,
  },
  coins: {
    textAlign: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 18,
  },
  activityPoints: {
    fontSize: 10,
  },
  activeDate: {
    color: rgba(colors.black, 0.64),
    fontSize: 8,
  },
  activeTitle: {
    color: colors.black,
    fontSize: 10,
    marginBottom: 2,
  },
  activityContent: {
    flex: 1,
  },
  activityImage: {
    width: 24,
    height: 24,
    resizeMode: 'cover',
  },
  activityImageContainerInner: {
    width: 24,
    height: 24,
    borderRadius: 24 / 2,
    backgroundColor: colors.grayBlue200,
  },
  activityImageContainer: {
    width: 24,
    height: 24,
    overflow: 'hidden',
    marginRight: 8,
  },
  activityInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: rgba('#95979797', 0.5),
  },
  activity: {
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderColor: rgba('#95979797', 0.5),
    marginHorizontal: 32,
    marginVertical: 8,
    ...Platform.select({
      android: {},
      ios: {borderRadius: 8},
    }),
  },
  viewpagerPageContent: {
    paddingHorizontal: 32,
    marginTop: 8,
  },
  earnText: {
    fontSize: 13,
    color: colors.black,
    marginBottom: 16,
  },
  activeIndicatorActive: {
    backgroundColor: colors.accent,
    height: 3,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    right: 0,
    height: 2,
    backgroundColor: rgba('#979797', 0.28),
  },
  navigationItemTextActive: {
    color: colors.black,
  },
  navigationItemText: {
    color: '#828282',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 8,
  },
  navigationItem: {
    flex: 1,
  },
  navigations: {
    flexDirection: 'row',
    marginHorizontal: 32,
  },
  coinImage: {
    height: width * coinImageWithPercentage * coinImageDimension,
    width: width * coinImageWithPercentage,
    resizeMode: 'stretch',
  },
  imageContainer: {
    marginTop: 48,
    alignItems: 'center',
    marginBottom: 16,
  },
  viewpagerPage: {
    flex: 1,
  },
  viewpager: {
    flex: 1,
  },
  content: {
    flex: 1,
    borderTopLeftRadius: 64,
    borderTopRightRadius: 64,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    marginTop: getStatusBarHeight(true) + 56,
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
});

export default withUser(Rewards);
