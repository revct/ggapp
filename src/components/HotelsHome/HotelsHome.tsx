import React from 'react';
import {
  StyleSheet,
  View,
  Image,
  Dimensions,
  FlatList,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import {HotelsHomeProps, HotelsHomeState} from './interfaces';
import Screen from 'components/Screen/Screen';
import colors from 'configs/colors';
import Text from 'components/Text/Text';
import DealsSlider from 'components/DealsSlider/DealsSlider';
import {getStatusBarHeight} from 'react-native-status-bar-height';
import {sleep} from 'utils/Misc';
import HotelsApi, {Hotel} from 'api/Hotels.api';
import Spinner from 'components/Spinner/Spinner';
const bgImage = require('../../assets/hotels/hotel-home-image-375x307.jpg');
const bgImageDimension = 375 / 307;
const {width} = Dimensions.get('window');
const hotelWidth = (width - 80 - 32) / 2;

class HotelsHome extends React.Component<HotelsHomeProps, HotelsHomeState> {
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

  mounted: boolean = false;

  state: HotelsHomeState = {
    errorMessage: null,
    isPending: false,
    list: [],
    title: '',
    subtitle: '',
    backgroundImage: null,
  };

  componentDidMount() {
    this.mounted = true;
    this.fetch();
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  fetch = async () => {
    this.setState({
      isPending: true,
      errorMessage: null,
    });
    await sleep(100);
    const res = await HotelsApi();
    if (!this.mounted) {
      return;
    }
    if (!res.data) {
      return this.setState({
        isPending: false,
        errorMessage: res.message || 'An error occured, please try again.',
      });
    }
    this.setState({
      isPending: false,
      list: res.data.hotels || [],
      title: res.data.title,
      subtitle: res.data.sub_title,
      backgroundImage: res.data.background_image,
    });
  };

  handleSelectHotel(hotel: {name: String}) {
    const {navigation} = this.props;
    navigation.navigate('HotelRooms', {hotel: hotel});
  }

  render() {
    const {list, title, subtitle} = this.state;
    return (
      <Screen
        statusBarColor={Platform.OS === 'ios' ? colors.gray900 : undefined}>
        <View style={styles.container}>
          {this.renderBackgroundImage()}
          <View style={styles.mainContent}>
            <View style={styles.titleSection}>
              <Text style={styles.heading} bold>
                {title}
              </Text>
              <Text style={styles.subheading} light>
                {subtitle}
              </Text>
            </View>
            <View style={styles.contentSection}>
              <View style={styles.contentSectionInner}>
                <FlatList
                  style={styles.content}
                  data={list}
                  renderItem={this.renderItem}
                  keyExtractor={item => String(item.id)}
                  ListHeaderComponent={this.renderContentHeader}
                  ListFooterComponent={this.renderContentFooter}
                  numColumns={2}
                />
              </View>
            </View>
          </View>
        </View>
      </Screen>
    );
  }

  renderContentHeader = () => {
    const {errorMessage} = this.state;
    return (
      <>
        <View style={styles.contentHeader}>
          <Text bold style={styles.hotelsHeading}>
            Our Hotels
          </Text>
        </View>
        {errorMessage ? (
          <View style={styles.errorMessageContainer}>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            <TouchableWithoutFeedback onPress={this.fetch}>
              <View style={styles.tryAgainButton}>
                <Text style={styles.tryAgainButtonText}>Try Again</Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        ) : null}
      </>
    );
  };

  renderContentFooter = () => {
    const {isPending} = this.state;
    return (
      <>
        {isPending ? (
          <View style={styles.loadingContainer}>
            <Spinner />
          </View>
        ) : null}
        <View style={styles.dealsSliderContainer}>
          <DealsSlider />
        </View>
      </>
    );
  };

  renderItem = (props: {item: Hotel; index: number}) => {
    const {item, index} = props;
    return (
      <View
        key={index}
        style={[
          styles.hotel,
          index % 2 < 1 ? {marginLeft: 40} : {},
          index === 1 ? {marginRight: 0} : {},
        ]}>
        <TouchableWithoutFeedback onPress={() => this.handleSelectHotel(item)}>
          <View style={styles.hotelInner}>
            <View style={styles.hotelImageContainer}>
              <Image
                source={{uri: item.image}}
                resizeMode="cover"
                style={styles.hotelImage}
              />
            </View>
            <Text style={styles.hotelName} light>
              {item.name}
            </Text>
            <Text style={styles.hotelLocation} light>
              {item.location}
            </Text>
            <View style={styles.bottomLine} />
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  };

  renderBackgroundImage() {
    const {backgroundImage} = this.state;
    return (
      <View style={styles.bgImageContainer}>
        {backgroundImage ? (
          <Image
            source={{uri: backgroundImage}}
            resizeMode="cover"
            style={styles.bgImage}
          />
        ) : null}
        <View style={styles.bgImageVeil} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  tryAgainButtonText: {
    color: colors.accent,
    fontSize: 12,
  },
  tryAgainButton: {
    backgroundColor: colors.white,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  errorMessage: {
    textAlign: 'center',
    color: colors.gray500,
    fontSize: 14,
    marginBottom: 4,
    marginTop: 24,
  },
  errorMessageContainer: {
    alignItems: 'center',
  },
  bottomLine: {
    backgroundColor: colors.accent,
    height: 3,
    width: 32,
  },
  hotelName: {
    color: colors.black,
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 4,
  },
  hotelLocation:{
    color: colors.gray600,
    textAlign: 'center',
    fontSize: 8,
    marginBottom: 8,
  },
  hotelImageContainer: {
    width: hotelWidth - 32,
    height: (hotelWidth - 32) / bgImageDimension,
    marginBottom: 8,
    overflow: 'hidden',
    borderRadius: 12,
  },
  hotelImage: {
    resizeMode: 'cover',
    width: hotelWidth - 32,
    height: (hotelWidth - 32) / bgImageDimension,
  },
  hotelInner: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        overflow: 'hidden',
        borderRadius: 12,
      },
      android: {},
    }),
  },
  hotel: {
    marginHorizontal: 16,
    marginVertical: 16,
    width: hotelWidth,
    backgroundColor: colors.white,
    borderRadius: 12,
    ...Platform.select({
      ios: {},
      android: {overflow: 'hidden'},
    }),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  hotelsRow: {
    paddingHorizontal: 40,
    flexDirection: 'row',
    marginVertical: 16,
  },
  hotelsHeading: {
    fontSize: 16,
    textAlign: 'center',
    color: colors.accent,
    marginTop: 32,
  },
  contentHeader: {
    // marginTop: 35,
  },
  loadingContainer: {
    marginBottom: 8,
    marginTop: 24,
  },
  dealsSliderContainer: {
    marginBottom: getStatusBarHeight(true) > 20 ? 80 + 32 : 64 + 32,
  },
  contentContainer: {
    flexGrow: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
  searchBoxContent: {
    flex: 1,
    height: 70,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  searchBoxBg: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    ...Platform.select({
      android: {},
      ios: {borderRadius: 5},
    }),
  },
  searchBox: {
    ...Platform.select({
      android: {overflow: 'hidden'},
      ios: {},
    }),
    position: 'absolute',
    left: 40,
    right: 40,
    top: width / bgImageDimension - 64 - 35,
    height: 70,
    backgroundColor: colors.white,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  contentSectionInner: {
    flex: 1,
    backgroundColor: colors.white,
  },
  contentSection: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderTopLeftRadius: 64,
    borderTopRightRadius: 64,
  },
  subheading: {
    fontSize: 14,
    lineHeight: 18,
    color: '#ffffff',
  },
  heading: {
    fontSize: 19,
    color: colors.white,
    marginBottom: 16,
  },
  titleSection: {
    height: width / bgImageDimension - 64,
    paddingHorizontal: 40,
    justifyContent: 'center',
  },
  mainContent: {
    flex: 1,
  },
  bgImageVeil: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  bgImage: {
    width: width,
    height: width / bgImageDimension,
    resizeMode: 'cover',
  },
  bgImageContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: width,
    height: width / bgImageDimension,
  },
  container: {
    flex: 1,
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

export default HotelsHome;
