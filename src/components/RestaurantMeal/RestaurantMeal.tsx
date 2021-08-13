import React from 'react';
import Screen from 'components/Screen/Screen';
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
} from 'react-native';
import colors from 'configs/colors';
import {
  IRestaurantSelectorProps,
  RestaurantMealProps,
  RestaurantMealState,
} from './interfaces';
import LinearGradient from 'react-native-linear-gradient';
import VectorIcon from 'components/VectorIcon/VectorIcon';
import {Meal, MealAttribute} from 'api/GetMenuMeals.api';
import {displayAmount} from 'utils/Misc';
import {
  MenuTrigger,
  MenuOptions,
  MenuOption,
  Menu,
} from 'react-native-popup-menu';
import DealsSlider from 'components/DealsSlider/DealsSlider';
import Text from 'components/Text/Text';
import {withLocation} from 'contexts/LocationContext';
import {withCart, CartItem} from 'contexts/CartContext';
import FetchRestaurantMealApi from 'api/FetchRestaurantMeal.api';
import Axios, {Canceler} from 'axios';
import Spinner from 'components/Spinner/Spinner';
import BottomSafeArea from 'components/BottomSafeArea/BottomSafeArea';
import {withGeoloc} from 'contexts/GeolocContext';
import Toast from 'utils/Toast';
import FetchRestaurantMealVariationsApi, { MealVariation } from 'api/FetchRestaurantMealVariations.api';
import RestaurantsApi, {Restaurant} from 'api/Restaurants.api';
import {asyncGet, asyncStore} from 'utils/Async';
import {STORE_KEYS} from 'configs/async';
import {UserContext} from 'contexts/UserContext';
const {width, height} = Dimensions.get('screen');
const placeholderImage = require('../../assets/restaurant/meal-placeholder.png');

class RestaurantMeal extends React.Component<
  RestaurantMealProps,
  RestaurantMealState
