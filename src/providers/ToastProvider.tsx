import React from 'react';
import {
  Animated,
  TouchableWithoutFeedback,
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import colors from 'configs/colors';
import {ToastContext} from '../contexts/ToastContext';
import Text from 'components/Text/Text';

interface ToastProviderState {
  message: string | null;
  opacity: Animated.Value;
  bottom: Animated.Value;
}

interface ToastProviderProps {}
export default class ToastProvider extends React.Component<
  ToastProviderProps,
  ToastProviderState
> {
  state: ToastProviderState = {
    message: null,
    opacity: new Animated.Value(0),
    bottom: new Animated.Value(0),
  };

  timeout: any;

  dismiss = () => {
    const {bottom, opacity} = this.state;
    Animated.parallel([
      Animated.timing(bottom, {
        toValue: 16,
        duration: 150,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150
      })
    ]).start(() => {
      this.setState({
        message: null
      })
    });
  };

  show = (message: string) => {
    const {bottom, opacity} = this.state;
    clearTimeout(this.timeout);
    this.dismiss();
    this.timeout = setTimeout(() => {
      this.setState(
        {
          message: message,
        },
        async () => {
          Animated.parallel([
            Animated.timing(bottom, {
              toValue: 32,
              duration: 200,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 200,
            }),
          ]).start(() => {
            this.timeout = setTimeout(this.dismiss, 5000);
          });
        },
      );
    }, 200);
  };

  render() {
    return (
      <ToastContext.Provider
        value={{
          toast: this.show,
        }}>
        {this.props.children}
        {this.renderToast()}
      </ToastContext.Provider>
    );
  }

  renderToast() {
    const {bottom, opacity, message} = this.state;
    if (!message) {
      return;
    }
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={this.dismiss}
        style={styles.toastContainer}>
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: opacity,
              bottom: bottom,
            },
          ]}>
          <View style={styles.toastInner}>
            <View style={styles.toastInnerInner}>
              <Text numberOfLines={1} style={styles.message}>
                {message}
              </Text>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  message: {
    color: colors.white,
  },
  toastInnerInner: {
    backgroundColor: colors.gray900,
    color: colors.gray800,
    height: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastInner: {
    borderRadius: 16,
    backgroundColor: colors.gray900,
    height: 32,
    ...Platform.select({
      ios: {
        overflow: 'hidden',
      },
      android: {}
    })
  },
  toast: {
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    height: 32,
    backgroundColor: colors.gray900,
    ...Platform.select({
      ios: {},
      android: {
        overflow: 'hidden',
      }
    })
  },
  toastContainer: {
    position: 'absolute',
    bottom: 16,
    right: 32,
    left: 32,
    overflow: 'visible',
    alignItems: 'center',
  }
})
