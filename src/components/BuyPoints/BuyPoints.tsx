import React, {useState} from 'react'
import { StyleSheet,
    ScrollView,
    View,
    TouchableOpacity,
    Image,
    Dimensions,
    TouchableWithoutFeedback,
    Alert,} from 'react-native'
import Input from 'components/Input/Input';
import colors from 'configs/colors';
import Text from 'components/Text/Text';
import Screen from 'components/Screen/Screen';
import {getStatusBarHeight} from 'react-native-status-bar-height';
import Spinner from 'components/Spinner/Spinner';
import ViewPager, {
    ViewPagerOnPageSelectedEventData,
  } from '@react-native-community/viewpager';
import {calcLoyaltyTopupPoint, sleep, thousand, evaluateLoyaltyPipelineAmount} from 'utils/Misc';
import UrlHelper from 'utils/UrlHelper';
import Axios, {Canceler} from 'axios';
import {
  PAYMENT_GATEWAY_URL,
  CONTRACT_CODES,
  PAYMENT_API_KEY,
  PAYMENT_SECRET,
} from 'configs/payment';
import {base64Encode} from '../../utils/Encryption';
import { LTP_MINIMUM_AMOUNT, redirectUrl } from 'configs/loyalty';

const coinImage = require('../../assets/rewards/reward-188x210.jpg');
const coinImageDimension = 164 / 151;
const coinImageWithPercentage = 144 / 375;
const {width} = Dimensions.get('window');



const BuyPoints = ({navigation}) => {
   
    const [amount, setAmount] = useState(0);
    const [isPending, setIsPending] = useState(false)
    const [isFetching, setIsFetching] = useState(false)
    const [status, setStatus] = useState("")
    const [checkoutUrl, setCheckoutUrl] = useState("")



    const handleSubmit = async() => {
        setIsPending(true);
        const user = navigation.getParam("user");
        if (!user) {
          return Alert.alert('Attention', 'Please log in to continue.');
        }

      const paymentResponse = await InitializePointTopupPayment();
      // return;
       if(paymentResponse.requestSuccessful) goToPaymentScreen(paymentResponse.responseBody.checkoutUrl)
        setIsPending(false);

    }

    const InitializePointTopupPayment = async() => {
      try{
        const user = navigation.getParam("user");
        const authorization = base64Encode(`${PAYMENT_API_KEY}:${PAYMENT_SECRET}`);
        const response = await Axios.post(`${PAYMENT_GATEWAY_URL}/init-transaction`,{
            amount: Number(amount),
            customerName: user.first_name + ' ' + user.last_name,
            customerEmail: user.email,
            paymentReference: Math.floor(Math.random() * 10000000),
            paymentDescription: 'Genesis loyalty TOPUP.',
            currencyCode: "NGN",
            redirectUrl: redirectUrl,
            contractCode:CONTRACT_CODES.default
        },{
            headers: {
                Authorization: `Basic ${authorization}`,
              },
        });
       return response.data;
      }
      catch(err)
      {
        console.log(err)
      }
       
    }
   


  const handleRedirectValidation = (url: string): boolean => {
    const urlHelper = new UrlHelper(url);
    return urlHelper.get('paymentReference', null) !== null;
  };

  const handlePaymentComplete = () => {
    // verify transaction
    setIsFetching(true);
    setStatus("paid");
  };

  const handlePaymentInitialized = (checkoutUrl: string) => {
    // verify transaction
    setStatus('ongoing')
    // this.setState({
    //   checkoutUrl: checkoutUrl,
    //   status: 'ongoing',
    // });
  };
    const goToPaymentScreen = (url) => {
        navigation.navigate('MonnifyPointTopupPayment',{url});
      }

    return (
    
        <Screen backgroundColor="#fbf5f6">
    <ScrollView>  
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.imageContainer}>
              <Image
                source={coinImage}
                style={styles.coinImage}
                resizeMode="stretch"
              />
            </View>
            
    
    <View style={styles.form}>
        <Text style={styles.title}>How much points are you buying?</Text>
        <View style={styles.formFieldsRow}>
          <View style={styles.formInputContainer}>
            <Input
              value={amount || ""}
              label="Enter Amount:"
              onChangeText={v => setAmount(v)}
              editable={!isPending}
              containerStyle={styles.inputContainer}
              labelStyle={styles.inputLabel}
            //   viewMode
              autoFocus
            />
          </View>
          </View>
         <Text style={styles.subtext}> {amount && amount>0?`You will get ${thousand(calcLoyaltyTopupPoint(amount))} points`:`Minimun amount is ${thousand(LTP_MINIMUM_AMOUNT)}`}</Text>

          
          <View style={styles.submitButtonContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSubmit}
          disabled={isPending || amount < LTP_MINIMUM_AMOUNT}
        >
          <View
            style={[
              styles.submitButton,
              isPending || amount < LTP_MINIMUM_AMOUNT ? styles.submitButtonDisabled : {},
            ]}>
            {isPending ? (
              <Spinner color={colors.white} />
            ) : (
              <Text style={styles.submitButtontext} bold>
               Buy Point
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>


          </View>


          </View>
        </View>
      </ScrollView>
      </Screen>
    )

}


const styles = StyleSheet.create({
    title:{
        fontSize:18,
        fontWeight:"500",
        margin:15
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
    coinImage: {
        height: width * coinImageWithPercentage * coinImageDimension,
        width: width * coinImageWithPercentage,
        resizeMode: 'stretch',
      },
      imageContainer: {
        marginTop: 48,
        alignItems: 'center',
        marginBottom: 16,
      },
      content: {
        flex: 1,
        borderTopLeftRadius: 64,
        borderTopRightRadius: 64,
        backgroundColor: colors.white,
        overflow: 'hidden',
      },
      container: {
        flex: 1,
        marginTop: getStatusBarHeight(true) + 56,
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

  inputLabel: {
    backgroundColor: '#FCF8F8',
  },
  inputContainer: {
    marginBottom: 8,
    marginHorizontal: 8,
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
    marginTop:25,
    marginBottom: 56 + (getStatusBarHeight(true) > 20 ? 32 : 0) + 88 * 0.5,
  },
  subtext:{ fontSize:11,marginLeft:15}
})


BuyPoints.navigationOptions = {
    headerTitle: 'Buy Points',
    headerTintColor: colors.gray600,
    headerTitleContainerStyle: styles.headerContainer,
    headerTransparent: true,
    headerStyle: styles.header,
    headerTitleStyle: styles.headerTitle,
    headerBackTitle: ' ',
    headerRight: <Text />,
  }

export default BuyPoints;