> {
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

  state: RestaurantMealState = {
    isFetching: false,
    data: null,
    errorMessage: null,
    quantity: 1,
    variationsConfig: {},
    info: null,
    sizes: [],
    restaurant: null,
  };

  mounted: boolean = false;

  componentDidMount() {
    this.mounted = true;
    this.fetch();
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  isDeal = () => {
    const {navigation} = this.props;
    return navigation.getParam('deal') ? true : false;
  };

  addToCart = () => {
    const {location, geoloc, cart} = this.props;
    const {quantity, variationsConfig, info, restaurant} = this.state;
    if (!info) {
      return this.fetch();
    }
    // requires cart object
    if (!cart || !cart.add) {
      return Alert.alert(
        'Error',
        'Failed to add item to cart, please try again.',
      );
    }
    // requires location to be set
    if (!restaurant) {
      return Alert.alert(
        'Attention',
        'Please select a restaurant and try again.',
        [{text: 'Ok'}],
      );
    }
    // stop if must selecte variant to continue
    if (this.hasSizeVariations() && !this.getVariant()) {
      return Toast.error('Please select size to continue.');
    }

    // create cart item object
    const cartItem: CartItem = {
      data: {
        ...info,
        deliveryLocation: location || geoloc,
        variation: {...variationsConfig},
        variantId: info.variantId,
      },
      restaurant: restaurant,
      location: restaurant.outlet_name,
      quantity: quantity,
      price: Number(info.price),
      type: 'meal',
      image: info.images && info.images.length ? info.images[0].src : null,
      name: info.name,
      caption: this.getVariantOption() || undefined,
    };
    // add item to cart
    cart.add(cartItem);
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

  handleSelectSize(name: string, size: MealVariation) {
    this.setState(({variationsConfig, info}) => ({
      variationsConfig: {...variationsConfig, Size: name},
      info: info
        ? {
            ...size,
            id: info.id,
            variantId: size.id,
            attributes: info ? info.attributes : size.attributes,
            variations: info ? info.variations : size.variations,
            name: info ? info.name : size.name,
            description: info ? info.description : size.description,
            images: info ? info.images : size.images,
          }
        : info,
    }));
  }

  fetch = () => {
    const {isFetching} = this.state;
    const {navigation} = this.props;
    const id = navigation.getParam('id');
    const variant = this.getVariant();

    if (isFetching || !id) {
      return;
    }
    this.setState(
      {
        isFetching: true,
        errorMessage: null,
      },
      async () => {
        try {
          // get meal based on variation
          const result = await FetchRestaurantMealApi(id, {
            vatiation: variant || undefined,
          });
          if (!this.mounted) {
            return;
          }
          if (!result) {
            throw new Error('An error occurred please try again.');
          }
          if (result && result.code) {
            throw new Error(result.message);
          }
          // add variant to state
          this.setState(
            ({info}) => ({
              info: {
                ...result,
                id: info ? info.id : result.id,
                attributes: info ? info.attributes : result.attributes,
                variations: info ? info.variations : result.variations,
                name: info ? info.name : result.name,
                description: info ? info.description : result.description,
                images: info ? info.images : result.images,
              },
              isFetching: false,
              quantity: 1,
            }),
            this.fetchVariations,
          );
        } catch (e) {
          // stop if action was cancelled
          if (Axios.isCancel(e) || e.message === 'cancelled' || !this.mounted) {
            return;
          }
          // error message
          let errorMessage = e.message;
          if (e.response && e.response.data) {
            errorMessage = e.response.data.message;
          }
          if (/network/gi.test(errorMessage)) {
            errorMessage =
              'Please check your internet connection and try again.';
          }
          if (/invalid/gi.test(errorMessage)) {
            errorMessage = "We couldn't load the meal you selected.";
          }
          if (this.state.info) {
            Toast.error(errorMessage);
          }
          // update component state and toggle off is fetching
          this.setState({
            isFetching: false,
            errorMessage:
              errorMessage || 'Failed to load the meal you selected.',
          });
        }
      },
    );
  };

  fetchVariations = () => {
    const {isFetching} = this.state;
    const {navigation} = this.props;
    const id = navigation.getParam('id');

    if (isFetching || !id || !this.hasSizeVariations()) {
      return;
    }
    this.setState(
      {
        isFetching: true,
        errorMessage: null,
      },
      async () => {
        try {
          // get meal based on variation
          const result = await FetchRestaurantMealVariationsApi(id);
          if (!this.mounted) {
            return;
          }
          if (!result) {
            throw new Error('An error occurred please try again.');
          }
          if (result && result.code) {
            throw new Error(result.message);
          }
          // add variant to state
          this.setState(() => ({isFetching: false, sizes: result}));
        } catch (e) {
          // stop if action was cancelled
          if (Axios.isCancel(e) || e.message === 'cancelled' || !this.mounted) {
            return;
          }
          // error message
          let errorMessage = e.message;
          if (e.response && e.response.data) {
            errorMessage = e.response.data.message;
          }
          if (/network/gi.test(errorMessage)) {
            errorMessage =
              'Please check your internet connection and try again.';
          }
          if (/invalid/gi.test(errorMessage)) {
            errorMessage = "We couldn't load the meal you selected.";
          }
          if (this.state.info) {
            Toast.error(errorMessage);
          }
          // update component state and toggle off is fetching
          this.setState({
            isFetching: false,
            errorMessage:
              errorMessage || "Failed to load the selected  meal's variations.",
          });
        }
      },
    );
  };

  getVariant = (): null | number => {
    const {navigation} = this.props;
    const {variationsConfig, info} = this.state;
    const variation = info
      ? info.attributes.find(item => item.variation)
      : null;

    if (!this.hasSizeVariations()) {
      return null;
    }

    if (this.isDeal()) {
      return navigation.getParam('variant') || null;
    }

    // return nothing if the meal has no variations
    if (!info || !info.variations) {
      return null;
    }
    // currently only support size
    if (
      !variation ||
      !/size/gi.test(variation.name) ||
      !variation.options ||
      !variation.options.length
    ) {
      return null;
    }
    // get selected variation
    const selectedValue = variation.options.indexOf(
      variationsConfig[variation.name],
    );
    if (selectedValue !== -1) {
      return info.variations[selectedValue];
    }
    // return default variation
    return null;
  };

  getVariantOption = (): null | string => {
    const {variationsConfig, info} = this.state;
    const variation = info
      ? info.attributes.find(item => item.variation === true)
      : null;
    // return nothing if the meal has no variations
    if (!info || !info.variations) {
      return null;
    }
    // currently only support size
    if (
      !variation ||
      !/size/gi.test(variation.name) ||
      !variation.options ||
      !variation.options.length
    ) {
      return null;
    }
    // return variation
    return variationsConfig[variation.name] || variation.options[0];
  };

  hasSizeVariations = () => {
    const {info} = this.state;
    if (!info) {
      return false;
    }
    const variations = info.attributes.find(item => item.name === 'Size');
    return !variations ? false : true;
  };

  render() {
    return (
      <Screen statusBarColor={Platform.select({ios: 'black'})}>
        <View style={styles.container}>
          {this.renderMealImage()}
          {this.renderMealInfo()}
        </View>
      </Screen>
    );
  }

  renderMealImage() {
    const {info} = this.state;
    return (
      <View style={styles.mealImageContainer}>
        <Image
          resizeMode="cover"
          width={width}
          height={height * 0.5}
          style={styles.mealImage}
          defaultSource={placeholderImage}
          source={
            info && Array.isArray(info.images) && info.images.length
              ? {uri: info.images[0].src}
              : placeholderImage
          }
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
          start={{x: 0.5, y: 0}}
          style={styles.mealImageNameGradient}
        />
      </View>
    );
  }

  renderMealInfo() {
    const {quantity, info, isFetching, errorMessage, restaurant} = this.state;
    const {cart, navigation} = this.props;
    let location = navigation.getParam('location');
    return (
      <View style={styles.mealInfo}>
        <View style={styles.mealNameContainer}>
          <Text style={styles.mealName}>{info ? info.name : ''}</Text>
          <View style={styles.mealRating}>
            <Text style={styles.mealRatingAvg}>
              {Number(
                info && info.average_rating ? info.average_rating : 0,
              ).toFixed(1)}
            </Text>
            {info && info.rating_count > 4.8 ? (
              <VectorIcon
                type="ion-icons"
                name="md-star"
                color={colors.white}
                size={24}
              />
            ) : info && info.rating_count > 0 ? (
              <VectorIcon
                type="ion-icons"
                name="start-half"
                color={colors.white}
                size={24}
              />
            ) : (
              <VectorIcon
                type="ion-icons"
                name="md-star-outline"
                color={colors.white}
                size={24}
              />
            )}
          </View>
        </View>
        <View style={styles.mainInfoSection}>
          <ScrollView>
            <View style={styles.mainInfoSectionInner}>
              <View style={styles.locationSelectorContainer}>
                <RestaurantSelector
                  onSelect={v => this.setState({restaurant: v})}
                  selected={restaurant || undefined}
                  disabled={!!cart.mealsCount}
                  location={location}
                />
              </View>
              {isFetching ? (
                this.renderInfoUnavailable()
              ) : (
                <>
                  {info &&
                  !errorMessage &&
                  String(info.description).replace(/\s/g, '').length ? (
                    <>
                      <Text style={styles.reviewHeading}>Review</Text>
                      <Text style={styles.review}>{info.description}</Text>
                    </>
                  ) : null}
                  {errorMessage ? (
                    <View style={styles.errorMessageContainer}>
                      <Text style={styles.errorMessage}>{errorMessage}</Text>
                      <TouchableWithoutFeedback onPress={this.fetch}>
                        <Text style={styles.errorMessageRetryButton}>
                          Try Again
                        </Text>
                      </TouchableWithoutFeedback>
                    </View>
                  ) : null}
                  {info && !errorMessage ? (
                    <View style={styles.mealOptions}>
                      {this.hasSizeVariations() && !this.getVariant() ? null : (
                        <View style={styles.mealPrice}>
                          <Text style={styles.price}>
                            Price:{' '}
                            {displayAmount(Number(info.price) * quantity)}
                          </Text>
                        </View>
                      )}
                      {this.renderVariation(info ? info.attributes : [])}
                      {this.renderQuantitySelector()}
                    </View>
                  ) : null}
                  <View style={styles.addToCartButtonContainer}>
                    <TouchableOpacity
                      disabled={isFetching}
                      activeOpacity={0.7}
                      onPress={this.addToCart}>
                      <View
                        style={[
                          styles.addToCartButton,
                          errorMessage ? styles.addToCartButtonDisable : null,
                        ]}>
                        <Text style={styles.addToCartButtonLabel}>
                          Add To Cart
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </>
              )}
              <DealsSlider />
            </View>
            <BottomSafeArea />
          </ScrollView>
        </View>
      </View>
    );
  }

  renderInfoUnavailable() {
    const {info, isFetching, errorMessage} = this.state;
    if (isFetching) {
      return (
        <View style={styles.infoLoaderContainer}>
          <Spinner />
        </View>
      );
    }
    if (info) {
      return null;
    }
    return (
      <View style={styles.errorMessageContainer}>
        <Text style={styles.errorMessage}>
          {errorMessage || 'Failed to load meal info, please try again.'}
        </Text>
        <TouchableWithoutFeedback onPress={this.fetch}>
          <Text style={styles.errorMessageRetryButton}>Try Again</Text>
        </TouchableWithoutFeedback>
      </View>
    );
  }

  renderQuantitySelector() {
    const {quantity, isFetching, info} = this.state;
    if (!info) {
      return null;
    }
    return (
      <View style={styles.quantitySelector}>
        <Text style={styles.optionLabel}>Order: </Text>
        <View style={styles.quantitySelectorControls}>
          <TouchableWithoutFeedback
            disabled={isFetching}
            onPress={() => this.handleChangeQuantity('remove')}>
            <View style={[styles.quantityButton]}>
              <VectorIcon name="md-remove" color={colors.accent} />
            </View>
          </TouchableWithoutFeedback>
          <Text style={styles.quantity}>{quantity}</Text>
          <TouchableWithoutFeedback
            disabled={isFetching}
            onPress={() => this.handleChangeQuantity('add')}>
            <View style={styles.quantityButton}>
              <VectorIcon name="md-add" color={colors.accent} />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>
    );
  }

  renderVariation(attributes: Array<MealAttribute>) {
    const variations = attributes.find(item => item.variation === true);
    const {variationsConfig, isFetching, sizes} = this.state;
    if (!variations) {
      return null;
    }
    if (
      variations.name.trim() === 'Size' &&
      variations.options &&
      variations.options.length
    ) {
      // get selected size
      const selectedValue = variationsConfig[variations.name];
      // return render
      return (
        <View style={styles.sizeSelector}>
          <Text style={styles.optionLabel}>Size: </Text>
          <View style={styles.mealSizeOption}>
            <Menu>
              <MenuTrigger
                customStyles={{
                  triggerWrapper: styles.variationTriggerOption,
                }}
                disabled={this.isDeal() || isFetching}>
                <View style={styles.variationTriggercontent}>
                  <Text
                    style={{
                      color: selectedValue ? colors.gray900 : colors.gray500,
                      flex: 1,
                    }}
                    numberOfLines={1}>
                    {selectedValue || 'Size'}
                  </Text>
                  <VectorIcon name="md-arrow-dropdown" color={colors.gray900} />
                </View>
              </MenuTrigger>
              <MenuOptions>
                {sizes.map((item, index) => {
                  const sizeAttribute = item.attributes.find(
                    (i: any) => i.name === 'Size',
                  );
                  if (!sizeAttribute) {
                    return null;
                  }
                  return (
                    <MenuOption
                      key={index}
                      onSelect={() =>
                        this.handleSelectSize(sizeAttribute.option || '', item)
                      }>
                      <Text style={styles.selectOption}>
                        {sizeAttribute.option}
                      </Text>
                    </MenuOption>
                  );
                })}
              </MenuOptions>
            </Menu>
          </View>
        </View>
      );
    }
    return null;
  }
}

const RestaurantSelector: React.FC<
  IRestaurantSelectorProps
> = function RestaurantSelector({onSelect, selected, style, disabled, location}) {
  const [list, setList] = React.useState<Restaurant[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState<boolean>(false);
  const cancelHttp = React.useRef<Canceler>();

  const handleSelect = React.useCallback(
    async (restaurant: Restaurant) => {
      if (onSelect) {
        onSelect(restaurant);
        await asyncStore(STORE_KEYS.LAST_RESTAURANT, restaurant);
      }
    },
    [onSelect],
  );

  const useLastSelectedRestaurant = React.useCallback(async () => {
    if (selected) {
      return;
    }
    const lastRestaurant = await asyncGet(STORE_KEYS.LAST_RESTAURANT);
    if (!lastRestaurant) {
      return;
    }
    handleSelect(lastRestaurant);
  }, [selected, handleSelect]);

  const fetchRestaurants = React.useCallback(async () => {
    setError(null);
    if (cancelHttp.current) {
      cancelHttp.current();
    }
    if (list.length) {
      setIsPending(false);
      return;
    }
    setIsPending(true);
    const restaurantsX = await RestaurantsApi();
    const restaurants = restaurantsX.data.filter(val=>location == val.location);

    setList(restaurants || []);
    setError(
      !restaurantsX.data
        ? restaurantsX.message ||
            'Failed to fetch restaurants, please try again.'
        : null,
    );
    setIsPending(false);
  }, [list]);

  React.useEffect(() => {
    fetchRestaurants();
    useLastSelectedRestaurant();
    const onGoingHttp = cancelHttp.current;
    return () => {
      if (onGoingHttp) {
        onGoingHttp();
      }
    };
  }, [fetchRestaurants, useLastSelectedRestaurant]);
  if (error) {
    return (
      <View
        style={[styles.errorMessageContainer, styles.restaurantSelectorError]}>
        <Text style={styles.errorMessage}>{error}</Text>
        <Text style={styles.errorMessageRetryButton} onPress={fetchRestaurants}>
          Try again
        </Text>
      </View>
    );
  }
  return (
    <View
      style={[
        styles.restaurantSelector,
        disabled ? styles.restaurantSelectorDisabled : null,
        style,
      ]}>
      {list.length ? (
        <Menu>
          <MenuTrigger
            customStyles={{
              triggerText: [
                styles.restaurantSelectorTriggerText,
                selected ? styles.restaurantSelectorTriggerTextSelected : {},
              ],
            }}
            text={selected ? selected.outlet_name : 'Select a Restaurant'}
            disabled={disabled}
          />
          <MenuOptions>
            {list.map(item => (
              <MenuOption
                key={item.id}
                onSelect={() => handleSelect(item)}
                text={item.outlet_name}
                style={styles.restaurantSelectorOption}
              />
            ))}
          </MenuOptions>
        </Menu>
      ) : isPending ? (
        <Spinner style={styles.restaurantSelectorSpinner} />
      ) : null}
      {disabled ? <View style={styles.restaurantSelectorBlocker} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  restaurantSelectorBlocker: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0)',
  },
  restaurantSelectorError: {
    marginTop: 48,
  },
  restaurantSelectorSpinner: {
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
  restaurantSelectorOption: {
    padding: 8,
  },
  restaurantSelectorTrigger: {
    flex: 1,
    backgroundColor: colors.gray200,
  },
  restaurantSelectorTriggerTextSelected: {
    color: colors.gray700,
  },
  restaurantSelectorTriggerText: {
    color: colors.gray500,
    fontSize: 14,
    marginVertical: 4,
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  restaurantSelectorDisabled: {
    opacity: 0.3,
  },
  restaurantSelector: {
    marginTop: 48,
    marginBottom: 16,
    marginHorizontal: 32,
    borderColor: colors.gray500,
    borderWidth: 1,
    borderRadius: 3,
    alignSelf: 'center',
    width: 250,
    height: 28,
    justifyContent: 'center',
  },
  errorMessageRetryButton: {
    textAlign: 'center',
    color: colors.accent,
    fontSize: 12,
    padding: 8,
    marginTop: 4,
  },
  errorMessage: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.gray600,
  },
  errorMessageContainer: {
    marginVertical: 18,
    alignItems: 'center',
  },
  infoLoaderContainer: {
    marginVertical: 32,
    alignItems: 'center',
  },
  addToCartButtonContainer: {
    paddingHorizontal: 32,
  },
  addToCartButtonDisable: {
    backgroundColor: colors.gray300,
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
  optionLabel: {
    color: colors.gray900,
    fontWeight: '500',
  },
  sizeSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectOption: {
    padding: 8,
  },
  variationTriggercontent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  variationTriggerOption: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.gray200,
  },
  quantityButton: {
    padding: 10,
  },
  quantity: {
    fontSize: 16,
  },
  quantitySelector: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  quantitySelectorControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  mealSizeOption: {
    flex: 1,
  },
  price: {
    color: colors.gray900,
    fontWeight: '500',
  },
  mealPrice: {
    flex: 1,
  },
  mealOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 32,
    paddingRight: 24,
    marginBottom: 32,
  },
  reviewHeading: {
    color: colors.accent,
    fontWeight: '600',
    textAlign: 'center',
  },
  review: {
    color: colors.gray800,
    fontWeight: '400',
  },
  locationSelectorContainer: {
    marginBottom: 16,
  },
  mealImageNameGradient: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    right: 0,
    height: height * 0.5,
  },
  mealImage: {
    width: width,
    height: height * 0.5,
    resizeMode: 'cover',
  },
  mealImageContainer: {
    height: height * 0.5,
    zIndex: -99999,
    justifyContent: 'flex-end',
  },
  mainInfoSectionInner: {
    flex: 1,
    backgroundColor: colors.white,
  },
  mainInfoSection: {
    position: 'relative',
    overflow: 'hidden',
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 64,
    borderTopRightRadius: 64,
  },
  mealNameContainer: {
    marginBottom: 16,
    paddingHorizontal: 32,
  },
  mealName: {
    color: colors.white,
    fontSize: 18,
    marginBottom: 4,
    fontWeight: '600',
  },
  mealInfo: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    right: 0,
    top: height * 0.25,
    // backgroundColor: 'white',
    zIndex: 99999,
  },
  mealRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealRatingAvg: {
    marginRight: 4,
    color: colors.white,
    fontSize: 16,
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

export default withGeoloc(withLocation(withCart(RestaurantMeal)));
