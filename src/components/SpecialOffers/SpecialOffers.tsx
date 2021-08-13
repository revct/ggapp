import React from 'react';
import Screen from 'components/Screen/Screen';
import {
  FlatList,
  Dimensions,
  StyleSheet,
  Image,
  View,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import colors from 'configs/colors';
import {SpecialOffersProps, SpecialOffersState} from './interface';
import {getStatusBarHeight} from 'react-native-status-bar-height';
import FetchSpecialOffersApi, {
  SpecialOfferInterface,
} from 'api/FetchSpecialOffers.api';
import {sleep} from 'utils/Misc';
import VectorIcon from 'components/VectorIcon/VectorIcon';
import Text from 'components/Text/Text';
import Spinner from 'components/Spinner/Spinner';
import BottomSafeArea from 'components/BottomSafeArea/BottomSafeArea';
const {width} = Dimensions.get('screen');
const thumbnailWidth = width - 64;
const thumbnailHeight = thumbnailWidth / (480 / 172);

class SpecialOffers extends React.Component<
  SpecialOffersProps,
  SpecialOffersState
> {
  static navigationOptions = () => {
    return {
      headerTitle: 'Special Offers',
      headerTintColor: colors.gray600,
      headerTitleContainerStyle: styles.headerContainer,
      headerTransparent: true,
      headerStyle: styles.header,
      headerTitleStyle: styles.headerTitle,
      headerBackTitle: ' ',
      headerRight: <Text />,
    };
  };

  state: SpecialOffersState = {
    isPending: false,
    data: [],
    errorMessage: null,
  };

  mounted: boolean = false;

  componentDidMount() {
    this.mounted = true;
    this.fetch();
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  handleDealPress = (item: SpecialOfferInterface) => {
    const {navigation} = this.props;
    switch (item.sbu) {
      case 'cinema':
        return navigation.navigate({
          routeName: 'CinemasFilm',
          params: {id: item.id, deal: true},
          key: 'CinemasFilm' + item.id,
        });
      case 'restaurant':
        return navigation.navigate({
          routeName: 'RestaurantMeal',
          params: {
            id: item.id,
            deal: true,
            variation: item.variation_id || null,
          },
          key: 'RestaurantMeal' + item.id,
        });
      case 'hotel':
        break;
    }
  };

  itemSpacingStyle(index: number) {
    const {data} = this.state;
    if (index === 0) {
      return styles.firstItem;
    }
    if (index >= data.length - 1) {
      return styles.lastItem;
    }
    return null;
  }

  fetch = async () => {
    const {isPending} = this.state;
    if (isPending || !this.mounted) {
      return;
    }
    this.setState({
      isPending: true,
      errorMessage: null,
    });
    await sleep(200);
    try {
      const data = await FetchSpecialOffersApi();
      if (!this.mounted) {
        return;
      }
      this.setState({
        isPending: false,
        data: data,
      });
    } catch (e) {
      if (!this.mounted) {
        return;
      }
      let errorMessage = e.message;
      if (/network/i.test(errorMessage)) {
        errorMessage = 'Please check your internet connection and try again.';
      }
      this.setState({
        isPending: false,
        errorMessage: errorMessage,
      });
    }
  };

  render() {
    const {data} = this.state;
    return (
      <Screen>
        <View style={styles.container}>
          <FlatList
            style={{flex: 1}}
            data={data.filter(
              i => typeof i.image_url === 'string' && i.image_url.trim().length,
            )}
            keyExtractor={item => String(item.id)}
            renderItem={this.renderItem}
            ListHeaderComponent={this.renderListHeader}
            ListFooterComponent={this.renderListFooter}
          />
        </View>
      </Screen>
    );
  }

  renderListFooter = () => {
    return <BottomSafeArea />;
  };

  renderListHeader = () => {
    const {isPending, errorMessage} = this.state;
    if (isPending) {
      return (
        <View style={[styles.offerItemLoader]}>
          <Spinner />
        </View>
      );
    }
    if (errorMessage) {
      return (
        <View
          style={[
            styles.offerItem,
            styles.offerItemError,
            this.itemSpacingStyle(0),
          ]}>
          <VectorIcon
            name="md-information-circle-outline"
            color={colors.accent}
            size={32}
          />
          <Text style={styles.offerItemErrorText}>{errorMessage}</Text>
          <TouchableWithoutFeedback onPress={this.fetch}>
            <Text style={styles.offerItemErrorRetryButton}>Try Again</Text>
          </TouchableWithoutFeedback>
        </View>
      );
    }
    return <View style={{marginTop: 24}} />;
  };

  renderItem = (props: {
    item: SpecialOfferInterface;
    index: number;
  }): React.ReactElement => {
    const {item} = props;
    return (
      <TouchableWithoutFeedback onPress={this.handleDealPress.bind(this, item)}>
        <View style={styles.offerItem}>
          <View style={styles.offerImageContainer}>
            <View style={styles.offerImageContainerInner}>
              <View style={styles.imageLoader}>
                <Spinner />
              </View>
              <Image source={{uri: item.image_url}} style={styles.offerImage} />
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  };
}

const styles = StyleSheet.create({
  imageLoader: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0)',
  },
  offerItemLoader: {
    height: thumbnailHeight,
    backgroundColor: colors.white,
    paddingVertical: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerItemErrorRetryButton: {
    padding: 4,
    color: colors.accent,
  },
  offerItemErrorText: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.gray700,
  },
  offerItemError: {
    width: thumbnailWidth,
    height: thumbnailHeight,
    backgroundColor: colors.gray200,
    paddingHorizontal: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 64,
    borderTopRightRadius: 64,
    marginTop: getStatusBarHeight(true) + 56,
    overflow: 'hidden',
  },
  firstItem: {
    marginTop: 16,
  },
  lastItem: {
    marginBottom: getStatusBarHeight(true) > 20 ? 80 + 32 : 64 + 32,
  },
  offerItem: {
    paddingHorizontal: 32,
    marginVertical: 10,
    borderRadius: 12,
  },
  offerImageContainerInner: {
    width: thumbnailWidth,
    height: thumbnailHeight,
    backgroundColor: colors.gray300,
  },
  offerImageContainer: {
    width: thumbnailWidth,
    height: thumbnailHeight,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      android: {
        overflow: 'hidden',
      },
      ios: {},
    }),
  },
  offerImage: {
    width: thumbnailWidth,
    height: thumbnailHeight,
    resizeMode: 'cover',
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

export default SpecialOffers;
