import React from 'react';
import {
  ForgotPasswordProps,
  ForgotPasswordState,
  ForgotPasswordFormField,
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
} from 'react-native';
import colors from 'configs/colors';
import Text from 'components/Text/Text';
import {rgba, ucFirst} from 'utils/Misc';
import Input from 'components/Input/Input';
import Spinner from 'components/Spinner/Spinner';
import SocialLogin from 'components/SocialLogin/SocialLogin';
import Axios from 'axios';
import Toast from 'utils/Toast';
import ForgotPasswordApi from '../../api/ForgotPassword.api';
import SocialLoginApi from '../../api/SocialLogin.api';
import {withUser} from '../../contexts/UserContext';
import {isEmail} from '../../configs/rules';
const bgImageOne = require('../../assets/authentication/bg-01-375x318.png');
const bgImageTwo = require('../../assets/authentication/bg-02-375x338.png');
const logo = require('../../assets/authentication/logo-360x360.png');
const {width} = Dimensions.get('window');
const bgOneDimension = 375 / 318;
const bgTwoDimension = 375 / 338;
const bgsContainerDimention =
  bgTwoDimension > bgOneDimension ? bgTwoDimension : bgOneDimension;

class ForgotPassword extends React.Component<
  ForgotPasswordProps,
  ForgotPasswordState
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

  api: ForgotPasswordApi;

  socialLogin: SocialLoginApi;

  mounted: boolean = false;

  state: ForgotPasswordState = {
    form: {
      email: '',
    },
    touched: [],
    dirtied: [],
    error: {},
    isPending: false,
    socialLogin: null,
  };

  constructor(props: ForgotPasswordProps) {
    super(props);
    this.api = new ForgotPasswordApi();
    this.socialLogin = new SocialLoginApi();
  }

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  handleFieldChange = (field: ForgotPasswordFormField, value: string) => {
    this.setState({
      form: {...this.state.form, [field]: value},
      dirtied:
        this.state.dirtied.indexOf(field) !== -1
          ? this.state.dirtied
          : [...this.state.dirtied, field],
    });
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
      form: {email},
    } = this.state;
    if (!isEmail(email.replace(/\s+/g, ''))) {
      return Toast.error('Please enter your email address and try again.');
    }
    this.setState({isPending: true}, async () => {
      try {
        // call forgot password API
        await this.api.fetch({email});
        this.setState(
          {
            isPending: false,
          },
          () => {
            const {navigation} = this.props;
            // navigate to password reset secreen
            navigation.navigate('ResetPassword', {email});
          },
        );
      } catch (e) {
        if (e.message === 'canceled') {
          return;
        }
        let errorMessage = e.message;
        if (/network/i.test(errorMessage)) {
          errorMessage = 'Please check your internet connection and try again.';
        }
        this.setState({isPending: false});
        Toast.error(errorMessage);
      }
    });
  };

  handleOnSocialLoginFailure = (
    provider: 'facebook' | 'twitter' | 'google',
    error: string,
  ) => {
    Alert.alert('Login Error', error);
    this.setState({socialLogin: null});
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
            Forgot Password
          </Text>
          <View style={styles.form}>
            <Input
              editable={!isPending}
              label="Email Address"
              value={form.email}
              onChangeText={v => this.handleFieldChange('email', v)}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TouchableWithoutFeedback
              disabled={isPending}
              onPress={this.handleSubmit}>
              <View style={styles.submitButton}>
                {isPending ? (
                  <Spinner color={colors.white} />
                ) : (
                  <Text style={styles.submitButtontext} bold>
                    Request A Reset
                  </Text>
                )}
              </View>
            </TouchableWithoutFeedback>
            <View style={styles.formFooter}>
              <Text style={styles.alternateFormLink} light />
              <View style={styles.socialForgotPasswordHeading}>
                <View style={styles.socialForgotPasswordHeadingLine} />
                <Text style={styles.socialForgotPasswordHeadingText} light>
                  Or log in with
                </Text>
                <View style={styles.socialForgotPasswordHeadingLine} />
              </View>
              <View style={styles.socialForgotPasswordOptions}>
                <SocialLogin
                  disabled={isPending}
                  onLogin={this.handleOnSocialLogin}
                  onLoginSuccess={this.handleOnSocialLoginSuccess}
                  onLoginFailure={this.handleOnSocialLoginFailure}
                />
              </View>
            </View>
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
  loginSocialForgotPassword: {
    width: 24,
    height: 24,
    marginHorizontal: 16,
  },
  socialForgotPasswordOptions: {
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
  socialForgotPasswordHeadingText: {
    marginHorizontal: 4,
    color: colors.black,
    fontSize: 12,
  },
  socialForgotPasswordHeadingLine: {
    flex: 1,
    height: 3,
    backgroundColor: rgba('#979797', 0.23),
  },
  socialForgotPasswordHeading: {
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

export default withUser(ForgotPassword);
