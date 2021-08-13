import React from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  TouchableWithoutFeedback,
  ImageBackground,
  Image,
  Animated,
  FlatList,
  PanResponder,
  PanResponderInstance,
  Platform,
  TouchableOpacity,
  NativeSyntheticEvent,
  BackHandler,
  NativeEventSubscription,
  Alert,
} from 'react-native';
import {NavigationState, NavigationParams} from 'react-navigation';
import {StackActions} from 'react-navigation';
import {NavigationStackScreenProps} from 'react-navigation-stack';
import colors from 'configs/colors';
import Text from '../Text/Text';
import {displayAmount, rgba, sleep, thousand} from 'utils/Misc';
import {withCart, CartItem, CartItemType} from 'contexts/CartContext';
import VectorIcon from '../VectorIcon/VectorIcon';
import {withUser, UserInterface} from 'contexts/UserContext';
import ViewPager, {
  ViewPagerOnPageSelectedEventData,
} from '@react-native-community/viewpager';
import {getCurrentRouteName} from 'navigation/AppStack';
import {getStatusBarHeight} from 'react-native-status-bar-height';
import {withDynamiConfig} from '../../contexts/DynamicConfigsContext';
import Axios, {Canceler} from 'axios';
import GetTotalPoints from '../../api/GetTotalPoints';
import RestaurantHoursApi, {
  IRestaurantHour,
  IRestaurantHourDay,
} from 'api/RestaurantHours.api';
import {Restaurant} from 'api/Restaurants.api';
const coinImage = require('../../assets/rewards/reward-188x210.jpg');
const placeholderImage = require('../../assets/general/placeholder-300x300.jpg');
const filemPlaceholderImage = require('../../assets/cinemas/placeholder-film.png');
const tabBgLeft = require('../../assets/tab/tab-bg-left.png');
const tabBgRight = require('../../assets/tab/tab-bg-right.png');
const homeIcon = require('../../assets/tab/home-icon78x81.png');
const transactionIcon = require('../../assets/tab/transactions-icon-99x78.png');
const cartIcon = require('../../assets/tab/cart-icon-112x135.png');
const indicator = require('../../assets/tab/cart-indicator-12x12.png');
const coinImageDimension = 164 / 151;
const coinImageWithPercentage = 30 / 375;
const cartHandleSize = 65;
const cartOptionSize = 29;
const {height, width} = Dimensions.get('window');
const cartHeight = height * 0.68;
const tabHeight = 58;
const minHandleBottom = 24;
const maxHandleBottom = cartHeight - cartHandleSize / 2;
const cartItemHight =
  Math.ceil(cartHeight * 0.144) > 66 ? 66 : Math.ceil(cartHeight * 0.144);

/**
 * This basically returns how much of the cart should be
 * revealed base don the percentage passed, it returns a
 * negative number.
 * @param percentage
 * @return number
 */
const calculateCartBottom = (percentage: number) => {
  return 0 - (cartHeight - tabHeight - percentage * (cartHeight - tabHeight));
};

interface TabProps extends NavigationStackScreenProps<NavigationParams> {
  position: Animated.Value;
  navigationState: NavigationState;
  cart: {
    add: (item: CartItem) => void;
    remove: (itemId: string) => void;
    update: (itemId: string, item: CartItem) => void;
    items: Array<CartItem>;
  };
  user: UserInterface;
  deliveryFee: number;
}

interface TabState {
  cartBottom: Animated.Value;
  cartOpacity: Animated.Value;
  overlayOpacity: Animated.Value;
  handleBottom: Animated.Value;
  expand: boolean;
  expanded: boolean;
  panResponder: PanResponderInstance | null;
  optionIconVisibility: Animated.Value;
  isSelectingOption: boolean;
  cartType: CartItemType | null;
  currentTab: number;
  selectedItems: Array<string>;
  hideTabbar: boolean;
  isPending: boolean;
  points: number | null;
  restaurantHours: IRestaurantHour[] | null | 'fetching' | 'error';
}

class Tab extends React.Component<TabProps, TabState> {
  state: TabState = {
    cartBottom: new Animated.Value(calculateCartBottom(0)),
    cartOpacity: new Animated.Value(0),
    overlayOpacity: new Animated.Value(0),
    handleBottom: new Animated.Value(minHandleBottom),
    expand: false,
    expanded: false,
    hideTabbar: false,
    panResponder: null,
    optionIconVisibility: new Animated.Value(0),
    isSelectingOption: false,
    cartType: null,
    currentTab: 0,
    selectedItems: [],
    isPending: false,
    points: null,
    restaurantHours: null,
  };

  panResponder?: PanResponderInstance;

  viewpager: ViewPager | null = null;

  backHandler?: NativeEventSubscription;

  cancelGetPoints?: Canceler;

  constructor(props: TabProps) {
    super(props);
  }

  componentDidMount() {
    this.getPoints();
  }

  componentWillUnmount() {
    this.collapse();
    if (this.cancelGetPoints) {
      this.cancelGetPoints();
    }
  }

