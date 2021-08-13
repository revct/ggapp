import React from 'react';
import Screen from 'components/Screen/Screen';
import {HotelCheckoutProps, HotelCheckoutState} from './interfaces';
import {
  StyleSheet,
  View,
  Alert,
  FlatList,
  Image,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
  TouchableOpacity,
} from 'react-native';
import colors from 'configs/colors';
import {getStatusBarHeight} from 'react-native-status-bar-height';
import {withCart, CartItem} from 'contexts/CartContext';
import Text from 'components/Text/Text';
import VectorIcon from 'components/VectorIcon/VectorIcon';
import {displayAmount, sleep, padNumber} from 'utils/Misc';
import NewReservation, {
  ReservationRoom,
  ReservationGuest,
} from 'api/NewReservation.api';
import ModifyReservationApi from 'api/ModifyReservation.api';
import {withLocation} from 'contexts/LocationContext';
import Spinner from 'components/Spinner/Spinner';
import UrlHelper from 'utils/UrlHelper';
import MonnifyPaymentVerify from 'components/MonnifyPaymentVerify/MonnifyPaymentVerify';
import {StackActions, NavigationActions} from 'react-navigation';
import {withUser} from 'contexts/UserContext';
import AddPoints from 'api/AddPoints';
import Toast from 'utils/Toast';
import GetTotalPoints from 'api/GetTotalPoints';
import Axios, {Canceler} from 'axios';
import RedeemPoints from 'api/RedeemPoints';
import UpdateRedemption from 'api/UpdateRedemption';
import PaymentSuccessModal from 'components/PaymentSuccessModal/PaymentSuccessModal';
import {asyncGet, asyncStore} from 'utils/Async';
import {STORE_KEYS} from 'configs/async';
import Logger from 'utils/Logger';
import {Booking} from 'components/BookingHistory/interfaces';
const {height} = Dimensions.get('window');
const cartHeight = height * 0.68;
const cartItemHight =
  Math.ceil(cartHeight * 0.144) > 66 ? 66 : Math.ceil(cartHeight * 0.144);

class HotelCheckout extends React.Component<
  HotelCheckoutProps,
  HotelCheckoutState
