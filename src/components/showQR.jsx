/**
 * 如果有人已经扫码绑定此块屏幕 但由于各种原因 其它用户想要绑定这个屏幕
 * 就需要用户单击右上角 弹出二维码 给当前用户重新绑定
 */
import React from 'react';
import './showQR.less';
export class ShowQR extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

        }
        this.onShowQrClicked = this.onShowQrClicked.bind(this);
    }
    
    onShowQrClicked(e) {
        this.props.onShowQrClicked();
    }

    render() {
        return (
            <div className="uuidfull" onClick={this.onShowQrClicked}>
                <div className="qrcodebox" >
                    <img className="uuidqrcode" src={this.props.qrcodeUrl}></img>
                </div>
            </div>
        )
    }
}