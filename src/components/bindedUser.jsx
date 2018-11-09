/**
 * 当前device没有用户绑定
 * 只显示一个二维码
 */
import React from 'react';
import './bindedUser.less';
export class BindedUser extends React.Component {
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
        let uuid = '0000';
        if (role) {
            title = role.get('title');
            if (role.get('icon'))
                icon = role.get('icon');
            if (role.get('bg'))
                bg = `url("${role.get('bg')}")`;
        }

        if (this.props.device)
            uuid = this.props.device.get('uuid');

        return (
            <div className="full" style={{ backgroundImage: bg }}>
                <div className="header">
                    <div className="headersidebox">
                        <img className="icon" src={icon}></img>
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
        )
    }
}