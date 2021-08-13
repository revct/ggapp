import React from 'react';
import {
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  Platform,
  Alert,
} from 'react-native';
import {
  HotelAvaialabilityFormProps,
  HotelAvaialabilityFormState,
} from './interfaces';
import {generateRangeArray, padNumber} from 'utils/Misc';
import Text from 'components/Text/Text';
import VectorIcon from 'components/VectorIcon/VectorIcon';
import colors from 'configs/colors';
import {
  Menu,
  MenuTrigger,
  MenuOptions,
  MenuOption,
} from 'react-native-popup-menu';
import DateTimePicker from '@react-native-community/datetimepicker';
import Modal from 'react-native-modal';

class HotelAvailabilityForm extends React.Component<
  HotelAvaialabilityFormProps,
  HotelAvaialabilityFormState
> {
  state: HotelAvaialabilityFormState = {
    form: {
      arrivalDate: null,
      departureDate: null,
      location: '',
      rooms: 0,
    },
    selectDate: null,
  };

  today: Date;

  iosDate?: Date;

  constructor(props: HotelAvaialabilityFormProps) {
    super(props);
    this.today = new Date();
  }

  friendlyDate(date: Date | null) {
    if (!date) {
      return null;
    }
    return (
      padNumber(date.getDate()) +
      '/' +
      padNumber(date.getMonth() + 1) +
      '/' +
      date.getFullYear()
    );
  }

  handleCheckAvailability = async () => {
    const {onSubmit} = this.props;
    const {form} = this.state;
    if (!form.arrivalDate || !form.departureDate) {
      return Alert.alert('Error', 'Please select arrival and departure date.');
    }
    if (!onSubmit) {
      return;
    }
    onSubmit({
      arrivalDate: form.arrivalDate,
      departureDate: form.departureDate,
      rooms: form.rooms,
    });
  };

  dismissiOSDatePicker = () => {
    this.iosDate = undefined;
    this.setState({selectDate: null});
  };

  handleSelectDate = (field: 'arrival' | 'departure') => {
    this.setState({selectDate: field});
  };

  handleSelectLocation = (location: string) => {
    this.setState(({form}) => ({
      form: {...form, location: location},
    }));
  };

  handleSelectRooms = (rooms: number) => {
    this.setState(({form}) => ({
      form: {...form, rooms: rooms},
    }));
  };

  handleDateSelect = (field: 'arrival' | 'departure', date?: Date) => {
    date = date || this.today;
    if (!date) {
      return this.setState({
        selectDate: null,
      });
    }
    const newDate = new Date(date);
    if (field === 'arrival' && date) {
      this.setState(({form}) => ({
        form: {
          ...form,
          arrivalDate: newDate,
          departureDate:
            form.departureDate &&
            form.departureDate.getMonth() +
              '' +
              form.departureDate.getFullYear() ===
              newDate.getMonth() + '' + newDate.getFullYear()
              ? null
              : form.departureDate,
        },
        selectDate: null,
      }));
    } else if (field === 'departure' && date) {
      this.setState(({form}) => ({
        form: {
          ...form,
          departureDate: newDate,
          arrivalDate:
            form.arrivalDate && form.arrivalDate.getTime() > newDate.getTime()
              ? newDate
              : form.arrivalDate,
        },
        selectDate: null,
      }));
    }
    // unset ios date
    this.iosDate = undefined;
  };

  render() {
    const {form} = this.state;
    const {disabled} = this.props;
    return (
      <>
        <View style={styles.container}>
          <View style={[styles.formFieldContainer, {flex: 1}]}>
            <TouchableWithoutFeedback
              disabled={disabled}
              onPress={() => this.handleSelectDate('arrival')}>
              <View style={styles.formField}>
                {form.arrivalDate ? (
                  <Text style={styles.formFieldLabel} numberOfLines={1}>
                    {this.friendlyDate(form.arrivalDate)}
                  </Text>
                ) : (
                  <Text style={styles.formFieldLabel} numberOfLines={1}>
                    Arrival
                  </Text>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>

          <View style={[styles.formFieldContainer, {flex: 1}]}>
            <TouchableWithoutFeedback
              disabled={disabled}
              onPress={() => this.handleSelectDate('departure')}>
              <View style={styles.formField}>
                {form.departureDate ? (
                  <Text style={styles.formFieldLabel} numberOfLines={1}>
                    {this.friendlyDate(form.departureDate)}
                  </Text>
                ) : (
                  <Text style={styles.formFieldLabel} numberOfLines={1}>
                    Departure
                  </Text>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
          {this.renderRoomsField()}
          <View style={styles.buttonContainer}>
            <TouchableWithoutFeedback
              disabled={disabled}
              onPress={this.handleCheckAvailability}>
              <View
                style={[
                  styles.buttonInner,
                  disabled ? styles.buttonInnerDisabled : {},
                ]}>
                <Text style={styles.buttonLabel}>Check Avilability</Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
        {this.renderDatePicker()}
      </>
    );
  }

  renderDatePicker() {
    const {selectDate, form} = this.state;
    const minimumDate =
      selectDate === 'departure' && form.arrivalDate
        ? new Date(form.arrivalDate.getTime() + 60 * 60 * 24 * 1000)
        : this.today;
    if (Platform.OS === 'android' && selectDate) {
      return (
        <DateTimePicker
          value={
            selectDate === 'arrival'
              ? form.arrivalDate || this.today
              : selectDate === 'departure'
              ? form.departureDate || minimumDate
              : this.today
          }
          minimumDate={minimumDate}
          onChange={(event, date) => this.handleDateSelect(selectDate, date)}
        />
      );
    }
    if (Platform.OS === 'ios') {
      return this.renderiOSDatePicker();
    }
    return null;
  }

  renderiOSDatePicker() {
    const {selectDate, form} = this.state;
    const minimumDate =
      selectDate === 'departure' && form.arrivalDate
        ? new Date(form.arrivalDate.getTime() + 60 * 60 * 24 * 1000)
        : this.today;
    return (
      <Modal
        isVisible={selectDate === 'arrival' || selectDate === 'departure'}
        style={styles.iosDatePickerModal}
        onBackdropPress={this.dismissiOSDatePicker}>
        <View style={styles.datePickerContainer}>
          <View style={styles.datePickerContainerInner}>
            <View style={styles.datePickerControls}>
              <TouchableWithoutFeedback
                onPress={
                  selectDate
                    ? () => {
                        this.handleDateSelect(
                          selectDate,
                          this.iosDate ||
                            (selectDate === 'arrival'
                              ? this.today
                              : minimumDate),
                        );
                      }
                    : undefined
                }>
                <View style={styles.datePickerControl}>
                  <Text style={styles.datePickerControlText}>Done</Text>
                </View>
              </TouchableWithoutFeedback>
            </View>
            <View style={styles.iosDatePicker}>
              <DateTimePicker
                mode="date"
                value={
                  selectDate === 'arrival'
                    ? form.arrivalDate || this.today
                    : selectDate === 'departure'
                    ? form.departureDate || minimumDate
                    : this.today
                }
                minimumDate={minimumDate}
                onChange={(event, date) => {
                  this.iosDate = date;
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  renderLocationField() {
    const {form} = this.state;
    const {disabled} = this.props;
    return (
      <View style={{flex: 1.2}}>
        <Menu>
          <MenuTrigger
            disabled={disabled}
            customStyles={{triggerWrapper: styles.ddTrigger}}>
            <View style={styles.formFieldContainer}>
              <View style={styles.formField}>
                {form.location.trim().length ? (
                  <Text style={styles.formFieldLabel} numberOfLines={1}>
                    {form.location}
                  </Text>
                ) : (
                  <Text style={styles.formFieldLabel} numberOfLines={1}>
                    Location
                  </Text>
                )}
                <VectorIcon
                  name="md-arrow-dropdown"
                  style={styles.formFieldIcon}
                  size={14}
                  color={colors.gray700}
                />
              </View>
            </View>
          </MenuTrigger>
          <MenuOptions>
            {locations.map((item, index) => (
              <MenuOption
                key={index}
                onSelect={() => this.handleSelectLocation(item)}>
                <View style={styles.selectOption}>
                  {form.location === item ? (
                    <VectorIcon
                      name="md-checkmark"
                      color={colors.accent}
                      size={16}
                    />
                  ) : null}
                  <Text style={styles.selectOptionName}>{item}</Text>
                </View>
              </MenuOption>
            ))}
          </MenuOptions>
        </Menu>
      </View>
    );
  }

  renderRoomsField() {
    const {form} = this.state;
    const {disabled} = this.props;
    return (
      <View style={{width: 46}}>
        <Menu>
          <MenuTrigger
            disabled={disabled}
            customStyles={{triggerWrapper: styles.ddTrigger}}>
            <View style={styles.formFieldContainer}>
              <View style={styles.formField}>
                {form.rooms ? (
                  <Text style={styles.formFieldLabel} numberOfLines={1}>
                    {form.rooms}
                  </Text>
                ) : (
                  <Text style={styles.formFieldLabel} numberOfLines={1}>
                    Rooms
                  </Text>
                )}
                <VectorIcon
                  name="md-arrow-dropdown"
                  style={styles.formFieldIcon}
                  size={14}
                  color={colors.gray700}
                />
              </View>
            </View>
          </MenuTrigger>
          <MenuOptions>
            {rooms.map((item, index) => (
              <MenuOption
                key={index}
                onSelect={() => this.handleSelectRooms(item)}>
                <View style={styles.selectOption}>
                  {form.rooms === item ? (
                    <VectorIcon
                      name="md-checkmark"
                      color={colors.accent}
                      size={16}
                    />
                  ) : null}
                  <Text style={styles.selectOptionName}>{item}</Text>
                </View>
              </MenuOption>
            ))}
          </MenuOptions>
        </Menu>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  iosDatePicker: {
    height: 150,
  },
  datePickerControlText: {
    fontSize: 16,
    color: colors.accent,
  },
  datePickerControl: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerControls: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  datePickerContainerInner: {
    padding: 32,
    paddingTop: 0,
    ...Platform.select({
      android: {
        overflow: 'hidden',
      },
      ios: {},
    }),
  },
  datePickerContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    ...Platform.select({
      android: {
        overflow: 'hidden',
      },
      ios: {},
    }),
  },
  iosDatePickerModal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  buttonLabel: {
    color: colors.white,
    textAlign: 'center',
    fontSize: 8,
  },
  buttonInner: {
    height: 18,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  buttonInnerDisabled: {
    backgroundColor: colors.gray400,
  },
  buttonContainer: {
    width: 80,
    marginLeft: 4,
  },
  formFieldIcon: {
    marginLeft: 2,
  },
  formFieldLabel: {
    color: colors.gray600,
    fontSize: 8,
    flex: 1,
  },
  formField: {
    borderBottomWidth: 1,
    borderBottomColor: colors.black,
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 4,
  },
  formFieldContainer: {
    flex: 1.3,
    marginHorizontal: 4,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ddTrigger: {
    height: 24,
    margin: 0,
  },
  selectOptionName: {
    flex: 1,
    marginLeft: 8,
  },
  selectOption: {
    padding: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});

const rooms = generateRangeArray(1, 15);

const locations = ['Lagos', 'Rivers', 'Abuja'];

export default HotelAvailabilityForm;
