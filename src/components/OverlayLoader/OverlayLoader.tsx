import React from 'react';
import Spinner from 'components/Spinner/Spinner';
import Text from 'components/Text/Text';
import {
  Animated,
  StyleSheet,
  View,
  BackHandler,
  NativeEventSubscription,
} from 'react-native';
import {sleep, rgba} from 'utils/Misc';
import colors from 'configs/colors';

interface OverlayLoaderProps {
  isVisible?: boolean;
  label?: string;
  disableBackButton?: boolean;
  opaque?: boolean | 'opaque';
  transparent?: boolean | 'transparent';
  animated?: boolean | 'animated';
  dark?: boolean | 'dark';
}

interface OverlayLoaderState {
  show: boolean;
}

class OverlayLoader extends React.Component<
  OverlayLoaderProps,
  OverlayLoaderState
> {
  static defaultProps = {
    isVisible: false,
    disableBackButton: false,
    animated: true,
  };

  state: OverlayLoaderState = {
    show: false,
  };

  mounted: boolean = false;

  opacityAnimation: Animated.Value = new Animated.Value(0);

  scaleAnimation: Animated.Value = new Animated.Value(0.95);

  backHandle?: NativeEventSubscription;

  componentDidMount() {
    this.mounted = true;
    this.toggleVisiblity();
  }

  componentWillUnmount() {
    this.removeBackButtonBlocker();
    this.dismiss();
    this.mounted = false;
  }

  componentDidUpdate(prevProps: OverlayLoaderProps) {
    if (prevProps.isVisible !== this.props.isVisible) {
      this.toggleVisiblity();
    }
  }

  toggleVisiblity() {
    const {isVisible, animated} = this.props;
    if (!animated) {
      return;
    }
    if (isVisible) {
      this.show();
      this.blockBackButton();
    } else {
      this.dismiss();
      this.removeBackButtonBlocker();
    }
  }

  blockBackButton() {
    this.removeBackButtonBlocker();
    this.backHandle = BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackPress,
    );
  }

  removeBackButtonBlocker() {
    if (this.backHandle) {
      this.backHandle.remove();
    }
  }

  handleBackPress = () => {
    const {disableBackButton} = this.props;
    if (disableBackButton) {
      return true;
    }
  };

  async show() {
    if (!this.mounted) {
      return;
    }
    this.setState({
      show: true,
    });
    await sleep(200);
    Animated.parallel([
      Animated.timing(this.opacityAnimation, {
        toValue: 1,
        duration: 300,
      }),
      Animated.timing(this.scaleAnimation, {
        toValue: 1,
        duration: 200,
      }),
    ]).start();
  }

  async dismiss() {
    if (!this.mounted) {
      return;
    }
    this.setState({
      show: true,
    });
    await sleep(200);
    Animated.parallel([
      Animated.timing(this.opacityAnimation, {
        toValue: 0,
        duration: 100,
      }),
      Animated.timing(this.scaleAnimation, {
        toValue: 0.95,
        duration: 300,
      }),
    ]).start(() => {
      if (!this.mounted) {
        return;
      }
      this.setState({
        show: false,
      });
    });
  }

  render() {
    const {animated} = this.props;
    if (animated) {
      return this.renderAnimated();
    }
    return this.renderNonAnimated();
  }

  renderAnimated() {
    const {show} = this.state;
    const {opaque, transparent, dark} = this.props;
    if (!show) {
      return null;
    }
    return (
      <Animated.View
        style={[
          styles.container,
          dark ? styles.dark : null,
          !opaque ? null : dark ? styles.opaqueDark : styles.opaque,
          !transparent
            ? null
            : dark
            ? styles.transparentDark
            : styles.transparent,
          {
            opacity: this.opacityAnimation,
            transform: [{scale: this.scaleAnimation}],
          },
        ]}>
        {this.renderContent()}
      </Animated.View>
    );
  }

  renderNonAnimated() {
    const {opaque, transparent, isVisible, dark} = this.props;
    if (!isVisible) {
      return null;
    }
    return (
      <View
        style={[
          styles.container,
          dark ? styles.dark : null,
          !opaque ? null : dark ? styles.opaqueDark : styles.opaque,
          !transparent
            ? null
            : dark
            ? styles.transparentDark
            : styles.transparent,
        ]}>
        {this.renderContent()}
      </View>
    );
  }

  renderContent() {
    const {label, dark} = this.props;
    return (
      <>
        <Spinner
          size={label ? 'small' : 'large'}
          color={dark ? colors.white : undefined}
        />
        {label ? (
          <Text style={[styles.label, dark ? styles.labelDark : null]}>
            {label}
          </Text>
        ) : null}
      </>
    );
  }
}

const styles = StyleSheet.create({
  labelDark: {
    color: colors.gray100,
  },
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: rgba(colors.white, 0.7),
    justifyContent: 'center',
    alignItems: 'center',
  },
  opaque: {
    backgroundColor: rgba(colors.white, 1),
  },
  transparent: {
    backgroundColor: rgba(colors.white, 0),
  },
  dark: {
    backgroundColor: rgba(colors.black, 0.7),
  },
  opaqueDark: {
    backgroundColor: rgba(colors.black, 1),
  },
  transparentDark: {
    backgroundColor: rgba(colors.black, 0),
  },
  label: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
    color: colors.gray600,
  },
});

export default OverlayLoader;
