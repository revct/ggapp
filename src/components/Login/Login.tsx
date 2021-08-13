import React from 'react';
import {
  LogInProps,
  LogInState,
  LogInFormField,
  LogInRules,
  LoginValidationItem,
} from './interfaces';
import Screen from 'components/Screen/Screen';
import {
  ScrollView,
  Image,
  View,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Alert,
  Platform,
} from 'react-native';
import colors from 'configs/colors';
import Text from 'components/Text/Text';
import {rgba, ucFirst} from 'utils/Misc';
import Input from 'components/Input/Input';
import {withUser} from 'contexts/UserContext';
import {isRequired} from 'configs/rules';
import LoginApi from 'api/Login.api';
import Spinner from 'components/Spinner/Spinner';
import SocialLogin from 'components/SocialLogin/SocialLogin';
import OverlayLoader from 'components/OverlayLoader/OverlayLoader';
import {md5} from 'utils/Encryption';
import SocialLoginApi from 'api/SocialLogin.api';
import Axios from 'axios';
import Toast from 'utils/Toast';
const bgImageOne = require('../../assets/authentication/bg-01-375x318.png');
const bgImageTwo = require('../../assets/authentication/bg-02-375x338.png');
const logo = require('../../assets/authentication/logo-360x360.png');
const {width} = Dimensions.get('window');
const bgOneDimension = 375 / 318;
const bgTwoDimension = 375 / 338;
const bgsContainerDimention =
  bgTwoDimension > bgOneDimension ? bgTwoDimension : bgOneDimension;

class LogIn extends React.Component<LogInProps, LogInState> {
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

  state: LogInState = {
    socialLogin: null,
    isFetching: false,
    isReady: false,
    form: {
      username: '',
      password: '',
    },
    touched: [],
    dirtied: [],
    error: {},
  };

  api: LoginApi;

  socialLogin: SocialLoginApi;

  mounted: boolean = false;

  constructor(props: LogInProps) {
    super(props);
    this.api = new LoginApi();
    this.socialLogin = new SocialLoginApi();
  }

  componentDidMount() {
    const {navigation, user} = this.props;
    if (user) {
      return navigation.pop(1);
    }
    this.mounted = true;
    this.setState({isReady: true});
  }

  componentWillUnmount() {
    this.mounted = false;
    this.api.cancel();
    this.socialLogin.cancel();
  }

  handleFieldChange = (field: LogInFormField, value: string) => {
    this.setState({
      form: {...this.state.form, [field]: value},
      dirtied:
        this.state.dirtied.indexOf(field) !== -1
          ? this.state.dirtied
          : [...this.state.dirtied, field],
    });
  };

