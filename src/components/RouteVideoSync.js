import React, {Component} from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, css } from 'aphrodite/no-important';
import Moment from 'moment';

import HLS from './HLS';
import {cameraPath} from '../api/routes';
import Video from '../api/video';
import RouteSeeker from './RouteSeeker';

export default class RouteVideoSync extends Component {
    static propTypes = {
        userSeekIndex: PropTypes.number.isRequired,
        secondsLoaded: PropTypes.number.isRequired,
        startOffset: PropTypes.number.isRequired,
        message: PropTypes.object.isRequired,
        canFrameOffset: PropTypes.number.isRequired,
        url: PropTypes.string.isRequired,
        playing: PropTypes.bool.isRequired,
        onPlaySeek: PropTypes.func.isRequired,
        onUserSeek: PropTypes.func.isRequired,
        onPlay: PropTypes.func.isRequired,
        onPause: PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            videoElement: null
        };

        this.onLoadStart = this.onLoadStart.bind(this);
        this.onLoadEnd = this.onLoadEnd.bind(this);
        this.segmentProgress = this.segmentProgress.bind(this);
        this.onVideoElementAvailable = this.onVideoElementAvailable.bind(this);
    }

    nearestFrameTime() {
        const {userSeekIndex, message, canFrameOffset} = this.props;
        const firstEntry = message.entries[0], curEntry = message.entries[userSeekIndex];
        if(firstEntry !== undefined && curEntry !== undefined) {
            const firstMsgTime = message.entries[0].time;
            const curMsgTime = message.entries[userSeekIndex].time;

            return canFrameOffset + (curMsgTime - firstMsgTime);
        } else {
            return 0;
        }
    }

    nearestFrameUrl() {
        const {url} = this.props;
        const sec = Math.round(this.nearestFrameTime());
        return cameraPath(url, sec);
    }

    loadingOverlay() {
        return (<div className={css(Styles.loadingOverlay)}>
                    <img className={css(Styles.loadingSpinner)}
                         src="/img/loading.svg"
                        />
                </div>);
    }

    onLoadStart() {
        this.setState({isLoading: true});
    }

    onLoadEnd() {
        this.setState({isLoading: false});
    }

    segmentProgress(currentTime) {
        // returns progress as number in [0,1]

        return (currentTime - this.props.startOffset) / this.props.secondsLoaded;
    }

    onVideoElementAvailable(videoElement) {
        this.setState({videoElement});
    }

    render() {
        return (<div className={css(Styles.root)}>
                    {this.state.isLoading ? this.loadingOverlay() : null}
                    <HLS
                         className={css(Styles.hls)}
                         source={Video.videoUrlForRouteUrl(this.props.url)}
                         startTime={this.nearestFrameTime()}
                         playbackSpeed={1}
                         onVideoElementAvailable={this.onVideoElementAvailable}
                         playing={this.props.playing}
                         onClick={this.props.onVideoClick}
                         onLoadStart={this.onLoadStart}
                         onLoadEnd={this.onLoadEnd}
                         onPlaySeek={this.props.onPlaySeek}
                         segmentProgress={this.segmentProgress} />
                     <RouteSeeker
                         className={css(Styles.seekBar)}
                         nearestFrameTime={this.nearestFrameTime()}
                         segmentProgress={this.segmentProgress}
                         secondsLoaded={this.props.secondsLoaded}
                         segmentIndices={this.props.segmentIndices}
                         onUserSeek={this.props.onUserSeek}
                         onPlaySeek={this.props.onPlaySeek}
                         videoElement={this.state.videoElement}
                         onPlay={this.props.onPlay}
                         onPause={this.props.onPause}
                         playing={this.props.playing} />
                </div>);
    }
}

const Styles = StyleSheet.create({
    root: {
        borderBottomWidth: '1px',
        borderColor: 'gray',
        flex: 1,
        position: 'relative',
        height: 480
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 3
    },
    loadingSpinner: {
        width: '25%',
        height: '25%',
        display: 'block'
    },
    img: {
        height: 480,
        display: 'block'
    },
    hls: {
        zIndex: 1,
        height: 480,
        backgroundColor: 'rgba(0,0,0,0.9)'
    },
    seekBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        zIndex: 4
    }
});