  subscribeHardwareBackPress = () => {
    this.unsubscribeHardwareBackPress();
    this.backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackPress,
    );
  };

  unsubscribeHardwareBackPress = () => {
    if (this.backHandler) {
      this.backHandler.remove();
    }
  };

  handleBackPress = () => {
    if (this.state.expand) {
      this.collapse();
      return true;
    }
    return false;
  };

  setupPanResponder() {
    const panResponder = PanResponder.create({
      onStartShouldSetPanResponderCapture: (_evt, _gestureState) => true,
      onMoveShouldSetPanResponder: (_evt, _gestureState) => true,
      onPanResponderMove: (_evt, gestureState) => {
        const moveY = height - gestureState.moveY;
        if (moveY >= cartHeight) {
          return this.handleAnimateCart({amount: cartHeight});
        }
        if (moveY - (minHandleBottom - 10) < 1) {
          return this.handleAnimateCart({amount: 0});
        }
        return this.handleAnimateCart({amount: moveY - cartHandleSize / 2});
      },
      onPanResponderTerminationRequest: (_evt, _gestureState) => true,
      onPanResponderRelease: (_evt, gestureState) => {
        const moveY = height - gestureState.moveY;
        // stop when user has gestured past the threshold(cart maximum height)
        if (moveY > cartHeight) {
          return;
        }

        // user has bearly opened the cart
        if (moveY - (minHandleBottom - 5) < 1) {
          return this.handleAnimateCart({amount: 0, expand: false});
        }

        // user has gestured downwards
        if (gestureState.dy >= 0) {
          return this.handleAnimateCart({
            amount: 0,
            expand: false,
            speed: 200 * (moveY / cartHeight),
          });
        }

        // when user has gestured upwards
        if (gestureState.dy <= -1) {
          return this.handleAnimateCart({
            amount: cartHeight,
            expand: true,
            speed: 200 * ((cartHeight - moveY) / cartHeight),
          });
        }
      },
      onPanResponderTerminate: (_evt, gestureState) => {
        // user has gestured downwards
        if (gestureState.dy >= -1) {
          return this.handleAnimateCart({amount: 0, expand: false, speed: 200});
        }

        // when user has upwards
        if (gestureState.dy <= 0) {
          return this.handleAnimateCart({
            amount: cartHeight,
            expand: true,
            speed: 200,
          });
        }
      },
      onShouldBlockNativeResponder: (_evt, _gestureState) => true,
    });

    this.setState({panResponder});
  }

  handleAnimateCart(
    props: {amount?: number; expand?: boolean; speed?: number} = {},
  ) {
    const {expanded} = this.state;
    const expand = typeof props.expand === 'boolean' ? props.expand : true;
    const amount = typeof props.amount === 'number' ? props.amount : 0;
    const speed = typeof props.speed === 'number' ? props.speed : 10;
    const percentage = amount / cartHeight;
    if (expanded !== expand) {
      return this.setState(
        {
          expand: expand,
        },
        () => {
          this.animateCartHandle({amount, speed});
          this.animateCart({percentage, speed});
        },
      );
    }
    this.animateCartHandle({amount, speed});
    this.animateCart({percentage, speed});
  }

  handleOverlayPress = () => {
    this.collapse();
  };

  handleHomeTabPress = async () => {
    const {navigation} = this.props;
    this.dismiss();
    await sleep(200);
    navigation.dispatch(StackActions.popToTop());
  };

  handleTransactionTabPress = async () => {
    const {navigation, user} = this.props;
    this.dismiss();
    await sleep(200);
    if (!user) {
      return navigation.navigate('LogIn', {
        afterLogin: () => {
          navigation.navigate('TicketsHistory');
        },
      });
    }
    navigation.navigate('TicketsHistory');
  };

  handlePageSelected = (
    ev: NativeSyntheticEvent<ViewPagerOnPageSelectedEventData>,
  ) => {
    const {nativeEvent} = ev;
    this.setState({
      currentTab: nativeEvent.position,
      cartType: tabs[nativeEvent.position].name,
    });
  };

  handleSelectPage = (index: number) => {
    if (this.viewpager) {
      this.viewpager.setPageWithoutAnimation(index);
    }
  };

  handleCartHandlePress = async () => {
    const {expand} = this.state;
    if (expand) {
      return this.collapse();
    }
    this.smartSelectTab();
    this.expand();
  };

  handleCheckout = async () => {
    const {cartType} = this.state;
    switch (cartType) {
      case 'meal':
        return this.handleRestaurantCheckout();
      case 'ticket':
        return this.handleCinemaCheckout();
      case 'room':
        return this.handleHotelCheckout();
      default:
        return;
    }
  };

  handleRestaurantCheckout = async () => {
    const {navigation, user} = this.props;
    const {selectedItems} = this.state;
    const hasSingleLocation = this.hasOnlyOneLoacation('meal');
    const restaurant = this.getRestaurant();
    const closeStatus = this.getCurrentDayStatus();

    let items = this.getTypeItems('meal').filter(
      item => item.id && selectedItems.indexOf(item.id) !== -1,
    );

    // get all items if has single location and no item is selected
    if (!items.length && hasSingleLocation) {
      items = this.getTypeItems('meal');
    }

    if (!items.length && !hasSingleLocation) {
      return Alert.alert(
        'Attention',
        'Please select items in your cart to checkout.',
      );
    }

    if (this.hasMultipleLocations(items)) {
      return Alert.alert(
        'Attention',
        'You can only checkout items from one outlet at a time.',
      );
    }

    if (restaurant && restaurant.closed) {
      return Alert.alert(
        'Restaurant Closed',
        'This resturant is closed for the moment, please check back some other time.',
      );
    }

    if (closeStatus !== 'open') {
      const nextOpenTime = this.getNextOpenHours();
      return Alert.alert(
        closeStatus === 'closed' ? 'Closed' : 'Not Open Yet',
        closeStatus === 'closed'
          ? `Sorry but we're closed, please check back in tomorrow${
              nextOpenTime
                ? ' at ' + nextOpenTime.open_time.split('+')[0] + ' WAT.'
                : ''
            }.`
          : `Sorry but we're not yet open for the day${
              nextOpenTime
                ? ' please check back at ' +
                  nextOpenTime.open_time.split('+')[0] +
                  ' WAT.'
                : ''
            }
        .`,
      );
    }

    const selected = items.map(item => item.id);

    if (!user) {
      return navigation.navigate('LogIn', {
        afterLogin: () =>
          navigation.navigate('RestaurantCheckout', {items: selected}),
      });
    }
    navigation.navigate('RestaurantCheckout', {items: selected});
    await sleep(200);
    this.dismiss();
  };

  handleCinemaCheckout = async () => {
    const {navigation, user} = this.props;
    const {selectedItems} = this.state;
    const hasSingleLocation = this.hasOnlyOneLoacation('ticket');
    let items = this.getTypeItems('ticket').filter(
      item => item.id && selectedItems.indexOf(item.id) !== -1,
    );

    // get all items if has single location and no item is selected
    if (!items.length && hasSingleLocation) {
      items = this.getTypeItems('ticket');
    }

    if (!items.length && hasSingleLocation) {
      return Alert.alert(
        'Attention',
        'Please select items in your cart to checkout.',
      );
    }

    if (this.hasMultipleLocations(items)) {
      return Alert.alert(
        'Attention',
        'You can only checkout items from one location at a time.',
      );
    }

    const selected = items.map(item => item.id);
    const cinema = items[0].data.cinema;

    if (!user) {
      return navigation.navigate('LogIn', {
        afterLogin: () =>
          navigation.navigate('CinemaCheckout', {
            items: selected,
            cinema: cinema,
          }),
      });
    }

    navigation.navigate('CinemaCheckout', {
      items: selected,
      cinema: cinema,
    });

    await sleep(200);
    this.dismiss();
  };

  handleHotelCheckout = async () => {
    const {navigation, user} = this.props;
    const {selectedItems} = this.state;
    const hasSingleLocation = this.hasOnlyOneLoacation('room');
    let items = this.getTypeItems('room').filter(
      item => item.id && selectedItems.indexOf(item.id) !== -1,
    );

    // get all items if has single location and no item is selected
    if (!items.length && hasSingleLocation) {
      items = this.getTypeItems('room');
    }

    if (!items.length && !hasSingleLocation) {
      return Alert.alert(
        'Attention',
        'Please select rooms within your cart to checkout.',
      );
    }

    if (this.hasMultipleLocations(items)) {
      return Alert.alert(
        'Attention',
        'You can only checkout items from one hoteal at a time.',
      );
    }

    const selected = items.map(item => item.id);
    const hotel = items[0].data.hotel;

    if (!user) {
      return navigation.navigate('LogIn', {
        afterLogin: () =>
          navigation.navigate('HotelCheckout', {
            items: selected,
            hotel: hotel,
          }),
      });
    }

    navigation.navigate('HotelCheckout', {
      items: selected,
      hotel: hotel,
    });

    await sleep(200);
    this.dismiss();
  };

  hasOnlyOneLoacation = (cartType: CartItemType): boolean => {
    const {cart} = this.props;
    const locations: string[] = [];
    if (!cartType) {
      return false;
    }
    const typeItems = cart.items.filter(i => i.type === cartType);
    for (let i = 0; i < typeItems.length; i++) {
      if (locations.indexOf(typeItems[i].location) !== -1) {
        continue;
      }
      locations.push(typeItems[i].location);
    }
    return locations.length === 1;
  };

  hasMultipleLocations = (list: Array<CartItem>) => {
    let location = null;
    for (let i = 0; i < list.length; i++) {
      if (location === null) {
        location = list[i].location;
        continue;
      }
      if (location !== list[i].location) {
        return true;
      }
    }
    return false;
  };

  toggleItemSelect = (itemId: string) => {
    if (!itemId) {
      return;
    }
    this.setState(({selectedItems}) => ({
      selectedItems:
        selectedItems.indexOf(itemId) === -1
          ? [...selectedItems, itemId]
          : selectedItems.filter(item => item !== itemId),
    }));
  };

  handleToggleGroupSelect = (label: string, type: CartItemType) => {
    const {cart} = this.props;
    const {selectedItems} = this.state;
    let cartItems: Array<string | undefined> = cart.items
      .filter(item => item.type === type && item.location === label)
      .map(item => item.id)
      .filter(item => item !== undefined && item !== null);
    if (this.isGroupSelected(label, type)) {
      return this.setState(state => ({
        selectedItems: state.selectedItems.filter(
          selected => selected && cartItems.indexOf(selected) === -1,
        ),
      }));
    }
    cartItems = cartItems.filter(
      item => item && selectedItems.indexOf(item) === -1,
    );
    this.setState(state => ({
      selectedItems: [
        ...state.selectedItems,
        ...cartItems.filter(i => i !== undefined),
      ],
    }));
  };

  getTypeItems(type: CartItemType): Array<CartItem> {
    const {cart} = this.props;
    if (!cart || !cart.items || !cart.items.length) {
      return [];
    }
    return cart.items.filter(item => item.type === type);
  }

  isGroupSelected = (label: string, type: CartItemType) => {
    const {cart} = this.props;
    const {selectedItems} = this.state;
    // we get the total number of items of the given group
    const groupItems = cart.items
      .filter(item => item.type === type)
      .filter(item => item.location === label);
    const totalItemsSelected = groupItems.filter(
      item => item.id && selectedItems.indexOf(item.id) !== -1,
    ).length;
    return totalItemsSelected >= groupItems.length;
  };

  dismiss = () => {
    this.collapse();
  };

  animateCart = (prop: {percentage: number; speed?: number}) => {
    const speed = typeof prop.speed === 'number' ? prop.speed : 200;
    const {expand} = this.state;

    // warn user to make sure percentage is between 0 and 1
    if (prop.percentage > 1 && __DEV__) {
      console.warn(
        'Invalid percentage given [' +
          prop.percentage +
          ']. Percentage for cart animation must be between 0 and 1.',
      );
    }

    // set bottom value
    const topValue = calculateCartBottom(prop.percentage);

    // set opacity value
    const opacityValue =
      expand && prop.percentage * 1 < 0.85 ? 0.85 : prop.percentage * 1;

    if (!expand) {
      this.setState({
        hideTabbar: false,
      });
    }

    // animate overlay
    this.animateOverlay(prop);

    // play animation
    Animated.parallel([
      Animated.timing(this.state.cartBottom, {
        toValue: topValue,
        duration: speed,
      }),
      Animated.timing(this.state.cartOpacity, {
        toValue: opacityValue,
        duration: speed,
      }),
    ]).start(() => {
      this.setState(state => ({
        expanded: state.expand,
        hideTabbar: state.expand,
      }));
    });
  };

  animateOverlay = (prop: {percentage: number; speed?: number}) => {
    // set speed
    const speed = typeof prop.speed === 'number' ? prop.speed : 200;
    // set opacity value
    const opacityValue = prop.percentage * 1;
    // animate view
    Animated.timing(this.state.overlayOpacity, {
      toValue: opacityValue > 0.6 ? 0.6 : opacityValue,
      duration: speed,
    }).start();
  };

  animateCartHandle = (prop: {amount: number; speed?: number}) => {
    const speed = typeof prop.speed === 'number' ? prop.speed : 200;
    // play animation
    Animated.timing(this.state.handleBottom, {
      toValue:
        prop.amount < minHandleBottom
          ? minHandleBottom
          : prop.amount > maxHandleBottom
          ? maxHandleBottom
          : prop.amount,
      duration: speed,
    }).start();
  };

  smartSelectTab() {
    const {navigation, cart} = this.props;
    const currentRouteName = getCurrentRouteName(navigation.state);
    if (currentRouteName && ScreenCart[currentRouteName]) {
      const tabIndex = tabs.findIndex(
        item => item.name === ScreenCart[currentRouteName],
      );
      if (tabIndex !== -1) {
        return this.setState({currentTab: tabIndex});
      }
    }
    // get first item in cart
    const lastCartItem = cart.items[0];
    if (!lastCartItem) {
      return;
    }
    return this.setState({
      currentTab:
        lastCartItem.type === 'meal' ? 0 : lastCartItem.type === 'room' ? 1 : 2,
    });
  }

  expand = () => {
    this.setState(
      () => ({
        expand: true,
        expanded: true,
      }),
      () => {
        this.fetchRestaurantHours();
        this.getPoints();
        this.animateCart({percentage: 1});
        this.animateCartHandle({amount: maxHandleBottom});
      },
    );
    this.subscribeHardwareBackPress();
  };

  collapse = () => {
    this.unsubscribeHardwareBackPress();
    this.setState(
      {
        expand: false,
      },
      () => {
        this.animateCart({percentage: 0});
        this.animateCartHandle({amount: minHandleBottom});
      },
    );
  };

  getServiceFee() {
    const {cartType} = this.state;
    if (this.getSubTotal() < 1 || cartType === 'meal') {
      return 0;
    }
    return 0;
  }

  getPoints = async () => {
    const {user} = this.props;
    const {isPending} = this.state;
    if (!user || isPending) {
      return null;
    }
    try {
      this.setState({
        isPending: true,
      });
      await sleep(100);
      const points = await GetTotalPoints({canceler: this.cancelGetPoints});
      this.setState({
        points: points,
        isPending: false,
      });
    } catch (e) {
      if (Axios.isCancel(e) || e.message === 'cancelled') {
        return;
      }
      this.setState({
        isPending: false,
      });
    }
  };

  fetchRestaurantHours = async () => {
    const {restaurantHours} = this.state;
    if (restaurantHours === 'fetching' || Array.isArray(restaurantHours)) {
      return;
    }
    this.setState(
      {
        restaurantHours: 'fetching',
      },
      async () => {
        const response = await RestaurantHoursApi();
        this.setState({
          restaurantHours: response.data ? response.data : 'error',
        });
      },
    );
  };

  getSelectedItems(): CartItem[] {
    const {cart} = this.props;
    const {cartType, selectedItems} = this.state;
    if (!cart.items.length || !cartType || !selectedItems) {
      return [];
    }
    if (!selectedItems.length) {
      return cart.items.filter(item => item && item.type === cartType);
    }
    return cart.items.filter(
      cartItem =>
        selectedItems.findIndex(selectedItem => {
          if (!cartItem.id) {
            return false;
          }
          return selectedItem === cartItem.id && cartItem.type === cartType;
        }) !== -1,
    );
  }

  getSubTotal(): number {
    const {cart} = this.props;
    const {cartType, selectedItems} = this.state;
    if (!cart.items.length || !cartType || !selectedItems) {
      return Number(0);
    }
    if (!selectedItems.length) {
      return Number(
        cart.items
          .filter(item => item && item.type === cartType)
          .reduce((total, item) => {
            if (!item) {
              return total;
            }
            return total + item.price * item.quantity;
          }, 0),
      );
    }
    return Number(
      selectedItems
        .map(item => cart.items.find(i => i.id === item))
        .filter(item => item && item.type === cartType)
        .reduce((total, item) => {
          if (!item) {
            return total;
          }
          return total + item.price * item.quantity;
        }, 0),
    );
  }

  getTotal(): number {
    return this.getSubTotal() + this.getServiceFee();
  }

  getCheckoutButtonLabel(): string {
    const {cartType} = this.state;
    switch (cartType) {
      case 'room':
        return 'Confirm';
      default:
        return 'Checkout';
    }
  }

  isCheckoutDisabled(): boolean {
    const {cart} = this.props;
    const {restaurantHours, cartType} = this.state;
    const nextOpenTime = this.getCurrentDayStatus();
    if (!Array.isArray(restaurantHours) && cartType === 'meal') {
      return true;
    }
    if (nextOpenTime !== 'open' && cartType === 'meal') {
      return true;
    }
    return !(cart.items.filter(item => item.type === cartType).length > 0);
  }

  getRestaurant(): Restaurant | null {
    const selectedItems = this.getSelectedItems();
    const meal = selectedItems.find(i => i.type === 'meal');
    if (!meal) {
      return null;
    }
    return meal.restaurant || null;
  }

  getCurrentDayStatus(): 'not-open-yet' | 'open' | 'closed' | null {
    const d = new Date();
    const openHours = this.getCurrentOpenHours();
    const currentTime = Date.now();
    if (!openHours || !openHours.open_time || !openHours.close_time) {
      return null;
    }
    const openTime = new Date(
      d.toISOString().split('T')[0] + 'T' + openHours.open_time,
    ).getTime();
    const closeTime = new Date(
      d.toISOString().split('T')[0] + 'T' + openHours.close_time,
    ).getTime();
    if (currentTime < openTime) {
      return 'not-open-yet';
    }
    if (currentTime > closeTime) {
      return 'closed';
    }
    return 'open';
  }

  getCurrentOpenHours(): IRestaurantHour | null {
    const {restaurantHours} = this.state;
    const d = new Date();
    const dayOfWeek = d.getDay();
    if (!Array.isArray(restaurantHours)) {
      return null;
    }
    const dayofWeekName: string = RestaurantHourDays[dayOfWeek];
    const dayOfWeekHours = restaurantHours.find(i => i.day === dayofWeekName);
    if (!dayOfWeekHours) {
      return null;
    }
    return dayOfWeekHours || null;
  }

  getNextOpenHours(): IRestaurantHour | null {
    const {restaurantHours} = this.state;
    const d = new Date();
    const dayOfWeek = d.getDay();
    const nextDayOfWeek = dayOfWeek >= 6 ? 0 : dayOfWeek + 1;
    if (!Array.isArray(restaurantHours)) {
      return null;
    }
    const nextDayOfWeekName: string = RestaurantHourDays[nextDayOfWeek];
    const nextDayOfWeekHours = restaurantHours.find(
      i => i.day === nextDayOfWeekName,
    );
    if (!nextDayOfWeekHours) {
      return null;
    }
    return nextDayOfWeekHours || null;
  }

  reduceCartList = (
    all: Array<{
      items: Array<CartItem>;
      label: string;
      type: CartItemType;
    }>,
    item: CartItem,
  ) => {
    let exist = all.findIndex(i => i.label === item.location);
    if (exist === -1) {
      all.push({
        items: [item],
        type: item.type,
        label: item.location,
      });
    } else {
      all[exist].items.push(item);
    }
    return all;
  };

  render() {
    const {expanded, overlayOpacity} = this.state;
    return (
      <>
        {expanded ? (
          <TouchableWithoutFeedback onPress={this.handleOverlayPress}>
            <Animated.View
              style={[styles.overlay, {opacity: overlayOpacity}]}
            />
          </TouchableWithoutFeedback>
        ) : null}
        {this.renderTabBar()}
        {this.renderCart()}
        {this.renderCartHandle()}
      </>
    );
  }

  renderCart() {
    const {cartBottom, cartOpacity, expand, expanded, currentTab} = this.state;
    const {cart} = this.props;
    if (!expand && !expanded) {
      return null;
    }
    return (
      <Animated.View
        style={[styles.cart, {bottom: cartBottom, opacity: cartOpacity}]}>
        <View style={styles.cartInner}>
          <View style={styles.content}>
            <View style={{flex: 1}}>
              <Text bold style={styles.cartHeading}>
                My Cart!
              </Text>
              {this.renderCartTabs()}
              <ViewPager
                ref={ref => (this.viewpager = ref)}
                initialPage={currentTab}
                style={styles.viewpager}
                onPageSelected={this.handlePageSelected}>
                <View style={styles.cartItemsContainer}>
                  <FlatList
                    style={styles.cartItems}
                    data={cart.items
                      .filter(item => item.type === 'meal')
                      .reduce(this.reduceCartList, [])}
                    renderItem={this.renderCartItemsGroup}
                    keyExtractor={item => String(item.label)}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={true}
                  />
                </View>

                <View style={styles.cartItemsContainer}>
                  <FlatList
                    style={styles.cartItems}
                    data={cart.items
                      .filter(item => item.type === 'room')
                      .reduce(this.reduceCartList, [])}
                    renderItem={this.renderCartItemsGroup}
                    keyExtractor={item => String(item.label)}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={true}
                  />
                </View>

                <View style={styles.cartItemsContainer}>
                  <FlatList
                    style={styles.cartItems}
                    data={cart.items
                      .filter(item => item.type === 'ticket')
                      .reduce(this.reduceCartList, [])}
                    renderItem={this.renderCartItemsGroup}
                    keyExtractor={item => String(item.label)}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={true}
                  />
                </View>
              </ViewPager>
            </View>
            {this.renderCartBottom()}
            {this.renderPoints()}
          </View>
        </View>
      </Animated.View>
    );
  }

  renderPoints() {
    const {user} = this.props;
    const {points, isPending} = this.state;
    if (!user) {
      return null;
    }
    return (
      <View style={styles.pointsContainer}>
        {typeof points !== 'number' ? null : (
          <Image
            source={coinImage}
            style={styles.coinImage}
            resizeMode="contain"
          />
        )}
        {typeof points === 'number' ? (
          <View style={styles.pointsMain}>
            <Text bold style={styles.points}>
              {thousand(points)}
            </Text>
            <Text bold style={styles.pointsLabel}>
              Points
            </Text>
          </View>
        ) : isPending ? null : (
          <TouchableOpacity
            onPress={this.getPoints}
            style={styles.pointsErrorContainer}>
            <VectorIcon
              name="md-warning"
              color={colors.danger}
              size={24}
              style={styles.pointsErrorIcon}
            />
            <Text style={styles.pointsError}>Load points</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  renderCartTabs() {
    return <View style={styles.cartTabs}>{tabs.map(this.renderCartTab)}</View>;
  }

  renderCartTab = (item: {name: any; displayName: string}, index: number) => {
    const {cartType} = this.state;
    return (
      <TouchableWithoutFeedback
        key={index}
        onPress={() => this.handleSelectPage(index)}>
        <View style={styles.cartTab}>
          <View
            style={[
              styles.cartTabIndicator,
              cartType === item.name ? styles.cartTabIndicatorActive : null,
            ]}
          />
          <Text
            style={[
              styles.cartTabLabel,
              cartType === item.name ? styles.cartTabLabelActive : null,
            ]}>
            {item.displayName}
          </Text>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  renderCartItemsGroup = (props: {
    item: {
      label: string;
      type: CartItemType;
      items: Array<CartItem>;
    };
    index: number;
  }) => {
    const {item} = props;
    return (
      <View style={styles.cartGroupItem}>
        <View style={styles.cartGroupItemInner}>
          <TouchableWithoutFeedback
            onPress={() => this.handleToggleGroupSelect(item.label, item.type)}>
            <View style={styles.cartGroupLabel}>
              <VectorIcon
                name={
                  this.isGroupSelected(item.label, item.type)
                    ? 'md-checkbox'
                    : 'md-square-outline'
                }
                color={
                  this.isGroupSelected(item.label, item.type)
                    ? colors.accent
                    : colors.gray400
                }
                size={16}
                style={styles.cartGroupLabelCheckbox}
              />
              <Text style={styles.cartGroupLabelText} numberOfLines={1}>
                {item.type === 'room'
                  ? ''
                  : item.type === 'meal'
                  ? 'Outlet:'
                  : 'Location:'}{' '}
                {item.label}
              </Text>
            </View>
          </TouchableWithoutFeedback>
          <View style={styles.cartGroupItems}>
            {item.items.map(this.renderCartItem)}
          </View>
        </View>
      </View>
    );
  };

  renderCartItem = (item: CartItem, index: number) => {
    const {cart} = this.props;
    const {selectedItems} = this.state;
    const imagePlaceholder =
      item.type === 'ticket' ? filemPlaceholderImage : placeholderImage;
    return (
      <View style={styles.cartItemContaier} key={index}>
        <TouchableWithoutFeedback
          onPress={() => this.toggleItemSelect(item.id)}>
          <VectorIcon
            name={
              item.id && selectedItems.indexOf(item.id) !== -1
                ? 'md-checkbox'
                : 'md-square-outline'
            }
            color={
              item.id && selectedItems.indexOf(item.id) !== -1
                ? colors.accent
                : colors.gray400
            }
            style={styles.cartItemCheckbox}
            size={16}
          />
        </TouchableWithoutFeedback>
        <View style={styles.cartItem} key={index}>
          <View style={styles.cartItemInner}>
            <View style={styles.cartItemImageContainer}>
              <Image
                style={styles.cartItemImage}
                source={item.image ? {uri: item.image} : imagePlaceholder}
                resizeMode="cover"
              />
            </View>
            <View style={styles.cartItemContent}>
              <View style={styles.cartItemNameContainer}>
                <Text style={styles.cartItemName} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.caption && item.type !== 'room' ? (
                  <Text style={styles.cartItemNameCaption}>{item.caption}</Text>
                ) : null}
              </View>
              <View style={styles.quantitySelector}>
                <Text style={styles.quantitySelectorLabel}>Quantity: </Text>
                <View style={styles.quantitySelectorControls}>
                  <TouchableWithoutFeedback
                    disabled={item.quantity <= 1}
                    onPress={() =>
                      cart.update(item.id, {
                        ...item,
                        quantity: item.quantity - 1,
                      })
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
                      cart.update(item.id, {
                        ...item,
                        quantity: item.quantity + 1,
                      })
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
      </View>
    );
  };

  renderCartBottom() {
    const {cartType} = this.state;
    return (
      <View style={styles.cartBottom}>
        <View style={styles.cartCosts}>
          {this.getSubTotal() !== this.getTotal() ? (
            <View style={styles.cartCostsRow}>
              <Text style={styles.cartCostsRowLabel}>
                {this.getSubTotal() ? 'Sub Total' : ''}
              </Text>
              <Text style={styles.cartCostsRowValue}>
                {this.getSubTotal() ? displayAmount(this.getSubTotal()) : ''}
              </Text>
            </View>
          ) : null}
          {(cartType === 'room' || cartType === 'ticket') &&
          this.getServiceFee() ? (
            <View style={styles.cartCostsRow}>
              <Text style={styles.cartCostsRowLabel}>Service Fee</Text>
              <Text style={styles.cartCostsRowValue}>
                {displayAmount(this.getServiceFee())}
              </Text>
            </View>
          ) : (
            <View />
          )}
          <View style={styles.cartCostsRow}>
            <Text style={[styles.cartCostsRowLabel, styles.total]} bold>
              {this.getTotal() ? 'Total' : ''}
            </Text>
            <Text style={[styles.cartCostsRowValue, styles.total]} bold>
              {this.getTotal() ? displayAmount(this.getTotal()) : ''}
            </Text>
          </View>
        </View>
        {this.renderClosedMessage()}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={this.handleCheckout}
          disabled={this.isCheckoutDisabled()}>
          <View
            style={[
              styles.checkoutButton,
              this.isCheckoutDisabled() ? styles.checkoutButtonDisabled : {},
            ]}>
            <Text bold style={styles.checkoutButtonText}>
              {this.getCheckoutButtonLabel()}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  renderClosedMessage() {
    const {cartType} = this.state;
    const status = this.getCurrentDayStatus();
    const nexOpenOurs = this.getNextOpenHours();
    if (cartType !== 'meal') {
      return null;
    }
    if (status === 'closed') {
      return (
        <Text style={styles.closedMessage}>
          Sorry but we're closed, please check back in tomorrow
          {nexOpenOurs
            ? ' at ' + nexOpenOurs.open_time.split('+')[0] + ' WAT.'
            : ''}
          .
        </Text>
      );
    }
    if (status === 'not-open-yet') {
      return (
        <Text style={styles.closedMessage}>
          Sorry but we're not yet open for the day
          {nexOpenOurs
            ? ' please check back at ' +
              nexOpenOurs.open_time.split('+')[0] +
              ' WAT.'
            : ''}
          .
        </Text>
      );
    }
    return null;
  }

  renderCartHandle() {
    const {cart} = this.props;
    return (
      <Animated.View
        style={[styles.cartHandle, {bottom: this.state.handleBottom}]}>
        <View style={styles.cartHandleMain}>
          <TouchableOpacity
            onPress={this.handleCartHandlePress}
            activeOpacity={0.9}>
            <View style={styles.cartHandleMainInner}>
              <View style={styles.cartHandleContent}>
                <View style={styles.cartHandleContentInner}>
                  <View style={styles.cartIconContainer}>
                    <Image
                      source={cartIcon}
                      resizeMode="contain"
                      style={styles.cartIcon}
                    />
                  </View>
                  {cart.items.length ? (
                    <Image
                      source={indicator}
                      style={styles.cartQuantityIndicator}
                      resizeMode="stretch"
                    />
                  ) : null}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  renderTabBar() {
    const {hideTabbar, expanded} = this.state;
    if (hideTabbar) {
      return null;
    }
    return (
      <View style={styles.tabbar}>
        <View style={styles.tabbarTab}>
          <ImageBackground
            source={tabBgLeft}
            style={styles.tabBarBackground}
            resizeMode="stretch">
            <TouchableWithoutFeedback
              disabled={expanded}
              onPress={this.handleHomeTabPress}>
              <View
                style={[
                  styles.tabbarTabContent,
                  {
                    paddingRight: 40,
                    backgroundColor: expanded ? colors.white : 'rgba(0,0,0,0)',
                  },
                ]}>
                {expanded ? null : (
                  <Image
                    source={homeIcon}
                    style={styles.homeIcon}
                    resizeMode="cover"
                  />
                )}
              </View>
            </TouchableWithoutFeedback>
          </ImageBackground>
        </View>
        <View style={styles.tabbarTab}>
          <ImageBackground
            source={tabBgRight}
            style={styles.tabBarBackground}
            resizeMode="stretch">
            <TouchableWithoutFeedback
              disabled={expanded}
              onPress={this.handleTransactionTabPress}>
              <View
                style={[
                  styles.tabbarTabContent,
                  {
                    alignSelf: 'flex-end',
                    paddingLeft: 40,
                    backgroundColor: expanded ? colors.white : 'rgba(0,0,0,0)',
                  },
                ]}>
                {expanded ? null : (
                  <Image
                    source={transactionIcon}
                    style={styles.transactionIcon}
                    resizeMode="cover"
                  />
                )}
              </View>
            </TouchableWithoutFeedback>
          </ImageBackground>
        </View>
      </View>
    );
  }
}

const RestaurantHourDays: IRestaurantHourDay[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const styles = StyleSheet.create({
  closedMessage: {
    textAlign: 'left',
    marginHorizontal: 0,
    marginBottom: 8,
    fontSize: 12,
    color: colors.accent,
  },
  pointsErrorIcon: {
    marginBottom: 4,
  },
  pointsError: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 14,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  pointsErrorContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  pointsLabel: {
    fontSize: 12,
    color: colors.gray400,
  },
  points: {
    color: colors.black,
    fontSize: 12,
    marginRight: 4,
  },
  pointsMain: {
    marginLeft: 4,
  },
  coinImage: {
    height: width * coinImageWithPercentage * coinImageDimension,
    width: width * coinImageWithPercentage,
    resizeMode: 'stretch',
    marginRight: 4,
  },
  pointsContainer: {
    position: 'absolute',
    left: 32,
    top: 24,
    flexDirection: 'row',
    alignItems: 'center',
    width: width * 0.3,
  },
  cartItemCheckbox: {
    paddingRight: 8,
    paddingVertical: 16,
  },
  cartItemContaier: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartGroupItems: {
    paddingHorizontal: 40,
  },
  cartGroupLabelCheckbox: {
    marginRight: 8,
  },
  cartGroupLabelText: {
    color: colors.gray600,
    fontSize: 10,
    flex: 1,
  },
  cartGroupLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: colors.gray100,
    paddingHorizontal: 40,
  },
  cartGroupItemInner: {},
  cartGroupItem: {
    marginVertical: 4,
  },
  viewpager: {
    // height: (cartItemHight + 16) * 2,
    flex: 1,
  },
  cartTabLabelActive: {
    color: colors.black,
  },
  cartTabLabel: {
    textAlign: 'center',
    color: '#828282',
    fontSize: 12,
  },
  cartTabIndicatorActive: {
    backgroundColor: colors.accent,
  },
  cartTabIndicator: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    right: 0,
    height: 2,
    backgroundColor: rgba('#ebebeb', 0.62),
  },
  cartTab: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  cartTabs: {
    flexDirection: 'row',
    marginHorizontal: 40,
    marginBottom: 4,
  },
  cartOptionQuantityIndicator: {
    position: 'absolute',
    right: 5,
    top: 5,
    zIndex: 100,
    resizeMode: 'stretch',
    width: 8,
    height: 8,
  },
  cartHandleOptionLabel: {
    textAlign: 'center',
    color: rgba(colors.black, 0.38),
    fontSize: 8,
    // marginBottom: 4,
  },
  cartHandleOptionImage: {
    width: cartOptionSize / 2,
    height: cartOptionSize / 2,
    resizeMode: 'contain',
  },
  cartHandleOptionImageContainerInner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: cartOptionSize,
    height: cartOptionSize,
    backgroundColor: colors.accent,
  },
  cartHandleOptionImageContainer: {
    width: cartOptionSize,
    height: cartOptionSize,
    borderRadius: cartOptionSize / 2,
    overflow: 'hidden',
  },
  cartHandleOptionContent: {
    width: cartOptionSize + 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartHandleOption: {
    position: 'absolute',
    transform: [{scale: 1}],
  },
  cartQuantityIndicatorInner: {
    backgroundColor: '#21ff00',
    width: 12,
    height: 12,
    // borderRadius: 6,
  },
  cartQuantityIndicator: {
    position: 'absolute',
    right: -4,
    top: 12,
    width: 12,
    height: 12,
    zIndex: 100,
    resizeMode: 'stretch',
  },
  cartItemDeleButtonText: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.white,
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
    justifyContent: 'flex-start',
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  cartItemNameCaption: {
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
    flex: 1,
    marginVertical: 8,
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
  cartItems: {},
  checkoutButtonText: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  checkoutButton: {
    height: 32,
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: 5,
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
  cartBottom: {
    paddingHorizontal: 40,
    marginBottom: (getStatusBarHeight(true) > 20 ? 24 : 0) + 32,
  },
  cartIconContainer: {
    width: 28,
    height: 33,
    zIndex: 1,
    backgroundColor: colors.accent,
  },
  cartIcon: {
    resizeMode: 'contain',
    width: 28,
    height: 33,
  },
  cartHandleContentInner: {
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
    backgroundColor: colors.accent,
  },
  cartHandleContent: {
    flexGrow: 1,
    backgroundColor: colors.accent,
    borderRadius: cartHandleSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: colors.white,
  },
  cartHandleMainInner: {
    width: cartHandleSize,
    height: cartHandleSize,
    backgroundColor: colors.white,
  },
  cartHandleMain: {
    flex: 1,
    width: cartHandleSize,
    height: cartHandleSize,
    backgroundColor: colors.white,
    borderRadius: cartHandleSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 4,
  },
  cartHandleInner: {
    width: cartHandleSize,
    height: cartHandleSize,
  },
  cartHandle: {
    position: 'absolute',
    left: width / 2 - cartHandleSize / 2,
    bottom: 22,
    width: cartHandleSize,
    height: cartHandleSize,
    elevation: 6,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: '#f9f1f2',
    opacity: 0.6,
  },
  cartHeading: {
    textAlign: 'center',
    color: colors.black,
    fontSize: 19,
    paddingHorizontal: 40,
    marginBottom: cartHandleSize * 0.2,
  },
  content: {
    flex: 1,
    paddingBottom: 0,
    paddingTop: cartHandleSize * 0.8,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cartInner: {
    height: cartHeight,
    backgroundColor: colors.white,
    ...Platform.select({
      ios: {
        overflow: 'hidden',
        borderTopLeftRadius: 56,
        borderTopRightRadius: 56,
      },
      android: {
        borderRightWidth: 2,
      },
    }),
  },
  cart: {
    position: 'absolute',
    left: -2,
    width: width + 4,
    height: cartHeight,
    borderTopLeftRadius: 56,
    borderTopRightRadius: 56,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        backgroundColor: colors.white,
        borderTopLeftRadius: 56,
        borderTopRightRadius: 56,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
      android: {
        overflow: 'hidden',
        elevation: 6,
      },
    }),
  },
  tabbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: tabHeight,
    backgroundColor: 'rgba(0,0,0,0)',
    flexDirection: 'row',
  },
  tabbarTab: {
    flex: 1,
  },
  tabBarBackground: {
    flex: 1,
    height: tabHeight,
    width: width / 2,
    resizeMode: 'cover',
  },
  tabbarTabContent: {
    flex: 1,
    width: width / 2,
    height: tabHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeIcon: {
    width: 24,
    height: 24 * (78 / 81),
  },
  transactionIcon: {
    width: 24,
    height: 24 / (99 / 78),
  },
});

const tabs: Array<{name: CartItemType; displayName: string}> = [
  {
    name: 'meal',
    displayName: 'Restaurant',
  },
  {
    name: 'room',
    displayName: 'Hotel',
  },
  {
    name: 'ticket',
    displayName: 'Cinema',
  },
];

const ScreenCart: {[k: string]: CartItemType} = {
  RestaurantsHome: 'meal',
  RestaurantMenu: 'meal',
  RestaurantMeal: 'meal',
  CinemasHome: 'ticket',
  CinemasFilm: 'ticket',
  HotelsHome: 'room',
  HotelRooms: 'room',
  HotelRoom: 'room',
};

export default withCart(withUser(withDynamiConfig(Tab)));
