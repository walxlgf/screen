import React from 'react';
import Marquee from 'react-marquee';
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router';
import { init, subscribeDevice, unsubscribeDevice, subscribeGame, unsubscribeGame, subscribeDeviceRole, unsubscribeDeviceRole, subscribeRole, unsubscribeRole } from '../actions/screen';
import './screen.less';
import { formatCountdown } from '../utils';

let marquees = [undefined, undefined, undefined, undefined, undefined];
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
            notification: undefined,
            ntfIndex: -1,
        };
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
        console.log(`screen:componentWillReceiveProps:this.props.game:${this.props.game && this.props.game.get('title')} nextProps.game:${nextProps.game && nextProps.game.get('uuid')}`);
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
            this.dealGameReward(nextProps.game);

            //处理通知
            this.dealGameNotification(nextProps.notification);
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
        //先把notificationInterval关掉
        if (this.notificationInterval) {
            clearInterval(this.notificationInterval);
            this.notificationInterval = null;
        }
        let ntfStr = game.get('notification');
        console.log(`screen:dealGameNotification:ntfStr:${ntfStr}`);
        if (ntfStr) {
            let notifications = ntfStr.split('\n');
            let notification;
            if (notifications)
                notification = notifications[0];
            this.setState({
                notifications,
                notification,
                ntfIndex: 0,
            });

            if (!this.notificationInterval) {
                this.notificationInterval = setInterval(() => this.dealNotificationInterval(), 1000 * 10);
            }
        } else {
            this.setState({
                notifications: undefined,
                notification: undefined,
                ntfIndex: -1,
            });
        }
    }

    /**
     * 在notificationInterval中每隔10秒执行一次
     * 通过计算获得循环显示的奖池信息
     */
    dealNotificationInterval() {
        //奖池信息可能有十几条或几十条不等 一屏显示不下
        //通过rwIndex对总页数求余获取当前页的i.
        let ntfIndex = this.state.ntfIndex;
        let i = 0;
        if (ntfIndex > 0)
            i = ntfIndex % this.state.notifications.length;
        let notification = this.state.notifications[i];
        console.log(`screen:dealRewardInterval:ntfIndex:${ntfIndex}`);
        this.setState({ ntfIndex: ++this.state.ntfIndex, notification })
    }

    /**
     * 如果比赛有奖池信息 并且允许显示 则显示奖池信息 （现在只判断是否有，有就显示)
     * @param {*} game 
     */
    dealGameReward(game) {
        //先把rewardInterval关掉
        if (this.rewardInterval) {
            clearInterval(this.rewardInterval);
            this.rewardInterval = null;
        }
        let rewardStr = game.get('reward');
        console.log(`screen:dealGameReward:rewardStr:${rewardStr}`);
        if (rewardStr) {
            let strs = rewardStr.split('\n');
            let rewardss = [];//二维数组
            let rewards = [];
            for (let i = 0; i < strs.length;) {
                const str = strs[i++];
                rewards.push(str);
                if (i == strs.length) {
                    rewardss.push(rewards);
                } else if (i !== 0 && i % 5 == 0) {
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
        this.setState({ rwIndex: ++this.state.rwIndex, rewards })
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
    onShowQrClicked = () => {
        this.setState({ showQrcode: !this.state.showQrcode })
    }

    render() {

        let that = this;
        //如果比赛不存在 显示UUID界面
        let uuid = '--';

        let countdownTitle = '';
        let pause = false;
        let blind = '--';
        let ante = '--';
        let nextBlind = '--';
        let currentLevel = '--';

        let statusChs;
        let statusEng;

        let palyerCount = '--';
        let totalChips = '--';
        let avgChips = '--';
        let restPlayers = '--';
        let rewardPlayers = '--';
        let gameTitle = '';

        let icon;
        let bg = `url("../images/bg.jpg")`;

        //
        let title = '';
        let role = this.props.role;
        if (role) {
            title = role.get('title');
            icon = role.get('icon');
            if (role.get('bg'))
                bg = role.get('bg');
        }

        if (!this.props.game) {
            if (this.props.device)
                uuid = this.props.device.get('uuid');
        }
        //如果比赛 显示比赛大屏幕
        else {
            if (this.props.device)
                uuid = this.props.device.get('uuid');

            pause = this.props.game.get('pauseTime') ? true : false;

            if (this.state.status === 'before') {
                countdownTitle = '尚未开始';
                statusChs = '准 备';
                statusEng = 'PREPARE';
                // rbg = 'rbgbefore';
            } else if (this.state.status === 'gaming') {
                let round = this.state.rounds[this.state.currentRoundIndex];
                currentLevel = round.level;
                if (this.state.breaking) {
                    countdownTitle = `级别:${round ? round.level : ''}休息中`;
                    statusChs = '休 息';
                    statusEng = 'BREAK';
                } else {
                    countdownTitle = `级别:${round ? round.level : ''}`;
                }
                blind = round ? `${round.smallBlind}/${round.bigBlind}` : '--';
                ante = round ? `${round.ante}` : '--';
                if (this.state.currentRoundIndex + 1 < this.state.rounds.length) {
                    let nextRound = this.state.rounds[this.state.currentRoundIndex + 1];
                    nextBlind = nextRound ? `${nextRound.smallBlind}/${nextRound.bigBlind}` : '--';
                }

            } else if (this.state.status === 'after') {
                // rbg = 'rbgafter';
                let round = this.state.rounds[this.state.currentRoundIndex];
                if (round) {
                    currentLevel = round.level;
                    countdownTitle = `已经结束 级别:${round ? round.level : ''}`;
                    blind = round ? `${round.smallBlind}/${round.bigBlind}` : '--';
                    ante = round ? `${round.ante}` : '--';
                }
            }
            let game = this.props.game;
            let palyers = game.get('players') ? game.get('players') : 0;
            let startChips = game.get('startChips') ? game.get('startChips') : 0;
            let rebuyChips = game.get('rebuyChips') ? game.get('rebuyChips') : 0;
            let addonChips = game.get('addonChips') ? game.get('addonChips') : 0;
            let rebuyCount = game.get('rebuyCount') ? game.get('rebuyCount') : 0;
            let addonCount = game.get('addonCount') ? game.get('addonCount') : 0;

            gameTitle = game.get('title');
            palyerCount = `${palyers ? palyers : '0'}/${rebuyCount ? rebuyCount : '0'}/${addonCount ? addonCount : '0'}`
            restPlayers = game.get('restPlayers') ? game.get('restPlayers') : 0;
            rewardPlayers = game.get('rewardPlayers') ? game.get('rewardPlayers') : 0;
            totalChips = palyers * startChips + rebuyCount * rebuyChips + addonCount * addonChips;
            avgChips = totalChips / palyers;



        }

        return (
            <div>

                {
                    // 如果有人已经扫码绑定此块屏幕 但由于各种原因 其它用户想要绑定这个屏幕
                    //就需要用户单击右上角 弹出二维码 给当前用户重新绑定
                    this.state.showQrcode &&
                    <div className="uuidfull" onClick={this.onShowQrClicked}>
                        <div className="qrcodebox" >
                            <img className="uuidqrcode" src={this.props.qrcodeUrl}></img>
                        </div>
                    </div>
                }
                {
                    (!this.state.showQrcode && !this.props.role) &&
                    <div className="uuidfull">
                        <div className="qrcodebox">
                            <img className="uuidqrcode" src={this.props.qrcodeUrl}></img>
                        </div>
                    </div>
                }
                {
                    (!this.state.showQrcode && this.props.role && !this.props.game) &&
                    <div className="full" style={{ backgroundImage: `url("${bg}")` }}>
                        <div className="header">
                            <div className="headersidebox">
                                <img src={icon}></img>
                            </div>
                            <div className="headercenterbox">
                                <div className="title">{title}</div>
                            </div>
                            <div className="headersidebox" onClick={this.onShowQrClicked}>
                                <div className="gameuuidbox">
                                    <div className="gameuuid">编码:{uuid}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                }
                {
                    (!this.state.showQrcode && this.props.game) &&
                    <div className="full" style={{ backgroundImage: `url("${bg}")` }}>
                        <div className="header">
                            <div className="headersidebox">
                                <img src={icon}></img>
                            </div>
                            <div className="headercenterbox">
                                <div className="title">{title}</div>
                                <div className="subTitle">{gameTitle}</div>
                            </div>
                            <div className="headersidebox">
                                <div className="gameuuidbox" onClick={this.onShowQrClicked}>
                                    <div className="gameuuid">编码:{uuid}</div>
                                </div>
                            </div>
                        </div>
                        <div className="body">

                            {//左边正常是显示剩余人数、参赛人数等 
                                !this.state.rewards && <div className="sidebox">
                                    <div className="siderowbox">
                                        <div className="leftlblbox">
                                            <div className="sidelblchs">剩余人数</div>
                                            <div className="sidelbleng">REST COUNT</div>
                                        </div>
                                        <div className="leftvaluebox">
                                            <div className="sidevalue">
                                                {restPlayers}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="siderowbox">
                                        <div className="leftlblbox">
                                            <div className="sidelblchs">参赛人数</div>
                                            <div className="sidelbleng">PLAYER COUNT</div>
                                        </div>
                                        <div className="leftvaluebox">
                                            <div className="sidevalue">
                                                {palyerCount}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="siderowbox">
                                        <div className="leftlblbox">
                                            <div className="sidelblchs">奖励人数</div>
                                            <div className="sidelbleng">REWARD COUNT</div>
                                        </div>
                                        <div className="leftvaluebox">
                                            <div className="sidevalue">
                                                {rewardPlayers}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            }

                            {//如果比赛有奖池信息 并且允许显示 则显示奖池信息 （现在只判断是否有，有就显示)
                                this.state.rewards && <div className="rewardsidebox">{
                                    marquees.map(function (marquee, idx) {
                                        return <div className="rewardbox" key={idx}>
                                            <Marquee
                                                className='rewardvalue'
                                                hoverToStop={that.state.rewards[idx] && that.state.rewards[idx].length > 10}
                                                text={that.state.rewards[idx]}
                                            />
                                        </div>
                                    })}
                                </div>
                            }
                            <div className="centerbox">
                                <div className="countdownbox">
                                    <div className="countdown">
                                        {this.state.countdown}
                                    </div>
                                </div>

                                {!statusChs && <div className="roundbox3">
                                    <div className="rowbox">
                                        <div className="lblbox">
                                            <div className="lblchs">盲注</div>
                                            <div className="lbleng">BLIND</div>
                                        </div>
                                        <div className="valuebox">
                                            <div className="value">
                                                {blind}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rowbox">
                                        <div className="lblbox">
                                            <div className="lblchs">前注</div>
                                            <div className="lbleng">ANTE</div>
                                        </div>
                                        <div className="valuebox">
                                            <div className="value">
                                                {ante}
                                            </div>
                                        </div>
                                    </div>
                                </div>}

                                {statusChs &&
                                    <div className="statusbox">
                                        <div className="statuschs">
                                            {statusChs}
                                        </div>
                                        <div className="statuschs">
                                            {statusEng}
                                        </div>
                                    </div>
                                }
                                <div className="nextroundbox3">
                                    <div className="rowbox">
                                        <div className="lblbox">
                                            <div className="minilblchs">下一级别</div>
                                            <div className="minilbleng">NEXT LEVEL</div>
                                        </div>
                                        <div className="valuebox">
                                            <div className="minivalue">
                                                {nextBlind}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="sidebox">
                                <div className="siderowbox">
                                    <div className="rightlblbox">
                                        <div className="sidelblchs">当前级别</div>
                                        <div className="sidelbleng">CURRENT LEVEL</div>
                                    </div>
                                    <div className="rightvaluebox">
                                        <div className="sidevalue">
                                            {currentLevel}
                                        </div>
                                    </div>
                                </div>

                                <div className="siderowbox">
                                    <div className="rightlblbox">
                                        <div className="sidelblchs">下一休息</div>
                                        <div className="sidelbleng">NEXT BREAK</div>
                                    </div>
                                    <div className="rightvaluebox">
                                        <div className="sidevalue">
                                            {this.state.nextBreak}
                                        </div>
                                    </div>
                                </div>

                                <div className="siderowbox">
                                    <div className="rightlblbox">
                                        <div className="sidelblchs">平均记分牌</div>
                                        <div className="sidelbleng">AVG.CHIPS</div>
                                    </div>
                                    <div className="rightvaluebox">
                                        <div className="sidevalue">
                                            {avgChips}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="footer">
                            {
                                pause && <div className="footerpausebox">
                                    <Marquee hoverToStop={true} text="    PAUSE　暂 停   PAUSE　暂 停   PAUSE　暂 停   PAUSE　暂 停   PAUSE　暂 停   PAUSE　暂 停   PAUSE　暂 停   PAUSE　暂 停   " />
                                </div>

                            }
                            {
                                this.state.notifications && <div className="footernotificationbox">
                                    <Marquee hoverToStop={this.state.notification && this.state.notificatio.length > 10} text={this.state.notification} />
                                </div>
                            }
                        </div>
                    </div>
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