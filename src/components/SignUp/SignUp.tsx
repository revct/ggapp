import React from 'react';
import {
  SignUpProps,
  SignUpState,
  SignUpFormField,
  SignUpRules,
  SignUpValidationItem,
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
import {isEmail, isRequired, isMatch, isUsername} from 'configs/rules';
import SignUpApi from 'api/SignUp.api';
import Spinner from 'components/Spinner/Spinner';
import {
  NavigationStackScreenProps,
  NavigationStackOptions,
  HeaderBackButton,
} from 'react-navigation-stack';
import {NavigationParams} from 'react-navigation';
import {withUser} from 'contexts/UserContext';
import SocialLogin from 'components/SocialLogin/SocialLogin';
import {md5} from 'utils/Encryption';
import SocialLoginApi from 'api/SocialLogin.api';
import Axios from 'axios';
import OverlayLoader from 'components/OverlayLoader/OverlayLoader';
import Toast from 'utils/Toast';
const bgImageOne = require('../../assets/authentication/bg-01-375x318.png');
const bgImageTwo = require('../../assets/authentication/bg-02-375x338.png');
const logo = require('../../assets/authentication/logo-360x360.png');
const {width} = Dimensions.get('window');
const bgOneDimension = 375 / 318;
const bgTwoDimension = 375 / 338;
const bgsContainerDimention =
  bgTwoDimension > bgOneDimension ? bgTwoDimension : bgOneDimension;

class SignUp extends React.Component<SignUpProps, SignUpState> {
  static navigationOptions = (
    props: NavigationStackScreenProps<NavigationParams>,
  ): NavigationStackOptions => {
    const {navigation} = props;
    const {state} = navigation;
    return {
      headerTitle: '',
      headerTintColor: colors.white,
      headerTitleContainerStyle: styles.headerContainer,
      headerTransparent: true,
      headerStyle: styles.header,
      headerTitleStyle: styles.headerTitle,
      headerLeft: (
        <HeaderBackButton
          tintColor={colors.white}
          disabled={
            state && state.params && state.params.disableBackButon
              ? true
              : false
          }
          onPress={navigation.goBack}
        />
      ),
    };
  };

  state: SignUpState = {
    socialLogin: null,
    isFetching: false,
    isReady: false,
    form: {
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      password: '',
      passwordConfirmation: '',
      reference:'',
    },
    touched: [],
    dirtied: [],
    error: {},
  };

  api: SignUpApi;

  socialLogin: SocialLoginApi;

  mounted: boolean = false;

  constructor(props: SignUpProps) {
    super(props);
    this.api = new SignUpApi();
    this.socialLogin = new SocialLoginApi();
  }

  componentDidMount() {
    const {navigation, user} = this.props;
    if (user) {
      return navigation.pop(1);
    }
    this.setState({isReady: true});
    this.mounted = true;
  }

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
          if (/netword/i.test(errorMessage)) {
            errorMessage =
              ucFirst(provider) +
              ' log in failed, please check your ' +
              'internet connection and try again.';
          } else if (/with your email address/i.test(errorMessage)) {
            errorMessage =
              'The email address on your ' +
              ucFirst(provider) +
              ' account was registered using a different log in option.';
          } else if (/already registered with your email/i.test(errorMessage)) {
            errorMessage =
              'An account is already registered with your email address, please log in.';
          } else {
            errorMessage = 'An error occurred, please try again in a moment.';
          }
          // display error
          Alert.alert(ucFirst(provider) + ' Sign Up Error', errorMessage);
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

  handleSubmit = () => {
    const {form} = this.state;
    const {setUser} = this.props;
    const validations = this.validation();
    if (validations.length) {
      const errors = validations.map(item => item.error).join('\n\n');
      return Toast.error(errors);
    }
    this.setState({isFetching: true}, async () => {
      try {
        const response = await this.api.fetch({
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          password: form.password,
          username: form.username,
          reference: form.reference,
        });
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
        Alert.alert('Login Error', errorMessage);
      }
    });
  };

  handleDone = () => {
    const {navigation} = this.props;
    const afterSignUp = navigation.getParam('afterSignUp');
    Toast.success('You successfully signed up.');
    navigation.pop(2);
    if (typeof afterSignUp === 'function') {
      afterSignUp();
    }
  };

  rules(): SignUpRules {
    const {form} = this.state;
    return {
      firstName: [
        (v: string) =>
          isRequired(v) ? false : 'Please enter your first name.',
      ],
      lastName: [
        (v: string) => (isRequired(v) ? false : 'Please enter your last name.'),
      ],
      email: [
        (v: string) =>
          isRequired(v) ? false : 'Please enter your email address.',
        (v: string) =>
          isEmail(v) ? false : 'Please enter a valid email address.',
      ],
      password: [
        (v: string) => (isRequired(v) ? false : 'Please enter your password.'),
      ],
      passwordConfirmation: [
        (v: string) => (isRequired(v) ? false : 'Please repeat your password.'),
        (v: string) =>
          isMatch(form.password, v)
            ? false
            // : "The passwords you rnetered don't match.",
            : "The passwords you entered don't match.",
      ],
      username: [
        (v: string) => (isRequired(v) ? false : 'Please enter your username.'),
        (v: string) =>
          isUsername(v)
            ? false
            : 'Invalid charaters in username see allowed characters below username feild.',
      ],
      reference:[

      ],
    };
  }

  validation(): Array<SignUpValidationItem> {
    const {form} = this.state;
    const rules = this.rules();
    return Object.keys(rules)
      .map(
        (field: SignUpFormField): SignUpValidationItem => {
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
      .filter((item: SignUpValidationItem) => item.error);
  }

  isFormValid() {
    const validations = this.validation();
    return validations.length < 1;
  }

  handleFieldChange = (field: SignUpFormField, value: string) => {
    this.setState({
      form: {...this.state.form, [field]: value},
      dirtied:
        this.state.dirtied.indexOf(field) !== -1
          ? this.state.dirtied
          : [...this.state.dirtied, field],
    });
  };

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
              Sign Up
            </Text>
            <View style={styles.form}>
              <View style={styles.nameContainer}>
                <Input
                  label="First Name"
                  value={form.firstName}
                  onChangeText={v => this.handleFieldChange('firstName', v)}
                  containerStyle={{marginRight: 8, flex: 1}}
                  editable={!isFetching}
                />
                <Input
                  label="Last Name"
                  value={form.lastName}
                  onChangeText={v => this.handleFieldChange('lastName', v)}
                  containerStyle={{marginLeft: 8, flex: 1}}
                  editable={!isFetching}
                />
              </View>

              <Input
                label="Username"
                value={form.username}
                onChangeText={v => this.handleFieldChange('username', v)}
                autoCapitalize="none"
                editable={!isFetching}
                hint="Alphanumeric, dashes and underscores in between."
              />

              <Input
                label="Email Address"
                value={form.email}
                onChangeText={v => this.handleFieldChange('email', v)}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isFetching}
              />

              <Input
                label="Enter Password"
                value={form.password}
                onChangeText={v => this.handleFieldChange('password', v)}
                secureTextEntry
                autoCapitalize="none"
                editable={!isFetching}
              />

              <Input
                label="Confirm Password"
                value={form.passwordConfirmation}
                onChangeText={v =>
                  this.handleFieldChange('passwordConfirmation', v)
                }
                secureTextEntry
                autoCapitalize="none"
                editable={!isFetching}
              />

              <Input
                label="Reference (Optional)"
                value={form.reference}
                onChangeText={v => this.handleFieldChange('reference', v)}
                autoCapitalize="none"
                editable={!isFetching}
              />

              <TouchableWithoutFeedback
                disabled={isFetching}
                onPress={this.handleSubmit}>
                <View style={styles.submitButton}>
                  {isFetching ? (
                    <Spinner color={colors.white} />
                  ) : (
                    <Text style={styles.submitButtontext} bold>
                      Sign Up
                    </Text>
                  )}
                </View>
              </TouchableWithoutFeedback>
              <View style={styles.formFooter}>
                <Text style={styles.alternateFormLink} light>
                  <Text light>Already have an account? </Text>
                  <Text
                    style={styles.alternateFormLinkText}
                    onPress={() => (!isFetching ? navigation.pop(1) : null)}>
                    Log In
                  </Text>
                </Text>
                {Platform.OS === 'android' ? (
                  <>
                    <View style={styles.socialSignUpHeading}>
                      <View style={styles.socialSignUpHeadingLine} />
                      <Text style={styles.socialSignUpHeadingText} light>
                        Or sign up with
                      </Text>
                      <View style={styles.socialSignUpHeadingLine} />
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
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginSocialSignUp: {
    width: 24,
    height: 24,
    marginHorizontal: 16,
  },
  socialSignUpOptions: {
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
  socialSignUpHeadingText: {
    marginHorizontal: 4,
    color: colors.black,
    fontSize: 12,
  },
  socialSignUpHeadingLine: {
    flex: 1,
    height: 3,
    backgroundColor: rgba('#979797', 0.23),
  },
  socialSignUpHeading: {
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

export default withUser(SignUp);
