import React from 'react';
import {
  StyleSheet,
  View,
  Image,
  Dimensions,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  FlatList,
} from 'react-native';
import Screen from 'components/Screen/Screen';
import colors from 'configs/colors';
import Text from 'components/Text/Text';
import DealsSlider from 'components/DealsSlider/DealsSlider';
import {displayAmount, thousand, padNumber} from 'utils/Misc';
import {HotelRoomProps, HotelRoomState} from './interfaces';
import VectorIcon from 'components/VectorIcon/VectorIcon';
import {
  Menu,
  MenuTrigger,
  MenuOptions,
  MenuOption,
} from 'react-native-popup-menu';
import DateTimePicker from '@react-native-community/datetimepicker';
import {getStatusBarHeight} from 'react-native-status-bar-height';
import Toast from 'utils/Toast';
import {withCart, CartItem} from 'contexts/CartContext';
const bgImage = require('../../assets/hotels/hotel-room-375x333.jpg');
const bgImageDimension = 375 / 307;
const {width} = Dimensions.get('window');

class HotelRoom extends React.Component<HotelRoomProps, HotelRoomState> {
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

  state: HotelRoomState = {
    quantity: 1,
    location: '',
    currentImage: null,
    arrivalDate: null,
    departureDate: null,
    selectDate: null,
  };

  today: Date;

  constructor(props: HotelRoomProps) {
    super(props);
    this.today = new Date();
  }

  componentDidMount() {
    this.initialize();
  }

  async initialize() {
    const {navigation} = this.props;
    const config = navigation.getParam('roomConfig');
    const room = navigation.getParam('room');
    const dataIsAvailable: boolean = await this.dataIsAvailable();
    if (!dataIsAvailable) {
      Toast.error('Please search and select room, then try again.');
      return navigation.goBack();
    }
    this.setState({
      quantity: config.quantity ? Number(config.quantity) : 1,
      arrivalDate: config.arrival,
      departureDate: config.departure,
      currentImage: room.images ? {uri: room.images[0]} : null,
    });
  }

  dataIsAvailable(): Promise<boolean> {
    const {navigation} = this.props;
    const config = navigation.getParam('roomConfig');
    const room = navigation.getParam('room');
    const hotel = navigation.getParam('hotel');
    if (!room || !config || !config.departure || !config.arrival || !hotel) {
      Toast.error('Please search and select room, then try again.');
      return Promise.resolve(false);
    }
    return Promise.resolve(true);
  }

  addToCart = async () => {
    const {cart, navigation} = this.props;
    const {quantity, arrivalDate, departureDate} = this.state;
    const hotel = navigation.getParam('hotel');
    const room = navigation.getParam('room');
    // check if all required information is available
    const dataIsAvailable: boolean = await this.dataIsAvailable();
    if (!dataIsAvailable) {
      Toast.error('Please search and select room, then try again.');
      return navigation.goBack();
    }
    // get create new cart item
    const cartItem: CartItem = {
      name: room.name,
      caption:
        this.friendlyDate(arrivalDate) +
        ' - ' +
        this.friendlyDate(departureDate),
      image: room.images ? room.images[0] : null,
      price: Number(room.rates[0].rate) * this.getNumberOfDays(),
      quantity: quantity,
      location: hotel.name,
      data: {
        days: this.getNumberOfDays(),
        arrival: arrivalDate,
        departure: departureDate,
        ...room,
        hotel: hotel,
      },
      type: 'room',
    };
    // add item to cart
    cart.add(cartItem);
  };

  getRatingStar = (rating: number): string => {
    if (rating >= 4.8) {
      return 'md-star';
    }
    if (rating >= 2) {
      return 'md-star-half';
    }
    return 'md-star-outline';
  };

  getNumberOfDays() {
    const {arrivalDate, departureDate} = this.state;
    if (!departureDate || !arrivalDate) {
      return 0;
    }
    // get difference between arrival and departure
    let days = departureDate.getTime() - arrivalDate.getTime();
    // convert to days
    days = Math.round(days / 1000 / (60 * 60 * 24));
    // return days
    return days < 1 ? 1 : days;
  }

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

  handleLocationSelect = (location: string) => {
    this.setState({
      location: location,
    });
  };

