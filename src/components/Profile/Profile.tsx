import React from 'react';
import {
  ProfileState,
  ProfileProps,
  ProfileFormFields,
  ProfileValidationItem,
  ProfileRules,
} from './interfaces';
import Screen from 'components/Screen/Screen';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Image,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import {withUser} from 'contexts/UserContext';
import Input from 'components/Input/Input';
import PhoneInput, {formatPhoneInput} from 'components/PhoneInput/PhoneInput';
import Spinner from 'components/Spinner/Spinner';
import colors from 'configs/colors';
import Text from 'components/Text/Text';
import OverlayLoader from 'components/OverlayLoader/OverlayLoader';
import {getStatusBarHeight} from 'react-native-status-bar-height';
import {isRequired, isEmail, isMatch} from 'configs/rules';
import {isValidPhoneNumber} from 'react-phone-number-input';
import VectorIcon from 'components/VectorIcon/VectorIcon';
import UpdateCustomerApi from 'api/UpdateCustomer.api';
import {sleep} from 'utils/Misc';
import {NavigationStackScreenProps} from 'react-navigation-stack';
const photoCamera = require('../../assets/profile/photo-camera.png');
const defaultAvatar = require('../../assets/general/avatar.png');
const photoCameraDimension = 15 / 12;

class Profile extends React.Component<ProfileProps, ProfileState> {
  static navigationOptions = (props: NavigationStackScreenProps) => {
    const {navigation} = props;
    const {state} = navigation;
    const hasCustomSave =
      state && state.params && state.params.handleSave ? true : false;
    return {
      headerTitle: (
        <Text style={styles.headerTitle}>
          {hasCustomSave ? 'Guest Information' : 'My Profile'}
        </Text>
      ),
      headerTintColor: colors.gray600,
      headerTitleContainerStyle: styles.headerContainer,
      headerTransparent: true,
      headerStyle: styles.header,
      headerTitleStyle: styles.headerTitle,
      headerBackTitle: ' ',
      headerRight: <Text />,
    };
  };

