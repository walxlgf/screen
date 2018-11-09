/**
 * 当前device没有用户绑定
 * 只显示一个二维码
 */
import React from 'react';
import './initial.less';
export class Initial extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div className="uuidfull">
                <div className="qrcodebox" >
                    <img className="uuidqrcode" src={this.props.qrcodeUrl}></img>
                </div>
            </div>
        )
    }
}