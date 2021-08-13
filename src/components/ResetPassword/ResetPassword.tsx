import React from 'react';
import {
  ResetPasswordProps,
  ResetPasswordState,
  ResetPasswordFormField,
  ResetPasswordValidationItem,
  ResetPasswordRules,
} from './interfaces';
import Screen from 'components/Screen/Screen';
import {
  ScrollView,
  Image,
  View,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import colors from 'configs/colors';
import Text from '../Text/Text';
import {rgba} from '../../utils/Misc';
import Input from '../Input/Input';
import Spinner from '../Spinner/Spinner';
import Toast from '../../utils/Toast';
import ResetPasswordApi from '../../api/ResetPassword.api';
import {withUser} from '../../contexts/UserContext';
import {isMatch, isRequired} from '../../configs/rules';
const bgImageOne = require('../../assets/authentication/bg-01-375x318.png');
const bgImageTwo = require('../../assets/authentication/bg-02-375x338.png');
const logo = require('../../assets/authentication/logo-360x360.png');
const {width} = Dimensions.get('window');
const bgOneDimension = 375 / 318;
const bgTwoDimension = 375 / 338;
const bgsContainerDimention =
  bgTwoDimension > bgOneDimension ? bgTwoDimension : bgOneDimension;

class ResetPassword extends React.Component<
  ResetPasswordProps,
  ResetPasswordState
> {
  static navigationOptions = () => {
    return {
      headerTitle: '',
      headerStyles: styles.header,
      headerTintColor: colors.white,
      headerTitleContainerStyle: styles.headerContainer,
      headerTransparent: true,
      headerStyle: styles.header,
      headerTitleStyle: styles.headerTitle,
      tabBarVisible: false,
    };
  };

  api: ResetPasswordApi;

  mounted: boolean = false;

  state: ResetPasswordState = {
    form: {
      code: '',
      password: '',
      passwordConfirmation: '',
    },
    touched: [],
    dirtied: [],
    error: {},
    isPending: false,
  };

  constructor(props: ResetPasswordProps) {
    super(props);
    this.api = new ResetPasswordApi();
  }

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  rules(): ResetPasswordRules {
    const {form} = this.state;
    return {
      code: [
        (v: string) =>
          isRequired(v) ? false : 'Password reset code is required.',
        (v: string) =>
          /^[0-9]{4}$/.test(v)
            ? false
            : 'The password reset code you entered is invalid.',
      ],
      password: [
        (v: string) =>
          isRequired(v) ? false : 'Please enter your new password.',
      ],
      passwordConfirmation: [
        (v: string) =>
          isRequired(v) ? false : 'Please repeat your new password.',
        (v: string) =>
          isMatch(form.password, v)
            ? false
            : "The passwords you rnetered don't match.",
      ],
    };
  }

  validation(): Array<ResetPasswordValidationItem> {
    const {form} = this.state;
    const rules = this.rules();
    return Object.keys(rules)
      .map(
        (field: ResetPasswordFormField): ResetPasswordValidationItem => {
          const fieldRules = rules[field];
          if (form[field] === undefined || !fieldRules) {
            return {name: field, error: false};
          }
          for (let i = 0; i < fieldRules.length; i++) {
            if (fieldRules[i](form[field])) {
              return {name: field, error: fieldRules[i](form[field])};
            }
          }
          return {name: field, error: false};
        },
      )
      .filter((item: ResetPasswordValidationItem) => item.error);
  }

  handleFieldChange = (field: ResetPasswordFormField, value: string) => {
    this.setState({
      form: {...this.state.form, [field]: value},
      dirtied:
        this.state.dirtied.indexOf(field) !== -1
          ? this.state.dirtied
          : [...this.state.dirtied, field],
    });
  };

  handleDone = () => {
    const {navigation} = this.props;
    const afterLogin = navigation.getParam('afterLogin');
    navigation.pop(1);
    if (typeof afterLogin === 'function') {
      afterLogin();
    }
  };

  handleSubmit = () => {
    const {
      form: {code, password},
    } = this.state;
    const validations = this.validation();
    if (validations.length) {
      const errors = validations.map(item => item.error).join('\n');
      return Toast.error(errors);
    }
    this.setState({isPending: true}, async () => {
      try {
        const {navigation} = this.props;
        // call forgot password API
        await this.api.fetch({
          code,
          email: navigation.getParam('email', ''),
          password,
        });
        this.setState(
          {
            isPending: false,
          },
          () => {
            // display a success pop up message
            Toast.success('Your password has been successfully reset.');
            // navigate to password reset secreen
            navigation.pop(2);
          },
        );
      } catch (e) {
        if (e.message === 'canceled') {
          return;
        }
        let errorMessage =
          (e.response && e.response.data && e.response.data.message) ||
          e.message;
        if (/network/i.test(errorMessage)) {
          errorMessage = 'Please check your internet connection and try again.';
        }
        this.setState({isPending: false});
        Toast.error(errorMessage);
      }
    });
  };

  render() {
    const {form, isPending} = this.state;
    return (
      <Screen backgroundColor={colors.white} statusBarColor={colors.accent}>
        <ScrollView
          style={styles.container}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.bgsContainer}>
            <Image style={styles.bgOne} source={bgImageOne} />
            <Image style={styles.bgTwo} source={bgImageTwo} />
          </View>
          <View style={styles.logoContainer}>
            <Image source={logo} resizeMode="contain" style={styles.logo} />
          </View>
          <Text style={styles.formTitle} bold>
            Reset Password
          </Text>
          <View style={styles.form}>
            <Input
              editable={!isPending}
              label="Password Reset Code"
              value={form.code}
              onChangeText={v => this.handleFieldChange('code', v)}
              keyboardType="number-pad"
            />
            <Input
              editable={!isPending}
              label="Password"
              value={form.password}
              onChangeText={v => this.handleFieldChange('password', v)}
              secureTextEntry
            />
            <Input
              editable={!isPending}
              label="Repeat Password"
              value={form.passwordConfirmation}
              onChangeText={v =>
                this.handleFieldChange('passwordConfirmation', v)
              }
              secureTextEntry
            />
            <TouchableWithoutFeedback
              disabled={isPending}
              onPress={this.handleSubmit}>
              <View style={styles.submitButton}>
                {isPending ? (
                  <Spinner color={colors.white} />
                ) : (
                  <Text style={styles.submitButtontext} bold>
                    Reset Password
                  </Text>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </ScrollView>
      </Screen>
    );
  }
}

const styles = StyleSheet.create({
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginSocialResetPassword: {
    width: 24,
    height: 24,
    marginHorizontal: 16,
  },
  socialResetPasswordOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alternateFormLinkText: {
    color: colors.accent,
  },
  alternateFormLink: {
    marginBottom: 32,
    color: colors.black,
    textAlign: 'right',
    fontSize: 9,
  },
  socialResetPasswordHeadingText: {
    marginHorizontal: 4,
    color: colors.black,
    fontSize: 12,
  },
  socialResetPasswordHeadingLine: {
    flex: 1,
    height: 3,
    backgroundColor: rgba('#979797', 0.23),
  },
  socialResetPasswordHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  formFooter: {
    marginBottom: 36,
  },
  submitButtontext: {
    color: colors.white,
    fontSize: 13,
    textAlign: 'center',
  },
  submitButton: {
    height: 36,
    paddingHorizontal: 16,
    backgroundColor: colors.accent,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  form: {
    marginHorizontal: 40,
  },
  bgsContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: width,
    height: width / bgsContainerDimention,
    zIndex: 1,
  },
  bgOne: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: width,
    height: width / bgOneDimension,
    resizeMode: 'stretch',
  },
  bgTwo: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: width,
    height: width / bgOneDimension,
    resizeMode: 'stretch',
  },
  container: {
    flex: 1,
    zIndex: 20,
  },
  logoContainer: {
    width: width,
    height: (width / bgsContainerDimention) * 0.9,
    alignItems: 'center',
    zIndex: 5,
  },
  logo: {
    width: width,
    height: (width / bgsContainerDimention) * 0.8,
  },
  formTitle: {
    textAlign: 'center',
    fontSize: 21,
    color: colors.accent,
    marginBottom: 32,
  },
  headerContainer: {},
  header: {
    backgroundColor: 'rgba(0,0,0,0)',
    borderBottomWidth: 0,
    elevation: 0,
  },
  headerTitle: {
    color: colors.white,
    fontWeight: '400',
    textAlign: 'center',
    alignSelf: 'center',
    flex: 1,
  },
});

export default withUser(ResetPassword);
