import React from 'react';
import {
  MonnifyPaymentVerifyProps,
  MonnifyPaymentVerifyState,
} from './interfaces';
import colors from 'configs/colors';
import {View, StyleSheet, TouchableWithoutFeedback} from 'react-native';
import Text from 'components/Text/Text';
import Modal from 'react-native-modal';
import Spinner from 'components/Spinner/Spinner';
import VerifyPayment, {PaymentVerifyResponseBody} from 'api/VerifyPayment';
import VectorIcon from 'components/VectorIcon/VectorIcon';

class MonnifyPaymentVerify extends React.Component<
  MonnifyPaymentVerifyProps,
  MonnifyPaymentVerifyState
> {
  state: MonnifyPaymentVerifyState = {
    isFetching: false,
    errorMessage: null,
    isCompleted: false,
    show: true,
  };

  paymentVerify: VerifyPayment;

  constructor(props: MonnifyPaymentVerifyProps) {
    super(props);
    this.paymentVerify = new VerifyPayment();
  }

  handleLeave = () => {
    const {onClose} = this.props;
    this.setState({show: false}, onClose);
  };

  handleVerificationComplete = (status: PaymentVerifyResponseBody) => {
    const {onComplete} = this.props;
    onComplete(status.paymentStatus);
  };

  verify = () => {
    const {paymentReference, paymentType} = this.props;
    const {isCompleted, isFetching} = this.state;
    if (isCompleted || isFetching) {
      return;
    }
    this.setState(
      {
        isFetching: true,
        errorMessage: null,
      },
      async () => {
        if (!paymentReference) {
          return this.setState({
            errorMessage: 'No payment reference specified.',
            isFetching: false,
          });
        }
        try {
          const paymentState = await this.paymentVerify.fetch(
            paymentReference,
            paymentType,
          );
          this.setState(
            {
              isCompleted: true,
              isFetching: false,
            },
            () => this.handleVerificationComplete(paymentState),
          );
        } catch (e) {
          this.setState({
            isFetching: false,
            errorMessage: e.message,
          });
        }
      },
    );
  };

  render() {
    const {isFetching, errorMessage, isCompleted} = this.state;
    const {isLoading, pointsGained, bookingRef} = this.props;
    return (
      <Modal
        isVisible={true}
        hardwareAccelerated={false}
        onBackdropPress={() => {}}
        style={styles.modal}
        onModalWillShow={this.verify}
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
              <View style={styles.statusSectionInner}>
                {isFetching || isLoading ? (
                  <>
                    <Spinner />
                    <Text style={styles.verifyingMessage}>Verifying...</Text>
                  </>
                ) : null}

                {errorMessage ? (
                  <>
                    <Text style={styles.errorMessageHeading} bold>
                      An Error Occured
                    </Text>
                    <Text style={styles.errorMessage}>{errorMessage}</Text>
                  </>
                ) : null}

                {isCompleted && !isLoading ? (
                  <View style={{alignItems: 'center'}}>
                    <VectorIcon
                      name="ios-checkmark-circle-outline"
                      size={77}
                      color={colors.success}
                    />
                    <Text bold style={styles.successMessage}>
                      Payment Successful
                    </Text>
                    {bookingRef ? (
                      <Text bold style={styles.bookingRef}>
                        Booking Reference: {bookingRef}
                      </Text>
                    ) : null}
                    <Text style={styles.pointsGained}>
                      {pointsGained && pointsGained > 0
                        ? `You've gained ${pointsGained} points.`
                        : ''}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
            {errorMessage && !isFetching ? (
              <TouchableWithoutFeedback onPress={this.verify}>
                <View style={styles.button}>
                  <Text style={styles.buttonText} bold>
                    Try Again
                  </Text>
                </View>
              </TouchableWithoutFeedback>
            ) : null}
            {isCompleted && !isLoading ? (
              <TouchableWithoutFeedback onPress={this.handleLeave}>
                <View style={styles.button}>
                  <Text style={styles.buttonText} bold>
                    Continue
                  </Text>
                </View>
              </TouchableWithoutFeedback>
            ) : null}
          </View>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  bookingRef: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 18,
  },
  pointsGained: {
    fontSize: 12,
    textAlign: 'center',
    color: colors.gray700,
  },
  successMessage: {
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorMessage: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.gray600,
  },
  errorMessageHeading: {
    textAlign: 'center',
    marginBottom: 4,
    fontSize: 18,
    color: colors.black,
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
  statusSectionInner: {},
  statusSection: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
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
  verifyingMessage: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.gray600,
    marginTop: 8,
  },
});

export default MonnifyPaymentVerify;
