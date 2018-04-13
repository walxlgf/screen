import React from 'react';
import { Card, Button } from 'antd-mobile';
import { formatCountdown } from '../utils';
import './countDown.less';
export class CountDown extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            rounds: [...this.appendRoundStartTime()],
            currentRoundIndex: -1,//当前正在运行round的index
            countdown: '',//倒计时字符串
            status: '',//比赛状态 'before' 'gaming' 'after'
        };
    }
    componentDidMount() {
        console.log(`countDown:componentDidMount`);
        if (this.props.game) {
            this.getCountdown();

            if (!this.props.game.get('pauseTime')) {
                this.interval = setInterval(() => this.getCountdown(), 980);
            }
        }
    }

    componentWillReceiveProps(nextProps) {
        console.log(`countDown:componentWillReceiveProps:`);
        if (nextProps.game && nextProps.game.get('pauseTime')) {
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
        } else {
            if (!this.interval) {
                this.interval = setInterval(() => this.getCountdown(), 980);
            }
        }
        this.setState({
            rounds: [...this.appendRoundStartTime()],
        });
    }

    componentWillUnmount() {
        console.log(`countDown:componentWillUnmount`);
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    /**
     * 根据game的startTime 生成rounds中每个round的开始时间 用于倒计时
     */
    appendRoundStartTime() {
        let game = this.props.game;
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
        return rounds;
    }

    /**
     * 
     */
    getCountdown() {
        //判断是不是暂停 如果有值 是在暂停
        let pauseTime = this.props.game.get('pauseTime');
        let dateTime;
        //没有暂停取当前值
        if (pauseTime) {
            dateTime = pauseTime.getTime();
        }
        else {
            dateTime = new Date().getTime();
        }

        let currentRoundIndex = -1;
        let status = 'before';
        let breaking = false;
        let countdown = '00:00';
        if (this.state.rounds) {
            for (var i = 0; i < this.state.rounds.length; i++) {
                var round = this.state.rounds[i];
                var time = dateTime - round.startTime;

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
        }

        if (currentRoundIndex === -1) {
            status = 'after';
            countdown = '00:00'
            currentRoundIndex = this.state.rounds.length - 1;
        }
        // console.log(`countDown:getCountdown():status:${status} countdown:${countdown} currentRoundIndex:${currentRoundIndex} breaking:${breaking}`);
        if (this.state.currentRoundIndex !== currentRoundIndex) {
            this.setState({ currentRoundIndex });
            this.props.updateCurrentRoundIndex(currentRoundIndex)
        }

        if (this.state.status !== status) {
            this.setState({ status });
            this.props.updateStatus(status)
        }
        if (this.state.breaking !== breaking) {
            this.setState({ breaking });
        }

        this.setState({
            countdown
        })

        //如果已经结束 停止倒计时 
        if (status === 'after') {
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
        }
    }


    render() {
        let countdownTitle = '';
        let pause = this.props.game ? this.props.game.get('pauseTime') ? true : false : false;
        let blind = '--';
        let ante = '--'
        let nextBlind = '--'
        if (this.state.status === 'before') {
            countdownTitle = '尚未开始';
        } else if (this.state.status === 'gaming') {
            let round = this.state.rounds[this.state.currentRoundIndex];
            if (this.state.breaking) {
                countdownTitle = `级别:${round ? round.level : ''}休息中`;
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
            let round = this.state.rounds[this.state.currentRoundIndex];
            countdownTitle = `已经结束 级别:${round ? round.level : ''}`;
            blind = round ? `${round.smallBlind}/${round.bigBlind}` : '--';
            ante = round ? `${round.ante}` : '--';
        }

        return (
            <div className="box">
                <div className="roundbox">
                    <div className="countdown">
                        {this.state.countdown}
                    </div>
                    <div className="rowbox">
                        <div className="lblbox">
                            <div className="lbl">盲注</div>
                            <div className="lbl">BLIND</div>
                        </div>
                        <div className="valuebox">
                            <div className="value">
                                {blind}
                            </div>
                        </div>
                    </div>
                    <div className="rowbox">
                        <div className="lblbox">
                            <div className="lbl">前注</div>
                            <div className="lbl">ANTE</div>
                        </div>
                        <div className="valuebox">
                            <div className="value">
                                {ante}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="nextroundbox">
                    <div className="rowbox">
                        <div className="lblbox">
                            <div className="lbl">下一级别</div>
                            <div className="lbl">NEXT LEVEL</div>
                        </div>
                        <div className="valuebox">
                            <div className="value">
                                {nextBlind}
                            </div>
                        </div>
                    </div>
                    <div className="rowbox">
                        <div className="lblbox">
                            <div className="lbl">下一休息</div>
                            <div className="lbl">NEXT BREAK</div>
                        </div>
                        <div className="valuebox">
                            <div className="value">
                                {this.state.countdown}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            // <Card>
            //     <Card.Header
            //         title={countdownTitle}
            //         extra={pause ? '暂停中' : ''}
            //     />
            //     <Card.Body>
            //         <div style={{ fontSize: 30 }}> {this.state.countdown}</div>
            //     </Card.Body>
            // </Card>
        );
    }
}