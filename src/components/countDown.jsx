import React from 'react';
import { Card, Button } from 'antd-mobile';
import { formatCountdown } from '../utils';
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
                startTime = startTime + round.duration * 60 * 1000;
            }
        }
        return rounds;
    }

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
                        if (time >= 0 && time < round.duration * 60 * 1000) {
                            countdown = formatCountdown(round.duration * 60 * 1000 - time);
                            status = 'gaming';
                            currentRoundIndex = i;
                            break;
                        }
                    }
                }
                else {
                    if (time >= 0 && time < round.duration * 60 * 1000) {
                        countdown = formatCountdown(round.duration * 60 * 1000 - time);
                        status = 'gaming';
                        currentRoundIndex = i;
                        break;
                    }
                }
            }
        }

        if (currentRoundIndex === -1) {
            status = 'after';
            countdown = '00:00'
            currentRoundIndex = this.state.rounds.length - 1;
        }
        // console.log(`countDown:getCountdown():status:${status} countdown:${countdown} currentRoundIndex:${currentRoundIndex}`);
        if (this.state.currentRoundIndex !== currentRoundIndex) {
            this.setState({ currentRoundIndex });
            this.props.updateCurrentRoundIndex(currentRoundIndex)
        }

        if (this.state.status !== status) {
            this.setState({ status });
            this.props.updateStatus(status)
        }

        this.setState({
            countdown
        })
    }


    render() {
        let countdownTitle = '';
        let pause = this.props.game ? this.props.game.get('pauseTime') ? true : false : false;
        if (this.state.status === 'before') {
            countdownTitle = '尚未开始';
        } else if (this.state.status === 'gaming') {
            let round = this.state.rounds[this.state.currentRoundIndex];
            countdownTitle = `当前级别:${round ? round.level : ''}`;
        } else if (this.state.status === 'after') {
            let round = this.state.rounds[this.state.currentRoundIndex];
            countdownTitle = `已经结束 级别:${round ? round.level : ''}`;
        }

        return (
            <Card>
                <Card.Header
                    title={countdownTitle}
                    extra={pause ? '暂停中' : ''}
                />
                <Card.Body>
                    <div style={{ fontSize: 30 }}> {this.state.countdown}</div>
                </Card.Body>
            </Card>
        );
    }
}