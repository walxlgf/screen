import React from 'react';
import { WingBlank, Toast, Card, WhiteSpace } from 'antd-mobile';
import { List } from 'antd-mobile';
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router';
import { CountDown } from '../components/countDown';
import { lchmod } from 'fs';
import { formatShortDate } from '../utils';
import { init, subscribeDevice, unsubscribeDevice, subscribeGame, unsubscribeGame } from '../actions/screen';

const Item = List.Item;
const Brief = Item.Brief;

class ViewGame extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            status: '',//比赛状态 'before' 'gaming' 'after' 在CountDown中计算 回调回来
            currentRoundIndex: -1,//当前正在运行round的index 在CountDown中计算 回调回来
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
        if (!this.props.device && nextProps.device) {
            console.log(`screen:componentWillReceiveProps:uuid:${nextProps.device.get('uuid')}`);
            this.props.subscribeDevice(nextProps.device);
        }
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
        if (!this.props.game && nextProps.game) {
        }
    }

    componentWillUnmount() {
        console.log(`screen:componentWillUnmount`);
        this.props.unsubscribeDevice(this.props.device);
        this.props.unsubscribeGame();
    }

    updateStatus = (status) => {
        console.log(`screen:updateStatus:${status}`);

        this.setState({ status });
    };

    updateCurrentRoundIndex = (currentRoundIndex) => {
        console.log(`screen:updateCurrentRoundIndex:${currentRoundIndex}`);
        this.setState({ currentRoundIndex });
    };

    render() {
        let username = this.props.user ? `${this.props.user.get('username')}` : '';
        let sessionToken = this.props.user ? `${this.props.user.get('sessionToken')}` : '';
        let id = this.props.user ? `${this.props.user.id}` : '';
        return (
            <div>

                {this.props.device &&
                    <WingBlank>
                        <WhiteSpace size='md' />
                        <Card>
                            <Card.Body>
                                <div
                                    style={{
                                        fontSize: 24,
                                        marginLeft: 'auto',
                                        marginRight: 'auto',
                                        textAlign: 'center'
                                    }}
                                >我是大屏幕</div>
                                <div
                                    style={{
                                        fontSize: 30,
                                        marginLeft: 'auto',
                                        marginRight: 'auto',
                                        textAlign: 'center'
                                    }}
                                >{this.props.device.get('uuid')}</div>
                            </Card.Body>
                            <Card.Footer>
                            </Card.Footer>
                        </Card>
                    </WingBlank>
                }

                <WhiteSpace size='md' />

                <div
                    style={{
                        fontSize: 14,
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        textAlign: 'center'
                    }}
                >{id}</div>
                <div
                    style={{
                        fontSize: 14,
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        textAlign: 'center'
                    }}
                >{username}</div>
                <div
                    style={{
                        fontSize: 14,
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        textAlign: 'center'
                    }}
                >{sessionToken}</div>

                <WhiteSpace size='md' />

                {this.props.game &&
                    <WingBlank>
                        <WhiteSpace size='md' />
                        <Card>
                            <Card.Header
                                title={this.props.game && this.props.game.get('title')}
                            />
                            <Card.Body>
                                <div> {`开始时间:${formatShortDate(this.props.game.get('startTime'))}`}</div>
                                <div> {`起始筹码:${this.props.game.get('startChips')}$`}</div>
                                {/* <div> {`重买筹码:${this.props.game.get('rebuyChips')}$`}</div>
                                <div> {`重买人次:${this.props.game.get('rebuyCount')}$`}</div>
                                <div> {`加买筹码:${this.props.game.get('addonChips')}$`}</div>
                                <div> {`加买人次:${this.props.game.get('addonCount')}$`}</div> */}
                                <div> {`玩家人数:${this.props.game.get('players')}人`}</div>
                                {this.props.game.get('rebuy') && <div> {`重买筹码:${this.props.game.get('rebuyChips')}$`}</div>}
                                {this.props.game.get('rebuy') && <div> {`重买人次:${this.props.game.get('rebuyCount')}$`}</div>}
                                {this.props.game.get('addon') && <div> {`加买筹码:${this.props.game.get('addonChips')}$`}</div>}
                                {this.props.game.get('addon') && <div> {`加买人次:${this.props.game.get('addonCount')}$`}</div>}
                            </Card.Body>
                        </Card>
                        <WhiteSpace size='md' />
                        <CountDown
                            game={this.props.game}
                            updateStatus={this.updateStatus}
                            updateCurrentRoundIndex={this.updateCurrentRoundIndex}
                        />
                    </WingBlank>
                }
            </div >
        );
    }
}



function mapStateToProps(state) {

    return {
        isAuthenticated: state.screen.isAuthenticated,
        game: state.screen.game,
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