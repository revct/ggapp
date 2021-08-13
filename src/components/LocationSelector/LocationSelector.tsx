import React from 'react';
import { StyleSheet, View, TouchableWithoutFeedback, TextInput, Alert } from 'react-native';
import Modal from 'react-native-modal';
import { LocationSelectorProps, LocationSelectorState, RenderLocationProp } from './interfaces';
import VectorIcon from 'components/VectorIcon/VectorIcon';
import colors from 'configs/colors';
import { withNavigationFocus, FlatList } from 'react-navigation';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import Axios, { Canceler } from 'axios';
import { sleep } from 'utils/Misc';
import { withLocation } from 'contexts/LocationContext';
import LocationSearchApi, { CoordsInfo } from 'api/LocationSearch.api';
import Spinner from 'components/Spinner/Spinner';
import Text from 'components/Text/Text';
import CoordsLookupApi from 'api/CoordsLookup.api';
import Logger from 'utils/Logger';
import { withGeoloc } from 'contexts/GeolocContext';

class LocationSelector extends React.Component<LocationSelectorProps, LocationSelectorState>{
  state: LocationSelectorState = {
    isFetching: false,
    errorMessage: null,
    visible: false,
    locations: [],
    search: '',
    searchQuery: '',
    isSearching: false,
    isSelecting: false,
    selectedLocation: null,
  };

  mounted: boolean = false;

  searchDebounce?: any;

  cancelSearch?: Canceler;

  coordsLookupCanceler?: Canceler;

  componentDidMount() {
    this.mounted = true;
    this.setScoped();
  }

  componentWillUnmount() {
    this.mounted = false;
    if (this.cancelSearch) {
      this.cancelSearch();
    }
    if (this.coordsLookupCanceler) {
      this.coordsLookupCanceler();
    }
  }

  componentDidUpdate(prevProps: LocationSelectorProps, prevState: LocationSelectorState) {
    if (prevProps.isFocused
      && !this.props.isFocused
      && this.state.visible
    ) {
      this.hide();
    }

    if (prevState.visible && !this.state.visible) {
      this.clearSearch();
    }

    if(this.props.scoped && !prevProps.value && this.props.value) {
      this.setState({
        selectedLocation: this.props.value,
      })
    }
  }

  setScoped = () => {
    const {scoped, value} = this.props;
    if(!scoped) {
      return;
    }
    this.setState({
      selectedLocation: value ? value : null,
    });
  }

  clearSearch = () => {
    this.setState({ locations: [] });
  }

  hide = () => {
    this.setState({
      visible: false,
    }, this.cancelOnGoingSearch);
  }

  show = () => {
    this.setState({
      visible: true,
      search: ''
    });
  }

  async getCoordsInfo(lat: number, lng: number): Promise<CoordsInfo> {
    try {
      const result = await CoordsLookupApi({ lat, lng }, { canceler: (c) => (this.coordsLookupCanceler = c) });
      if (result.length) {
        return Promise.resolve(result[0]);
      }
      throw new Error("Failed to get selected location's geo coordinates.");
    } catch (e) {
      Logger(e);
      return Promise.reject(e);
    }
  }

  selectLocation = async (location: CoordsInfo) => {
    const { setLocation, scoped, onChange } = this.props;
    try {
      if (!location.address_components) {
        this.setState({ isSelecting: true });
        const loc = await this.getCoordsInfo(location.geometry.location.lat, location.geometry.location.lng);
        location = { ...location, ...loc }
      }
      this.setState(({selectedLocation}) => ({
        isSelecting: false,
        selectedLocation: scoped ? location : selectedLocation,
      }), () => {
        if(scoped && onChange) {
          onChange(location);
        }
        this.hide()
      });
      if(!scoped) {
        setLocation(location);
      }
    } catch (e) {
      this.setState({ isSelecting: false });
      Alert.alert('Error', 'Falied to select location, please try again.');
      Logger(e);
    }
  }

  handleModalShow = async () => {
  }

  handleSearchChange = (value: string) => {
    this.setState({
      search: value,
    }, this.handlePrepareToSearch);
  }

  handlePrepareToSearch = () => {
    clearTimeout(this.searchDebounce);
    this.cancelOnGoingSearch();
    this.searchDebounce = setTimeout(this.searchLocations, 800);
  }

