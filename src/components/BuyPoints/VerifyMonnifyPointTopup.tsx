import React, {useState, useEffect} from 'react'
import Spinner from 'components/Spinner/Spinner';
import { StyleSheet,
    ScrollView,
    View,
    TouchableOpacity,
    Image,
    Dimensions,
    TouchableWithoutFeedback,
    Alert,} from 'react-native'
import colors from 'configs/colors';
import Text from 'components/Text/Text';
import Screen from 'components/Screen/Screen';
import {getStatusBarHeight} from 'react-native-status-bar-height';
import {sleep} from 'utils/Misc';
import {
    PAYMENT_GATEWAY_URL,
    CONTRACT_CODES,
    PAYMENT_API_KEY,
    PAYMENT_SECRET,
  } from 'configs/payment';
import {base64Encode} from '../../utils/Encryption';
import Axios, {Canceler} from 'axios';


const  VerifyMonnifyPointTopup = ({navigation})  => {

    const verifyMonnifyPayment = async (paymentReference:any) => {
        try{
            console.log("here2")
        const authorization = base64Encode(`${PAYMENT_API_KEY}:${PAYMENT_SECRET}`);
        const response = await Axios.get(
            PAYMENT_GATEWAY_URL + '/query?paymentReference=' + paymentReference,
            {
              headers: {
                Authorization: `Basic ${authorization}`,
              },
            },
          );
          console.log(response.data)
       return response.data;
        }
        catch(err)
        {
            console.log(err);
        }
    }

    const handleVerifyPayment = async () => {
        const paymentReference = navigation.getParam("paymentReference");
        const data = await verifyMonnifyPayment(paymentReference);
        //if data is successfully verified;
        if(data.requestSuccessful){
        navigation.navigate('AddLoyaltyPoints',{
            amount: data.responseBody.amount,
            ref:data.responseBody.paymentReference
          })
        }else{
            navigation.popToTop();
            navigation.navigate('Rewards');
        }
    }

    useEffect(() => {
       handleVerifyPayment()
    }, [])
    return (
        <Screen backgroundColor="#fbf5f6">
        <ScrollView>  
            <View style={styles.container}>
                <Spinner color={colors.black} />
                <Text style={styles.text}>Verifying Payment</Text>
            </View>
        </ScrollView>
    </Screen>
    )
}



const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems:"center",
        justifyContent:"center",
        marginTop: getStatusBarHeight(true) + 56,
      },
      text:{

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
})


VerifyMonnifyPointTopup.navigationOptions = {
    headerTitle: 'Verify Payment',
    headerTintColor: colors.gray600,
    headerTitleContainerStyle: styles.headerContainer,
    headerTransparent: true,
    headerStyle: styles.header,
    headerTitleStyle: styles.headerTitle,
    headerBackTitle: ' ',
    headerRight: <Text />,
  }
  
  export default VerifyMonnifyPointTopup;