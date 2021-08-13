/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {View, StyleSheet} from 'react-native';
import {CinemaSelectorProps, CinemaSelectorState} from './interfaces';
import {GeolocationRefApi} from 'components/Goelocation/interfaces';
import {
  Menu,
  MenuTrigger,
  MenuOptions,
  MenuOption,
} from 'react-native-popup-menu';
import Text from 'components/Text/Text';
import colors from 'configs/colors';
import VectorIcon from 'components/VectorIcon/VectorIcon';
import FetchCinemas, {Cinema} from 'api/FetchCinemas';
import Spinner from 'components/Spinner/Spinner';
import {asyncGet, asyncStore} from 'utils/Async';
import {STORE_KEYS} from 'configs/async';
import Axios from 'axios';
import NearestPlaceIndex from 'utils/NearestPlace';
import isEqual from 'lodash/isEqual';
import {withGeoloc} from 'contexts/GeolocContext';

class CinemaSelector extends React.Component<
  CinemaSelectorProps,
  CinemaSelectorState
> {
  state: CinemaSelectorState = {
    isFetching: false,
    list: [],
    error: false,
    selected: null,
  };

  geolocationApi?: GeolocationRefApi;

  cinemasApi: FetchCinemas;

  mounted: boolean = false;

  constructor(props: CinemaSelectorProps) {
    super(props);
    this.cinemasApi = new FetchCinemas();
  }

  componentDidMount() {
    this.mounted = true;
    this.getPersistedCinema();
    this.getCinemas();
  }

  componentWillUnmount() {
    this.mounted = false;
    if (this.cinemasApi) {
      this.cinemasApi.cancel();
    }
  }

  componentDidUpdate(prevPros: CinemaSelectorProps) {
    if (!isEqual(prevPros.coords, this.props.coords)) {
      this.selectNearestCinema();
    }
  }

  getCinemas = async () => {
    const cinemas = await asyncGet(STORE_KEYS.CINEMAS);
    if (!this.mounted) {
      return;
    }
    if (Array.isArray(cinemas)) {
      this.setState(
        {
          list: cinemas,
        },
        this.selectNearestCinema,
      );
    }
    this.fetchCinemas();
  };

  getPersistedCinema = async () => {
    const cinema = await asyncGet(STORE_KEYS.SELECTED_CINEMA);
    if (cinema) {
      this.handleSelectCinema(cinema);
    }
  };

  fetchCinemas = () => {
    if (!this.mounted) {
      return;
    }
    this.setState(
      {
        isFetching: true,
        error: false,
      },
      async () => {
        try {
          const cinemas = await this.cinemasApi.fetch();
          this.setState(
            {
              list: cinemas,
              isFetching: false,
            },
            () => {
              this.selectNearestCinema();
              this.save();
            },
          );
        } catch (e) {
          // do nothing if the request was canceled
          if (Axios.isCancel(e)) {
            return;
          }
          this.setState({
            error: true,
            isFetching: false,
          });
        }
      },
    );
  };

  save = () => {
    const {list} = this.state;
    asyncStore(STORE_KEYS.CINEMAS, list);
  };

  getCurrentlySelected(): Cinema | undefined {
    const {list, selected} = this.state;
    if (selected) {
      return selected;
    }
    return list[0];
  }

  getTriggerLabel() {
    const {isFetching} = this.state;
    const selected = this.getCurrentlySelected();
    if (selected) {
      return selected.a;
    }
    if (isFetching) {
      return 'Loading...';
    }
    return 'Select Cinema';
  }

  selectNearestCinema = () => {
    const {list} = this.state;
    const {coords, onChange} = this.props;
    // stop if user location has not been selected or cinemas list is empty
    if (!list.length) {
      return;
    }

    // select first item from list if location is not fetched
    if (!coords) {
      if (!onChange) {
        return;
      }
      return this.handleSelectCinema(this.getCurrentlySelected() || null);
    }

    // get cinemas with geo points
    const cinemasWithCoords = list.map(
      (item): {lat: number; lng: number} => {
        return {lat: item.lat, lng: item.long};
      },
    );

    // get nearest cinema
    const nearestIndex = NearestPlaceIndex(
      coords.lat,
      coords.lng,
      cinemasWithCoords,
    );

    // stop if no nearest cinema is found
    if (nearestIndex < 0) {
      return;
    }

    // select the neares cinema from the list
    const cinema = list[nearestIndex];
    if (!cinema) {
      return;
    }

    // set the neares cinema as the  selected one
    this.handleSelectCinema(cinema);
  };

  handleSelectCinema = async (item: Cinema | null) => {
    const cinema: Cinema | null = item ? {...item} : null;
    // const cinema: Cinema | null = item ? {...item, tsite: 'GENAPI'} : null;
    // const cinema: Cinema | null = item
    //   ? {...item, tsite: __DEV__ ? 'GENAPI' : item.tsite}
    //   : null;
    this.setState(
      {
        selected: cinema,
      },
      this.handleCinemaSelected,
    );
    // persist selected cinema
    asyncStore(STORE_KEYS.SELECTED_CINEMA, cinema);
  };

  handleCinemaSelected = () => {
    const {selected} = this.state;
    const {onChange} = this.props;
    if (onChange) {
      onChange(selected);
    }
  };

  render() {
    const {list, isFetching} = this.state;
    const selected = this.getCurrentlySelected();
    return (
      <>
        <Menu>
          <MenuTrigger
            disabled={isFetching && !list.length ? true : false}
            customStyles={{triggerWrapper: styles.variationTriggerOption}}>
            <View style={styles.variationTriggercontent}>
              <Text
                style={{
                  color: selected ? colors.gray900 : colors.gray600,
                  flex: 1,
                  fontSize: 12,
                }}
                numberOfLines={1}
                light>
                {selected ? selected.t : 'Select Cinema'}
              </Text>
              {isFetching && !list.length ? (
                <Spinner />
              ) : (
                <VectorIcon
                  name="md-arrow-dropdown"
                  color={colors.gray900}
                  size={16}
                />
              )}
            </View>
          </MenuTrigger>
          <MenuOptions>
            {list.map((item, index) => (
              <MenuOption
                key={index}
                onSelect={() => this.handleSelectCinema(item)}>
                <View style={styles.selectOption}>
                  {selected && selected.t === item.t ? (
                    <VectorIcon
                      name="md-checkmark"
                      color={colors.accent}
                      size={16}
                    />
                  ) : null}
                  <Text style={styles.selectOptionName}>{item.t}</Text>
                </View>
              </MenuOption>
            ))}
          </MenuOptions>
        </Menu>
      </>
    );
  }
}

const styles = StyleSheet.create({
  selectOptionName: {
    flex: 1,
    marginLeft: 8,
  },
  selectOption: {
    padding: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  variationTriggercontent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  variationTriggerOption: {
    flexGrow: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: colors.gray100,
  },
});

export default withGeoloc(CinemaSelector);
