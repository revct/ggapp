import React from 'react';
import Input, { InputProps } from 'components/Input/Input';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { formatPhoneNumberIntl } from 'react-phone-number-input'

interface PhoneInputProps extends InputProps {
  country?: "NG" | string,
}

interface PhoneInputState {
  value: string,
}

class PhoneInput extends React.Component<PhoneInputProps, PhoneInputState> {

  state:PhoneInputState = {
    value: '',
  }

  componentDidMount() {
    this.handleOnChange(this.props.value || '');
  }

  componentDidUpdate(prevProps: PhoneInputProps) {
    // when value changes externally
    if(prevProps.value !== this.props.value
      && this.props.value !== this.state.value
    ) {
      this.setState({value: this.props.value || ''});
    }
  }

  handleOnChange = (v:string) => {
    const {onChangeText} = this.props;
    const value = formatPhoneInput(v);
    this.setState({
      value: value,
    }, () => {
      if(typeof onChangeText === 'function') {
        onChangeText(value);
      }
    });
  }

  render() {
    const {secureTextEntry, country, value, onChangeText, ...props} = this.props;
    return(
     <Input
      {...props}
      value={this.state.value}
      onChangeText={this.handleOnChange}
    />
    );
  }
}

export function formatPhoneInput(value: string):string {
  const phone = parsePhoneNumberFromString(value, 'NG');
  value = phone ? formatPhoneNumberIntl(phone.number) : value;
  return value;
}

export default PhoneInput;
