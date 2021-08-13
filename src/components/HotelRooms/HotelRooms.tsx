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
import Screen from 'components/Screen/Screen';
import colors from 'configs/colors';
import Text from 'components/Text/Text';
import DealsSlider from 'components/DealsSlider/DealsSlider';
import HotelAvailabilityForm from 'components/HotalAvaialabilityForm/HotalAvaialabilityForm';
import {HotelRoomsState, HotelRoomsProps} from './interfaces';
import {displayAmount, sleep, padNumber} from 'utils/Misc';
import {getStatusBarHeight} from 'react-native-status-bar-height';
import AvailableRoomsApi, {Room} from 'api/AvailableRooms.api';
import Spinner from 'components/Spinner/Spinner';
const bgImage = require('../../assets/hotels/hotel-image-375x307.jpg');
const hotelRoomImage = require('../../assets/hotels/hotel-room-375x333.jpg');
const bgImageDimension = 375 / 307;
const {width} = Dimensions.get('window');
const hotelWidth = (width - 80 - 32) / 2;

class HotelRooms extends React.Component<HotelRoomsProps, HotelRoomsState> {
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

  state: HotelRoomsState = {
    isPending: false,
    list: [],
    errorMessage: null,
    hasSearched: false,
    arrival: null,
    departure: null,
    quantity: 0,
  };

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  isToday(d: Date) {
    const today = new Date();
    const todaysDate = today.getFullYear() + today.getMonth() + today.getDate();
    const dDate = d.getFullYear() + d.getMonth() + d.getDate();
    return todaysDate === dDate;
  }

  convertDate = (date: Date): string => {
    return (
      date.getFullYear() +
      '-' +
      padNumber(date.getMonth() + 1) +
      '-' +
      padNumber(date.getDate()) +
      'T00:00:00' +
      // date.getTimezoneOffset() +
      '-05:00'
    );
  };

  handleCheckAvailability = async (data: {
    arrivalDate: Date;
    departureDate: Date;
    rooms: number;
  }) => {
    const {navigation} = this.props;
    const hotel = navigation.getParam('hotel');
    if (!hotel) {
      return navigation.goBack();
    }
    this.setState({
      isPending: true,
      list: [],
      errorMessage: null,
      hasSearched: true,
    });
    await sleep(100);
    const result = await AvailableRoomsApi(
      hotel.id,
      this.convertDate(data.arrivalDate),
      this.convertDate(data.departureDate),
      data.rooms || 1,
    );
    // don't update if component has already unmounted
    if (!this.mounted) {
      return;
    }
    let errorMessage = '';
    if (!result.success) {
      errorMessage = result.message || 'An unknown error occurred.';
      if (/network|internet connection/i.test(errorMessage)) {
        errorMessage = 'Please check your internet connection and try agaon.';
      }
    }
    this.setState(({list}) => ({
      isPending: false,
      errorMessage: errorMessage.trim().length ? errorMessage : null,
      list: result.data && result.data.length ? result.data : list,
      arrival: data.arrivalDate,
      departure: data.departureDate,
      quantity: data.rooms,
    }));
  };

  handleSelectRoom = (room: Room) => {
    const {navigation} = this.props;
    const {quantity, arrival, departure} = this.state;
    const hotel = navigation.getParam('hotel');
    navigation.navigate('HotelRoom', {
      room,
      hotel,
      roomConfig: {
        quantity,
        arrival,
        departure,
      },
    });
  };

  render() {
    const {navigation} = this.props;
    const {list} = this.state;
    const hotel = navigation.getParam('hotel');
    if (!hotel) {
      return;
    }
    return (
      <Screen
        statusBarColor={Platform.OS === 'ios' ? colors.gray900 : undefined}>
        <View style={styles.container}>
          {this.renderBackgroundImage()}
          <View style={styles.mainContent}>
            <View style={styles.titleSection}>
              <Text style={styles.heading} light>
                Welcome To
              </Text>
              <Text style={styles.subheading} bold>
                {hotel.name}
              </Text>
              <Text style={styles.subAddress} light>
                {hotel.address}
              </Text>
            </View>
            <View style={styles.contentSection}>
              <View style={styles.contentSectionInner}>
                <FlatList
                  style={styles.content}
                  data={list}
                  renderItem={this.renderItem}
                  keyExtractor={room => String(room.code)}
                  ListEmptyComponent={this.renderContentEmpty()}
                  ListHeaderComponent={this.renderContentHeader}
                  ListFooterComponent={this.renderContentFooter}
                  numColumns={2}
                />
              </View>
            </View>
            <View style={styles.searchBox}>
              <View style={styles.searchBoxBg} />
              <View style={styles.searchBoxContent}>
                <HotelAvailabilityForm
                  onSubmit={this.handleCheckAvailability}
                />
              </View>
            </View>
          </View>
        </View>
      </Screen>
    );
  }