  handleDateSelected = (field: 'arrival' | 'departure', date?: Date) => {
    if (!date) {
      return this.setState({selectDate: null});
    }
    const newDate = new Date(date);
    if (field === 'arrival') {
      this.setState(({departureDate}) => ({
        arrivalDate: newDate,
        departureDate:
          departureDate && departureDate.getTime() - newDate.getTime() < 1
            ? newDate
            : departureDate,
        selectDate: null,
      }));
    } else if (field === 'departure') {
      this.setState(({arrivalDate}) => ({
        departureDate: newDate,
        arrivalDate:
          arrivalDate && arrivalDate.getTime() > newDate.getTime()
            ? newDate
            : arrivalDate,
        selectDate: null,
      }));
    }
  };

  handleSelectDate = (field: 'arrival' | 'departure') => {
    this.today = new Date();
    this.setState({selectDate: field});
  };

  friendlyDate(date: Date | null) {
    if (!date) {
      return null;
    }
    return (
      padNumber(date.getDate()) +
      '/' +
      padNumber(date.getMonth() + 1) +
      '/' +
      date.getFullYear()
    );
  }

  priceMultiplier() {
    const {arrivalDate, departureDate} = this.state;
    if (!arrivalDate || !departureDate) {
      return 1;
    }
    const msPerDay = 60 * 60 * 24 * 1000;
    const days = departureDate.getTime() - arrivalDate.getTime();
    if (days < msPerDay) {
      return 1;
    }
    return Math.round(days / msPerDay) - 1;
  }

  render() {
    const {navigation} = this.props;
    const room = navigation.getParam('room');
    if (!room) {
      return null;
    }
    return (
      <Screen
        statusBarColor={Platform.OS === 'ios' ? colors.gray900 : undefined}>
        <View style={styles.container}>
          {this.renderBackgroundImage()}
          <View style={styles.mainContent}>
            {this.renderTopSection()}
            <View style={styles.contentSection}>
              <View style={styles.contentSectionInner}>
                <ScrollView
                  style={styles.content}
                  contentContainerStyle={styles.contentContainer}>
                  {this.renderContent()}
                  <View style={styles.dealsSliderContainer}>
                    <DealsSlider />
                  </View>
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
        {this.renderDatePicker()}
      </Screen>
    );
  }

  renderDatePicker() {
    const {selectDate, arrivalDate, departureDate} = this.state;
    const {navigation} = this.props;
    if (!navigation.isFocused() || !selectDate) {
      return;
    }
    if (Platform.OS === 'android') {
      return (
        <DateTimePicker
          value={
            selectDate === 'arrival'
              ? arrivalDate || this.today
              : selectDate === 'departure'
              ? departureDate || this.today
              : this.today
          }
          minimumDate={this.today}
          onChange={(ev, date) => this.handleDateSelected(selectDate, date)}
        />
      );
    }
    if (Platform.OS === 'ios') {
      return null;
    }
    return null;
  }

  renderTopSection() {
    const {navigation} = this.props;
    const room = navigation.getParam('room');
    return (
      <View style={styles.topSection}>
        <Text style={styles.heading} bold>
          {room.name}
        </Text>
        {/* {this.renderMetaInfo()} */}
        {room.images && room.images.length ? (
          <View>
            <FlatList
              data={room.images}
              renderItem={this.renderImageSlideItem}
              keyExtractor={(item, index) => String(index + item)}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>
        ) : null}
      </View>
    );
  }

  renderMetaInfo() {
    const rating = 4.3;
    return (
      <View style={styles.metaInfo}>
        <Text style={styles.metaText}>{rating}</Text>
        <VectorIcon
          name={this.getRatingStar(rating)}
          color={colors.white}
          size={16}
          style={styles.metaIcon}
        />
        <Text style={styles.metaText}>({thousand(10)})</Text>
        <Text style={styles.metaText}>+{60}</Text>
        <VectorIcon
          name={'ios-apps'}
          color={colors.white}
          size={16}
          style={styles.metaIcon}
        />
      </View>
    );
  }

  renderImageSlideItem = (props: {item: string; index: number}) => {
    return (
      <View style={styles.imageSlideItem}>
        <TouchableWithoutFeedback
          onPress={() => this.setState({currentImage: {uri: props.item}})}>
          <Image
            source={{uri: props.item}}
            resizeMode="cover"
            style={styles.imageSlideItemImage}
          />
        </TouchableWithoutFeedback>
      </View>
    );
  };

