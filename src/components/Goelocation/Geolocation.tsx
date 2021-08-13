import React from 'react';
import {Platform, Alert, Linking} from 'react-native';
import GeoLib from '@react-native-community/geolocation';
import {PERMISSIONS, check, request} from 'react-native-permissions';
import {GeolocationProps, GeolocationState} from './interfaces';
import CoordsLookupApi from 'api/CoordsLookup.api';
import {Canceler} from 'axios';
import Logger from 'utils/Logger';
const LocationPermission = Platform.select({
  android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
  ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
});

class Geolocation extends React.Component<GeolocationProps, GeolocationState> {
  state: GeolocationState = {
    isPending: false,
    errorMessage: null,
  };

  mounted: boolean = false;

  coordsLookupCanceler?: Canceler;

  componentDidMount() {
    this.mounted = true;
    this.getCurrentLocation();
  }

  componentWillUnmount() {
    this.mounted = false;
    this.cancelLocationLookup();
  }

  cancelLocationLookup() {
    if (this.coordsLookupCanceler) {
      this.coordsLookupCanceler();
    }
  }

  checkLocationPermission() {
    check(LocationPermission)
      .then(status => {
        switch (status) {
          case 'unavailable':
            this.requestLocationPermission();
            break;
          case 'denied':
            this.requestLocationPermission();
            break;
          case 'granted':
            this.getCurrentLocation();
            break;
          case 'blocked':
            // do nothing
            break;
        }
      })
      .catch(e => {
        Logger(e);
      });
  }

  requestLocationPermission() {
    request(LocationPermission, {
      title: 'Access Your Location',
      message: 'Grant Genesis access your current location?',
      buttonPositive: 'Yes',
      buttonNegative: 'No',
    })
      .then(status => {
        switch (status) {
          case 'unavailable':
          case 'denied':
          case 'blocked':
            this.openAppSettings();
            break;
          case 'granted':
            this.getCurrentLocation();
            break;
        }
      })
      .catch(e => {
        Logger(e);
      });
  }

  openAppSettings() {
    Alert.alert(
      'Location Settings',
      'You will need to change your location settings to allow Genesis access your current location',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Open Settings', onPress: () => Linking.openSettings()},
      ],
    );
  }

  getCurrentLocation = () => {
    const {onlyCoords, onCoords} = this.props;
    GeoLib.getCurrentPosition(
      result => {
        if (!this.mounted) {
          return;
        }
        // set coords
        if (onCoords) {
          onCoords({
            lat: result.coords.latitude,
            lng: result.coords.longitude,
          });
        }
        // stop if only needs to set coords
        if (onlyCoords) {
          return;
        }
        // get coords information
        this.getCoordsInfo(result.coords.latitude, result.coords.longitude);
      },
      error => {
        if (!this.mounted) {
          return;
        }
        Logger(new Error('GEOLOCATION ERROR: ' + JSON.stringify(error)));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 20000,
      },
    );
  };

  async getCoordsInfo(lat: number, lng: number) {
    const {onGoeloc} = this.props;
    try {
      const result = await CoordsLookupApi(
        {lat, lng},
        {canceler: c => (this.coordsLookupCanceler = c)},
      );
      if (result.length && onGoeloc) {
        onGoeloc(result[0]);
      }
    } catch (e) {
      Logger(e);
    }
  }

  render() {
    return null;
  }
}

export default Geolocation;
