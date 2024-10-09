import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs"
import Records from "../screens/Records";

const Toptab = createMaterialTopTabNavigator();

const TopBarNavigator = () => {

    const activeColor = {
        awaiting: "orange",
        "on-going" : "blue",
        resolved : "green"
    }
    return (
        <Toptab.Navigator screenOptions={({route}) => ({
           tabBarActiveTintColor : activeColor[route.name],
           tabBarInactiveTintColor: "gray",
           tabBarIndicatorStyle : {backgroundColor: activeColor[route.name]}
        }
        )}>
        <Toptab.Screen name="awaiting" children={()=> <Records status="awaiting response" />} />
        <Toptab.Screen name="on-going" children={()=> <Records status="on-going" />} />
        <Toptab.Screen name="resolved" children={()=> <Records status="resolved" />} />
    </Toptab.Navigator>
    )
}

export default TopBarNavigator
