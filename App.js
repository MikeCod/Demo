import React, { Component } from 'react';
import { AppState, LogBox, BackHandler, TouchableOpacity, SafeAreaView, View, Text, TextInput, StyleSheet, Alert, Platform, DevSettings } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import VersionCheck from 'react-native-version-check';
import * as Linking from 'expo-linking';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faSearch, faGlobe, faComments, faClipboard, faUser, faCircle } from '@fortawesome/free-solid-svg-icons';
import PushNotification from "react-native-push-notification";
import BackgroundTimer from 'react-native-background-timer';
import {
	setCustomView,
	setCustomTextInput,
	setCustomText,
	setCustomImage,
	setCustomTouchableOpacity
} from 'react-native-global-props';

import { HOST, parse_url } from "./config";

import Init from "./init";
import SignIn from './sign-in';
import SignUp from './sign-up';
import ForgotPassword from './forgot-password';
import Contract from './contract';
import Home from './pages/home';
import News from './pages/news';
import Contacts, { friends_is_typing } from './pages/messages';
import MyProfile from './pages/my-profile';
import Questionnaires from './pages/questionnaires';
import { THEME } from './theme';
import GenerateKeyPair from './encryption';
import { displayName, name } from "./app.json";


LogBox.ignoreAllLogs();
setCustomText({style:{
	fontFamily:"Poppins"
}});
setCustomTextInput({style:{
	fontFamily:"Poppins"
}});

var current_screen = 0;

var tab_bar_visible = true;

var foreground = true;

export function add_notification(title, content, force = false) {
	if(force || current_screen != 1 || !foreground)
		PushNotification.localNotification({
			channelId:name,
			id:"13",
			title:title,
			message:content
		});
}

export const tab_bar_hide = () => tab_bar_visible = false;
export const tab_bar_show = () => tab_bar_visible = true;

function MyTabBar({ state, descriptors, navigation }) {
	return (
		<SafeAreaView style={{flexDirection:'row', backgroundColor:THEME.color_1, height:(Platform.OS === "android" ? 50 : 80), justifyContent:"center", alignItems:"center", display:(tab_bar_visible ? "flex" : "none")}}>
			{state.routes.map((route, index) => {
				const { options } = descriptors[route.key];
				const label =
					options.tabBarLabel !== undefined
					? options.tabBarLabel
					: options.title !== undefined
					? options.title
					: route.name;
		
				const isFocused = state.index === index;
		
				const onPress = () => {
					const event = navigation.emit({
						type: 'tabPress',
						target: route.key,
					});
		
					if (!isFocused && !event.defaultPrevented) {
						navigation.navigate(route.name);
					}
				};
		
				const onLongPress = () => {
					navigation.emit({
						type: 'tabLongPress',
						target: route.key,
					});
				};
				var badge = <></>;
				var icon = undefined;
				switch(index) {
					case 0:	icon = faSearch;	break;
					case 1:	icon = faComments;	break;
					case 2: break;
					case 3:	icon = faClipboard;	break;
					case 4:	icon = faUser;		break;
					default:
						console.error("Label '"+label+"' of index "+index+" unknown");
				}
				var color = THEME.color_text_1;
				if(isFocused) {
					switch(index) {
						case 0:	color = "#ffedc9";	break;
						case 1:	color = "#ffe7b6";	break;
						case 2:	color = "#ffd276";	break;
						case 3:	color = "#ffbf3c";	break;
						case 4:	color = "#f9b428";	break;
						default:
							console.error("Label '"+label+"' of index "+index+" unknown");
					}
				}
				else if(index == 2)
					color = "white";
				if(index == 2)
					return (
						<TouchableOpacity
							accessibilityRole="button"
							accessibilityStates={isFocused ? ['selected'] : []}
							accessibilityLabel={options.tabBarAccessibilityLabel}
							testID={options.tabBarTestID}
							onPress={onPress}
							//onLongPress={onLongPress}
							style={{ flex: 1, alignItems:"center", justifyContent:'center', backgroundColor:"#f0ac41", borderRadius:35, height:70, marginTop:-20}}
						>
							<FontAwesomeIcon icon={faGlobe} size={32} color={color}/>
						</TouchableOpacity>
					);
				return (
					<TouchableOpacity
						accessibilityRole="button"
						accessibilityStates={isFocused ? ['selected'] : []}
						accessibilityLabel={options.tabBarAccessibilityLabel}
						testID={options.tabBarTestID}
						onPress={onPress}
						//onLongPress={onLongPress}
						style={{ flex: 1, alignItems:"center" }}
					>
						{badge}
						<FontAwesomeIcon icon={icon} size={28} color={color}/>
					</TouchableOpacity>
				);
			})}
		</SafeAreaView>
	);
}