  cancelOnGoingSearch(callback?: () => void) {
    if (this.cancelSearch) {
      this.cancelSearch();
    }
    if (callback) {
      callback();
    }
  }

  searchLocations = () => {
    const { search, isSearching } = this.state;
    // stop if the search string is empty
    if (!search.replace(/ /gi, '')) {
      return;
    }
    // cancel ongoing search
    if (isSearching) {
      this.cancelOnGoingSearch();
    }
    // set searching to true
    this.setState({
      isSearching: true,
      errorMessage: null,
      locations: [],
      searchQuery: search,
    }, async () => {
      await sleep(800);
      try {
        const result = await LocationSearchApi(search, { canceler: c => (this.cancelSearch = c) });
        if (!this.mounted) {
          return;
        }
        this.setState({
          isSearching: false,
          locations: result,
        });
      }
      catch (e) {
        if (!this.mounted) {
          return;
        }
        // cancel search
        if (Axios.isCancel(e)) {
          return this.setState({
            isSearching: false
          });
        }

        // log error
        Logger(e);
        let errorMessage = e.message || 'Your location search failed.';
        if(/network/i.test(errorMessage)) {
          errorMessage = 'Please check your internet connection and try again.'
        }
        // set search error
        this.setState({
          isSearching: false,
          errorMessage: errorMessage
        });
      }
    });
  }

  getSelected() {
    const {location, geoloc, scoped} = this.props;
    const {selectedLocation} = this.state;
    if(scoped){
      return selectedLocation || null;
    }
    return location || geoloc || null;
  }

  render() {
    const { renderer, disabled } = this.props;
    const location = this.getSelected();
    return (
      <View style={styles.container}>
        {renderer
          ? renderer(this.show, location)
          : (
            <View style={styles.content}>
              <Text style={styles.label}>Set Delivery Location</Text>
              <TouchableWithoutFeedback onPress={this.show} disabled={disabled ? true : false}>
                <View style={styles.button}>
                  <VectorIcon
                    name="md-pin"
                    color={colors.gray900}
                    size={14}
                  />
                  <Text style={styles.buttonLabel} numberOfLines={1}>
                    {location
                      ? location.name || location.formatted_address : 'Your Location'}
                  </Text>
                </View>
              </TouchableWithoutFeedback>
            </View>
          )}

        {this.renderModal()}
      </View>
    );
  }

  renderModal() {
    const { visible } = this.state;
    return (
      <Modal
        style={styles.modal}
        isVisible={visible}
        onModalShow={this.handleModalShow}
        animationIn="fadeInUp"
        animationOut="fadeOutDown"
        animationInTiming={400}
        animationOutTiming={300}
        backdropColor="rgba(255,255,255,1)"
        onSwipeComplete={this.hide}
        swipeDirection="down">
        <View style={styles.modalContent}>
          {this.renderModalHeader()}
          {this.renderModalBody()}
        </View>
      </Modal>
    );
  }

  renderModalBody() {
    const { locations } = this.state;
    return (
      <FlatList
        style={styles.flatList}
        data={locations}
        ListHeaderComponent={this.renderListHeader}
        ListEmptyComponent={this.renderEmptyList}
        renderItem={this.renderLocation}
        keyExtractor={(item: CoordsInfo) => String(item.geometry.location.lat + '-' + item.geometry.location.lng)}
      />
    );
  }

  renderListHeader = () => {
    const { isSelecting, errorMessage } = this.state;
    const { location, geoloc } = this.props;
    if(errorMessage) {
      return (
        <View
          style={{
            marginVertical: 32,
            marginHorizontal: 56
          }}>
          <Text
            style={{
              fontSize: 14,
              textAlign: 'center'
            }}>{errorMessage}</Text>
        </View>
      );
    }
    return (
      <View>
        {isSelecting ? (
          <View style={styles.headerLoader}>
              <Spinner />
          </View>
        ) : null}
        {!geoloc || (geoloc && location && geoloc.place_id === location.place_id)
          ? null
          : (
            this.renderLocation({
              item: geoloc,
              caption: 'MY CURRENT LOCATION',
              active: true,
              icon: (<VectorIcon
                name="ios-navigate"
                color={colors.accent}
                size={18}
              />)
            })
          )
        }
        {location
          ? this.renderLocation({
            item: location,
            selected: true,
            caption: 'MY DELIVERY LOCATION',
            active: true,
            icon: (<VectorIcon
              name="md-time"
              color={colors.gray400}
              size={18}
            />)
          })
          : null
        }
      </View>
    );
  }

