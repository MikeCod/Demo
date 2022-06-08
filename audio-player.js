import React, { Component } from 'react';
import { TouchableOpacity } from 'react-native';
import { Video } from 'expo-av';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPlay, faPause } from '@fortawesome/free-solid-svg-icons';

import { THEME } from './theme';
import { TimeShow } from "./timer";

export default class MyAudio extends Component {
	constructor(props) {
		super(props);
		this.state = {
			paused:true,
			duration:0,
			current_time:0
		};
		this.myaudio = null;
		this.updater_currently_played = null;
	}
	componentDidMount() {
		this.updater_currently_played = setInterval(() => {
			if(this.props.uri != this.props.currentlyPlayed() && !this.state.paused)
				this.setState({paused:true}, () => this.myaudio.pauseAsync());
		}, 100);
	}
	componentWillUnmount() {
		clearInterval(this.updater_currently_played);
	}
	render() {
		return <TouchableOpacity
			onPress={() => {
				if(this.state.paused) {
					this.props.onPlay(() => {
						this.myaudio.playAsync();
						this.setState({paused:false});
					});
				}
				else {
					this.myaudio.pauseAsync();
					this.setState({paused:true});
				}
			}}
		>
			{
				this.state.paused ? 
					<FontAwesomeIcon icon={faPlay} size={32} color={THEME.color_text_1}/>
				:
					<FontAwesomeIcon icon={faPause} size={32} color={THEME.color_text_1}/>
			}
			<Video
				source={{uri:this.props.uri}}
				onPlaybackStatusUpdate={playbackStatus => {
					this.setState({duration:playbackStatus.durationMillis, current_time:playbackStatus.positionMillis});
					if (playbackStatus.durationMillis === playbackStatus.positionMillis) {
						this.setState({paused:true});
						this.myaudio.stopAsync();
					}
				}}
				ref={ref => this.myaudio = ref}
			/>
			<TimeShow
				duration={this.state.duration/1000}
				update={() => this.state.current_time/1000}
				unmount={this.state.paused}
				loaded={this.state.duration > 0}
			/>
		</TouchableOpacity>;
	}
}