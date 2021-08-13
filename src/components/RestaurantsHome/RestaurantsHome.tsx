import React from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  Image,
  TouchableWithoutFeedback,
  InteractionManager,
  Platform,
} from 'react-native';
import {getStatusBarHeight} from 'react-native-status-bar-height';
import {NavigationEventSubscription, ScrollView} from 'react-navigation';
import colors from 'configs/colors';
import {RestaurantsHomeState, RestaurantsHomeProps} from './interfaces';
import Screen from 'components/Screen/Screen';
import {
  withRestaurantMenu,
  RestaurantMenu,
} from 'contexts/ReastaurantMenuContext';
import GetRestaurantsMenuApi from 'api/GetRestaurantsMenu.api';
import GetFeaturedMealsApi, {FeaturedMeal} from 'api/GetFeaturedMeals.api';
import Carousel from 'react-native-snap-carousel';
import LinearGradient from 'react-native-linear-gradient';
import {displayAmount} from 'utils/Misc';
import Spinner from 'components/Spinner/Spinner';
import {FlatList} from 'react-native-gesture-handler';
import DealsSlider from 'components/DealsSlider/DealsSlider';
import VectorIcon from 'components/VectorIcon/VectorIcon';
import Text from 'components/Text/Text';
const mealPlaceholder = require('../../assets/restaurant/meal-placeholder.png');
const watermark = require('../../assets/home/watermark-480x406.png');
const {width} = Dimensions.get('screen');
const featuredCarouselWidth = width * 0.4;
const featuredCarouselHeight = featuredCarouselWidth * 1.05;
const menuWidth = (width - (64 + 16)) / 3;
const menuImageWidth = menuWidth - 16;
const menuImageHeight = menuWidth / (16 / 9);

class RestaurantsHome extends React.Component<
  RestaurantsHomeProps,
  RestaurantsHomeState
