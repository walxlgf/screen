import Parse from 'parse';
import QRCode from 'qrcode';
import { appId, serverURL, liveQueryServerURL, masterKey } from '../config'


export const AUTHENTICATED = "AUTHENTICATED";//已经完成验证

export const DEVICE_CREATED = "DEVICE_CREATED";//已经创建完device


export const SET_QRCODE = "SET_QRCODE";//已经创建完device


export const DEVICE_DESTROY = "DEVICE_DESTROY";//监听到删除

//LiveQuery

export const S_DEVICE_OPENED = "S_DEVICE_OPENED";//监听已成功打开
export const S_DEVICE_CLOSED = "S_DEVICE_CLOSED";//设置监听 取消监听

export const S_DEVICE_UPDATED = "S_DEVICE_UPDATED";//监听到更新

export const S_GAME_OPENED = "S_GAME_OPENED";//监听已成功打开
export const S_GAME_CLOSED = "S_GAME_CLOSED";//设置监听 取消监听

export const S_GAME_UPDATED = "S_GAME_UPDATED";//监听到更新
export const S_GAME_DELETED = "S_GAME_DELETED";//监听到删除




export const S_ROLE_OPENED = "S_ROLE_OPENED";//监听已成功打开
export const S_ROLE_CLOSED = "S_ROLE_CLOSED";//设置监听 取消监听

export const S_ROLE_CREATED = "S_ROLE_CREATED";//监听到新增
export const S_ROLE_DELETED = "S_ROLE_DELETED";//监听到删除






/**
 * 1、用screenuser登录
 * 2、根据user的sessionToken获取session
 * 3、根据installationId获取device 然后
 * 
 * 4、根据device获取deviceRole
 * 5、根据deviceRole获取绑定屏幕的role
 * 6、根据device获取game
 */
export const init = () => {
    return dispatch => {
        let installationId;
        let device;
        let role;
        //1、用screenuser登录
        Parse.User.logIn('screenuser', '1').then(function (user) {
            let sessionToken = user.getSessionToken();
            console.log(`screen:init:user:sessionToken:${JSON.stringify(sessionToken)}`);
            //2、根据user的sessionToken获取session
            let query = new Parse.Query(Parse.Session);
            query.equalTo('sessionToken', sessionToken);
            return query.first();
        }).then(function (session) {
            //3、根据installationId获取device
            if (session) {
                installationId = session.get('installationId');
                console.log(`screen:init:installationId:${JSON.stringify(installationId)}`);
                let query = new Parse.Query('Device');
                query.equalTo('installationId', installationId);
                return query.first();
            }
        }).then(function (d) {
            console.log(`screen:init:device:${d && d.get('uuid')}`);
            if (d) {
                device = d;
                QRCode.toDataURL(device.get('uuid')).then(url => {
                    dispatch({ type: SET_QRCODE, qrcodeUrl: url });
                }).catch(err => {
                    console.log(`screen:screen:QRCode:err:${err}`);
                })
            }
            //4、根据device获取deviceRole
            let DeviceRole = Parse.Object.extend("DeviceRole");
            let query = new Parse.Query(DeviceRole);
            query.equalTo('device', device);
            query.include('role');
            return query.first();
        }).then(function (deviceRole) {
            //5、根据deviceRole获取绑定屏幕的role
            if (deviceRole)
                role = deviceRole.get('role');

            console.log(`screen:init:role:${role && role.get('name')}`);
            //6、根据device获取game
            //如果有值  说明此设备已经有了 获取
            //如果没值  创建
            if (device) {
                let game = device.get('game');
                console.log(`screen:init:game:${game && game.id}`);
                //有game 
                if (game) {
                    game.fetch().then(function (game) {
                        dispatch({ type: DEVICE_CREATED, device, deviceGame: game, role });
                    });
                } else {
                    dispatch({ type: DEVICE_CREATED, device, deviceGame: null, role: role });
                }
            } else {
                let Device = Parse.Object.extend('Device');
                let device = new Device();
                device.set('installationId', installationId);
                //获取新建的device
                device.save().then(function (device) {
                    console.log(`screen:init:created:device:${device && device.get('uuid')}`)
                    if (device) {
                        dispatch({ type: DEVICE_CREATED, device, role: role });
                    }
                });
            }
        }).catch(function (error) {
            console.log(`screen:init:error:${JSON.stringify(error)}`)
        });
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
                    game.fetch().then(function (game) {
                        console.log(`subscribeDevice:game:title:${JSON.stringify(game.get('title'))}`);
                        dispatch({ type: S_DEVICE_UPDATED, device: d, deviceGame: game });
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

export const unsubscribeDevice = () => {
    return dispatch => {
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
            dispatch({ type: S_GAME_UPDATED, updateGame: g })
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


let sDeviceRole;
export const subscribeRole = (device) => {
    return dispatch => {
        let query = new Parse.Query('DeviceRole');
        query.equalTo('device', device);
        sDeviceRole = query.subscribe();
        sDeviceRole.on('open', () => {
            console.log(`subscribeRole:opened`);
            dispatch({ type: S_ROLE_OPENED });
        });
        sDeviceRole.on('create', (deviceRole) => {
            let device = deviceRole.get('device');
            let role = deviceRole.get('role');
            console.log(`subscribeRole:create:deviceRole:${device && device.get('uuid')}`);
            dispatch({ type: S_ROLE_CREATED, role });
        });
        sDeviceRole.on('delete', (deviceRole) => {
            let device = deviceRole.get('device');
            let role = deviceRole.get('role');
            console.log(`subscribeRole:delete:deviceRole:${device && device.get('uuid')}`);
            dispatch({ type: S_ROLE_DELETED, role });
        });
        sDeviceRole.on('close', () => {
            console.log('subscribeRole:closed');
            dispatch({ type: S_ROLE_CLOSED });
        });

    }
}

export const unsubscribeRole = () => {
    return dispatch => {
        if (sDeviceRole) {
            sDeviceRole.unsubscribe();
        }
    }
}



