import React from 'react';
import Marquee from 'react-smooth-marquee';
import QRCode from 'qrcode';
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router';
import { lchmod } from 'fs';
import { formatShortDate } from '../utils';
import { init, subscribeDevice, unsubscribeDevice, subscribeGame, unsubscribeGame } from '../actions/screen';
import './screen.less';
import { formatCountdown } from '../utils';
class ViewGame extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            qrcodeUrl: null,
            rounds: [],
            currentRoundIndex: -1,//当前正在运行round的index
            countdown: '',//倒计时字符串
            status: '',//比赛状态 'before' 'gaming' 'after'
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
        //device创建完毕 监听device列表  根据uuid生成二维码qrcode
        if (!this.props.device && nextProps.device) {
            console.log(`screen:componentWillReceiveProps:uuid:${nextProps.device.get('uuid')}`);
            this.props.subscribeDevice(nextProps.device);

            QRCode.toDataURL(nextProps.device.get('uuid')).then(url => {
                this.setState({ qrcodeUrl: url });
                console.log(`screen:QRCode:url:${url}`);
            }).catch(err => {
                console.log(`screen:QRCode:err:${err}`);
            })

        }
        //监听比赛
        if (nextProps.game) {
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
        this.props.unsubscribeDevice(this.props.device);
        this.props.unsubscribeGame();
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

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
     * 
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

    render() {
        //如果比赛不存在 显示UUID界面
        let uuid = '--';

        let countdownTitle = '';
        let pause = false;
        let blind = '--';
        let ante = '--';
        let nextBlind = '--';
        let currentLevel = '--';

        //各种状态的样式  未开始 正常 暂停  休息中 已经结束 等状态通过这个样式来区别
        // let rbg = 'rbg';
        // let roundbox2 = "roundbox2 ";
        // let nextroundbox2 = "nextroundbox2 ";

        let statusChs;
        let statusEng;

        let palyerCount = '--';
        let totalChips = '--';
        let avgChips = '--';
        let restPlayers = '--';
        let rewardPlayers = '--';
        let title = '';
        let subTitle = '';
        let icon = '';
        let bg = '';

        let bgStyle = {
            backgroundImage: `url("../images/bg.jpg")`
        };


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
            if (pause) {
                // rbg = 'rbgpausing';
            }

            // roundbox2 = roundbox2 + rbg;
            // nextroundbox2 = nextroundbox2 + rbg;


            let game = this.props.game;
            let palyers = game.get('players') ? game.get('players') : 0;
            let startChips = game.get('startChips') ? game.get('startChips') : 0;
            let rebuyChips = game.get('rebuyChips') ? game.get('rebuyChips') : 0;
            let addonChips = game.get('addonChips') ? game.get('addonChips') : 0;
            let rebuyCount = game.get('rebuyCount') ? game.get('rebuyCount') : 0;
            let addonCount = game.get('addonCount') ? game.get('addonCount') : 0;

            title = game.get('title');
            subTitle = game.get('subTitle');
            palyerCount = `${palyers ? palyers : '0'}/${rebuyCount ? rebuyCount : '0'}/${addonCount ? addonCount : '0'}`
            restPlayers = game.get('restPlayers') ? game.get('restPlayers') : 0;
            rewardPlayers = game.get('rewardPlayers') ? game.get('rewardPlayers') : 0;
            totalChips = palyers * startChips + rebuyCount * rebuyChips + addonCount * addonChips;
            avgChips = totalChips / palyers;

            let role = this.props.role;
            icon = role.get('icon');
            bg = role.get('bg');
            if (bg)
                bgStyle = {
                    backgroundImage: `url("${bg}")`
                };
        }

        return (
            <div>
                {
                    (this.props.role && !this.props.game) &&
                    <div className="full" style={bgStyle}>
                        <div className="header">
                            <div className="headersidebox">
                                <img src={icon}></img>
                            </div>
                            <div className="headercenterbox">
                                <div className="title">Hulu计时器</div>
                            </div>
                            <div className="headersidebox">
                                <div className="gameuuidbox">
                                    <div className="gameuuid">编码:{uuid}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                }
                {
                    (!this.props.game && !this.props.role) &&
                    <div className="uuidfull">
                        <div className="qrcodebox">
                            <img className="uuidqrcode" src={this.state.qrcodeUrl}></img>
                        </div>
                    </div>
                }
                {
                    this.props.game && <div className="full" style={bgStyle}>

                        <div className="header">
                            <div className="headersidebox">
                                <img src={icon}></img>
                            </div>
                            <div className="headercenterbox">
                                <div className="title">{title}</div>
                                <div className="subTitle">{subTitle}</div>
                            </div>
                            <div className="headersidebox">
                                <div className="gameuuidbox">
                                    <div className="gameuuid">编码:{uuid}</div>
                                </div>
                            </div>
                        </div>
                        <div className="body">
                            <div className="sidebox">
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
                            {pause &&
                                <div className="footerpausebox">
                                    <Marquee>
                                        PAUSE　暂 停   PAUSE　暂 停   PAUSE　暂 停   PAUSE　暂 停   PAUSE　暂 停   PAUSE　暂 停   PAUSE　暂 停   PAUSE　暂 停
                                    </Marquee>
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
    }
}

export default withRouter(
    connect(
        mapStateToProps,
        mapDispatchToProps
    )(ViewGame)
);