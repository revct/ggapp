import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  View,
  StyleSheet,
} from 'react-native';
import {withNavigationFocus} from 'react-navigation';
import propTypes from 'prop-types';
import Color from 'color';
import {ScreenProps, ScreenState} from './interfaces';
import colors from 'configs/colors';

class Screen extends React.Component<ScreenProps, ScreenState> {
  static propTypes = {
    backgroundColor: propTypes.string,
    statusBarColor: propTypes.string,
  };

  static defaultProps = {
    backgroundColor: '#FCF8F8',
    isFocused: false,
    hideStatusBar: false,
    statusBarColor: '#FCF8F8',
  };

  state: ScreenState = {};

  componentDidMount() {
    this.setStatusBar();
    if (typeof this.props.setRef === 'function') {
      this.props.setRef({});
    }
  }

  componentDidUpdate(prevProps: ScreenProps) {
    // reset status bar
    if (
      (!prevProps.isFocused && this.props.isFocused) ||
      prevProps.statusBarColor !== this.props.statusBarColor ||
      prevProps.backgroundColor !== this.props.backgroundColor
    ) {
      this.setStatusBar();
    }
  }

  componentWillUnmount() {
    if (typeof this.props.setRef === 'function') {
      this.props.setRef(undefined);
    }
  }

  setStatusBar() {
    const {backgroundColor, statusBarColor, hideStatusBar} = this.props;
    // hide status bar is set so.
    if (hideStatusBar) {
      StatusBar.setHidden(true, 'none');
      return;
    }
    // make status bar visible
    StatusBar.setHidden(false, 'none');
    // get status bar color
    const color = statusBarColor
      ? statusBarColor
      : backgroundColor
      ? Color(backgroundColor)
          .darken(0.03)
          .rgb()
          .toString()
      : colors.white;
    // set background color on android
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(color);
    }
    // set color style
    StatusBar.setBarStyle(
      Color(color).isDark() ? 'light-content' : 'dark-content',
    );
  }

  render() {
    const {children, backgroundColor, style} = this.props;
    if (Platform.OS === 'ios') {
      return (
        <KeyboardAvoidingView
          behavior="padding"
          style={[
            styles.container,
            backgroundColor ? {backgroundColor} : {},
            style,
          ]}>
          {children}
        </KeyboardAvoidingView>
      );
    }
    return (
      <View
        {...options}
        style={[
          styles.container,
          backgroundColor ? {backgroundColor} : {},
          style,
        ]}>
        {children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

/**
 * Default options for platform components
 */
const options = Platform.select({
  ios: {behavior: 'padding'},
  android: {},
});

// Export connected screen as default
export default withNavigationFocus(Screen);
