import React from 'react';
import {View, StyleSheet, TouchableWithoutFeedback, Image} from 'react-native';
import Text from 'components/Text/Text';
import colors from 'configs/colors';
import Modal from 'react-native-modal';
const successImage = require('../../assets/checkout/points-payment-success-420.png');

export interface PaymentSuccessModalProps {
  isVisible: boolean | 'isVisible';
  onClick: () => void;
  pointsBalance?: number;
  bookingRef?: string;
}

const PaymentSuccessModal: React.FC<
  PaymentSuccessModalProps
> = function PaymentSuccessModal({
  onClick,
  isVisible,
  pointsBalance,
  bookingRef,
}) {
  return (
    <Modal
      isVisible={isVisible ? true : false}
      hardwareAccelerated={false}
      onBackdropPress={() => {}}
      style={styles.modal}
      backdropColor={colors.black}
      backdropOpacity={0.52}
      animationIn="fadeInUp"
      animationOut="fadeOutDown"
      animationInTiming={300}
      animationOutTiming={200}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.bg} />
          <View style={styles.statusSection}>
            <Image
              source={successImage}
              resizeMode="cover"
              style={styles.image}
            />
            <Text bold style={styles.successMessage}>
              Successful
            </Text>
            {pointsBalance ? (
              <Text style={styles.balanceMessage}>
                You have {pointsBalance} points remaining.
              </Text>
            ) : (
              <Text style={styles.balanceMessage}>
                Your payment was successful.
              </Text>
            )}
            {bookingRef ? (
              <Text bold style={styles.bookingRef}>
                Booking Reference: {bookingRef}
              </Text>
            ) : null}
          </View>
          <TouchableWithoutFeedback onPress={onClick}>
            <View style={styles.button}>
              <Text style={styles.buttonText} bold>
                Continue
              </Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  bookingRef: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 18,
  },
  balanceMessage: {
    fontSize: 12,
    textAlign: 'center',
    color: colors.gray700,
  },
  successMessage: {
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonText: {
    fontSize: 20,
    textAlign: 'center',
    color: colors.white,
  },
  button: {
    height: 39,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusSection: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    flex: 1,
    margin: 0,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bg: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: colors.white,
  },
  content: {
    width: 284,
    borderRadius: 10,
    minHeight: 290,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  image: {
    width: 284 - 144,
    height: 284 - 144,
    resizeMode: 'cover',
    marginBottom: 16,
  },
});

export default PaymentSuccessModal;