  renderContent = () => {
    const {quantity} = this.state;
    const {navigation} = this.props;
    const room = navigation.getParam('room');
    return (
      <View style={styles.mainContent}>
        <View style={styles.contentInner}>
          {/* <ImageBackground
            source={watermark}
            resizeMode="cover"
            style={styles.watermark}>
          </ImageBackground> */}
          {room.description || room.facilities ? (
            <>
              <Text style={styles.descriptionLabel} bold>
                Description
              </Text>
              <View style={[styles.roomInfo, {marginBottom: 12}]}>
                <Text style={styles.description} light>
                  {room.facilities + '\n' + room.description}
                </Text>
              </View>
            </>
          ) : null}
          {this.renderDateSelectors()}
          <View style={[styles.roomInfo, {alignItems: 'center'}]}>
            {this.renderQuantitySelector()}
            <Text style={styles.filmPrice}>
              Price:{' '}
              {displayAmount(
                room.rates[0].rate * quantity * this.getNumberOfDays(),
              )}
            </Text>
          </View>
          <View style={styles.addToCartButtonContainer}>
            <TouchableWithoutFeedback onPress={this.addToCart}>
              <View style={styles.addToCartButton}>
                <Text style={styles.addToCartButtonLabel}>Book Room</Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
      </View>
    );
  };

  renderDateSelectors() {
    const {arrivalDate, departureDate} = this.state;
    return (
      <>
        {/* <Text style={styles.dateSelectorHeading}>Choose Date</Text> */}
        <View style={styles.roomInfo}>
          <View style={[styles.dateSelector, {marginRight: 16}]}>
            <Text style={styles.dateSelectorFieldTitle} light>
              From:
            </Text>
            <View style={styles.dateSelectorButton}>
              <TouchableWithoutFeedback
                disabled
                onPress={() => this.handleSelectDate('arrival')}>
                <View style={styles.dateSelectorButtonInner}>
                  <Text style={styles.dateSelectorButtonText}>
                    {arrivalDate ? this.friendlyDate(arrivalDate) : ''}
                  </Text>
                  <VectorIcon
                    name="md-calendar"
                    color={colors.black}
                    size={18}
                    style={styles.dateSelectorIcon}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </View>
          <View style={[styles.dateSelector, {marginLeft: 16}]}>
            <Text style={styles.dateSelectorFieldTitle} light>
              To:
            </Text>
            <View style={styles.dateSelectorButton}>
              <TouchableWithoutFeedback
                disabled
                onPress={() => this.handleSelectDate('departure')}>
                <View style={styles.dateSelectorButtonInner}>
                  <Text style={styles.dateSelectorButtonText}>
                    {departureDate ? this.friendlyDate(departureDate) : ''}
                  </Text>
                  <VectorIcon
                    name="md-calendar"
                    color={colors.black}
                    size={18}
                    style={styles.dateSelectorIcon}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </View>
        </View>
      </>
    );
  }

  renderLocationSelector() {
    const {location} = this.state;
    return (
      <Menu>
        <MenuTrigger
          customStyles={{triggerWrapper: styles.locationSelectorTriggerOption}}>
          <View style={styles.locationSelectorTriggerContent}>
            <Text
              style={[
                styles.locationSelectorTriggerContentText,
                location
                  ? styles.locationSelectorTriggerContentTextActive
                  : null,
              ]}
              numberOfLines={1}>
              {location ? location : 'Select'}
            </Text>
            <VectorIcon
              name="md-arrow-dropdown"
              color={colors.gray900}
              size={10}
            />
          </View>
        </MenuTrigger>
        <MenuOptions>
          {locations.map((item, index) => (
            <MenuOption
              key={index}
              onSelect={() => this.handleLocationSelect(item)}>
              <View style={styles.selectOption}>
                {location === item ? (
                  <VectorIcon
                    name="md-checkmark"
                    color={colors.accent}
                    size={16}
                  />
                ) : null}
                <Text style={styles.selectOptionName}>{item}</Text>
              </View>
            </MenuOption>
          ))}
        </MenuOptions>
      </Menu>
    );
  }