  renderEmptyList = () => {
    const { isSearching, locations, searchQuery } = this.state;
    if (isSearching && !locations.length) {
      return (
        <View style={styles.searchingLoader}>
          <Spinner />
          <Text style={styles.searchingLabel}>
            Searching for <Text style={styles.textBold}>{searchQuery}</Text>
          </Text>
        </View>
      );
    }
    return null;
  }

  renderLocation = (props: RenderLocationProp) => {
    const { item, active, icon, selected, caption, hideDivider } = props;
    const { location } = this.props;
    return (
      <View style={[hideDivider ? {} : styles.locationItemDivider]}>
        <TouchableWithoutFeedback onPress={() => this.selectLocation(item)}>
          <View style={styles.locationItemInner}>
            <View style={styles.locationIconConetiner}>
              {icon ? icon : <VectorIcon
                name="ios-navigate"
                color={colors.gray400}
                size={18}
              />}
            </View>
            <View style={styles.locationNameContainer}>
              <Text style={[styles.locationName, active ? styles.locationNameActive : {}]} numberOfLines={2}>
                {item.name || item.formatted_address}
              </Text>
              {/* show caption or, name or formatted address if both are not the same */}
              <Text style={styles.locationNameCation}>
                {caption
                  ? caption
                  : item.name && item.name !== item.formatted_address
                    ? item.formatted_address
                    : null
                }
              </Text>
            </View>
            {selected || (location && location.place_id === item.place_id) ? (
              <View style={styles.locationSelectedIconContainer}>
                <VectorIcon
                  name='md-checkmark'
                  size={18}
                  color={colors.accent}
                />
              </View>
            ) : null}
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  }

  renderModalHeader() {
    const { search, visible, isSelecting } = this.state;
    return (
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchField}
            placeholder='Search here...'
            autoFocus={visible}
            value={search}
            onChangeText={this.handleSearchChange}
            editable={!isSelecting}
          />
          <TouchableWithoutFeedback onPress={this.hide} disabled={isSelecting}>
            <View style={styles.doneButton}>
              <Text style={styles.doneButtonLabel}>Done</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  headerLoader: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
  },
  textBold: {
    fontWeight: 'bold',
  },
  searchingLabel: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 12,
  },
  searchingLoader: {
    alignItems: 'center',
    marginVertical: 40,
  },
  flatList: {
    flex: 1,
    backgroundColor: colors.white,
  },
  locationNameContainer: {
    flex: 1,
    marginVertical: 16,
  },
  locationNameCation: {
    fontSize: 12,
    color: colors.gray400,
    marginTop: 4,
  },
  locationItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  locationSelectedIconContainer: {
    marginLeft: 16,
  },
  locationName: {
    color: colors.gray600,
    fontSize: 16,
  },
  locationNameActive: {
    color: colors.gray900,
  },
  locationIconConetiner: {
    marginRight: 16,
    width: 18,
  },
  locationItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  content: {
    alignItems: 'center',
  },
  container: {
  },
  modalContent: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    height: getStatusBarHeight(true) + 56,
    paddingTop: getStatusBarHeight(true) + 16,
    justifyContent: 'flex-end'
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  searchField: {
    flex: 1,
    height: 40,
    paddingHorizontal: 16,
    backgroundColor: colors.gray100,
  },
  doneButton: {
    height: 40,
    paddingLeft: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  doneButtonLabel: {
    color: colors.accent,
    fontWeight: '500',
    fontSize: 16,
  },
  modal: {
    margin: 0
  },
  label: {
    textAlign: 'center',
    fontSize: 16,
    color: colors.gray900,
    marginBottom: 16,
    marginTop: 32
  },
  button: {
    width: 240,
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 32,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 6,
    backgroundColor: colors.white,
  },
  buttonLabel: {
    flex: 1,
    color: colors.gray400,
    marginLeft: 8
  }
});

export default withGeoloc(withLocation(withNavigationFocus(LocationSelector)));