> {
  static navigationOptions = () => {
    return {
      headerTitle: 'Hotel Checkout',
      headerTintColor: colors.gray600,
      headerTitleContainerStyle: styles.headerContainer,
      headerTransparent: true,
      headerStyle: styles.header,
      headerTitleStyle: styles.headerTitle,
      headerBackTitle: ' ',
      headerRight: <Text />,
    };
  };

  state: HotelCheckoutState = {
    isFetching: false,
    checkoutUrl: null,
    status: 'pending',
    isUpdatingOrder: false,
    usePoints: 0,
    redeptionRef: null,
    pointsGained: 0,
    pointsBalance: 0,
    hotel: null,
    paymentReference: null,
    reservationId: null,
    guest: {
      firstName: '',
      lastName: '',
      postalCode: '',
      email: '',
      phoneNumber: '',
      address: '',
      city: '',
      state: '',
      country: '',
    },
  };

  cancelGetPoints?: Canceler;

  cancelRedeem?: Canceler;

  mounted: boolean = false;

  componentDidMount() {
    this.mounted = true;
    this.handleComponentMounted();
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  handleComponentMounted() {
    this.setDefaultGuestInfo();
    this.setHotel();
  }

  async setDefaultGuestInfo() {
    const {user} = this.props;
    if (!user) {
      return;
    }
    // get last reservation guest if available
    const lastGuest:
      | ReservationGuest & {email: string; phoneNumber: string}
      | undefined = await asyncGet(
      STORE_KEYS.LAST_GUEST.replace('{userId}', String(user.id)),
    );
    // update guest info
    this.setState({
      guest: {
        firstName: lastGuest ? lastGuest.firstName : user.first_name,
        lastName: lastGuest ? lastGuest.lastName : user.last_name,
        email: lastGuest ? lastGuest.email : user.email,
        phoneNumber: lastGuest ? lastGuest.phoneNumber : user.billing.phone,
        postalCode: user.billing.postcode || '',
        address: lastGuest ? lastGuest.address : user.billing.address_1,
        city: lastGuest ? lastGuest.city : user.billing.city,
        state: lastGuest ? lastGuest.state : user.billing.state,
        country: lastGuest ? lastGuest.country : user.billing.country,
      },
    });
  }

  setHotel() {
    const {navigation} = this.props;
    const hotel = navigation.getParam('hotel');
    if (!hotel) {
      Alert.alert('Error', 'Hotel not specified on cehckout.');
      return navigation.goBack();
    }
    this.setState({hotel: hotel});
  }

  handleRedirectValidation = (url: string): boolean => {
    const urlHelper = new UrlHelper(url);
    return urlHelper.get('paymentReference', null) !== null;
  };

  handlePaymentComplete = () => {
    // verify transaction
    this.setState({
      isFetching: true,
      status: 'paid',
    });
  };

  handlePaymentInitialized = (checkoutUrl: string) => {
    // verify transaction
    this.setState({
      checkoutUrl: checkoutUrl,
      status: 'ongoing',
    });
  };

  handleClose = async () => {
    const {navigation, cart} = this.props;
    const itemIds = navigation.getParam('items');
    cart.remove(itemIds, true);
    navigation.dispatch(
      StackActions.reset({
        index: 1,
        actions: [
          NavigationActions.navigate({routeName: 'Home'}),
          NavigationActions.navigate({routeName: 'BookingHistory'}),
        ],
      }),
    );
  };

  handleVerificationCompleted = (status: 'PAID' | 'PENDING' | 'FAILED') => {
    this.setState(
      {
        status: 'verified',
      },
      () => {
        if (status === 'PAID') {
          this.handleOnPaid();
        }
      },
    );
  };

  handleConfirm = async () => {
    const {user, navigation} = this.props;
    const {status} = this.state;
    if (!user) {
      return;
    }
    if (!user.billing.phone) {
      Alert.alert(
        'Attention',
        'Please provide your phone number to continue.',
        [
          {text: 'Cancel'},
          {
            text: 'Update Profile',
            onPress: () => {
              navigation.navigate('Profile', {
                leaveAfterSave: async () => {
                  await sleep(200);
                  this.handleConfirm();
                },
              });
            },
          },
        ],
      );
      return;
    }
    if (status === 'paid') {
      return;
    }
    this.setState({isFetching: true});
    await sleep(100);
    try {
      const points = await GetTotalPoints({
        canceler: this.cancelGetPoints,
      });
      this.setState({isFetching: false});
      // ask user if they would like to used their points
      if (points >= this.getTotal()) {
        Alert.alert(
          'Use Points',
          'You have enough points to cover the cost of your order, would you like to use your points?',
          [
            {text: 'No, pay with card', onPress: this.handleNewReservation},
            {
              text: 'Yes, use my points',
              onPress: () =>
                this.setState(
                  {
                    usePoints: points,
                  },
                  this.handleNewReservation,
                ),
            },
            {text: 'Cancel', style: 'cancel'},
          ],
        );
        return;
      }
      this.handleNewReservation();
    } catch (e) {
      if (Axios.isCancel(e) || e.message === 'cancelled') {
        return;
      }
      // toggle off pending status
      this.setState({isFetching: false}, this.handleNewReservation);
    }
  };

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

  handleNewReservation = async () => {
    const {user, navigation} = this.props;
    const {status, usePoints, hotel, guest} = this.state;
    const items = this.getSelectedItems();

    if (!hotel || !guest) {
      return;
    }

    if (!items.length) {
      Alert.alert('Error', 'Please select movie rooms and try again.');
      return navigation.goBack();
    }

    if (status === 'paid') {
      return;
    }

    // cancel is customer information is missing
    if (!user) {
      return Alert.alert('Attention', 'Please log in to continue.');
    }

    // get line items
    const lineItems = items.map(
      (item): ReservationRoom => ({
        units: item.quantity,
        arrival: this.convertDate(item.data.arrival),
        departure: this.convertDate(item.data.departure),
        code: item.data.code,
        planCode: item.data.planCode,
      }),
    );

    // prep guest info
    const reservationGuest: ReservationGuest = {
      firstName: guest.firstName,
      lastName: guest.lastName,
      address: guest.address,
      city: guest.city,
      state: guest.state,
      country: guest.country,
      postalCode: guest.postalCode,
    };

    // start creating order
    this.setState({isFetching: true});
    //
    await sleep(100);
    //
    const reservation = await NewReservation(
      hotel.id,
      reservationGuest,
      lineItems,
    );
    // check if action was cancelled
    if (!this.mounted) {
      return;
    }
    await asyncStore(
      STORE_KEYS.LAST_GUEST.replace('{userId}', String(user.id)),
      guest,
    );
    // check if reservation action failed
    if (!reservation.success || !reservation.data) {
      // display error message
      Toast.alert(
        reservation.message ||
          'An error occured, please try again in a moment.',
      );
      return this.setState({isFetching: false});
    }
    // toggle pendins state off and go to payment screen
    this.setState(
      {
        isFetching: false,
        reservationId: reservation.data,
        status: 'ongoing',
        paymentReference:
          'HTL-' +
          String(usePoints ? 'PT-' : 'PD-') +
          String(Math.ceil(Date.now() / 1000)).substr(0, 7) +
          '-' +
          reservation.data,
      },
      this.goToPaymentScreen,
    );
  };

  getSelectedItems = (): Array<CartItem> => {
    const {cart, navigation} = this.props;
    const items = navigation.getParam('items');
    if (!Array.isArray(items) || !cart || !Array.isArray(cart.items)) {
      return [];
    }
    return cart.items.filter(
      (i: CartItem) => i.type === 'room' && items.indexOf(i.id) !== -1,
    );
  };

  updateRedemption = async () => {
    const {paymentReference, redeptionRef, status} = this.state;
    // stop if completed
    if (status === 'paid') {
      return;
    }
    this.setState({isFetching: true});
    await sleep(200);
    try {
      const result = await UpdateRedemption({
        reference: redeptionRef || '',
        purchase_reference: paymentReference ? paymentReference : '',
        status: 'success',
      });
      this.setState({
        isFetching: true,
        status: 'verified',
        pointsBalance: result.balance,
      });
    } catch (e) {
      if (Axios.isCancel(e) || e.message === 'cancelled') {
        return;
      }
      this.setState(
        () => ({
          isFetching: true,
        }),
        () => {
          Alert.alert(
            'Error',
            e.message,
            [{text: 'Try again', onPress: this.updateRedemption}],
            {
              cancelable: false,
            },
          );
        },
      );
    }
  };

  redeemPoints = async () => {
    const {redeptionRef} = this.state;
    if (redeptionRef) {
      return this.handleSetHotelOrderAsPaid();
    }
    this.setState({isFetching: true});
    await sleep(100);
    try {
      const redemption = await RedeemPoints(
        {
          amount: this.getTotal(),
          SBU: 'Hotel',
        },
        {canceler: this.cancelRedeem},
      );
      this.setState(
        {
          isFetching: false,
          redeptionRef: redemption,
        },
        this.handleSetHotelOrderAsPaid,
      );
    } catch (e) {
      if (Axios.isCancel(e) || e.message === 'cancelled') {
        return;
      }
      // show error
      this.setState({isFetching: false}, () => {
        Alert.alert(
          'Error',
          'Your points are currently unavailable.',
          [
            {
              text: 'Pay With Card',
              onPress: () =>
                this.setState({usePoints: 0}, this.goToPaymentScreen),
            },
            {text: 'Try again', onPress: this.redeemPoints},
          ],
          {
            cancelable: false,
          },
        );
      });
    }
  };

  goToPaymentScreen() {
    const {user, navigation} = this.props;
    const {paymentReference, checkoutUrl, usePoints, hotel} = this.state;
    if (usePoints) {
      return this.redeemPoints();
    }
    if (!user) {
      return Alert.alert('Attention', 'Please log in to continue.');
    }

    if (!paymentReference || !hotel) {
      return;
    }

    navigation.navigate('MonnifyPayment', {
      paymentInfo: {
        amount: Number(this.getTotal()),
        customerName: user.first_name + ' ' + user.last_name,
        customerEmail: user.email,
        paymentReference: paymentReference,
        paymentDescription: hotel.name,
        checkoutUrl: checkoutUrl,
        paymentType: 'hotel',
      },
      redirectValidation: this.handleRedirectValidation,
      onPaymentComplete: this.handlePaymentComplete,
      onPaymentInitialized: this.handlePaymentInitialized,
    });
  }

  saveReservation = async (): Promise<boolean> => {
    const {user} = this.props;
    if (!user) {
      return Promise.resolve(false);
    }
    const rooms = this.getNewRoomsList();
    // get existing list of rooms
    let roomsHistory: Array<Booking> = await asyncGet(
      STORE_KEYS.BOOKING_HISTORY.replace('userId', String(user.id)),
    );
    // if there none make into an empty array
    if (!Array.isArray(roomsHistory)) {
      roomsHistory = [];
    }
    // merge arrays together
    rooms.reverse().forEach(item => {
      roomsHistory.unshift(item);
    });
    try {
      // save to local storage
      await asyncStore(
        STORE_KEYS.BOOKING_HISTORY.replace('userId', String(user.id)),
        roomsHistory,
      );
      // resolve promise
      return Promise.resolve(true);
    } catch (e) {
      // log error
      Logger(e);
      // resolve promise
      return Promise.resolve(false);
    }
  };

  getNewRoomsList(): Array<Booking> {
    const {reservationId, paymentReference} = this.state;
    const {user} = this.props;
    if (!reservationId || !paymentReference || !user) {
      return [];
    }
    const items = this.getSelectedItems();
    return items.map(
      (item): Booking => {
        return {
          id: item.data.id,
          code: item.data.code,
          email: user.email,
          price: item.data.rates[0].rate,
          customerName: user.first_name + ' ' + user.last_name,
          roomName: item.name,
          hotelName: item.data.hotel.name,
          quantity: item.quantity,
          image: item.image || null,
          arrival: item.data.arrival,
          departure: item.data.departure,
          reference: paymentReference,
          reservationId: reservationId,
          createdAt: Date.now(),
          expiresAt: new Date(item.data.arrival).getTime() + 60 * 60 * 2 * 1000,
        };
      },
    );
  }

  addPoints = async () => {
    const {paymentReference} = this.state;
    if (!paymentReference) {
      return this.setState({status: 'pending', isFetching: false});
    }
    // toggle fetch state
    this.setState({
      status: 'addingPoints',
      isFetching: true,
    });
    await sleep(200);
    try {
      const gained = await AddPoints({
        amount: this.getTotal(),
        SBU: 'Hotel',
        purchase_ref: paymentReference,
      });
      // update component status
      this.setState({
        status: 'verified',
        pointsGained: gained.points_gained,
      });
    } catch (e) {
      // update component status
      this.setState(({pointsGained}) => ({
        status: 'verified',
        pointsGained: pointsGained,
      }));
    }
  };

  handleAddPointsFailed = (message: string) => {
    // alert
    Alert.alert(
      'An Error Occurred',
      message,
      [{text: 'Try Again', onPress: this.addPoints}],
      {cancelable: false},
    );
  };

  handleOnPaid = () => {
    this.handleSetHotelOrderAsPaid();
  };

  handleSetHotelOrderAsPaid = async () => {
    const {
      isUpdatingOrder,
      usePoints,
      hotel,
      reservationId,
      status,
      guest,
    } = this.state;
    const items = this.getSelectedItems();
    const {user} = this.props;
    // stop if already updating order
    if (
      isUpdatingOrder ||
      !hotel ||
      !user ||
      !guest ||
      !items ||
      !items.length ||
      !reservationId
    ) {
      return;
    }

    // if order status is already paid
    if (status === 'updatingRedemption' || status === 'addingPoints') {
      if (!usePoints) {
        return this.addPoints();
      }
      return this.updateRedemption();
    }

    this.setState({
      isUpdatingOrder: true,
      isFetching: true,
      status: 'updatingOrder',
    });

    // get line items
    const lineItems = items.map(
      (item): ReservationRoom => ({
        units: item.quantity,
        arrival: this.convertDate(item.data.arrival),
        departure: this.convertDate(item.data.departure),
        code: item.data.code,
        planCode: item.data.planCode,
      }),
    );

    await sleep(200);

    const result = await ModifyReservationApi(
      hotel.id,
      reservationId,
      lineItems,
      guest.email,
    );
    if (!result.success) {
      // update component
      this.setState({
        isUpdatingOrder: false,
        isFetching: false,
        status: 'updatingOrder',
      });
      // get error message
      let errorMessage = result.message;
      if (/network/i.test(errorMessage)) {
        errorMessage = 'Please check your internet connection and try again.';
      }
      // alert
      return Alert.alert(
        'An Error Occurred',
        errorMessage,
        [{text: 'Try Again', onPress: this.handleSetHotelOrderAsPaid}],
        {cancelable: false},
      );
    }
    this.setState(
      {
        isUpdatingOrder: false,
        status: usePoints ? 'updatingRedemption' : 'addingPoints',
      },
      async () => {
        await this.saveReservation();
        if (!usePoints) {
          return this.addPoints();
        }
        return this.updateRedemption();
      },
    );
  };

  handleUpdateCustomerInfo = () => {
    const {navigation} = this.props;
    const {guest} = this.state;
    navigation.navigate('Profile', {
      handleSave: this.handleGuestInfoSave,
      defaultInfo: guest,
    });
  };

  handleGuestInfoSave = (
    info: ReservationGuest & {email: string; phoneNumber: string},
  ) => {
    this.setState(({guest}) => ({
      guest: {...(guest || {}), ...info},
    }));
  };

  getServiceFee(): number {
    return 0;
  }

  getSubTotal(): number {
    const items = this.getSelectedItems();
    if (!items.length) {
      return Number(0);
    }
    return Number(
      items.reduce((total, item) => total + item.price * item.quantity, 0),
    );
  }

  getTotal(): number {
    return this.getSubTotal() + this.getServiceFee();
  }

  getTotalItems(): number {
    const items = this.getSelectedItems();
    if (!items.length) {
      return Number(0);
    }
    return Number(items.reduce((total, item) => total + item.quantity, 0));
  }

  render() {
    const {navigation} = this.props;
    const {
      status,
      isFetching,
      isUpdatingOrder,
      usePoints,
      pointsGained,
      pointsBalance,
      paymentReference,
    } = this.state;

    return (
      <Screen>
        <View style={styles.container}>
          {this.renderHeader()}
          <FlatList
            style={styles.content}
            data={this.getSelectedItems()}
            renderItem={this.renderCartItem}
            ListEmptyComponent={this.renderEmptyList}
            showsVerticalScrollIndicator={false}
          />
          {this.renderFooter()}
        </View>
        {paymentReference &&
        (status === 'paid' ||
          status === 'verified' ||
          status === 'updatingOrder' ||
          status === 'addingPoints') &&
        navigation.isFocused() &&
        !usePoints ? (
          <MonnifyPaymentVerify
            onClose={this.handleClose}
            onComplete={this.handleVerificationCompleted}
            paymentReference={paymentReference}
            isLoading={
              status === 'updatingOrder' ||
              status === 'addingPoints' ||
              isUpdatingOrder
            }
            pointsGained={pointsGained}
          />
        ) : null}

        <PaymentSuccessModal
          isVisible={
            navigation.isFocused() && usePoints && status === 'verified'
              ? true
              : false
          }
          onClick={this.handleClose}
          pointsBalance={pointsBalance}
        />

        {isFetching ? <View style={styles.uiBlocker} /> : null}
      </Screen>
    );
  }

  renderEmptyList = () => {
    return (
      <View style={styles.emptyListContainer}>
        <VectorIcon
          name="md-information-circle-outline"
          color={colors.gray500}
          size={32}
        />
        <Text style={styles.emptyListText} light>
          Your order appears empty, please go back and add items to your cart to
          checkout.
        </Text>
      </View>
    );
  };

  renderHeader = () => {
    return (
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderTitle} bold>
          {this.getTotalItems()} ITEMS
        </Text>
      </View>
    );
  };

  renderFooter = () => {
    const {cart} = this.props;
    const {isFetching, status} = this.state;
    const hasItems: boolean =
      cart.items.filter((item: CartItem) => item.type === 'room').length > 0;
    return (
      <View style={styles.footer}>
        {this.remderHotelInfo()}
        {this.renderGuestInfo()}
        <View style={styles.cartCosts}>
          <View style={styles.cartCostsRow}>
            <Text style={styles.cartCostsRowLabel}>Sub Total</Text>
            <Text style={styles.cartCostsRowValue}>
              {displayAmount(this.getSubTotal())}
            </Text>
          </View>
          {/* <View style={styles.cartCostsRow}>
            <Text style={styles.cartCostsRowLabel}>Service Fee</Text>
            <Text style={styles.cartCostsRowValue}>{displayAmount(this.getServiceFee())}</Text>
          </View> */}
          <View style={styles.cartCostsRow}>
            <Text style={[styles.cartCostsRowLabel, styles.total]} bold>
              Total
            </Text>
            <Text style={[styles.cartCostsRowValue, styles.total]} bold>
              {displayAmount(this.getTotal())}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={this.handleConfirm}
          disabled={!hasItems}>
          <View style={styles.checkoutButton}>
            <View
              style={[
                styles.checkoutButtonInner,
                !hasItems || isFetching ? styles.checkoutButtonDisabled : {},
              ]}>
              {isFetching && status !== 'verified' ? (
                <Spinner color={colors.white} />
              ) : (
                <Text bold style={styles.checkoutButtonText}>
                  Make Payment
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  renderGuestInfo() {
    const {guest} = this.state;
    return (
      <View style={styles.customerInfo}>
        <View style={styles.customerInfoHeading}>
          <Text style={styles.customerInfoHeader} bold>
            GUEST INFORMATION
          </Text>
          {guest ? (
            <TouchableWithoutFeedback onPress={this.handleUpdateCustomerInfo}>
              <Text style={styles.changeButtonText}>Change Guest Info</Text>
            </TouchableWithoutFeedback>
          ) : null}
        </View>
        {!guest ||
        !guest.firstName ||
        !guest.lastName ||
        !guest.email ||
        !guest.phoneNumber ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={this.handleUpdateCustomerInfo}>
            <View style={styles.customerInfoEmpty}>
              <VectorIcon
                name="md-information-circle-outline"
                color={colors.accent}
                size={22}
              />
              <Text style={styles.customerInfoEmptyText}>
                Tap here to enter guest information.
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.customer}>
            <Text style={styles.customerName}>
              {guest.firstName} {guest.lastName}
            </Text>
            <Text style={styles.customerEmail}>{guest.email}</Text>
            <Text style={styles.customerPhone}>{guest.phoneNumber}</Text>
          </View>
        )}
      </View>
    );
  }

  remderHotelInfo() {
    const {hotel} = this.state;
    if (!hotel) {
      return null;
    }
    return (
      <View style={styles.hotelLocationInfo}>
        <View style={styles.hotelInfoHeading}>
          <Text style={styles.hotelInfoHeader} bold>
            HOTEL
          </Text>
        </View>
        <Text style={styles.hotelInfoLocation}>{hotel.name}</Text>
      </View>
    );
  }

  renderCartItem = (props: {item: CartItem; index: number}) => {
    const {cart} = this.props;
    const {item} = props;
    return (
      <View style={styles.cartItem}>
        <View style={styles.cartItemInner}>
          <View style={styles.cartItemImageContainer}>
            <Image
              style={styles.cartItemImage}
              source={item.image ? {uri: item.image} : undefined}
              resizeMode="cover"
            />
          </View>
          <View style={styles.cartItemContent}>
            <View style={styles.cartItemNameContainer}>
              <Text style={styles.cartItemName} numberOfLines={1}>
                {item.name}
              </Text>
              {/* {item.caption ? (
                <Text style={styles.cartItemCaption}>{item.caption}</Text>
              ) : null} */}
            </View>
            <View style={styles.quantitySelector}>
              <Text style={styles.quantitySelectorLabel}>Quantity: </Text>
              <View style={styles.quantitySelectorControls}>
                <TouchableWithoutFeedback
                  disabled={item.quantity <= 1}
                  onPress={() =>
                    cart.update(item.id, {...item, quantity: item.quantity - 1})
                  }>
                  <View style={[styles.quantityButton]}>
                    <VectorIcon
                      name="md-remove"
                      color={item.quantity > 1 ? '#000000' : '#b8b8b8'}
                    />
                  </View>
                </TouchableWithoutFeedback>
                <Text style={styles.quantity}>{item.quantity}</Text>
                <TouchableWithoutFeedback
                  disabled={item.quantity >= 20}
                  onPress={() =>
                    cart.update(item.id, {...item, quantity: item.quantity + 1})
                  }>
                  <View style={styles.quantityButton}>
                    <VectorIcon
                      name="md-add"
                      color={item.quantity < 20 ? '#000000' : '#b8b8b8'}
                    />
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </View>
          </View>
          <View style={styles.cartItemActions}>
            <View style={styles.cartItemPrice}>
              <Text style={styles.cartItemPriceText} bold>
                {displayAmount(item.price * item.quantity)}
              </Text>
            </View>
            <View>
              <TouchableWithoutFeedback onPress={() => cart.remove(item.id)}>
                <View style={styles.cartItemDeleteButton}>
                  <Text style={styles.cartItemDeleButtonText}>Delete</Text>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </View>
        </View>
      </View>
    );
  };
}

const styles = StyleSheet.create({
  hotelInfoLocation: {
    color: colors.gray500,
    fontSize: 14,
  },
  hotelInfoEmptyText: {
    color: colors.black,
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  hotelInfoEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 8,
    padding: 16,
    backgroundColor: colors.gray200,
    borderRadius: 8,
  },
  hotelInfoHeader: {
    color: colors.black,
    fontSize: 10,
    marginBottom: 4,
    flex: 1,
  },
  hotelInfoHeading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hotelLocationInfo: {
    marginVertical: 8,
    marginBottom: 16,
  },
  customerPhone: {
    fontSize: 12,
    color: colors.gray500,
  },
  customerEmail: {
    fontSize: 12,
    color: colors.gray500,
  },
  customerName: {
    fontSize: 16,
    color: colors.black,
  },
  customer: {
    marginVertical: 16,
    marginTop: 8,
  },
  changeButtonText: {
    color: colors.accent,
    fontSize: 10,
  },
  customerInfoEmptyText: {
    color: colors.black,
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  customerInfoEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 8,
    padding: 16,
    backgroundColor: colors.gray200,
    borderRadius: 8,
  },
  customerInfoHeader: {
    color: colors.black,
    fontSize: 10,
    marginBottom: 4,
    flex: 1,
  },
  customerInfoHeading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerInfo: {
    marginVertical: 8,
  },
  emptyListText: {
    textAlign: 'center',
    color: colors.gray500,
    marginTop: 16,
    fontSize: 14,
  },
  emptyListContainer: {
    marginHorizontal: 32,
    alignItems: 'center',
    marginVertical: 32,
  },
  checkoutButtonText: {
    color: colors.white,
    fontSize: 13,
    textAlign: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  checkoutButtonInner: {
    height: 32,
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  checkoutButton: {
    height: 32,
    borderRadius: 5,
    overflow: 'hidden',
  },
  total: {
    fontSize: 13,
  },
  cartCostsRowValue: {
    flex: 1,
    fontSize: 11,
    color: '#7a7979',
    textAlign: 'right',
  },
  cartCostsRowLabel: {
    flex: 1,
    fontSize: 11,
    color: '#7a7979',
    textAlign: 'left',
  },
  cartCostsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartCosts: {
    marginBottom: 16,
    paddingTop: 8,
  },
  footer: {
    paddingHorizontal: 40,
    marginBottom: getStatusBarHeight(true) > 20 ? 56 : 32,
  },
  listHeaderTitle: {
    textAlign: 'center',
    color: colors.black,
    fontSize: 14,
  },
  listHeader: {
    marginTop: 32,
    marginBottom: 16,
  },
  cartItemDeleButtonText: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.white,
  },
  cartItemDeleteButtonInner: {
    height: cartItemHight / 2,
    backgroundColor: colors.black,
    justifyContent: 'center',
  },
  cartItemDeleteButton: {
    height: cartItemHight / 2,
    backgroundColor: colors.accent,
    justifyContent: 'center',
  },
  cartItemPriceText: {
    fontSize: 13,
    color: '#7a7979',
  },
  cartItemPrice: {
    height: cartItemHight / 2,
    justifyContent: 'center',
  },
  cartItemActions: {
    width: 73,
    height: cartItemHight,
  },
  quantity: {
    fontSize: 11,
    color: colors.accent,
  },
  quantityButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantitySelectorControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantitySelectorLabel: {
    color: '#b8b8b8',
    fontSize: 11,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
  },
  cartItemNameContainer: {
    flexGrow: 1,
    paddingTop: 4,
    justifyContent: 'flex-start',
    paddingHorizontal: 8,
  },
  cartItemCaption: {
    fontSize: 10,
    color: '#7a7979',
  },
  cartItemName: {
    color: colors.black,
    fontSize: 14,
  },
  cartItemContent: {
    flex: 1,
    flexDirection: 'column',
  },
  cartItemImage: {
    width: cartItemHight,
    height: cartItemHight,
    resizeMode: 'cover',
  },
  cartItemImageContainer: {
    height: cartItemHight,
    width: cartItemHight,
  },
  cartItemInner: {
    flexDirection: 'row',
    ...Platform.select({
      android: {
        backgroundColor: colors.white,
      },
      ios: {
        overflow: 'hidden',
        borderRadius: 10,
        backgroundColor: colors.white,
      },
    }),
  },
  cartItem: {
    marginVertical: 8,
    marginHorizontal: 3,
    height: cartItemHight,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
    ...Platform.select({
      android: {
        borderRadius: 10,
        // backgroundColor: colors.white,
        overflow: 'hidden',
        backgroundColor: colors.white,
      },
      ios: {},
    }),
  },
  cartItemsContainer: {
    height: (cartItemHight + 16) * 2,
  },
  cartItems: {
    marginHorizontal: 32,
  },
  content: {
    flex: 1,
    marginHorizontal: 32,
  },
  container: {
    flex: 1,
    marginTop: getStatusBarHeight(true) + 56,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderTopLeftRadius: 64,
    borderTopRightRadius: 64,
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
  uiBlocker: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0)',
  },
});

export default withLocation(withCart(withUser(HotelCheckout)));