  renderQuantitySelector() {
    const {quantity} = this.state;
    const {navigation} = this.props;
    const room = navigation.getParam('room');
    return (
      <View style={styles.quantitySelector}>
        <Text style={styles.quantitySelectorLabel}>Quantity: </Text>
        <View style={styles.quantitySelectorControls}>
          <TouchableWithoutFeedback
            onPress={() => this.handleChangeQuantity('remove')}>
            <View style={[styles.quantityButton]}>
              <VectorIcon name="md-remove" color={colors.accent} />
            </View>
          </TouchableWithoutFeedback>
          <Text style={styles.quantity}>{quantity}</Text>
          <TouchableWithoutFeedback
            disabled={room.units <= quantity}
            onPress={() => this.handleChangeQuantity('add')}>
            <View style={styles.quantityButton}>
              <VectorIcon name="md-add" color={colors.accent} />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>
    );
  }

  renderBackgroundImage() {
    const {currentImage} = this.state;
    return (
      <View style={styles.bgImageContainer}>
        <Image
          source={currentImage ? currentImage : bgImage}
          resizeMode="cover"
          style={styles.bgImage}
        />
        <View style={styles.bgImageVeil} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  contentInner: {
    paddingTop: 24,
  },
  dateSelectorIcon: {
    marginHorizontal: 8,
  },
  dateSelectorButtonText: {
    color: colors.black,
    paddingLeft: 8,
    flex: 1,
    fontSize: 12,
  },
  dateSelectorButtonInner: {
    height: 24,
    backgroundColor: colors.gray200,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateSelectorButton: {},
  dateSelectorFieldTitle: {
    fontSize: 12,
  },
  dateSelectorHeading: {
    color: '#000000',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  dateSelector: {
    flex: 1,
  },
  imageSlideItem: {
    width: 80,
    height: 80,
  },
  imageSlideItemImage: {
    width: 80,
    height: 80,
    resizeMode: 'cover',
  },
  locationSelectorTriggerContentTextActive: {
    color: colors.gray900,
  },
  locationSelectorTriggerContentText: {
    color: colors.gray500,
    flex: 1,
    fontSize: 12,
  },
  locationSelectorTriggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationSelectorTriggerOption: {
    flexGrow: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.gray200,
    marginRight: 24,
  },
  selectOptionName: {
    flex: 1,
    marginLeft: 8,
  },
  selectOption: {
    padding: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addToCartButtonContainer: {
    paddingHorizontal: 40,
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
  },
  cinemaSelector: {
    flexGrow: 1,
  },
  quantitySelectorLabel: {
    color: colors.gray900,
    fontWeight: '500',
    fontSize: 12,
  },
  quantityButton: {
    padding: 10,
  },
  quantity: {
    fontSize: 16,
  },
  quantitySelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  quantitySelectorControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  roomInfoItemContent: {
    fontSize: 8,
    lineHeight: 10,
    color: '#000000',
    textAlign: 'center',
  },
  roomInfoItem: {
    flexGrow: 1,
    backgroundColor: colors.gray200,
    paddingVertical: 8,
    paddingHorizontal: 2,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  filmPrice: {
    textAlign: 'right',
    fontSize: 16,
    color: '#000000',
    flex: 1,
    paddingLeft: 8,
  },
  roomInfo: {
    flexDirection: 'row',
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  dealsContainer: {
    marginBottom: 32,
  },
  description: {
    fontSize: 13,
    lineHeight: 16,
    color: 'rgba(0,0,0,1)',
    textAlign: 'left',
  },
  descriptionLabel: {
    textAlign: 'center',
    color: colors.accent,
    marginTop: 24,
    marginBottom: 16,
    fontSize: 16,
  },
  metaText: {
    color: colors.white,
    fontSize: 14,
    marginRight: 5,
  },
  metaIcon: {
    marginRight: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 16,
  },
  hotelName: {
    color: colors.black,
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 8,
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
    fontSize: 22,
    color: colors.white,
    marginBottom: 8,
    paddingHorizontal: 40,
  },
  topSection: {
    height: width / bgImageDimension - 64,
    justifyContent: 'flex-end',
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
  watermark: {
    flex: 1,
    resizeMode: 'cover',
  },
});

const locations = ['Lagos', 'Rivers', 'Abuja'];

export default withCart(HotelRoom);