  state: ProfileState = {
    editingUsername: false,
    edited: [],
    isPending: false,
    form: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      username: '',
      address: '',
      city: '',
      state: '',
      password: '',
      passwordConfirmation: '',
    },
  };

  api: UpdateCustomerApi;

  username: Input | null = null;

  constructor(props: ProfileProps) {
    super(props);
    this.api = new UpdateCustomerApi();
  }

  componentDidMount() {
    this.populateForm();
  }

  handleDone = () => {
    const {navigation} = this.props;
    const leaveAfterSave = navigation.getParam('leaveAfterSave');
    if (leaveAfterSave) {
      navigation.pop(1);
      if (typeof leaveAfterSave === 'function') {
        leaveAfterSave();
      }
    }
  };

  handleSubmit = () => {
    const {form} = this.state;
    const {setUser, user, navigation} = this.props;
    const handleSave = navigation.getParam('handleSave', null);
    const validations = this.validation();
    if (validations.length) {
      const errors = validations.map(item => item.error).join('\n\n');
      return Alert.alert('Form Is Invalid', errors);
    }
    if (typeof handleSave === 'function') {
      handleSave({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        state: form.state,
        city: form.city,
        phoneNumber: form.phone,
        address: form.address,
      });
      return navigation.goBack();
    }
    this.setState({isPending: true}, async () => {
      try {
        const response = await this.api.fetch(user.id, {
          first_name: form.firstName || '',
          last_name: form.lastName || '',
          email: form.email || '',
          password: form.password,
          state: form.state || '',
          city: form.city || '',
          phone: form.phone || '',
          address: form.address || '',
        });
        await setUser(response);
        this.setState(
          {
            isPending: false,
            form: {
              ...form,
              password: '',
              passwordConfirmation: '',
            },
          },
          () => {
            Alert.alert('Success', 'Profile updated successfully!');
            this.handleDone();
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
        Alert.alert('Error', errorMessage);
      }
    });
  };

  handleChangeText = (field: ProfileFormFields, value: string) => {
    const {form} = this.state;
    this.setState({
      form: {...form, [field]: value},
      edited: this.getEditedListUpdate(field, value.trim().length < 1),
    });
  };

  handleEnableUsernameEdit = () => {
    this.setState(
      {
        editingUsername: true,
      },
      () => {
        if (this.username) {
          this.username.refs.input.focus();
        }
      },
    );
  };

  getEditedListUpdate(field: ProfileFormFields, remove: boolean = false) {
    const {edited} = this.state;
    if (remove) {
      return edited.filter(item => item !== field);
    }
    if (edited.indexOf(field) !== -1) {
      return [...edited];
    }
    return [...edited, field];
  }

  rules(): ProfileRules {
    const {form} = this.state;

    // create rules
    const rules: ProfileRules = {
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
      phone: [
        (v: string) =>
          isRequired(v) ? false : 'Please enter your phone number.',
        (v: string) =>
          isValidPhoneNumber(v) ? false : 'Please enter a valid phone number.',
      ],
      city: [
        (v: string) => (isRequired(v) ? false : 'Please enter your city.'),
      ],
      state: [
        (v: string) => (isRequired(v) ? false : 'Please enter your state.'),
      ],
      password: !form.password
        ? []
        : [
            (v: string) =>
              isRequired(v) ? false : 'Please enter your password.',
          ],
      passwordConfirmation: !form.password
        ? []
        : [
            (v: string) =>
              isRequired(v) ? false : 'Please repeat your password.',
            (v: string) =>
              isMatch(form.password, v)
                ? false
                : "The passwords you rnetered don't match.",
          ],
    };

    // return rules
    return rules;
  }

  validation(): Array<ProfileValidationItem> {
    const {form} = this.state;
    const rules = this.rules();
    return Object.keys(rules)
      .map(
        (field: ProfileFormFields): ProfileValidationItem => {
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
      .filter((item: ProfileValidationItem) => item.error);
  }

  isFormValid() {
    const validations = this.validation();
    return validations.length < 1;
  }

  populateForm = async () => {
    const {user, navigation} = this.props;
    const defaultInfo = navigation.getParam('defaultInfo', null);
    await sleep(300);
    this.setState(({form}) => ({
      form: {
        ...form,
        firstName: defaultInfo ? defaultInfo.firstName : user.first_name,
        lastName: defaultInfo ? defaultInfo.lastName : user.last_name,
        email: defaultInfo ? defaultInfo.email : user.email,
        phone: formatPhoneInput(
          defaultInfo ? defaultInfo.phoneNumber : user.billing.phone,
        ),
        username: user.username,
        address: defaultInfo ? defaultInfo.address : user.billing.address_1,
        city: defaultInfo ? defaultInfo.city : user.billing.city,
        state: defaultInfo ? defaultInfo.state : user.billing.state,
      },
    }));
  };

  getAvatar() {
    const {user} = this.props;
    if (!user || !user.avatar_url) {
      return null;
    }

    if (user.avatar_url.substr(0, 4) !== 'http') {
      return 'http:' + user.avatar_url;
    }

    return user.avatar_url;
  }

  hasCustomSave(): boolean {
    const {navigation} = this.props;
    const handleSave = navigation.getParam('handleSave', null);
    return typeof handleSave === 'function';
  }

  isSocial(): boolean {
    const {user} = this.props;
    if (!user || !user.username) {
      return false;
    }
    const username = user.username.split('-');
    if (
      /facebook|twitter|google/i.test(username[0]) &&
      username[1].length === 32
    ) {
      return true;
    }
    return false;
  }

  isGoogleAccount(): boolean {
    const {user} = this.props;
    if (!user || !user.username) {
      return false;
    }
    return /google/i.test(user.username.split('-')[0]);
  }

  render() {
    const {isPending} = this.state;
    return (
      <>
        <Screen>
          <ScrollView style={styles.container}>
            {this.renderAvatarSection()}
            {this.renderForm()}
            {this.renderSubmitButton()}
          </ScrollView>
        </Screen>
        <OverlayLoader isVisible={isPending} />
      </>
    );
  }

  renderAvatarSection() {
    const {user} = this.props;
    if (this.hasCustomSave()) {
      return (
        <View style={[styles.avatarSection, styles.avatarSectionCustomSave]} />
      );
    }
    return (
      <View style={styles.avatarSection}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarContainerInner}>
            <Image
              source={
                user && this.getAvatar()
                  ? {uri: this.getAvatar()}
                  : defaultAvatar
              }
              style={styles.avatar}
              resizeMode="cover"
            />
          </View>
          <TouchableWithoutFeedback>
            <View style={styles.photoCameraIconContainer}>
              <Image
                source={photoCamera}
                resizeMode="stretch"
                style={styles.photoCameraIcon}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
        {this.renderUsername()}
      </View>
    );
  }

  renderUsername() {
    const {editingUsername, form} = this.state;
    const {user} = this.props;
    // not allowed for social media log in accounts
    if (this.isSocial()) {
      return null;
    }

    // not yet in edit mode
    if (!editingUsername) {
      return (
        <View style={styles.usernameContainer}>
          {/* <TouchableOpacity onPress={this.handleEnableUsernameEdit}> */}
          <View style={styles.username}>
            <Text style={styles.usernameText}>{user.username}</Text>
            {/* {this.renderEditIcon()} */}
          </View>
          {/* </TouchableOpacity> */}
        </View>
      );
    }

    // edit username
    return (
      <View style={styles.usernameContainer}>
        <View style={styles.usernameFieldContainer}>
          <Input
            ref={ref => (this.username = ref)}
            value={form.username || ''}
            flat
            style={styles.usernameInput}
            inputContainerStyle={styles.usernameInputContainer}
            containerStyle={{marginVertical: 0}}
            onChangeText={v => this.handleChangeText('username', v)}
          />
        </View>
      </View>
    );
  }

  renderEditIcon() {
    return <VectorIcon name="md-create" color={colors.gray700} size={18} />;
  }

  renderForm() {
    const {form, isPending} = this.state;
    return (
      <View style={styles.form}>
        <View style={styles.formFieldsRow}>
          <View style={styles.formInputContainer}>
            <Input
              value={form.firstName}
              label="First Name:"
              onChangeText={v => this.handleChangeText('firstName', v)}
              editable={!isPending}
              containerStyle={styles.inputContainer}
              labelStyle={styles.inputLabel}
              viewMode
              autoFocus
            />
          </View>

          <View style={styles.formInputContainer}>
            <Input
              value={form.lastName}
              label="Last Name:"
              onChangeText={v => this.handleChangeText('lastName', v)}
              editable={!isPending}
              containerStyle={styles.inputContainer}
              labelStyle={styles.inputLabel}
              viewMode
              autoFocus
            />
          </View>
        </View>

        <PhoneInput
          value={form.phone}
          label="Phone Number:"
          onChangeText={v => this.handleChangeText('phone', v)}
          editable={!isPending}
          keyboardType="phone-pad"
          containerStyle={styles.inputContainer}
          labelStyle={styles.inputLabel}
          viewMode
          autoFocus
        />

        <Input
          value={form.email}
          label="Email Address:"
          onChangeText={v => this.handleChangeText('email', v)}
          autoCapitalize={'none'}
          keyboardType="email-address"
          editable={!isPending && !this.isGoogleAccount()}
          containerStyle={styles.inputContainer}
          labelStyle={styles.inputLabel}
          viewMode={!this.isGoogleAccount()}
          autoFocus
        />

        <Input
          value={form.address}
          label="Address:"
          onChangeText={v => this.handleChangeText('address', v)}
          autoCapitalize={'none'}
          editable={!isPending}
          containerStyle={styles.inputContainer}
          labelStyle={styles.inputLabel}
          viewMode
          autoFocus
        />

        <View style={styles.formFieldsRow}>
          <View style={styles.formInputContainer}>
            <Input
              value={form.city}
              label="City:"
              onChangeText={v => this.handleChangeText('city', v)}
              editable={!isPending}
              containerStyle={styles.inputContainer}
              labelStyle={styles.inputLabel}
              viewMode
              autoFocus
            />
          </View>

          <View style={styles.formInputContainer}>
            <Input
              value={form.state}
              label="State:"
              onChangeText={v => this.handleChangeText('state', v)}
              editable={!isPending}
              containerStyle={styles.inputContainer}
              labelStyle={styles.inputLabel}
              viewMode
              autoFocus
            />
          </View>
        </View>

        {this.renderPasswordFields()}
      </View>
    );
  }

  renderPasswordFields() {
    const {form, isPending, edited} = this.state;
    if (this.isSocial() || this.hasCustomSave()) {
      return null;
    }
    return (
      <>
        <Input
          value={form.password}
          label="Change Password:"
          onChangeText={v => this.handleChangeText('password', v)}
          autoCapitalize={'none'}
          editable={!isPending}
          containerStyle={styles.inputContainer}
          labelStyle={styles.inputLabel}
          secureTextEntry
        />

        {edited.indexOf('password') !== -1 && form.password ? (
          <Input
            value={form.passwordConfirmation}
            label="Repeat Password:"
            onChangeText={v => this.handleChangeText('passwordConfirmation', v)}
            autoCapitalize={'none'}
            editable={!isPending}
            containerStyle={styles.inputContainer}
            labelStyle={styles.inputLabel}
            secureTextEntry
          />
        ) : null}
      </>
    );
  }

  renderSubmitButton() {
    const {isPending} = this.state;
    return (
      <View style={styles.submitButtonContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={this.handleSubmit}
          disabled={isPending}>
          <View
            style={[
              styles.submitButton,
              isPending ? styles.submitButtonDisabled : {},
            ]}>
            {isPending ? (
              <Spinner color={colors.white} />
            ) : (
              <Text style={styles.submitButtontext} bold>
                {this.hasCustomSave() ? 'Update Guest Info' : 'Update Profile'}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  usernameInputContainer: {
    height: 25,
  },
  usernameInput: {
    textAlign: 'center',
    height: 25,
    fontSize: 18,
    color: colors.black,
    fontFamily: 'Avenir-Heavy',
  },
  usernameText: {
    marginRight: 4,
    color: colors.black,
    fontSize: 18,
  },
  username: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  usernameFieldContainer: {
    flex: 1,
  },
  usernameContainer: {
    justifyContent: 'center',
    marginTop: 16,
    flexDirection: 'row',
  },
  photoCameraIcon: {
    width: 15,
    height: 15 / photoCameraDimension,
    resizeMode: 'stretch',
  },
  photoCameraIconContainer: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    backgroundColor: '#e26969',
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25 * 0.5,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 100 * 0.5,
    backgroundColor: colors.grayBlue200,
  },
  avatarContainerInner: {
    width: 100,
    height: 100,
    borderRadius: 100 * 0.5,
    overflow: 'hidden',
  },
  avatarContainer: {
    width: 100,
    height: 100,
  },
  avatarSectionCustomSave: {
    marginTop: 50,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtontext: {
    color: colors.white,
    fontSize: 14,
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  submitButton: {
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonContainer: {
    paddingHorizontal: 32,
    marginBottom: 56 + (getStatusBarHeight(true) > 20 ? 32 : 0) + 88 * 0.5,
  },
  inputLabel: {
    backgroundColor: '#FCF8F8',
  },
  inputContainer: {
    marginBottom: 8,
    marginHorizontal: 8,
  },
  formInputContainer: {
    flex: 1,
  },
  formFieldsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    marginTop: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  container: {
    flex: 1,
    marginTop: getStatusBarHeight(true) + 40,
  },
  headerContainer: {},
  header: {},
  headerTitle: {
    color: colors.black,
    textAlign: 'center',
    alignSelf: 'center',
    fontSize: 18,
    flex: 1,
  },
});

export default withUser(Profile);