> {
  
  static navigationOptions = () => {
    return {
      headerTitle: 'Featured Meal',
      headerTintColor: colors.gray600,
      headerTitleContainerStyle: styles.headerContainer,
      headerTransparent: true,
      headerStyle: styles.header,
      headerTitleStyle: styles.headerTitle,
      headerBackTitle: ' ',
      headerRight: <Text />,
    };
  };

  state: RestaurantsHomeState = {
    isFetchingMenu: false,
    menusError: null,
    isFetchingFeatured: false,
    fearuredError: null,
    featuredMeals: [],
    menus: [],
    isReady: false,
    isSearchEnabled: false,
    search: '',
  };

  
  didFocus?: NavigationEventSubscription;

  mounted: boolean = false;

  componentDidMount() {
    const {navigation} = this.props;
    this.mounted = true;
    InteractionManager.runAfterInteractions(() => {
      this.handleDidFocus();
      this.didFocus = navigation.addListener('didFocus', this.handleDidFocus);
    });
  }

  componentDidUpdate(
    prevProps: RestaurantsHomeProps,
    prevState: RestaurantsHomeState,
  ) {
    if (prevState.isSearchEnabled !== this.state.isSearchEnabled) {
      this.renderHeaderRight();
    }
  }

  componentWillUnmount() {
    this.mounted = false;
    if (this.didFocus) {
      this.didFocus.remove();
    }
  }

  handleDidFocus = () => {
    const {isReady} = this.state;
    if (!isReady) {
      this.setState({
        isReady: true,
      });
    }
    this.fetchMenu();
    this.fetchFeatured();
    this.renderHeaderRight();
  };

  fetchFeatured = () => {
    const {navigation} = this.props;
    let location = navigation.getParam("location");

    const {isFetchingFeatured, featuredMeals} = this.state;
    if (
      isFetchingFeatured ||
      (Array.isArray(featuredMeals) && featuredMeals.length)
    ) {
      return;
    }
    this.setState(
      {
        isFetchingFeatured: true,
        fearuredError: null,
      },
      async () => {
        try {
          const featured = await GetFeaturedMealsApi(location);
          if (!this.mounted) {
            return;
          }
          this.setState({
            isFetchingFeatured: false,
            featuredMeals: featured,
          });
        } catch (e) {
          if (!this.mounted) {
            return;
          }
          this.setState({
            isFetchingFeatured: false,
            fearuredError: e.message,
          });
        }
      },
    );
  };

  fetchMenu = () => {
    const {restaurantMenu, navigation} = this.props;
    let location = navigation.getParam("location");
    this.setState(
      {
        isFetchingMenu: true,
        menusError: null,
      },
      async () => {
        try {
          const menus = await GetRestaurantsMenuApi(location);
          if (!this.mounted) {
            return;
          }
          this.setState(
            {
              isFetchingMenu: false,
              menus: menus,
            },
            () => restaurantMenu.set(menus),
          );
        } catch (error) {
          this.setState({
            isFetchingMenu: false,
            menusError: error.message,
          });
        }
      },
    );
  };

  getMenuMargin(index: number) {
    const {menus} = this.state;
    if (menus.length < 1) {
      return null;
    }
    if (index === 0) {
      return {marginLeft: 32};
    }
    if (index >= menus.length - 1) {
      return {marginRight: 32};
    }
    return null;
  }

  render() {
   
    return (
      <Screen>
        <View style={styles.container}>
          {this.renderFeatured()}
          {this.renderMenuSection()}
        </View>
      </Screen>
    );
  }

  renderFeatured() {
    const {featuredMeals, isFetchingFeatured, isReady} = this.state;
    if (isFetchingFeatured && (!featuredMeals || !featuredMeals.length)) {
      return (
        <View style={styles.featured}>
          <View style={styles.featuredLoader}>
            <Spinner />
          </View>
        </View>
      );
    }
    return (
      <View style={styles.featured}>
        {featuredMeals && featuredMeals.length ? (
          <Carousel
            itemWidth={featuredCarouselWidth}
            itemHeight={featuredCarouselWidth}
            sliderWidth={width}
            sliderHeight={featuredCarouselWidth}
            data={featuredMeals}
            renderItem={this.renderFeaturedMeal}
            inactiveSlideOpacity={0.7}
            inactiveSlideScale={0.8}
            loop={featuredMeals.length > 1}
            autoplay
            autoplayDelay={7000}
            autoplayInterval={7000}
          />
        ) : isReady ? (
          <View style={[styles.featuredLoader]}>
            <Text style={styles.fetchFeaturedFailure}>
              Failed to load featured meals.
            </Text>
            <TouchableWithoutFeedback
              onPress={this.fetchFeatured}
              style={{alignSelf: 'center'}}>
              <Text style={styles.fetchFeaturedFailureRetry}>Try Again</Text>
            </TouchableWithoutFeedback>
          </View>
        ) : null}
      </View>
    );
  }

  renderFeaturedMeal = (props: {item: FeaturedMeal; index: number}) => {
    const {item} = props;
    const {navigation} = this.props;
    let location = navigation.getParam('location');
    return (
      <TouchableWithoutFeedback
        onPress={() => navigation.navigate('RestaurantMeal', {id: item.id, location})}>
        <View style={styles.featuredMeal}>
          <Image
            source={
              Array.isArray(item.images) && item.images[0]
                ? {uri: item.images[0].src}
                : mealPlaceholder
            }
            style={styles.featuredMealImage}
            resizeMode="cover"
            resizeMethod="auto"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
            start={{x: 0.5, y: 0}}
            style={styles.featuredMealInfo}>
            <Text style={styles.featuredMealName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.featuredMealPrice}>
              {displayAmount(item.price)}
            </Text>
            <View style={styles.featuredMealRating}>
              {item.rating_count > 4.8 ? (
                <VectorIcon
                  type="ion-icons"
                  name="md-star"
                  color={colors.white}
                  size={18}
                />
              ) : item.rating_count > 0 ? (
                <VectorIcon
                  type="ion-icons"
                  name="start-half"
                  color={colors.white}
                  size={18}
                />
              ) : (
                <VectorIcon
                  type="ion-icons"
                  name="md-star-outline"
                  color={colors.white}
                  size={18}
                />
              )}
              <Text style={styles.featuredMealRatingAvg}>
                {Number(item.average_rating).toFixed(1)}
              </Text>
            </View>
          </LinearGradient>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  renderMenuSection() {
    return (
      <View style={styles.menusSectionContainer}>
        <ScrollView
          style={styles.menusSection}
          showsVerticalScrollIndicator={false}>
          <Image source={watermark} style={styles.watermark} />
          {this.renderMenus()}
          <View style={styles.bottomSection}>
            <DealsSlider />
          </View>
        </ScrollView>
      </View>
    );
  }

  renderMenus() {
    const {menus, isFetchingMenu, menusError, isReady} = this.state;

    return (
      <View style={styles.menus}>
        <Text style={styles.menusTitle} bold>
          Menu
        </Text>
        {isFetchingMenu && (!menus || !menus.length) ? (
          <View style={styles.menusLoader}>
            <Spinner />
          </View>
        ) : !menus || menus.length ? (
          <FlatList
            data={menus}
            renderItem={this.renderMenu}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => String(item.id)}
          />
        ) : isReady ? (
          <View style={styles.loadMenuFailure}>
            <Text style={styles.loadMenuFailureMessage}>
              {menusError || 'Failed to load the menu.'}
            </Text>
            <TouchableWithoutFeedback onPress={this.fetchMenu}>
              <Text style={styles.loadMenuFailureRetry}>Try Again</Text>
            </TouchableWithoutFeedback>
          </View>
        ) : null}
      </View>
    );
  }

  renderMenu = (props: {item: RestaurantMenu; index: number}) => {
    const {item, index} = props;
    const {navigation} = this.props;
    let location = navigation.getParam("location");
    return (
      <TouchableWithoutFeedback
        onPress={() =>
          navigation.navigate('RestaurantMenu', {
            menuName: item.name,
            menuId: item.id,
            location
          })
        }>
        <View style={[styles.menu, this.getMenuMargin(index)]}>
          <Image
            source={
              item.image && item.image.src
                ? {uri: item.image.src}
                : mealPlaceholder
            }
            style={styles.menuImage}
            resizeMode="stretch"
          />
          <Text style={styles.menuName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.menuLine} />
        </View>
      </TouchableWithoutFeedback>
    );
  };

  renderHeaderRight = () => {
    const {navigation} = this.props;
    const {isSearchEnabled} = this.state;
    navigation.setParams({
      isSearchEnabled: isSearchEnabled,
      onToggleSearch: () => this.setState({isSearchEnabled: !isSearchEnabled}),
    });
  };
}

// alternative for shadow for android
const androidShadowAlt = Platform.select({
  android: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  ios: {},
});

const styles = StyleSheet.create({
  container: {
    marginTop: getStatusBarHeight(true) + 56,
    flex: 1,
  },
  menusSectionContainer: {
    flex: 1,
    borderTopLeftRadius: 64,
    borderTopRightRadius: 64,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  menusSection: {
    flex: 1,
    backgroundColor: colors.white,
    paddingTop: 64 / 2,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        borderTopLeftRadius: 64,
        borderTopRightRadius: 64,
      },
      android: {},
    }),
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
  featured: {
    height: featuredCarouselHeight + 8,
    marginBottom: 16,
  },
  featuredMeal: {
    backgroundColor: colors.white,
    width: featuredCarouselWidth,
    height: featuredCarouselHeight,
    borderRadius: 8,
    justifyContent: 'flex-end',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // elevation: 2,
    ...androidShadowAlt,
  },
  featuredMealImage: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: featuredCarouselWidth,
    height: featuredCarouselHeight,
    resizeMode: 'cover',
    borderRadius: 8,
  },
  carousel: {
    backgroundColor: 'blue',
  },
  featuredMealInfo: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 16,
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 8,
  },
  featuredMealInfoLeft: {
    flex: 1,
  },
  featuredMealInfoRight: {},
  featuredMealName: {
    color: colors.white,
    fontWeight: '400',
    marginBottom: 2,
  },
  featuredMealPrice: {
    color: colors.white,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  featuredMealRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredMealRatingAvg: {
    marginLeft: 4,
    color: colors.white,
  },
  featuredLoader: {
    alignSelf: 'center',
    width: featuredCarouselWidth,
    height: featuredCarouselHeight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // elevation: 2,
    ...androidShadowAlt,
  },
  menus: {
    marginBottom: 32,
  },
  menusTitle: {
    marginVertical: 32,
    color: colors.accent,
    textAlign: 'center',
    fontWeight: '600',
  },
  menusLoader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  menu: {
    width: menuWidth,
    marginVertical: 8,
    alignItems: 'center',
    padding: 8,
    backgroundColor: colors.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    // elevation: 3,
    marginHorizontal: 8,
    ...androidShadowAlt,
  },
  menuImage: {
    width: menuImageWidth,
    height: menuImageHeight,
    borderRadius: 12,
    resizeMode: 'stretch',
    marginBottom: 8,
  },
  menuName: {
    textAlign: 'center',
    fontSize: 13,
    color: colors.gray700,
    marginBottom: 8,
  },
  menuLine: {
    alignSelf: 'center',
    height: 3,
    backgroundColor: colors.accent,
    width: 32,
  },
  bottomSection: {
    marginBottom: getStatusBarHeight(true) > 20 ? 80 + 64 : 64 + 64,
  },
  fetchFeaturedFailure: {
    textAlign: 'center',
    color: colors.gray700,
    marginBottom: 8,
    fontSize: 12,
    paddingHorizontal: 16,
  },
  fetchFeaturedFailureRetry: {
    color: colors.accent,
    fontSize: 14,
    textAlign: 'center',
  },
  loadMenuFailure: {
    alignItems: 'center',
    marginBottom: 16,
  },
  loadMenuFailureMessage: {
    textAlign: 'center',
    color: colors.gray700,
    marginBottom: 2,
    fontSize: 12,
  },
  loadMenuFailureRetry: {
    color: colors.accent,
    fontSize: 14,
    textAlign: 'center',
  },
  watermark: {
    position: 'absolute',
    right: 0,
    top: 46,
    width: width * 0.7,
    height: (width * 0.7) / (480 / 406),
    resizeMode: 'stretch',
  },
});

export default withRestaurantMenu(RestaurantsHome);
