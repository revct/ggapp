import React from 'react';
import {
  TextInputProps,
  StyleSheet,
  TextInput,
  ViewStyle,
  View,
  TouchableWithoutFeedback,
  TextStyle,
} from 'react-native';
import colors from 'configs/colors';
import Text from 'components/Text/Text';
import VectorIcon from 'components/VectorIcon/VectorIcon';
import {rgba} from 'utils/Misc';

export interface InputProps extends TextInputProps {
  containerStyle?: ViewStyle;
  label?: string;
  hint?: string;
  inputContainerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  viewMode?: 'viewMode' | boolean;
  flat?: 'flat' | boolean;
}

interface InputState {
  secure: boolean | null;
  disableViewMode: boolean;
}

class Input extends React.Component<InputProps, InputState> {
  state: InputState = {
    secure: null,
    disableViewMode: false,
  };

  toggleSecureState = () => {
    if (this.isViewModeActive()) {
      return;
    }
    this.setState(({secure}) => ({
      secure: secure === null ? false : !secure,
    }));
  };

  isViewModeActive(): boolean {
    const {viewMode} = this.props;
    const {disableViewMode} = this.state;
    return !disableViewMode && viewMode ? true : false;
  }

  handleDisableViewMode = () => {
    this.setState(
      {
        disableViewMode: true,
      },
      () => {
        if (this.refs.input) {
          this.refs.input.focus();
        }
      },
    );
  };

  render() {
    const {
      containerStyle,
      inputContainerStyle,
      labelStyle,
      label,
      style,
      secureTextEntry,
      hint,
      viewMode,
      editable,
      flat,
      ...props
    } = this.props;
    const {secure} = this.state;
    return (
      <View style={[styles.container, containerStyle]}>
        <View
          style={[
            styles.inputContainer,
            flat ? styles.inputContainerFlat : {},
            inputContainerStyle,
          ]}>
          {label && !flat ? (
            <Text style={[styles.label, labelStyle]} light>
              {label}
            </Text>
          ) : null}
          <TextInput
            {...props}
            ref="input"
            style={[styles.input, style]}
            secureTextEntry={secure !== null ? secure : secureTextEntry}
            underlineColorAndroid={'rgba(0,0,0,0)'}
            editable={this.isViewModeActive() ? false : editable}
          />
          {this.renderRight()}
          {this.renderViewModeBolcker()}
        </View>
        {hint ? (
          <View style={styles.hintContainer}>
            <VectorIcon
              name="md-information-circle-outline"
              size={12}
              color={colors.gray600}
            />
            <Text bold style={styles.hint}>
              {hint}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  renderViewModeBolcker() {
    if (!this.isViewModeActive()) {
      return;
    }
    return (
      <TouchableWithoutFeedback onPress={this.handleDisableViewMode}>
        <View style={styles.viewModeBlocker} />
      </TouchableWithoutFeedback>
    );
  }

  renderRight() {
    const {secureTextEntry, editable} = this.props;
    const {secure} = this.state;
    const secured = typeof secure === 'boolean' ? secure : secureTextEntry;
    if (this.isViewModeActive()) {
      return (
        <View style={styles.rightContainer}>
          <View style={styles.rightContent}>
            <TouchableWithoutFeedback onPress={this.handleDisableViewMode}>
              <View style={styles.toggleSecurButton}>
                <VectorIcon name="md-create" size={14} color={colors.black} />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
      );
    }
    if (secureTextEntry) {
      return (
        <View style={styles.rightContainer}>
          <View style={styles.rightContent}>
            <TouchableWithoutFeedback onPress={this.toggleSecureState}>
              <View style={styles.toggleSecurButton}>
                <VectorIcon
                  name={'md-eye' + (secured ? '' : '-off')}
                  size={14}
                  color={colors.black}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
      );
    }
    return null;
  }
}

const styles = StyleSheet.create({
  viewModeBlocker: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0)',
  },
  hint: {
    color: colors.gray600,
    fontSize: 9,
    marginLeft: 4,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  inputContainerFlat: {
    borderColor: 'rgba(0,0,0,0)',
  },
  inputContainer: {
    height: 40,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.gray300,
    flexDirection: 'row',
  },
  container: {
    marginVertical: 12,
  },
  label: {
    flex: 0,
    fontSize: 10,
    position: 'absolute',
    left: 8,
    top: -8,
    backgroundColor: colors.white,
    paddingHorizontal: 4,
  },
  input: {
    height: 40,
    marginHorizontal: 8,
    paddingHorizontal: 4,
    flex: 1,
    color: rgba(colors.black, 0.5),
  },
  rightContainer: {
    height: 40,
  },
  rightContent: {
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  toggleSecurButton: {
    height: 40,
    paddingHorizontal: 8,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});

export default Input;