  renderContentEmpty = () => {
    const {errorMessage, isPending, hasSearched} = this.state;
    if (!errorMessage && !isPending && !hasSearched) {
      return (
        <Text style={styles.searchDirection}>
          Please use the form above to find availble roooms at this hotel.
        </Text>
      );
    }
    if (!errorMessage && !isPending && hasSearched) {
      return (
        <Text style={styles.searchDirection}>
          There are currently no available rooms within this time.
          {/* Your rooms search returned an empty result. */}
        </Text>
      );
    }
    return null;
  };

  renderContentHeader = () => {
    const {errorMessage} = this.state;
    return (
      <>
        <View style={styles.contentHeader}>
          <Text bold style={styles.hotelsHeading}>
            Our Rooms
          </Text>
        </View>
        {errorMessage ? (
          <View style={styles.errorMessageContainer}>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
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

  renderItem = (props: {item: Room; index: number}) => {
    const {item, index} = props;
    const image =
      item.images && item.images.length
        ? {uri: item.images[0]}
        : hotelRoomImage;
    return (
      <View
        key={index}
        style={[styles.hotel, index % 2 < 1 ? {marginLeft: 40} : {}]}>
        <TouchableWithoutFeedback onPress={() => this.handleSelectRoom(item)}>
          <View style={styles.hotelInner}>
            <View style={styles.hotelRoomImageContainer}>
              <Image
                source={image}
                resizeMode="cover"
                style={styles.hotelRoomImage}
              />
            </View>
            <Text style={styles.hotelName} light>
              {item.name}
            </Text>
            <View style={styles.bottomLine} />
            <View style={styles.price}>
              <Text style={styles.priceLabel}>
                {displayAmount(item.rates[0].rate)}
              </Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  };

  renderBackgroundImage() {
    const {navigation} = this.props;
    const hotel = navigation.getParam('hotel');
    return (
      <View style={styles.bgImageContainer}>
        <Image
          source={hotel ? {uri: hotel.image} : bgImage}
          resizeMode="cover"
          style={styles.bgImage}
        />
        <View style={styles.bgImageVeil} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  searchDirection: {
    textAlign: 'center',
    paddingHorizontal: 24,
    color: colors.gray500,
    fontSize: 18,
    marginBottom: 4,
    marginTop: 24,
  },
  loadingContainer: {
    marginBottom: 8,
    marginTop: 24,
  },
  errorMessage: {
    textAlign: 'center',
    color: colors.gray500,
    fontSize: 14,
    marginBottom: 4,
    marginTop: 24,
    paddingHorizontal: 24,
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
    marginBottom: 8,
  },
  priceLabel: {
    color: colors.white,
    fontSize: 12,
  },
  price: {
    position: 'absolute',
    right: 0,
    top: 16,
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: colors.accent,
  },
  hotelRoomImageContainer: {
    width: hotelWidth - 32,
    height: (hotelWidth - 32) / bgImageDimension,
    marginBottom: 8,
    overflow: 'hidden',
    borderRadius: 12,
  },
  hotelRoomImage: {
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
      android: {},
      ios: {
        overflow: 'hidden',
        borderRadius: 12,
      },
    }),
  },
  hotel: {
    marginHorizontal: 16,
    marginVertical: 16,
    width: hotelWidth,
    backgroundColor: colors.white,
    borderRadius: 12,
    ...Platform.select({
      android: {
        overflow: 'hidden',
      },
      ios: {},
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
    marginTop: 35,
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
    top: width / bgImageDimension - 96 - 35,
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
  heading: {
    fontSize: 14,
    lineHeight: 18,
    color: '#ffffff',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 22,
    color: colors.white,
    fontWeight:"bold",
  },
  subAddress:{
    fontSize:12,
    color: colors.white,
    fontWeight:"500",    
  },
  titleSection: {
    height: width / bgImageDimension - 96,
    paddingHorizontal: 40,
    justifyContent: 'flex-end',
    paddingBottom: 72,
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

export default HotelRooms;
