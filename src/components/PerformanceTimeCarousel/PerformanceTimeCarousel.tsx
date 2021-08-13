import React from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  PerformanceTimeCarouselProps,
  PerformanceTimeCarouselState,
} from './interfaces';
import FetchPerformanceList, {Performance} from 'api/FetchPerformanceList';
import Text from 'components/Text/Text';
import {padNumber, parseTimeDate} from 'utils/Misc';
import Axios, {Canceler} from 'axios';
import Spinner from 'components/Spinner/Spinner';
import colors from 'configs/colors';

class PerformanceTimeCarousel extends React.Component<
  PerformanceTimeCarouselProps,
  PerformanceTimeCarouselState
> {
  state: PerformanceTimeCarouselState = {
    isPending: false,
    page: 0,
    nextPage: 1,
    list: [],
    errorMessage: null,
  };

  cancler?: Canceler;

  currentTime: number;

  constructor(props: PerformanceTimeCarouselProps) {
    super(props);
    this.currentTime = Date.now();
  }

  componentDidMount() {
    setTimeout(() => {
      this.fetch();
    }, 300);
  }

  componentWillUnmount() {
    if (this.cancler) {
      this.cancler();
    }
  }

  handleSelect = (item: Performance) => {
    const {onSelect} = this.props;
    if (onSelect) {
      onSelect(item);
    }
  };

  updateList = (performances: Array<Performance>) => {
    const newList = performances
      .filter(item => {
        const showingTime = new Date(item.perfdate + 'T' + item.start_time);
        if (
          this.currentTime > showingTime.getTime() ||
          item.stop_selling !== 'N'
        ) {
          return false;
        }
        return true;
      })
      .map(item => {
        const showingTime = new Date(item.perfdate + 'T' + (item.start_time+"Z"));
        return {
          ...item,
          perfdate: item.perfdate,
          start_time: `${padNumber(showingTime.getHours() - 1)}:${padNumber(
            showingTime.getMinutes(),
          )}`,
        };
      });
    // add new items to the list
    this.setState(({list}) => ({
      list: [...list, ...newList],
    }));
  };

  fetch = () => {
    const {date, filmId, cinema} = this.props;
    const {nextPage, isPending} = this.state;
    if (isPending || !nextPage || !filmId) {
      return;
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
              film__id: filmId,
              cinema,
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
          let errorMessage = e.message;
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

  render() {
    const {list, isPending} = this.state;
    return (
      <FlatList
        horizontal={
          (!isPending && list.length) || (isPending && !list.length)
            ? true
            : false
        }
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

  renderFooter = () => {
    const {isPending, errorMessage, list} = this.state;
    if (isPending) {
      return (
        <View
          style={[
            styles.showTime,
            !list.length ? styles.firstShowtime : {},
            styles.lastShowtime,
          ]}>
          <View style={styles.loaderContainer}>
            <Spinner />
          </View>
        </View>
      );
    }
    if (errorMessage && !list.length) {
      return (
        <Text style={styles.errorMessage}>
          {errorMessage}{' '}
          <Text style={styles.tryAgainText} onPress={this.fetch}>
            Try Again
          </Text>
        </Text>
      );
    }
    if (!list.length) {
      return (
        <Text style={styles.emptyMessage}>
          No available show time on selected day
        </Text>
      );
    }
    return null;
  };

  renderItem = (props: {item: Performance; index: number}) => {
    const {item, index} = props;
    const {selected} = this.props;
    const {list, isPending} = this.state;
    return (
      <TouchableWithoutFeedback onPress={() => this.handleSelect(item)}>
        <View
          style={[
            styles.showTime,
            selected && selected.id === item.id
              ? styles.showTimeSelected
              : null,
            index === 0 ? styles.firstShowtime : {marginLeft: 0},
            index >= list.length - 1 && list.length > 1 && !isPending
              ? styles.lastShowtime
              : null,
          ]}>
          <Text
            light
            style={[
              styles.showTimeTime,
              selected && selected.id === item.id
                ? styles.showTimeTimeSelected
                : {},
            ]}>
            {parseTimeDate(item.perfdate + 'T' + item.start_time)}
          </Text>
        </View>
      </TouchableWithoutFeedback>
    );
  };
}

const styles = StyleSheet.create({
  emptyMessage: {
    flex: 1,
    textAlign: 'center',
    color: colors.gray400,
    fontSize: 14,
  },
  tryAgainText: {
    color: colors.accent,
  },
  errorMessage: {
    color: colors.black,
    fontSize: 14,
    textAlign: 'center',
  },
  showTimeTimeSelected: {
    color: colors.white,
  },
  showTimeTime: {
    color: 'rgba(0,0,0,0.57)',
    fontSize: 12,
  },
  lastShowtime: {
    marginRight: 32,
  },
  firstShowtime: {
    marginLeft: 32,
  },
  showTimeSelected: {
    backgroundColor: colors.accent,
  },
  showTime: {
    backgroundColor: colors.gray200,
    paddingHorizontal: 8,
    marginHorizontal: 8,
    borderRadius: 4,
    height: 24,
    justifyContent: 'center',
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  flatlist: {
    minHeight: 200,
    backgroundColor: 'orange',
  },
});

export default PerformanceTimeCarousel;
