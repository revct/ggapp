import React from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  Dimensions,
  Image,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {PerformanceCarouselProps, PerformanceCarouselState} from './interfaces';
import FetchPerformanceList, {Performance, fetchFilmList} from 'api/FetchPerformanceList';
import Text from 'components/Text/Text';
import {padNumber} from 'utils/Misc';
import Axios, {Canceler} from 'axios';
import Spinner from 'components/Spinner/Spinner';
import colors from 'configs/colors';
import VectorIcon from 'components/VectorIcon/VectorIcon';
import { CINEMAS_API_URL } from 'configs/api';
import CinemasTokenApi from '../../api/CinemasToken.api';

const {width} = Dimensions.get('window');
const placeholderFilmImage = require('../../assets/cinemas/placeholder-film.png');
const filmWidth = (width - (64 + 32)) / 3;
const filmImageWidth = filmWidth;
const filmImageHeight = filmWidth * (206 / 162);

class PerformanceCarousel extends React.Component<
  PerformanceCarouselProps,
  PerformanceCarouselState
> {
  state: PerformanceCarouselState = {
    isPending: false,
    page: 0,
    nextPage: 1,
    list: [],
    errorMessage: null,
    filmList:[],
  };

  cancler?: Canceler;

  currentTime: number;

  constructor(props: PerformanceCarouselProps) {
    super(props);
    this.currentTime = new Date().getTime();
  }

  componentDidMount() {
    this.fetch();
  }

  componentWillUnmount() {
    if (this.cancler) {
      this.cancler();
    }
  }

  componentDidUpdate(prevProps: PerformanceCarouselProps) {
    if (prevProps.cinema !== this.props.cinema) {
      this.reset();
    }
  }

  handleSelect = (item: Performance) => {
    const {onSelect} = this.props;
    if (onSelect) {
      onSelect(item);
    }
  };

  reset = () => {
    if (this.cancler) {
      this.cancler();
    }
    this.setState(
      {
        isPending: false,
        page: 0,
        nextPage: 1,
        list: [],
        errorMessage: null,
      },
      this.fetch,
    );
  };

  updateList = (performances: Array<Performance>) => {
    const {list} = this.state;
    const listArrayId = [];
   
    const newList: Array<Performance> = performances.filter(item => {
      // dont add if show time has already elapsed
      if (
        this.currentTime >
          new Date(item.perfdate + ' ' + item.start_time).getTime() ||
        item.stop_selling !== 'N'
      ) {
        return false;
      }
      // don't repeat performance already listed
      // if (list.findIndex(i => i.film.id === item.film.id) !== -1) {
      // return false;
      // }
      if(listArrayId.includes(item.film.id)){
        return false;
      }
      
      listArrayId.push(item.film.id);
      
      // show
      return true;
    });
    
    // add new items to the list
    this.setState(({list}) => ({
      list: [...list, ...newList],
    }));
  };

  fetch = () => {
    this.fetchFilmList();

    const {date, cinema, onWillFetch} = this.props;
    const {nextPage, isPending} = this.state;
    if (isPending || !nextPage) {
      return;
    }
    if (onWillFetch) {
      onWillFetch();
    }
    this.setState(
      {
        isPending: true,
        errorMessage: null,
      },
      async () => {
        try {
          const result = await FetchPerformanceList(
            {
              perfdate: date
                ? date.getFullYear() +
                  '-' +
                  padNumber(date.getMonth() + 1) +
                  '-' +
                  padNumber(date.getDate())
                : undefined,
              page: nextPage,
              cinema: cinema,
            },
            {
              canceler: this.cancler,
            },
          );
          this.setState(
            {
              isPending: false,
              page: nextPage,
              nextPage: result.next ? nextPage + 1 : null,
            },
            () => this.updateList(result.results),
          );
        } catch (e) {
          if (Axios.isCancel(e)) {
            return;
          }
          let errorMessage =
            e.reponse && e.response.data
              ? e.reponse.data.message || e.response.data.detail
              : e.message;
          if (/network/gi.test(errorMessage)) {
            errorMessage =
              'Please check your internet connection and try agian.';
          }
          this.setState({
            isPending: false,
            errorMessage: errorMessage,
          });
        }
      },
    );
  };

  fetchFilmList = async () => {
    try{
      const token = await CinemasTokenApi();
      let response = await Axios.get(`${CINEMAS_API_URL+ this.props.cinema +"/film/"}`,{
        headers:{
          Authorization: `Token ${token.data}`
        }
      })   

      if(response.data){
        this.setState({
          filmList:response.data.results
        })
      }
    }catch(err){
      console.log(err)
      let errorMessage = "Could not get movie posters";
      this.setState({
        errorMessage: errorMessage,
      });
    }
      
  }

  render() {
    const {list, isPending} = this.state;
    if (list.length < 1) {
      return (
        <View style={styles.noListContainer}>
          {isPending ? this.renderLoader() : this.renderEmpty()}
        </View>
      );
    }
    return (
      <FlatList
        horizontal
        bounces={false}
        data={list}
        renderItem={this.renderItem}
        keyExtractor={item => String(item.id)}
        ListFooterComponent={this.renderFooter}
        showsHorizontalScrollIndicator={false}
        onEndReachedThreshold={0.8}
        onEndReached={this.fetch}
      />
    );
  }

  renderEmpty = () => {
    const {errorMessage, isPending, list} = this.state;
    if (isPending || list.length) {
      return null;
    }
    if (errorMessage) {
      return (
        <>
          <Text style={styles.noScheduleError}>{errorMessage}</Text>
          {this.renderRetryButton()}
        </>
      );
    }
    return (
      <Text style={styles.noSchedule}>
        No movies scheduled for this day at the selected cinema.
      </Text>
    );
  };

  renderFooter = () => {
    const {isPending, errorMessage} = this.state;
    if (isPending) {
      return this.renderLoader();
    }
    if (errorMessage) {
      return this.renderRetryButton();
    }
    return null;
  };

  renderLoader() {
    const {list} = this.state;
    return (
      <View
        style={[
          styles.item,
          !list.length ? styles.firstFilm : {},
          styles.lastFilm,
        ]}>
        <View style={styles.loaderContainer}>
          <View style={styles.loaderContainerInner}>
            <Spinner />
          </View>
        </View>
      </View>
    );
  }

  renderRetryButton() {
    const {list} = this.state;
    return (
      <TouchableOpacity onPress={this.fetch}>
        <View
          style={[
            styles.item,
            !list.length ? styles.firstFilm : {},
            styles.lastFilm,
            !list.length ? styles.itemError : {},
          ]}>
          <View
            style={[
              styles.loaderContainer,
              !list.length ? styles.loaderContainerError : {},
            ]}>
            <View
              style={[
                styles.loaderContainerInner,
                !list.length ? styles.loaderContainerErrorInner : {},
              ]}>
              <Text
                style={[
                  styles.errorText,
                  !list.length ? styles.errorTextListItem : {},
                ]}>
                Try Again
              </Text>
              <VectorIcon
                color={colors.accent}
                size={!list.length ? 18 : 24}
                name="md-refresh"
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  renderItem = (props: {item: Performance; index: number}) => {
    const {item, index} = props;
    const {list, isPending, errorMessage} = this.state;
    const filmItem = this.state.filmList.find(film=>film.id==item.film.id);
    const imageUrl = filmItem? filmItem.imageurl.trim() : '';
    // const imageUrl = item.film.imageurl ? item.film.imageurl.trim() : '';
    return (
      <TouchableWithoutFeedback onPress={() => this.handleSelect(item)}>
        <View
          style={[
            styles.item,
            index === 0 ? styles.firstFilm : {},
            index + 1 >= list.length &&
            !isPending &&
            !errorMessage &&
            list.length > 3
              ? styles.lastFilm
              : {},
          ]}>
          <View style={styles.imageContainer}>
            <Image
              resizeMode="cover"
              source={
                imageUrl && imageUrl !== 'n/a'
                  ? {uri: imageUrl}
                  : placeholderFilmImage
              }
              style={styles.image}
            />
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {item.film.title}
          </Text>
          <View style={styles.filmMetaInfo} />
        </View>
      </TouchableWithoutFeedback>
    );
  };
}

const styles = StyleSheet.create({
  noListContainer: {
    // flexDirection: 'row',
  },
  noScheduleError: {
    paddingHorizontal: 40,
    color: colors.gray600,
    marginTop: 32,
    marginBottom: 0,
    textAlign: 'center',
    fontSize: 14,
  },
  noSchedule: {
    paddingHorizontal: 40,
    color: colors.gray600,
    marginVertical: 16,
    textAlign: 'center',
    fontSize: 14,
  },
  errorTextListItem: {
    marginRight: 10,
    marginBottom: 0,
  },
  errorText: {
    marginRight: 0,
    marginBottom: 4,
    fontSize: 14,
    textAlign: 'center',
    color: colors.accent,
  },
  filmMetaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#0b0b0b',
    fontSize: 10,
    height: 28,
    lineHeight: 12,
  },
  loaderContainerErrorInner: {
    backgroundColor: undefined,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loaderContainerInner: {
    flex: 1,
    backgroundColor: colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainerError: {
    width: undefined,
    height: 32,
    overflow: undefined,
  },
  loaderContainer: {
    marginTop: 8,
    width: filmImageWidth,
    height: filmImageHeight,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imageContainer: {
    width: filmImageWidth,
    height: filmImageHeight,
    backgroundColor: colors.white,
    borderRadius: 8,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
    ...Platform.select({
      android: {
        overflow: 'hidden',
      },
      ios: {},
    }),
  },
  image: {
    resizeMode: 'cover',
    width: filmImageWidth,
    height: filmImageHeight,
    borderRadius: 8,
  },
  firstFilm: {
    marginLeft: 32,
  },
  lastFilm: {
    marginRight: 32,
  },
  itemError: {
    width: undefined,
    // flex: 1,
    marginTop: 0,
  },
  item: {
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: 8,
    width: filmWidth,
  },
  flatlist: {
    minHeight: 200,
    backgroundColor: 'orange',
  },
});

export default PerformanceCarousel;
