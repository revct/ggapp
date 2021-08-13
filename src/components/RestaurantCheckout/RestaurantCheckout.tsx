import React from 'react';
import Screen from 'components/Screen/Screen';
import {
  RestaurantCheckoutProps,
  RestaurantCheckoutState,
  SelectSectionProps,
} from './interfaces';
import {
  StyleSheet,
  View,
  Alert,
  Image,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import colors from 'configs/colors';
import {getStatusBarHeight} from 'react-native-status-bar-height';
import Icon from 'react-native-vector-icons/Ionicons';
import {withCart, CartItem} from 'contexts/CartContext';
import Text from 'components/Text/Text';
import VectorIcon from 'components/VectorIcon/VectorIcon';
import {displayAmount, sleep} from 'utils/Misc';
import CreateRestaurantOrder, {
  RestaurantNewOrderLineItem,
} from 'api/CreateRestaurantOrder.api';
import UpdateRestaurantOrder from 'api/UpdateRestaurantOrder.api';
import {withLocation} from 'contexts/LocationContext';
import {BUGSNAG} from 'configs/app';
import Spinner from 'components/Spinner/Spinner';
import UrlHelper from 'utils/UrlHelper';
import MonnifyPaymentVerify from 'components/MonnifyPaymentVerify/MonnifyPaymentVerify';
import {StackActions, ScrollView} from 'react-navigation';
import {withUser} from 'contexts/UserContext';
import AddPoints from 'api/AddPoints';
import Toast from 'utils/Toast';
import GetTotalPoints from 'api/GetTotalPoints';
import Axios, {Canceler} from 'axios';
import RedeemPoints from 'api/RedeemPoints';
import UpdateRedemption from 'api/UpdateRedemption';
import PaymentSuccessModal from 'components/PaymentSuccessModal/PaymentSuccessModal';
import {withDynamiConfig} from 'contexts/DynamicConfigsContext';
import {Restaurant} from 'api/Restaurants.api';
import {
  MenuOptions,
  MenuTrigger,
  Menu,
  MenuOption,
} from 'react-native-popup-menu';
import {asyncGet, asyncStore} from 'utils/Async';
import {STORE_KEYS} from 'configs/async';
const placeholderImage = require('../../assets/general/placeholder-300x300.jpg');
const deliveryImage = require('../../assets/checkout/delivery.png');
const {height} = Dimensions.get('window');
const cartHeight = height * 0.68;
const cartItemHight =
  Math.ceil(cartHeight * 0.144) > 66 ? 66 : Math.ceil(cartHeight * 0.144);

class RestaurantCheckout extends React.Component<
  RestaurantCheckoutProps,
  RestaurantCheckoutState
> {
  static navigationOptions = () => {
    return {
      headerTitle: 'Order Summary',
      headerTintColor: colors.gray600,
      headerTitleContainerStyle: styles.headerContainer,
      headerTransparent: true,
      headerStyle: styles.header,
      headerTitleStyle: styles.headerTitle,
      headerBackTitle: ' ',
      headerRight: <Text />,
    };
  };

  state: RestaurantCheckoutState = {
    isFetching: false,
    checkoutUrl: null,
    order: null,
    status: 'pending',
    isUpdatingOrder: false,
    isFetchingRestaurants: false,
    usePoints: 0,
    redeptionRef: null,
    pointsBalance: 0,
    pointsGained: 0,
    deliveryTypes: ['Pickup', 'Delivery'],
    deliveryType: 'Delivery',
    showLess: true,
    area: '',
    deliveryAddress: '',
  };

  cancelGetPoints?: Canceler;

  cancelRedeem?: Canceler;

  mounted: boolean = false;

  componentDidMount() {
    this.mounted = true;
    this.prefillLastArea();
  }

  componentWillUnmount() {
    this.mounted = false;
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
    navigation.dispatch(StackActions.popToTop());
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
    const {status, deliveryAddress, area, deliveryType} = this.state;
    const outlet = this.getRestaurant();
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
    if (outlet && outlet.closed) {
      return Alert.alert(
        'Restaurant Closed',
        'This outlet is closed for the moment, please check back some other time.',
      );
    }
    // requires delivery type to be selected
    if (!deliveryType) {
      return Alert.alert('Error', 'Please select pickup or delivery continue.');
    }
    // requires addes for delivery
    if (
      deliveryType !== 'Pickup' &&
      (!deliveryAddress.replace(/\s/g, '').length || !area)
    ) {
      return Alert.alert(
        'Delivery Location',
        'Please select your area and provide your address and try again.',
      );
    }
    if (
      !user.billing.first_name ||
      !user.billing.last_name ||
      !user.billing.phone
    ) {
      return Alert.alert(
        'Delivery Location',
        'Please you need your name, email, and phone number to proceed.',
      );
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
            {text: 'No, pay with card', onPress: this.handleCreateOrder},
            {
              text: 'Yes, use my points',
              onPress: () =>
                this.setState(
                  {
                    usePoints: points,
                  },
                  this.handleCreateOrder,
                ),
            },
            {text: 'Cancel', style: 'cancel'},
          ],
        );
        return;
      }
      this.handleCreateOrder();
    } catch (e) {
      if (Axios.isCancel(e) || e.message === 'cancelled') {
        return;
      }
      // toggle off pending status
      this.setState({isFetching: false}, this.handleCreateOrder);
    }
  };

  handleCreateOrder = () => {
    const {user} = this.props;
    const {status, usePoints, deliveryAddress, deliveryType, area} = this.state;
    const items = this.getSelectedItems();
    const outlet = this.getRestaurant();

    if (!outlet) {
      return Alert.alert('Error', 'Please select your preferred restarant.');
    }

    if (status === 'paid') {
      return;
    }

    // cancel is customer information is missing
    if (!user) {
      return Alert.alert('Attention', 'Please log in to continue.');
    }

    // requires delivery type to be selected
    if (!deliveryType) {
      return Alert.alert('Error', 'Please select pickup or delivery continue.');
    }
    // cancel if location is not provided
    if (
      deliveryType !== 'Pickup' &&
      (!deliveryAddress.replace(/\s/g, '').length || !area)
    ) {
      return Alert.alert(
        'Delivery Location',
        'Please select your area and provide your address and try again.',
      );
    }

    // get line items
    const lineItems = items
      .filter(item => item.type === 'meal')
      .map(
        (item): RestaurantNewOrderLineItem => {
          const data: RestaurantNewOrderLineItem = {
            quantity: item.quantity,
            product_id: item.data ? item.data.id : 0,
          };
          if (item.data && item.data.variantId) {
            data.variation_id = item.data.variantId;
          }
          return data;
        },
      );

    // create customer note
    let customerNote = usePoints ? 'Paid With: points.' : 'Paid With: card.';
    customerNote += ' Outlet: ' + outlet.outlet_name;
    customerNote += ' Area: ' + area;
    customerNote += ' Delivery Type: ' + deliveryType;

    // start creating order
    this.setState(
      {
        isFetching: true,
      },
      async () => {
        try {
          const order = await CreateRestaurantOrder({
            set_paid: false,
            customer_id: user.id,
            customer_note: customerNote,
            billing: {
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              phone: user.billing.phone,
              address_1: user.billing.address_1,
              city: user.billing.city,
              state: user.billing.state,
              country: user.billing.country,
              postcode: user.billing.postcode,
            },
            shipping: {
              first_name: user.first_name,
              last_name: user.last_name,
              address_1:
                deliveryType === 'Pickup' ? '' : deliveryAddress + ', ' + area,
              city: '',
              state: '',
              country: 'NG',
              postcode: user.billing.postcode || '',
            },
            line_items: lineItems,
            shipping_lines: [
              {
                method_id: 'flat_rate',
                method_title: 'Flat rate',
                total: String(this.getDeliveryFee()),
              },
            ],
            status: 'pending',
          });
          const transactionId =
            'RST-' +
            (usePoints ? 'PT-' : 'PD-') +
            String(Math.ceil(Date.now() / 1000)).substr(0, 7) +
            '-' +
            order.id;
          this.setState(
            {
              isFetching: false,
              order: {...order, transaction_id: transactionId},
              status: 'ongoing',
            },
            async () => {
              if (deliveryType !== 'Pickup') {
                await asyncStore(
                  STORE_KEYS.LAST_AREA.replace(
                    '{restaurant}',
                    String(outlet.id),
                  ),
                  {
                    area: area,
                    address: deliveryAddress,
                  },
                );
              }
              this.goToPaymentScreen();
            },
          );
        } catch (e) {
          if (__DEV__) {
          } else {
            BUGSNAG.notify(e);
          }
          Toast.alert(e.message);
          this.setState({isFetching: false});
        }
      },
    );
  };

  prefillLastArea = async () => {
    const {area} = this.state;
    const outlet = this.getRestaurant();
    if (!!area.length || !outlet) {
      return;
    }
    const lastArea = await asyncGet(
      STORE_KEYS.LAST_AREA.replace('{restaurant}', String(outlet.id)),
    );
    if (!lastArea) {
      return;
    }
    this.setState({
      area: lastArea.area,
      deliveryAddress: lastArea.address,
    });
  };

  updateRedemption = async () => {
    const {order, redeptionRef, status} = this.state;
    // stop if completed
    if (status === 'paid') {
      return;
    }
    this.setState({isFetching: true});
    await sleep(200);
    try {
      const result = await UpdateRedemption({
        reference: redeptionRef || '',
        purchase_reference: order ? order.transaction_id : '',
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
      return this.handleSetRestaurantOrderAsPaid();
    }
    this.setState({isFetching: true}, async () => {
      try {
        const redemption = await RedeemPoints(
          {
            amount: this.getTotal(),
            SBU: 'Restaurant',
          },
          {canceler: this.cancelRedeem},
        );
        this.setState(
          {
            isFetching: false,
            redeptionRef: redemption,
          },
          this.handleSetRestaurantOrderAsPaid,
        );
      } catch (e) {
        if (Axios.isCancel(e) || e.message === 'cancelled') {
          return;
        }
        // show error
        this.setState({isFetching: false}, () => {
          Alert.alert(
            'Points Unavailable',
            e.message,
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
    });
  };

  getSelectedItems = (): Array<CartItem> => {
    const {cart, navigation} = this.props;
    const items = navigation.getParam('items');
    if (!Array.isArray(items) || !cart || !Array.isArray(cart.items)) {
      return [];
    }
    return cart.items.filter(
      i => i.type === 'meal' && items.indexOf(i.id) !== -1,
    );
  };

  goToPaymentScreen() {
    const {user, navigation} = this.props;
    const {order, checkoutUrl, usePoints} = this.state;
    const outlet = this.getRestaurant();
    if (!outlet) {
      return Alert.alert(
        'Error',
        'Please select a restaurant before continuing.',
      );
    }
    if (usePoints) {
      return this.redeemPoints();
    }
    if (!user) {
      return Alert.alert('Attention', 'Please log in to continue.');
    }

    if (!order) {
      return;
    }

    navigation.navigate('MonnifyPayment', {
      paymentInfo: {
        amount: Number(order.total),
        customerName: user.first_name + ' ' + user.last_name,
        customerEmail: user.email,
        paymentReference: order.transaction_id,
        paymentDescription: 'Genesis restaurant.',
        checkoutUrl: checkoutUrl,
        paymentType: 'restaurant',
        incomeSplitConfig: [
          {
            subAccountCode: outlet.sub_account_code,
            feePercentage: 100,
            splitPercentage: 100,
            feeBearer: true,
          },
        ],
      },
      redirectValidation: this.handleRedirectValidation,
      onPaymentComplete: this.handlePaymentComplete,
      onPaymentInitialized: this.handlePaymentInitialized,
    });
  }

  addPoints = async () => {
    const {order} = this.state;
    // toggle fetch state
    this.setState({status: 'addingPoints', isFetching: true});
    await sleep(200);
    try {
      const result = await AddPoints({
        amount: this.getTotal(),
        SBU: 'Restaurant',
        purchase_ref: order ? order.transaction_id : '',
      });
      // update component status
      this.setState({
        status: 'verified',
        pointsGained: result.points_gained,
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
    this.handleSetRestaurantOrderAsPaid();
  };

  handleSetRestaurantOrderAsPaid = () => {
    const {order, isUpdatingOrder, usePoints} = this.state;
    // stop if already updating order
    if (isUpdatingOrder) {
      return;
    }
    // this actually will never happen
    if (!order) {
      return Alert.alert(
        'Error',
        'An error occurred, please contact the admin.',
      );
    }

    // if order status is already paid
    if (/verified/gi.test(order.status)) {
      if (!usePoints) {
        return this.addPoints();
      }
      return this.updateRedemption();
    }

    this.setState(
      {
        isUpdatingOrder: true,
        isFetching: true,
        status: 'updatingOrder',
      },
      async () => {
        try {
          const orderUpdate = await UpdateRestaurantOrder(order.id, {
            set_paid: true,
            transaction_id: order.transaction_id,
          });
          this.setState(
            {
              isUpdatingOrder: false,
              status: usePoints ? 'updatingRedemption' : 'addingPoints',
              order: {...orderUpdate, transaction_id: order.transaction_id},
            },
            () => {
              if (!usePoints) {
                return this.addPoints();
              }
              return this.updateRedemption();
            },
          );
        } catch (e) {
          // update component
          this.setState({
            isUpdatingOrder: false,
            status: 'updatingOrder',
            isFetching: false,
          });
          // get error message
          let errorMessage = e.message || 'An error occured, please try again.';
          if (/network/i.test(errorMessage)) {
            errorMessage =
              'Please check your internet connection and try again.';
          }
          // alert
          Alert.alert(
            'An Error Occurred',
            errorMessage,
            [{text: 'Try Again', onPress: this.handleSetRestaurantOrderAsPaid}],
            {cancelable: false},
          );
        }
      },
    );
  };

  handleUpdateCustomerInfo = () => {
    const {navigation} = this.props;
    navigation.navigate('Profile', {leaveAfterSave: true});
  };

  getDeliveryFee(): number {
    const {deliveryType} = this.state;
    const {deliveryFee} = this.props;
    return /deliver/i.test(deliveryType) ? deliveryFee : 0;
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
    return this.getSubTotal() + this.getDeliveryFee();
  }

  getTotalItems(): number {
    const items = this.getSelectedItems();
    if (!items.length) {
      return Number(0);
    }
    return Number(items.reduce((total, item) => total + item.quantity, 0));
  }

  getRestaurant(): Restaurant | null {
    const items = this.getSelectedItems();
    const [firstItem] = items;
    if (!firstItem) {
      return null;
    }
    return firstItem.restaurant || null;
  }

  filterList = (_item: CartItem, index: number): boolean => {
    const {showLess} = this.state;
    if (index >= 3 && showLess) {
      return false;
    }
    return true;
  };

  checkoutIsDisabled(): boolean {
    const {cart, user} = this.props;
    const {isFetching} = this.state;
    const hasItems = cart.items.filter(item => item.type === 'meal').length < 1;
    if (!user) {
      return true;
    }
    if (!user.first_name || !user.last_name || !user.billing.phone) {
      return true;
    }
    return isFetching || hasItems;
  }

  render() {
    const {navigation} = this.props;
    const {
      status,
      order,
      isFetching,
      isUpdatingOrder,
      usePoints,
      pointsBalance,
      pointsGained,
    } = this.state;
    const restaurant = this.getRestaurant();
    return (
      <Screen>
        <View style={styles.container}>
          {!restaurant ? (
            this.renderLoadRestaurants()
          ) : (
            <ScrollView style={styles.containerInner}>
              {this.renderItems()}
              {this.renderRestaurant()}
              {this.renderDeliveryOptionPicker()}
              {this.renderAreaPicker()}
              {this.renderFooter()}
            </ScrollView>
          )}
        </View>
        {order &&
        order.transaction_id &&
        (status === 'paid' ||
          status === 'verified' ||
          status === 'updatingOrder' ||
          status === 'addingPoints') &&
        navigation.isFocused() &&
        !usePoints ? (
          <MonnifyPaymentVerify
            onClose={this.handleClose}
            onComplete={this.handleVerificationCompleted}
            paymentReference={order.transaction_id}
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

  renderItems() {
    const {showLess} = this.state;
    return (
      <>
        {this.renderHeader()}
        <View style={styles.content}>
          {this.renderEmptyList()}
          {this.getSelectedItems()
            .filter(this.filterList, [])
            .map(this.renderCartItem)}
          {this.getSelectedItems().length > 3 ? (
            <View style={styles.expandList}>
              <TouchableOpacity
                style={styles.expandListButton}
                onPress={() => this.setState({showLess: !showLess})}>
                <Text style={styles.expandListButtonText}>
                  {showLess ? 'Show All' : 'Show Less'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </>
    );
  }

  renderLoadRestaurants() {
    const {navigation, cart} = this.props;
    return (
      <View style={styles.loadRestaurants}>
        {cart.items.filter(item => item.type === 'meal').length < 1 ? (
          <Text style={styles.loadRestaurantsError}>
            You have no selected item, please return to the menu and add items
            to your cart, and try again.
          </Text>
        ) : (
          <Text style={styles.loadRestaurantsError}>
            Failed to get your selected restaurant, please return to the cart
            and try again.
          </Text>
        )}
        <TouchableOpacity
          style={styles.loadRestaurantsButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.loadRestaurantsButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  renderAreaPicker() {
    const {deliveryType, area} = this.state;
    const restaurant = this.getRestaurant();
    if (deliveryType !== 'Delivery') {
      return null;
    }
    if (!restaurant) {
      return null;
    }
    return (
      <SelectSection
        icon={<Icon name="md-pin" color={colors.accent} size={32} />}
        options={restaurant.delivering_to}
        selected={area}
        onSelect={v => this.setState({area: v})}
        title="Your Area"
        placeholder="Select your area"
        attachedField={this.renderAddressInput()}
      />
    );
  }

  renderAddressInput() {
    const {deliveryAddress} = this.state;
    return (
      <View style={styles.deliveryLocationField}>
        <TextInput
          style={styles.deliveryLocationFieldInput}
          placeholder="Enter your address"
          value={deliveryAddress}
          onChangeText={v => this.setState({deliveryAddress: v})}
          underlineColorAndroid="rgba(0, 0, 0, 0)"
          textAlignVertical="center"
          selectionColor={colors.accent}
          placeholderTextColor={colors.gray500}
        />
      </View>
    );
  }

  renderDeliveryOptionPicker() {
    const {deliveryTypes, deliveryType} = this.state;
    return (
      <View style={styles.deliveryTypePicker}>
        <SelectSection
          icon={
            <Image
              source={deliveryImage}
              style={styles.selectSectionIcon}
              resizeMode="center"
            />
          }
          options={deliveryTypes}
          selected={deliveryType}
          onSelect={v => this.setState({deliveryType: v})}
          title="Delivery Option"
          placeholder="Select Delivery Option"
          description={
            !deliveryType
              ? undefined
              : `Delivery Fee: NGN ${this.getDeliveryFee().toFixed(2)}`
          }
        />
      </View>
    );
  }

  renderEmptyList = () => {
    if (this.getSelectedItems().length) {
      return null;
    }
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
    const {isFetching, status} = this.state;
    return (
      <View style={styles.footer}>
        {this.renderCustomerInfo()}
        <View style={styles.cartCosts}>
          <View style={styles.cartCostsRow}>
            <Text style={styles.cartCostsRowLabel}>Sub Total</Text>
            <Text style={styles.cartCostsRowValue}>
              {displayAmount(this.getSubTotal())}
            </Text>
          </View>
          <View style={styles.cartCostsRow}>
            <Text style={styles.cartCostsRowLabel}>Delivery Fee</Text>
            <Text style={styles.cartCostsRowValue}>
              {displayAmount(this.getDeliveryFee())}
            </Text>
          </View>
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
          disabled={this.checkoutIsDisabled()}>
          <View style={styles.checkoutButton}>
            <View
              style={[
                styles.checkoutButtonInner,
                this.checkoutIsDisabled() || isFetching
                  ? styles.checkoutButtonDisabled
                  : {},
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

  renderCustomerInfo() {
    const {user} = this.props;
    return (
      <View style={styles.customerInfo}>
        <View style={styles.customerInfoHeading}>
          <Text style={styles.customerInfoHeader} bold>
            CUSTOMER INFORMATION
          </Text>
          {user ? (
            <TouchableWithoutFeedback onPress={this.handleUpdateCustomerInfo}>
              <Text style={styles.changeButtonText}>Edit</Text>
            </TouchableWithoutFeedback>
          ) : null}
        </View>
        {!user.first_name ||
        !user.last_name ||
        !user.email ||
        !user.billing.phone ? (
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
                Please you need your name, email, and phone number to proceed.
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.customer}>
            <Text style={styles.customerName}>
              {user.first_name} {user.last_name}
            </Text>
            <Text style={styles.customerEmail}>{user.email}</Text>
            <Text style={styles.customerPhone}>{user.billing.phone}</Text>
          </View>
        )}
      </View>
    );
  }

  renderRestaurant() {
    const restaurant = this.getRestaurant();
    if (!restaurant) {
      return null;
    }
    return (
      <View style={styles.deliveryOutlet}>
        <View style={styles.deliveryOutletHeading}>
          <Text style={styles.deliveryOutletHeader} bold>
            OUTLET
          </Text>
        </View>
        <Text style={styles.deliveryOutletName}>{restaurant.outlet_name}</Text>
      </View>
    );
  }

  renderCartItem = (item: CartItem, index: number) => {
    const {cart} = this.props;
    return (
      <View style={styles.cartItem} key={index}>
        <View style={styles.cartItemInner}>
          <View style={styles.cartItemImageContainer}>
            <Image
              style={styles.cartItemImage}
              source={item.image ? {uri: item.image} : placeholderImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.cartItemContent}>
            <View style={styles.cartItemNameContainer}>
              <Text style={styles.cartItemName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.caption ? (
                <Text style={styles.cartItemCaption}>{item.caption}</Text>
              ) : null}
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

const SelectSection: React.FC<SelectSectionProps> = function SelectSection({
  placeholder,
  options,
  selected,
  description,
  title,
  error,
  disabled,
  icon,
  onSelect,
  attachedField,
}) {
  const handleSelect = React.useCallback(
    (v: string) => {
      if (!onSelect) {
        return;
      }
      onSelect(v);
    },
    [onSelect],
  );

  return (
    <View style={styles.selectSection}>
      <View style={styles.selectSectionInner}>
        <Text bold style={styles.selectSectionTitle}>
          {title}
        </Text>
        {error ? <Text style={styles.selectSectionError}>{error}</Text> : null}
        <View style={styles.selectSectionMain}>
          {icon ? (
            <View style={styles.selectSectionIconContainer}>{icon}</View>
          ) : null}
          <View style={styles.selectSectionTrigger}>
            <View
              style={[
                styles.selectSectionTriggerInner,
                attachedField
                  ? styles.selectSectionTriggerInnerWithAttached
                  : null,
              ]}>
              <Menu>
                <MenuTrigger
                  customStyles={{
                    triggerText: [
                      styles.selectSectionTriggerText,
                      options.indexOf(selected) !== -1
                        ? styles.selectSectionTriggerTextSelected
                        : {},
                    ],
                  }}
                  text={
                    options.indexOf(selected) !== -1
                      ? options[options.indexOf(selected)]
                      : placeholder
                  }
                  disabled={disabled || !options.length}
                />
                <MenuOptions>
                  {options.map(item => (
                    <MenuOption
                      key={item}
                      onSelect={() => handleSelect(item)}
                      text={item}
                      style={styles.selectSectionOption}
                    />
                  ))}
                </MenuOptions>
              </Menu>
            </View>
            {attachedField}
          </View>
        </View>
        {description ? (
          <Text style={styles.selectSectionDescription}>{description}</Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  expandListButtonText: {
    color: colors.accent,
    fontSize: 10,
  },
  expandListButton: {
    padding: 4,
  },
  expandList: {
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  loadRestaurantsButtonText: {
    color: colors.accent,
    fontSize: 16,
  },
  loadRestaurantsButton: {
    padding: 8,
  },
  loadRestaurantsError: {
    marginHorizontal: 32,
    color: colors.gray700,
    textAlign: 'center',
    marginBottom: 4,
  },
  loadRestaurantsText: {
    textAlign: 'center',
    color: colors.gray500,
    marginTop: 4,
    fontSize: 12,
  },
  loadRestaurants: {
    alignItems: 'center',
    flex: 1,
    marginTop: 72,
  },
  deliveryTypePicker: {},
  deliveryLocationFieldInput: {
    height: 24,
    backgroundColor: colors.gray200,
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 6,
    fontSize: 14,
    color: colors.black,
  },
  deliveryLocationField: {
    height: 40,
  },
  selectSectionOption: {
    padding: 8,
  },
  selectSectionTriggerInnerWithAttached: {
    marginBottom: 8,
  },
  selectSectionTriggerInner: {
    backgroundColor: colors.gray200,
  },
  selectSectionTrigger: {
    flex: 1,
  },
  selectSectionTriggerTextSelected: {
    color: colors.black,
  },
  selectSectionTriggerText: {
    color: colors.gray500,
    fontSize: 14,
    marginVertical: 4,
    paddingHorizontal: 4,
  },
  selectSectionDescription: {
    color: colors.black,
    fontSize: 10,
    paddingLeft: 48,
  },
  selectSectionIcon: {
    width: 32,
    height: 32,
  },
  selectSectionIconContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 16,
  },
  selectSectionMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  selectSectionError: {
    color: colors.danger,
    fontSize: 12,
    marginBottom: 8,
  },
  selectSectionTitle: {
    color: colors.black,
    fontSize: 12,
    marginBottom: 8,
  },
  selectSectionInner: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: colors.white,
    ...Platform.select({
      android: {},
      ios: {
        overflow: 'hidden',
      },
    }),
  },
  selectSection: {
    marginHorizontal: 32,
    marginBottom: 24,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    backgroundColor: colors.white,
    elevation: 3,
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
  deliveryOutletName: {
    color: colors.gray500,
    fontSize: 14,
  },
  deliveryOutletEmptyText: {
    color: colors.black,
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  deliveryOutletEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 8,
    padding: 16,
    backgroundColor: colors.gray200,
    borderRadius: 8,
  },
  deliveryOutletHeader: {
    color: colors.black,
    fontSize: 10,
    marginBottom: 4,
    flex: 1,
  },
  deliveryOutletHeading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryOutlet: {
    marginTop: 8,
    marginHorizontal: 40,
    marginBottom: 24,
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
    marginBottom: getStatusBarHeight(true) > 20 ? 40 : 20,
  },
  listHeaderTitle: {
    textAlign: 'center',
    color: colors.black,
    fontSize: 12,
  },
  listHeader: {
    marginTop: 32,
    marginBottom: 4,
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
    backgroundColor: colors.white,
    elevation: 3,
    ...Platform.select({
      android: {
        borderRadius: 10,
        // backgroundColor: colors.white,
        overflow: 'hidden',
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
    marginBottom: 16,
  },
  containerInner: {},
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

export default withLocation(
  withCart(withUser(withDynamiConfig(RestaurantCheckout))),
);
