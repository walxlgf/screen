/**
 * 当前device绑定了比赛 但不要求显示奖池信息时用这个组件显示
 */
import React from 'react';
import Marquee from 'react-marquee';
import Slider from "react-slick";
import "jquery";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import './bindedGame.less';
export class BindedGame extends React.Component {
    constructor(props) {
        super(props);
        this.onShowQrClicked = this.onShowQrClicked.bind(this);
    }
    
    onShowQrClicked(e) {
        this.props.onShowQrClicked();
    }

    render() {
        let icon = `../images/icon.jpg`;
        let bg = `url("../images/bg.jpg")`;
        let title = 'Hulu计时器';
        let role = this.props.role;
        if (role) {
            title = role.get('title');
            if (role.get('icon'))
                icon = role.get('icon');
            if (role.get('bg'))
                bg = `url("${role.get('bg')}")`;
        }

        let uuid = '--';
        if (this.props.device)
            uuid = this.props.device.get('uuid');

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
        if (this.props.game) {
            pause = this.props.game.get('pauseTime') ? true : false;

            if (this.props.status === 'before') {
                countdownTitle = '尚未开始';
                statusChs = '准 备';
                statusEng = 'PREPARE';
                // rbg = 'rbgbefore';
            } else if (this.props.status === 'gaming') {
                let round = this.props.rounds[this.props.currentRoundIndex];
                currentLevel = round.level;
                if (this.props.breaking) {
                    countdownTitle = `级别:${round ? round.level : ''}休息中`;
                    statusChs = '休 息';
                    statusEng = 'BREAK';
                } else {
                    countdownTitle = `级别:${round ? round.level : ''}`;
                }
                blind = round ? `${round.smallBlind}/${round.bigBlind}` : '--';
                ante = round ? `${round.ante}` : '--';
                if (this.props.currentRoundIndex + 1 < this.props.rounds.length) {
                    let nextRound = this.props.rounds[this.props.currentRoundIndex + 1];
                    nextBlind = nextRound ? `${nextRound.smallBlind}/${nextRound.bigBlind}` : '--';
                }

            } else if (this.props.status === 'after') {
                // rbg = 'rbgafter';
                let round = this.props.rounds[this.props.currentRoundIndex];
                if (round) {
                    currentLevel = round.level;
                    countdownTitle = `已经结束 级别:${round ? round.level : ''}`;
                    blind = round ? `${round.smallBlind}/${round.bigBlind}` : '--';
                    ante = round ? `${round.ante}` : '--';
                }
            }
            let game = this.props.game;
            gameTitle = game.get('title');
            let chipss = game.get('chipss');
            let palyers = game.get('players') ? game.get('players') : 0;
            palyerCount = `${palyers ? palyers : '0'}`
            restPlayers = game.get('restPlayers') ? game.get('restPlayers') : 0;
            rewardPlayers = game.get('rewardPlayers') ? game.get('rewardPlayers') : 0;
          
            let chipss = game.get('chipss');
            let total = 0;
            if (chipss) {
                for (let i = 0; i < chipss.length; i++) {
                    const chips = chipss[i];
                    total += chips.count * chips.value;
                }
            }
            let avg = parseInt(total / palyers);
            totalChips = `${total}`;
            avgChips = `${avg}`;
        }
        const sliderSettings = {
            arrows: false,
            autoplay: true,
            autoplaySpeed: 5000,
            speed: 5000,
            dots: false,
            infinite: true,
            slidesToShow: 1,
            slidesToScroll: 1,
            vertical: true,
            verticalSwiping: true,
        };
        return (
            <div className="full" style={{ backgroundImage: bg }}>
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
                                {this.props.countdown}
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
                                    {this.props.nextBreak}
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
                    { //优先显示暂停 有暂停不显示通知
                        (!pause && this.props.notifications) &&
                        <div className="footernotificationbox">
                            <Slider {...sliderSettings}>
                                {
                                    this.props.notifications.map(function (notification, idx) {
                                        return <div key={idx} className="footernotificationvalue">{notification}</div>
                                    })
                                }
                            </Slider>
                        </div>
                    }
                    {
                        //优先显示暂停 有暂停不显示通知
                        pause && <div className="footerpausebox">
                            <Marquee hoverToStop={true} text="    PAUSE　暂 停   PAUSE　暂 停   PAUSE　暂 停   PAUSE　暂 停   PAUSE　暂 停   PAUSE　暂 停   PAUSE　暂 停   PAUSE　暂 停   " />
                        </div>

                    }
                </div>
            </div>
        )
    }
}