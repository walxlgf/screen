import Parse from 'parse';
import { appId, serverURL, liveQueryServerURL, masterKey } from '../config'


export const AUTHENTICATED = "AUTHENTICATED";//已经完成验证

export const DEVICE_CREATED = "DEVICE_CREATED";//已经创建完device


export const DEVICE_DESTROY = "DEVICE_DESTROY";//监听到删除

//LiveQuery

export const S_DEVICE_OPENED = "S_DEVICE_OPENED";//监听已成功打开
export const S_DEVICE_CLOSED = "S_DEVICE_CLOSED";//设置监听 取消监听

export const S_DEVICE_UPDATED = "S_DEVICE_UPDATED";//监听到更新

export const S_GAME_OPENED = "S_GAME_OPENED";//监听已成功打开
export const S_GAME_CLOSED = "S_GAME_CLOSED";//设置监听 取消监听

export const S_GAME_UPDATED = "S_GAME_UPDATED";//监听到更新
export const S_GAME_DELETED = "S_GAME_DELETED";//监听到删除



export const init = () => {
    return dispatch => {
        let installationId;
        //首先登录
        //获取session对象
        Parse.User.logIn('screenuser', '1').then(function (user) {
            let sessionToken = user.getSessionToken();
            console.log(`screen:init:user:sessionToken:${JSON.stringify(sessionToken)}`);
            let query = new Parse.Query(Parse.Session);
            query.equalTo('sessionToken', sessionToken);
            return query.first();

        }).then(function (session) {
            //根据session获取installationId
            //根据installationId获取device
            if (session) {
                installationId = session.get('installationId');
                console.log(`screen:init:installationId:${JSON.stringify(installationId)}`);
                let query = new Parse.Query('Device');
                query.equalTo('installationId', installationId);
                return query.first();
            }
        }).then(function (device) {
            //如果有值  说明此设备已经有了 获取
            //如果没值  创建
            if (device) {
                let game = device.get('game');
                //有game 
                if (game) {
                    game.fetch({
                        success: function (game) {
                            console.log(`subscribeDevice:game:title:${JSON.stringify(game.get('title'))}`);
                            dispatch({ type: DEVICE_CREATED, device, deviceGame: game });
                        }
                    });
                } else {
                    dispatch({ type: DEVICE_CREATED, device, deviceGame: null });
                }
            } else {
                let Device = Parse.Object.extend('Device');
                let device = new Device();
                device.set('installationId', installationId);
                //获取新建的device
                device.save().then(function (device) {
                    console.log(`screen:device:${JSON.stringify(device)}`)
                    if (device) {
                        dispatch({ type: DEVICE_CREATED, device });
                    }
                }, function (error) {
                    console.log(`screen:error:${JSON.stringify(error)}`)
                });
            }
        })
    }
}

let sDevice;
export const subscribeDevice = (device) => {
    return dispatch => {
        let query = new Parse.Query('Device');
        query.equalTo('installationId', device.get('installationId'))
        sDevice = query.subscribe();
        sDevice.on('open', () => {
            console.log(`subscribeDevice:opened`);
            dispatch({ type: S_DEVICE_OPENED });
        });
        sDevice.on('update', (d) => {
            console.log(`subscribeDevice:device updated:${JSON.stringify(d.get('uuid'))}`);
            if (device.id === d.id) {
                let game = d.get('game');
                //有game 
                if (game) {
                    game.fetch({
                        success: function (game) {
                            console.log(`subscribeDevice:game:title:${JSON.stringify(game.get('title'))}`);
                            dispatch({ type: S_DEVICE_UPDATED, device: d, deviceGame: game });
                        }
                    });
                } else {
                    dispatch({ type: S_DEVICE_UPDATED, device: d, deviceGame: null });
                }
            }
        });
        sDevice.on('close', () => {
            console.log('subscribeDevice:closed');
            dispatch({ type: S_DEVICE_CLOSED });
        });

    }
}

export const unsubscribeDevice = (device) => {
    return dispatch => {
        if (device) {
            device.destroy()
                .then(function (game) {
                    dispatch({ type: DEVICE_DESTROY });
                    console.log('unsubscribeDevice:device.destroy():');
                }, function (error) {
                    console.log('unsubscribeDevice:device.destroy():', error);
                });
        }

        if (sDevice) {
            sDevice.unsubscribe();
        }
    }
}

let sGame;
export const subscribeGame = (game) => {
    return dispatch => {
        let query = new Parse.Query('Game');
        query.equalTo('objectId', game.id);
        sGame = query.subscribe();
        sGame.on('open', () => {
            console.log(`subscribeGame:opened`);
            dispatch({ type: S_GAME_OPENED });
        });
        sGame.on('update', (g) => {
            console.log(`subscribeGame:game updated:${g.get('title')} pauseTime:${g.get('pauseTime')}`);
            dispatch({ type: S_GAME_UPDATED, updateGame: g });
        });
        sGame.on('close', () => {
            console.log('subscribeGame:closed');
            dispatch({ type: S_GAME_CLOSED });
        });

    }
}

export const unsubscribeGame = () => {
    return dispatch => {
        if (sGame) {
            sGame.unsubscribe();
        }
    }
}



