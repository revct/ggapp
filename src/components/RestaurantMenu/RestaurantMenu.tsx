import React from 'react';
import {
  View,
  StyleSheet,
  InteractionManager,
  FlatList,
  TouchableWithoutFeedback,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import Screen from 'components/Screen/Screen';
import {NavigationStackScreenProps} from 'react-navigation-stack';
import {RestaurantMenuProps, RestaurantMenuState} from './interfaces';
import colors from 'configs/colors';
import {getStatusBarHeight} from 'react-native-status-bar-height';
import GetMenuMeals, {Meal} from 'api/GetMenuMeals.api';
import Spinner from 'components/Spinner/Spinner';
import {displayAmount} from 'utils/Misc';
import Text from 'components/Text/Text';
const mealPlaceholder = require('../../assets/restaurant/meal-placeholder.png');
const {width} = Dimensions.get('screen');
const mealImageWidth = width / 2 - 64;
const PER_PAGE = 24;

class RestaurantMenu extends React.Component<
  RestaurantMenuProps,
  RestaurantMenuState
> {
  static navigationOptions = (props: NavigationStackScreenProps) => {
    const {navigation} = props;
    const navState = navigation.state;
    return {
      headerTitle: navState.params
        ? navState.params.menuName || 'Menu'
        : 'Menu',
      headerStyles: styles.header,
      headerTintColor: colors.gray600,
      headerTitleContainerStyle: styles.headerContainer,
      headerTransparent: true,
      headerStyle: styles.header,
      headerTitleStyle: styles.headerTitle,
      headerRight: <Text />,
    };
  };

  state: RestaurantMenuState = {
    isFetching: false,
    data: [],
    errorMessage: null,
    page: 0,
    request: null,
    search: '',
    isSearchEnabled: false,
    endIsReached: false,
  };

  mounted: boolean = false;

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      this.mounted = true;
      this.fetch();
      this.setState({isSearchEnabled: true});
    });
  }

  componentDidUpdate(
    prevProps: RestaurantMenuProps,
    prevState: RestaurantMenuState,
  ) {
    if (prevState.isSearchEnabled !== this.state.isSearchEnabled) {
      this.renderHeaderRight();
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  fetch = () => {
    const {navigation} = this.props;
    const {page, isFetching} = this.state;
    const menuId = navigation.getParam('menuId');
    let location = navigation.getParam('location');
    const newRequest = new Date().getTime();
    if (isFetching) {
      return;
    }
    this.setState(
      {
        isFetching: true,
        errorMessage: null,
        request: newRequest,
      },
      async () => {
        try {
          // get menu meals
          const data = await GetMenuMeals({
            menuId: String(menuId),
            page: page + 1,
            per_page: PER_PAGE,
            location: location,
          });
          // stop if component has unmounted
          if (!this.mounted) {
            return;
          }
          // stop if request changed
          if (this.state.request !== newRequest) {
            return;
          }
          // daa data to component state
          this.setState(state => ({
            isFetching: false,
            data: [
              ...state.data,
              ...data.filter(
                i => state.data.findIndex(j => j.id === i.id) === -1,
              ),
            ],
            page: page + 1,
            endIsReached:
              data.filter(i => state.data.findIndex(j => j.id === i.id) === -1)
                .length < PER_PAGE,
          }));
        } catch (e) {
          // stop if component has unmounted
          if (!this.mounted) {
            return;
          }
          // stop if request changed
          if (this.state.request !== newRequest) {
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

  render() {
    const {data, endIsReached} = this.state;
    return (
      <Screen>
        <View style={styles.mainContainer}>
          <FlatList
            style={styles.container}
            ListHeaderComponent={this.renderHeader}
            ListEmptyComponent={this.renderEmptyList}
            ListFooterComponent={this.renderFooter}
            data={data}
            renderItem={this.renderItem}
            numColumns={2}
            keyExtractor={item => String(item.name)}
            onEndReachedThreshold={0.5}
            onEndReached={!endIsReached && data.length ? this.fetch : undefined}
          />
        </View>
      </Screen>
    );
  }

  renderHeader = () => {
    return <View style={styles.listHeader}>{this.renderError()}</View>;
  };

  renderError = () => {
    const {errorMessage, isFetching, data} = this.state;
    if (isFetching || data.length || !errorMessage) {
      return;
    }
    return (
      <View style={styles.error}>
        <Text style={styles.errorMessage}>{errorMessage}</Text>
        <TouchableWithoutFeedback onPress={this.fetch}>
          <Text style={styles.errorRetry}>Try Again</Text>
        </TouchableWithoutFeedback>
      </View>
    );
  };

  renderEmptyList = () => {
    const {isFetching, errorMessage} = this.state;

    if (isFetching) {
      return (
        <View style={styles.loader}>
          <Spinner />
          <Text style={styles.loaderLabel}>Loading menu...</Text>
        </View>
      );
    }

    if (!errorMessage) {
      return (
        <Text style={styles.emptyListMessage}>
          This menu is empty, please try another one.
        </Text>
      );
    }

    return null;
  };

  renderItem = (props: {item: Meal; index: number}) => {
    const {item, index} = props;
    const {navigation} = this.props;
    let location = navigation.getParam('location');
    const {data} = this.state;
    return (
      <View
        style={[
          styles.meal,
          index % 2 < 1 ? {marginLeft: 24} : {},
          index >= data.length
            ? {marginBottom: getStatusBarHeight() > 20 ? 80 + 32 : 64 + 32}
            : {},
        ]}
        key={index}>
        <TouchableWithoutFeedback
          onPress={() => navigation.navigate('RestaurantMeal', {id: item.id, location:location})}>
          <View style={styles.mealInner}>
            <View style={styles.mealImageContainer}>
              <View style={styles.mealImageContainerInner}>
                <Image
                  defaultSource={mealPlaceholder}
                  source={
                    item.images && item.images[0]
                      ? {uri: item.images[0].src}
                      : mealPlaceholder
                  }
                  resizeMode="cover"
                  width={mealImageWidth}
                  height={mealImageWidth / (16 / 9)}
                  style={styles.mealImage}
                />
              </View>
            </View>
            <Text style={styles.mealName} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={styles.mealLine} />
            <Text style={styles.mealPrice}>{displayAmount(item.price)}</Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  };

  renderFooter = () => {
    const {isFetching, data} = this.state;
    return (
      <View style={styles.footer}>
        {isFetching && data.length ? (
          <Spinner style={styles.loadingMoreSpinner} />
        ) : null}
      </View>
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

const styles = StyleSheet.create({
  loadingMoreSpinner: {
    marginTop: 8,
    marginBottom: 12,
  },
  footer: {
    marginBottom: getStatusBarHeight(true) > 20 ? 90.5 + 20 : 90.5,
  },
  mealLine: {
    height: 3,
    backgroundColor: colors.accent,
    width: 32,
    marginBottom: 8,
  },
  mealImageContainerInner: {
    width: mealImageWidth,
    height: mealImageWidth / (16 / 9),
    ...Platform.select({
      ios: {},
      android: {
        backgroundColor: colors.gray200,
      },
    }),
  },
  mealImageContainer: {
    borderRadius: 8,
    marginBottom: 8,
    marginTop: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        backgroundColor: colors.gray200,
      },
      android: {
        overflow: 'hidden',
      },
    }),
  },
  mealImage: {
    width: mealImageWidth,
    height: mealImageWidth / (16 / 9),
    resizeMode: 'cover',
  },
  listHeader: {
    marginBottom: 32,
  },
  mealName: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.gray900,
    marginBottom: 8,
    height: 40,
    paddingHorizontal: 8,
  },
  mealPrice: {
    position: 'absolute',
    alignSelf: 'flex-end',
    right: 0,
    top: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: colors.accent,
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  mealInner: {
    paddingVertical: 12,
    backgroundColor: colors.white,
    minHeight: 100,
    alignItems: 'center',
    borderStyle: 'solid',
    ...Platform.select({
      android: {
        backgroundColor: colors.white,
      },
      ios: {
        borderRadius: 8,
      },
    }),
  },
  meal: {
    backgroundColor: colors.white,
    width: (width - 80) / 2,
    shadowColor: colors.gray600,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    marginHorizontal: 16,
    marginVertical: 16,
    elevation: 5,
    ...Platform.select({
      android: {
        overflow: 'hidden',
        backgroundColor: colors.white,
        borderRadius: 8,
      },
      ios: {
        borderRadius: 8,
      },
    }),
  },
  errorRetry: {
    color: colors.accent,
    padding: 8,
    fontSize: 14,
  },
  errorMessage: {
    textAlign: 'center',
    fontSize: 16,
    color: colors.gray600,
    marginBottom: 8,
  },
  error: {
    alignItems: 'center',
    marginVertical: 64,
  },
  emptyListMessage: {
    textAlign: 'center',
    color: colors.gray600,
    paddingHorizontal: 64,
    marginVertical: 64,
  },
  loader: {
    marginVertical: 64,
    marginHorizontal: 32,
    alignItems: 'center',
  },
  loaderLabel: {
    color: colors.gray500,
    marginTop: 16,
  },
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  mainContainer: {
    flex: 1,
    marginTop: getStatusBarHeight(true) + 56,
    backgroundColor: colors.white,
    borderTopLeftRadius: 64,
    borderTopRightRadius: 64,
    overflow: 'hidden',
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

export default RestaurantMenu;