  handleSubmit = () => {
    const {form} = this.state;
    const {setUser} = this.props;
    const validations = this.validation();
    if (validations.length) {
      return Toast.error('Input username or email and password.');
    }
    this.setState({isFetching: true}, async () => {
      try {
        const response = await this.api.fetch(form);
        await setUser(response);
        this.handleDone();
      } catch (e) {
        if (e.message === 'canceled') {
          return;
        }
        let errorMessage = e.message;
        if (/network/i.test(errorMessage)) {
          errorMessage = 'Please check your internet connection and try again.';
        }
        this.setState({isFetching: false});
        Toast.error(errorMessage);
      }
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

  handleOnSocialLogin = (
    provider: 'facebook' | 'twitter' | 'google' | null,
  ) => {
    this.setState({
      socialLogin: provider,
    });
  };

  handleOnSocialLoginSuccess = (
    provider: 'facebook' | 'twitter' | 'google',
    data: any,
  ) => {
    const {setUser} = this.props;
    this.setState(
      {
        socialLogin: provider,
      },
      async () => {
        try {
          // create user object
          const user = {
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            username: provider + '-' + md5(provider + data.id + md5(data.id)),
            password: md5(md5(md5(md5(data.id)))),
            avatar_url: data.avatar_url,
          };
          // remove ide from user object
          const result = await this.socialLogin.handle(user);
          // set user
          await setUser(result);
          // fire done handler
          this.handleDone();
        } catch (e) {
          // stop if request was canceled
          if (Axios.isCancel(e) || e.message === 'cancelled' || !this.mounted) {
            return;
          }
          // display error
          let errorMessage = e.message;
          // parse error message
          if (/network/i.test(errorMessage)) {
            errorMessage =
              ucFirst(provider) +
              ' log in failed, please check your ' +
              'internet connection and try again.';
          } else if (/with your email address/i.test(errorMessage)) {
            errorMessage =
              'The email address on your ' +
              ucFirst(provider) +
              ' account was registered using a different log in option.';
          } else {
            errorMessage = 'An error occurred, please try again in a moment.';
          }
          // display error
          Alert.alert(ucFirst(provider) + ' Login Error', errorMessage);
          // toggle off social login option
          this.setState({socialLogin: null});
        }
      },
    );
  };

  handleOnSocialLoginFailure = (
    provider: 'facebook' | 'twitter' | 'google',
    error: string,
  ) => {
    Alert.alert('Login Error', error);
    this.setState({socialLogin: null});
  };

  rules(): LogInRules {
    return {
      password: [
        (v: string) => (isRequired(v) ? false : 'Please enter your password.'),
      ],
      username: [
        (v: string) =>
          isRequired(v)
            ? false
            : 'Please enter your username or email address.',
      ],
    };
  }

  validation(): Array<LoginValidationItem> {
    const {form} = this.state;
    const rules = this.rules();
    return Object.keys(rules)
      .map(
        (field: LogInFormField): LoginValidationItem => {
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
      .filter((item: LoginValidationItem) => item.error);
  }

  isFormValid() {
    const validations = this.validation();
    return validations.length < 1;
  }

  render() {
    const {form, isFetching, isReady, socialLogin} = this.state;
    const {navigation} = this.props;
    if (!isReady) {
      return null;
    }
    return (
      <>
        <Screen
          backgroundColor={colors.white}
          statusBarColor={socialLogin !== null ? colors.black : colors.accent}>
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
              Log In
            </Text>
            <View style={styles.form}>
              <Input
                label="Username"
                value={form.username}
                onChangeText={v => this.handleFieldChange('username', v)}
                autoCapitalize="none"
                editable={!isFetching}
              />
              <View style={styles.passwordContainer}>
                <Input
                  label="Enter Password"
                  value={form.password}
                  onChangeText={v => this.handleFieldChange('password', v)}
                  secureTextEntry
                  autoCapitalize="none"
                  containerStyle={{marginBottom: 4}}
                  editable={!isFetching}
                />
                <Text
                  style={styles.forgotText}
                  onPress={() => navigation.navigate('ForgotPassword')}
                  light>
                  Forgot Password?
                </Text>
              </View>

              <TouchableWithoutFeedback
                disabled={isFetching}
                onPress={this.handleSubmit}>
                <View style={styles.submitButton}>
                  {isFetching ? (
                    <Spinner color={colors.white} />
                  ) : (
                    <Text style={styles.submitButtontext} bold>
                      Log In
                    </Text>
                  )}
                </View>
              </TouchableWithoutFeedback>
              <View style={styles.formFooter}>
                <Text style={styles.alternateFormLink} light>
                  <Text light>Don't have an account? </Text>
                  <Text
                    style={styles.alternateFormLinkText}
                    onPress={() =>
                      navigation.navigate('SignUp', {
                        afterSignUp: navigation.getParam('afterLogin'),
                      })
                    }>
                    Sign Up
                  </Text>
                </Text>
                {Platform.OS === 'android' ? (
                  <>
                    <View style={styles.socialLogInHeading}>
                      <View style={styles.socialLogInHeadingLine} />
                      <Text style={styles.socialLogInHeadingText} light>
                        Or log in with
                      </Text>
                      <View style={styles.socialLogInHeadingLine} />
                    </View>
                    <SocialLogin
                      disabled={isFetching}
                      onLogin={this.handleOnSocialLogin}
                      onLoginSuccess={this.handleOnSocialLoginSuccess}
                      onLoginFailure={this.handleOnSocialLoginFailure}
                    />
                  </>
                ) : null}
              </View>
            </View>
          </ScrollView>
        </Screen>
        <OverlayLoader
          disableBackButton
          isVisible={socialLogin !== null}
          dark
          label={
            'Logging in' +
            (socialLogin !== null ? ' with ' + ucFirst(socialLogin) : '') +
            '!'
          }
        />
      </>
    );
  }
}

const styles = StyleSheet.create({
  forgotText: {
    textAlign: 'right',
    fontSize: 8,
    color: colors.black,
  },
  passwordContainer: {
    marginBottom: 16,
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
  socialLogInHeadingText: {
    marginHorizontal: 4,
    color: colors.black,
    fontSize: 12,
  },
  socialLogInHeadingLine: {
    flex: 1,
    height: 3,
    backgroundColor: rgba('#979797', 0.23),
  },
  socialLogInHeading: {
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

export default withUser(LogIn);
