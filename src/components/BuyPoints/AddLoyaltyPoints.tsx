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
import {evaluateLoyaltyPipelineAmount, sleep} from 'utils/Misc';
import AddPoints from 'api/AddPoints';


const AddLoyaltyPoints = ({navigation}) => {
    const [status, setStatus] = useState("addingPoints")
    const [isFetching, setIsFetching] = useState(false)
    const [pointsGained, setPointsGained] = useState(0)


    useEffect(() => {
      addPoints();
    }, [])

    const addPoints = async () => {
        // toggle fetch state
        setStatus('addingPoints');
        setIsFetching(true);
        const amount = navigation.getParam("amount");
        const ref = navigation.getParam("ref");
        
        const newAmount = evaluateLoyaltyPipelineAmount(amount)

        await sleep(200);
        try {
          const result = await AddPoints({
            amount: newAmount,
            SBU: 'Restaurant',
            purchase_ref: ref,
          });

          // if(result.balance){
            navigation.popToTop();
            navigation.navigate('Rewards');
          // }
          // update component status
          setStatus('verified');
          setPointsGained(result.points_gained)
        } catch (e) {
          // update component status
          setStatus('verified');
          // setPointsGained(({pointsGained}) => (pointsGained));
        }
      };

    return (
    <Screen backgroundColor="#fbf5f6">
        <ScrollView>  
            <View style={styles.container}>
                <Spinner color={colors.black} />
                <Text style={styles.text}>Adding Points</Text>
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


AddLoyaltyPoints.navigationOptions = {
  headerTitle: 'Adding Points',
  headerTintColor: colors.gray600,
  headerTitleContainerStyle: styles.headerContainer,
  headerTransparent: true,
  headerStyle: styles.header,
  headerTitleStyle: styles.headerTitle,
  headerBackTitle: ' ',
  headerRight: <Text />,
}

export default AddLoyaltyPoints;