import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs"
import Records from "../screens/Records";
import colors from "../constants/colors";

const Toptab = createMaterialTopTabNavigator();

const TopBarNavigator = () => {

    const activeColor = {
        awaiting: colors.orange[500],
        "on-going" : colors.blue[500],
        resolved : colors.green[500]
    }
    return (
        <Toptab.Navigator screenOptions={({route}) => ({
           tabBarActiveTintColor : activeColor[route.name],
           tabBarInactiveTintColor: colors.gray[400],
           tabBarIndicatorStyle : {backgroundColor: activeColor[route.name]},
           tabBarLabelStyle : {fontWeight: "bold"},
        }
        )}>
        <Toptab.Screen name="on-going" children={()=> <Records status="on-going" />} />
        <Toptab.Screen name="resolved" children={()=> <Records status="resolved" />} />
    </Toptab.Navigator>
    )
}

export default TopBarNavigator
