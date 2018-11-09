import React from 'react';
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router';
import { init, subscribeDevice, unsubscribeDevice, subscribeGame, unsubscribeGame, subscribeDeviceRole, unsubscribeDeviceRole, subscribeRole, unsubscribeRole } from '../actions/screen';
import './screen.less';
import { formatCountdown } from '../utils';
//自定义组件
import { Initial } from '../components/initial';
import { ShowQR } from '../components/showQR';
import { BindedUser } from '../components/bindedUser';
import { BindedGame } from '../components/bindedGame';
import { BindedGameWithReward } from '../components/bindedGameWithReward';

let marquees = [undefined, undefined, undefined, undefined, undefined, undefined, undefined];

class ViewGame extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            qrcodeUrl: null,
            rounds: [],
            currentRoundIndex: -1,//当前正在运行round的index
            countdown: '',//倒计时字符串
            status: '',//比赛状态 'before' 'gaming' 'after'
            showQrcode: false,//单击显示二维码开关

            //奖池相关
            rewardss: undefined,//game.get('reward')分隔回车形成的字符串数组（5个一组）的数组
            rewards: undefined,//正在展示的5个
            rwIndex: -1,//第几页

            //通知相关
            notifications: undefined,
        };
        //绑定方法
        this.onShowQrClicked = this.onShowQrClicked.bind(this);
    }

    componentWillMount() {
        console.log(`screen:componentWillMount`);
    }

    componentDidMount() {
        console.log(`screen:componentDidMount`);
        //初始化 用screen登录 监听 devices
        this.props.init();
    }

    componentWillReceiveProps(nextProps) {
        //device创建完毕 监听device列表  
        console.log(`screen:componentWillReceiveProps:this.props.device:${this.props.device && this.props.device.get('uuid')} nextProps.device:${nextProps.device && nextProps.device.get('uuid')}`);
        if (!this.props.device && nextProps.device) {
            this.props.subscribeDevice(nextProps.device);
            this.props.subscribeDeviceRole(nextProps.device);
        }
        console.log(`screen:componentWillReceiveProps:this.props.role:${this.props.role && this.props.role.get('name')} nextProps.role:${nextProps.role && nextProps.role.get('name')}`);
        if (!this.props.role && nextProps.role) {
            this.props.subscribeRole(nextProps.role);
        }
        //如果正在显示二维码的过程中有role改变 不显示
        if (this.state.showQrcode) {
            if (!nextProps.role) {
                this.setState({ showQrcode: false });
            } else {
                if (!this.props.role) {
                    this.setState({ showQrcode: false });
                } else {
                    if (this.props.role.id !== nextProps.role.id) {
                        this.setState({ showQrcode: false });
                    }
                }
            }
        }
        console.log(`screen:componentWillReceiveProps:this.props.game:${this.props.game && this.props.game.get('title')} nextProps.game:${nextProps.game && nextProps.game.get('title')}`);
        //监听比赛
        if (nextProps.game) {
            console.log(`screen:componentWillReceiveProps：game`);
            //如果老game为空 说明初次  监听
            if (!this.props.game) {
                this.props.subscribeGame(nextProps.game);
            }
            //如果新老game的id不相同，说明大屏幕已经显示了不同的game
            //取消对老game的监听  监听新的game
            else if (this.props.game && this.props.game.id !== nextProps.game.id) {
                this.props.unsubscribeGame();//先取消对老game的监听
                this.props.subscribeGame(nextProps.game);
            }

            //处理奖池
            this.dealGameReward(nextProps.game, nextProps.device);

            //处理通知
            this.dealGameNotification(nextProps.game);
        }

        this.setState({
            rounds: [...this.appendRoundStartTime(nextProps.game)],
        });

        if (!this.interval) {
            this.interval = setInterval(() => this.getCountdown(), 980);
        }
    }

    componentWillUnmount() {
        console.log(`screen:componentWillUnmount`);
        this.props.unsubscribeDevice();
        this.props.unsubscribeDeviceRole();
        this.props.unsubscribeRole();
        this.props.unsubscribeGame();
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        if (this.rewardInterval) {
            clearInterval(this.rewardInterval);
            this.rewardInterval = null;
        }

    }


    /**
     * 如果比赛有通知 则显示通知
     * game中notification是一个用包含换行的字符串 
     * 分隔成数组 循环播放
     * @param {*} game 
     */
    dealGameNotification(game) {
        let notificationStr = game.get('notification');
        if (notificationStr) {
            let notifications = [];
            let array = notificationStr.split('\n');
            for (let i = 0; i < array.length; i++) {
                const str = array[i];
                let row = 40;
                if (str.length > row) {
                    for (let j = 0; j * row < str.length; j++) {
                        let start = j * row;
                        let end = (j + 1) * row < str.length ? (j + 1) * row : str.length;
                        let ntf = str.slice(start, end)
                        notifications.push(ntf)
                        // console.log(`index:constructor:notificationStr:start${start} end:${end} ntf:${ntf}`);
                    }
                } else {
                    notifications.push(str);
                }
            }
            // console.log(`index:constructor:${JSON.stringify(notifications)}`);
            this.setState({
                notifications,
            });
        } else {
            this.setState({
                notifications: undefined,
            });
        }
    }


    /**
     * 如果比赛有奖池信息 并且允许显示 则显示奖池信息 （现在只判断是否有，有就显示)
     * @param {*} game 
     */
    dealGameReward(game, device) {
        console.log(`screen:dealGameReward:`);
        //先把rewardInterval关掉
        if (this.rewardInterval) {
            clearInterval(this.rewardInterval);
            this.rewardInterval = null;
        }
        if (device && device.get('type') === 'withreward') {
            let rewardStr = game.get('reward');
            console.log(`screen:dealGameReward:rewardStr:${rewardStr}`);
            if (rewardStr) {
                let strs = rewardStr.split('\n');
                let rewardss = [];//二维数组
                let rewards = [];
                for (let i = 0; i < strs.length;) {
                    const str = strs[i++];
                    rewards.push(str);
                    if (i === strs.length) {
                        rewardss.push(rewards);
                    } else if (i !== 0 && i % 9 === 0) {
                        rewardss.push(rewards);
                        rewards = [];
                    }
                }
                if (rewardss)
                    rewards = rewardss[0];

                this.setState({
                    rewardss,
                    rewards,
                    rwIndex: 0,
                });

                if (!this.rewardInterval) {
                    this.rewardInterval = setInterval(() => this.dealRewardInterval(), 1000 * 10);
                }
            } else {
                this.setState({
                    rewardss: undefined,
                    rewards: undefined,
                    rwIndex: -1,
                });
            }
        }
    }


    /**
     * 在rewardInterval中每隔10秒执行一次
     * 通过计算获得循环显示的奖池信息
     */
    dealRewardInterval() {
        //奖池信息可能有十几条或几十条不等 一屏显示不下
        //通过rwIndex对总页数求余获取当前页的i.
        let rwIndex = this.state.rwIndex;
        let i = 0;
        if (rwIndex > 0)
            i = rwIndex % this.state.rewardss.length;
        let rewards = this.state.rewardss[i];
        console.log(`screen:dealRewardInterval:rwIndex:${rwIndex}`);
        this.setState({ rwIndex: ++this.state.rwIndex, rewards });
    }

    /**
     * 根据game的startTime 生成rounds中每个round的开始时间 用于倒计时
     */
    appendRoundStartTime(game) {
        let rounds = [];
        if (game) {
            let startTime = game.get('startTime').getTime();
            for (let round of game.get('rounds')) {
                rounds.push({ ...round, startTime });
                // console.log(`countDown:appendRoundStartTime():level:${round.level} startTime:${startTime} `);
                if (!round.breakDuration || round.breakDuration === 0) {
                    startTime = startTime + round.duration * 60 * 1000;
                } else {
                    startTime = startTime + (round.duration + round.breakDuration) * 60 * 1000;
                }
            }
        }

        console.log(`countDown:appendRoundStartTime():rounds:${rounds.length}`);
        return rounds;
    }

    /**
     * 在Interval中每隔一秒执行一次
     * 根据比赛的开始时间计算当前的状态 所在盲注的索引等信息
     */
    getCountdown() {
        //判断是不是暂停 如果有值 是在暂停
        let pauseTime;
        if (this.props.game)
            pauseTime = this.props.game.get('pauseTime');
        let dateTime;
        //没有暂停取当前值
        if (pauseTime) {
            dateTime = pauseTime.getTime();
        } else {
            dateTime = new Date().getTime();
        }

        let currentRoundIndex = -1;
        let status = 'before';
        let breaking = false;
        let countdown = '00:00';
        let nextBreak = '--'
        if (this.state.rounds) {
            for (let i = 0; i < this.state.rounds.length; i++) {
                let round = this.state.rounds[i];
                let time = dateTime - round.startTime;

                if (i === 0) {
                    if (time < 0) {
                        status = 'before';
                        countdown = formatCountdown(0 - time);
                        currentRoundIndex = i;
                        break;
                    } else {
                        //判断是否执行的当前round
                        if (time >= 0) {
                            //没有round.breakDuration
                            if (!round.breakDuration || round.breakDuration === 0) {
                                if (time <= round.duration * 60 * 1000) {
                                    countdown = formatCountdown(round.duration * 60 * 1000 - time);
                                    status = 'gaming';
                                    breaking = false;
                                    currentRoundIndex = i;
                                    break;
                                }
                            }
                            else {
                                //有round.breakDuration 就要判断是正在执行round.duration还是正执行round.breakDuration
                                if (time <= (round.duration + round.breakDuration) * 60 * 1000) {
                                    if (time <= round.duration * 60 * 1000) {
                                        countdown = formatCountdown(round.duration * 60 * 1000 - time);
                                        breaking = false;
                                    } else if (time < (round.duration + round.breakDuration) * 60 * 1000) {
                                        countdown = formatCountdown((round.duration + round.breakDuration) * 60 * 1000 - time);
                                        breaking = true;
                                    }
                                    status = 'gaming';
                                    currentRoundIndex = i;
                                    break;
                                }
                            }
                        }
                    }
                }
                else {
                    //判断是否执行的当前round
                    if (time >= 0) {
                        //没有round.breakDuration
                        if (!round.breakDuration || round.breakDuration === 0) {
                            if (time <= round.duration * 60 * 1000) {
                                countdown = formatCountdown(round.duration * 60 * 1000 - time);
                                status = 'gaming';
                                breaking = false;
                                currentRoundIndex = i;
                                break;
                            }
                        }
                        else {
                            //有round.breakDuration 就要判断是正在执行round.duration还是正执行round.breakDuration
                            if (time <= (round.duration + round.breakDuration) * 60 * 1000) {
                                if (time <= round.duration * 60 * 1000) {
                                    countdown = formatCountdown(round.duration * 60 * 1000 - time);
                                    breaking = false;
                                } else if (time < (round.duration + round.breakDuration) * 60 * 1000) {
                                    countdown = formatCountdown((round.duration + round.breakDuration) * 60 * 1000 - time);
                                    breaking = true;
                                }
                                status = 'gaming';
                                currentRoundIndex = i;
                                break;
                            }
                        }
                    }
                }
            }

            //计算下次休息 
            if ('gaming' === status && currentRoundIndex !== -1 && currentRoundIndex < this.state.rounds.length) {
                let currentRound = this.state.rounds[currentRoundIndex];
                //如果当前round就有breakDuration,并且正在执行duration而不是执行breakDuration
                //和倒计时相同
                if (currentRound.breakDuration && currentRound.breakDuration > 0 && !breaking) {
                    nextBreak = countdown;
                } else {
                    //其它的直接计算得出
                    //把第一个有breakDuration的round起始时间加上duration的时间
                    //减去当前时间就是倒计时
                    let time = 0;
                    for (let i = currentRoundIndex + 1; i < this.state.rounds.length; i++) {
                        let round = this.state.rounds[i];
                        //如果有round.breakDuration
                        if (round.breakDuration && round.breakDuration > 0) {
                            let time = round.duration * 60 * 1000 + round.startTime - dateTime
                            nextBreak = formatCountdown(time);
                            break;
                        }
                    }
                }
            }
        }

        if (currentRoundIndex === -1) {
            status = 'after';
            countdown = '00:00'
            currentRoundIndex = this.state.rounds.length - 1;
        }
        // console.log(`countDown:getCountdown():status:${status} countdown:${countdown} currentRoundIndex:${currentRoundIndex} breaking:${breaking}`);
        if (this.state.currentRoundIndex !== currentRoundIndex) {
            this.setState({ currentRoundIndex });
        }

        if (this.state.status !== status) {
            this.setState({ status });
        }
        if (this.state.breaking !== breaking) {
            this.setState({ breaking });
        }

        this.setState({
            countdown,
            nextBreak,
        })

        //如果暂停或者已经结束 停止倒计时 
        if (pauseTime || status === 'after') {
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
        }


    }
    /**
     * 如果有人已经扫码绑定此块屏幕 但由于各种原因 其它用户想要绑定这个屏幕
     * 就需要用户单击右上角 弹出二维码 给当前用户重新绑定
     */
    onShowQrClicked() {
        this.setState({ showQrcode: !this.state.showQrcode })
    }

    render() {
        //获取大屏幕类别
        let type = 'normal';
        if (this.props.device)
            type = this.props.device.get('type');
        if (!type)
            type = 'normal';
        return (
            <div>
                {
                    //初始界面  只显示二维码供人扫描
                    !this.state.showQrcode && !this.props.role &&
                    <Initial qrcodeUrl={this.props.qrcodeUrl} onShowQrClicked={this.onShowQrClicked}></Initial>
                }
                {
                    // 如果有人已经扫码绑定此块屏幕 但由于各种原因 其它用户想要绑定这个屏幕
                    //就需要用户单击右上角 弹出二维码 给当前用户重新绑定
                    this.state.showQrcode &&
                    <ShowQR qrcodeUrl={this.props.qrcodeUrl} onShowQrClicked={this.onShowQrClicked}></ShowQR>
                }
                {
                    //用户绑定屏幕 但没有比赛绑定
                    !this.state.showQrcode && this.props.role && !this.props.game &&
                    <BindedUser role={this.props.role} device={this.props.device} onShowQrClicked={this.onShowQrClicked}></BindedUser>
                }
                {
                    //屏幕已被比赛绑定 但没有显示奖池
                    !this.state.showQrcode && this.props.game && type === 'normal' &&
                    <BindedGame role={this.props.role}
                        device={this.props.device}
                        game={this.props.game}
                        onShowQrClicked={this.onShowQrClicked}
                        status={this.state.status}
                        currentRoundIndex={this.state.currentRoundIndex}
                        rounds={this.state.rounds}
                        breaking={this.state.breaking}
                        countdown={this.state.countdown}
                        nextBreak={this.state.nextBreak}
                        notifications={this.state.notifications}
                    >
                    </BindedGame>
                }
                {
                    //屏幕已被比赛绑定 并且显示奖池
                    !this.state.showQrcode && this.props.game && type === 'withreward' &&
                    <BindedGameWithReward role={this.props.role}
                        device={this.props.device}
                        game={this.props.game}
                        onShowQrClicked={this.onShowQrClicked}
                        status={this.state.status}
                        currentRoundIndex={this.state.currentRoundIndex}
                        rounds={this.state.rounds}
                        breaking={this.state.breaking}
                        countdown={this.state.countdown}
                        nextBreak={this.state.nextBreak}
                        notifications={this.state.notifications}
                        rewards={this.state.rewards}
                    >
                    </BindedGameWithReward>
                }
            </div>
        );
    }
}



function mapStateToProps(state) {

    return {
        isAuthenticated: state.screen.isAuthenticated,
        game: state.screen.game,
        role: state.screen.role,
        user: state.screen.user,
        device: state.screen.device,
        qrcodeUrl: state.screen.qrcodeUrl,
        deleted: state.screen.deleted,
        error: state.screen.error,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        init: bindActionCreators(init, dispatch),
        subscribeDevice: bindActionCreators(subscribeDevice, dispatch),
        unsubscribeDevice: bindActionCreators(unsubscribeDevice, dispatch),
        subscribeGame: bindActionCreators(subscribeGame, dispatch),
        unsubscribeGame: bindActionCreators(unsubscribeGame, dispatch),
        subscribeDeviceRole: bindActionCreators(subscribeDeviceRole, dispatch),
        unsubscribeDeviceRole: bindActionCreators(unsubscribeDeviceRole, dispatch),
        subscribeRole: bindActionCreators(subscribeRole, dispatch),
        unsubscribeRole: bindActionCreators(unsubscribeRole, dispatch),
    }
}

export default withRouter(
    connect(
        mapStateToProps,
        mapDispatchToProps
    )(ViewGame)
);