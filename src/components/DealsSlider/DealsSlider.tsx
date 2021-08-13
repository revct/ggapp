import React from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Image,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  DealsSliderState,
  DealsSliderProps,
  RenderRestaurantDealProps,
} from './interfaces';
import colors from 'configs/colors';
import {withNavigation} from 'react-navigation';
import Text from 'components/Text/Text';
import {sleep} from 'utils/Misc';
import FetchSpecialOffersApi, {
  SpecialOfferInterface,
} from 'api/FetchSpecialOffers.api';
import VectorIcon from 'components/VectorIcon/VectorIcon';
import Spinner from 'components/Spinner/Spinner';
const {width} = Dimensions.get('screen');
const thumbnailWidth = width - 32 * 2;
const thumbnailHeight = thumbnailWidth / (480 / 172);

class DealsSlider extends React.Component<DealsSliderProps, DealsSliderState> {
  state: DealsSliderState = {
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
      return styles.firstDeal;
    }
    if (index >= data.length - 1) {
      return styles.lastDeal;
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
      // get deals
      const data = await FetchSpecialOffersApi();
      if (!this.mounted) {
        return;
      }
      this.setState({
        isPending: false,
        data: data || [],
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
    const {navigation} = this.props;
    return (
      <View style={styles.container}>
        <View style={styles.heading}>
          <Text style={styles.title}>Special Offers</Text>
          <TouchableWithoutFeedback
            onPress={() => navigation.navigate('SpecialOffers')}>
            <Text style={styles.seeAllLink}>{'See All>>'}</Text>
          </TouchableWithoutFeedback>
        </View>
        <FlatList
          data={data.filter(
            i => typeof i.image_url === 'string' && i.image_url.trim().length,
          )}
          keyExtractor={item => String(item.id)}
          renderItem={this.renderDeal}
          horizontal={true}
          ListHeaderComponent={this.renderListHeader}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    );
  }

  renderListHeader = () => {
    const {isPending, errorMessage} = this.state;
    if (isPending) {
      return (
        <View
          style={[styles.deal, styles.dealLoader, this.itemSpacingStyle(0)]}>
          <Spinner />
        </View>
      );
    }
    if (errorMessage) {
      return (
        <View style={[styles.deal, styles.dealError, this.itemSpacingStyle(0)]}>
          <VectorIcon
            name="md-information-circle-outline"
            color={colors.accent}
            size={32}
          />
          <Text style={styles.dealErrorText}>{errorMessage}</Text>
          <TouchableWithoutFeedback onPress={this.fetch}>
            <Text style={styles.dealErrorRetryButton}>Try Again</Text>
          </TouchableWithoutFeedback>
        </View>
      );
    }
    return null;
  };

  renderDeal = (props: RenderRestaurantDealProps) => {
    const {item} = props;
    return (
      <TouchableWithoutFeedback onPress={this.handleDealPress.bind(this, item)}>
        <View style={[styles.deal, this.itemSpacingStyle(props.index)]}>
          <View style={styles.dealInner}>
            <View style={styles.imageLoader}>
              <Spinner />
            </View>
            <Image source={{uri: item.image_url}} style={styles.dealImage} />
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
    backgroundColor: colors.gray300,
  },
  dealLoader: {
    width: thumbnailWidth,
    height: thumbnailHeight,
    backgroundColor: colors.gray200,
    paddingHorizontal: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dealErrorRetryButton: {
    padding: 4,
    color: colors.accent,
  },
  dealErrorText: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.gray700,
  },
  dealError: {
    width: thumbnailWidth,
    height: thumbnailHeight,
    backgroundColor: colors.gray200,
    paddingHorizontal: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {},
  firstDeal: {
    marginLeft: 32,
  },
  lastDeal: {
    marginRight: 32,
  },
  dealInner: {},
  deal: {
    marginHorizontal: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  dealImage: {
    width: thumbnailWidth,
    height: thumbnailHeight,
    resizeMode: 'stretch',
    borderRadius: 12,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 18,
    marginTop: 16,
  },
  title: {
    flex: 1,
    fontSize: 14,
    color: colors.black,
    marginLeft: 32,
  },
  seeAllLink: {
    paddingTop: 16,
    paddingLeft: 16,
    color: colors.accent,
    fontSize: 10,
    marginRight: 40,
  },
});

export default withNavigation(DealsSlider);