export default class App extends Component {
	constructor(props) {
		super(props);
		this.check_update();
	}
	componentDidMount() {
		/*
		AppState.addEventListener('change', state => {
			console.log('AppState changed to', state);
			foreground = (state == "active");
			if(Platform.OS === "ios" && foreground)
				websocket.connect();
		});
		*/
		BackgroundTimer.runBackgroundTimer(async () => {
			var email = await AsyncStorage.getItem("email");
			var password = await AsyncStorage.getItem("password");
			if(email === undefined || password === undefined)
				return ;
			
			var request = new XMLHttpRequest();
			
			request.open("POST", "https://"+HOST+"/sign-in.php");
			request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			request.setRequestHeader('Origin', 'https://'+HOST);
			request.send(
				"login="+email+
				"&password="+password+
				"&submit=1&no-redirect=1&stay=1"
			);
		},
		900000);
	}
	async check_update() {
		VersionCheck.needUpdate()
		.then(res => {
			console.log("Is update needed: "+res.isNeeded);
			if(res.isNeeded) {
				Linking.openURL(res.storeUrl); // open store if update is needed
			}
		});
	}
	dashboard({ navigation }) {
		Linking.addEventListener('url', (event) => {
			var p = parse_url(event.url);
			console.log(p);
			if(p.path == "/user.php" && p.query.hasOwnProperty("id"))
				navigation.navigate("Search");
			else if(p.query.hasOwnProperty("page")) {
				switch(p.query.page) {
					case "home":
					case "search":
						navigation.navigate('Search');
						break;
					case "news":
						navigation.navigate('News');
						break;
					case "messages":
					case "contacts":
						navigation.navigate('Messages');
						break;
					case "questionnaire":
					case "questionnaires":
						navigation.navigate('Questionnaires');
						break;
					case "profile":
					case "my-profile":
						navigation.navigate('My profile');
						break;
				}
			}
		});
		BackHandler.addEventListener(
			"hardwareBackPress",
			() => true
		);
		return (
			<Tab.Navigator
				initialRouteName="Search"
				tabBar={props => <MyTabBar {...props} />}
				screenOptions={{
					headerStyle: {
						backgroundColor: THEME.color_1,
					},
					headerTintColor: THEME.color_text_1
				}}
				screenListeners={{
					state: (e) => {
						current_screen = e.data.state.index;
					},
				}}
			>
				<Tab.Screen name="Search" component={Home} />
				<Tab.Screen name="Messages" component={Contacts} />
				<Tab.Screen name="News" component={News} />
				<Tab.Screen name="Questionnaires" component={Questionnaires} />
				<Tab.Screen name="My profile" component={MyProfile} />
			</Tab.Navigator>
		);
	}
	render() {
		return <NavigationContainer>
			<Stack.Navigator initialRouteName="Init" screenOptions={{headerShown:false}}>
				<Stack.Screen name="Init" component={Init} />
				<Stack.Screen name="Generate key pair" component={GenerateKeyPair} />
				<Stack.Screen name="Dashboard" component={this.dashboard} />
				<Stack.Screen name="Sign in" component={SignIn} />
				<Stack.Screen name="Sign up" component={SignUp} />
				<Stack.Screen name="Forgot password" component={ForgotPassword} />
				<Stack.Screen name="Contract" component={Contract} />
			</Stack.Navigator>
		</NavigationContainer>;
	}
}
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();