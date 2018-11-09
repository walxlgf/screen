/**
 * 当前device绑定了比赛 但不要求显示奖池信息时用这个组件显示
 */
import React from 'react';
import Marquee from 'react-marquee';
import Slider from "react-slick";
import "jquery";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import './bindedGameWithReward.less';

const marquees = [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,undefined];
export class BindedGameWithReward extends React.Component {
    constructor(props) {
        super(props);
        this.onShowQrClicked = this.onShowQrClicked.bind(this);
    }

    onShowQrClicked(e) {
        this.props.onShowQrClicked();
    }

    render() {
        console.log('BindedGameWithReward:render:')
        let that = this;
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
            avgChips = parseInt(totalChips / palyers);
        }

        const sliderSettings = {
            arrows: false,
            autoplay: true,
            autoplaySpeed: 5000,
            speed: 1000,
            dots: false,
            infinite: true,
            slidesToShow: 1,
            slidesToScroll: 1,
            vertical: true,
            verticalSwiping: true,
        };
        return (

            <div className="r-full" style={{ backgroundImage: bg }}>
                <div className="r-header">
                    <div className="r-headersidebox">
                        <img src={icon}></img>
                    </div>
                    <div className="r-headercenterbox">
                        <div className="r-title">{title}</div>
                        <div className="r-subTitle">{gameTitle}</div>
                    </div>
                    <div className="r-headersidebox">
                        <div className="r-gameuuidbox" onClick={this.onShowQrClicked}>
                            <div className="r-gameuuid">编码:{uuid}</div>
                        </div>
                    </div>
                </div>
                <div className="r-body">
                    <div className="r-bodytop">
                        <div className="r-toprowbox">
                            <div className="r-toplblbox">REMAIN</div>
                            <div className="r-topvaluebox">{restPlayers}</div>
                        </div>
                        <div className="r-toprowbox">
                            <div className="r-toplblbox">ENTRIES</div>
                            <div className="r-topvaluebox">{palyerCount}</div>
                        </div>
                        <div className="r-toprowbox">
                            <div className="r-toplblbox">PRIZE</div>
                            <div className="r-topvaluebox">{rewardPlayers}</div>
                        </div>
                        <div className="r-toprowbox">
                            <div className="r-toplblbox">LEVEL</div>
                            <div className="r-topvaluebox">{currentLevel}</div>
                        </div>

                        <div className="r-toprowbox">
                            <div className="r-toplblbox">NEXT BREAK</div>
                            <div className="r-topvaluebox">{this.props.nextBreak}</div>
                        </div>

                        <div className="r-toprowbox">
                            <div className="r-toplblbox">AVG.CHIPS</div>
                            <div className="r-topvaluebox">{avgChips}</div>
                        </div>
                    </div>
                    <div className="r-bodybottom">
                        <div className="r-gamebox">
                            <div className="r-countdownbox">
                                <div className="r-countdown">
                                    {this.props.countdown}
                                </div>
                            </div>

                            {!statusChs && <div className="r-roundbox">
                                <div className="r-rowbox">
                                    <div className="r-lblbox">
                                        <div className="r-lblchs">盲注</div>
                                        <div className="r-lbleng">BLIND</div>
                                    </div>
                                    <div className="r-valuebox">
                                        <div className="r-value">
                                            {blind}
                                        </div>
                                    </div>
                                </div>

                                <div className="r-rowbox">
                                    <div className="r-lblbox">
                                        <div className="r-lblchs">前注</div>
                                        <div className="r-lbleng">ANTE</div>
                                    </div>
                                    <div className="r-valuebox">
                                        <div className="r-value">
                                            {ante}
                                        </div>
                                    </div>
                                </div>
                            </div>}

                            {statusChs && <div className="r-statusbox">
                                <div className="r-statuschs">
                                    {statusChs}
                                </div>
                                <div className="r-statuschs">
                                    {statusEng}
                                </div>
                            </div>}

                            <div className="r-nextroundbox">
                                <div className="r-rowbox">
                                    <div className="r-lblbox">
                                        <div className="r-minilblchs">下一级别</div>
                                        <div className="r-minilbleng">NEXT LEVEL</div>
                                    </div>
                                    <div className="r-valuebox">
                                        <div className="r-minivalue">
                                            {nextBlind}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="r-rewardsbox">{
                            marquees.map(function (marquee, idx) {
                                return <div key={idx}>
                                    {
                                        idx === 0 && <div className="r-toprewardbox">
                                            <Marquee
                                                className='r-rewardvalue'
                                                hoverToStop={that.props.rewards && that.props.rewards[idx] && that.props.rewards[idx].length > 10}
                                                text={that.props.rewards && that.props.rewards[idx]}
                                            />
                                        </div>
                                    }
                                    {
                                        idx > 0 && idx < marquees.length - 1 && <div className="r-centerrewardbox">
                                            <Marquee
                                                className='r-rewardvalue'
                                                hoverToStop={that.props.rewards && that.props.rewards[idx] && that.props.rewards[idx].length > 10}
                                                text={that.props.rewards && that.props.rewards[idx]}
                                            />
                                        </div>
                                    }
                                    {
                                        idx === marquees.length - 1 && <div className="r-bottomrewardbox">
                                            <Marquee
                                                className='r-rewardvalue'
                                                hoverToStop={that.props.rewards && that.props.rewards[idx] && that.props.rewards[idx].length > 10}
                                                text={that.props.rewards && that.props.rewards[idx]}
                                            />
                                        </div>
                                    }
                                </div>
                            })}
                        </div>
                    </div>
                </div>
                <div className="r-footer">
                    { //优先显示暂停 有暂停不显示通知
                        (!pause && this.props.notifications) &&
                        <div className="r-footernotificationbox">
                            <Slider {...sliderSettings}>
                                {
                                    this.props.notifications.map(function (notification, idx) {
                                        return <div key={idx} className="r-footernotificationvalue">{notification}</div>
                                    })
                                }
                            </Slider>
                        </div>
                    }
                    {
                        //优先显示暂停 有暂停不显示通知
                        pause && <div className="r-footerpausebox">
                            <Marquee hoverToStop={true} text="    PAUSE　暂 停   PAUSE　暂 停   PAUSE　暂 停   PAUSE　暂 停   PAUSE　暂 停   PAUSE　暂 停   PAUSE　暂 停   PAUSE　暂 停   " />
                        </div>
                    }
                </div>
            </div>
        )
    }
}