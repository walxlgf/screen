
import {
    AUTHENTICATED,
    DEVICE_CREATED,
    SET_QRCODE,
    S_DEVICE_UPDATED,
    S_GAME_UPDATED,
    S_ROLE_CREATED,
    S_ROLE_DELETED
} from '../actions/screen'

const initialState = {
    isAuthenticated: false,
    user: null,
    device: null,
    deviceGame: null,//从device对象中获取的Game
    updateGame: null,//liveQuery update过来的game
    game: null,//倒计时的game
};

export function screen(state = initialState, action) {
    switch (action.type) {
        case AUTHENTICATED: {
            return {
                ...state,
                user: action.user,
                isAuthenticated: true,
            }
        }
        case DEVICE_CREATED: {
            return {
                ...state,
                device: action.device,
                deviceGame: action.deviceGame,
                game: action.deviceGame,
                role: action.role,
            }
        }
        case SET_QRCODE: {
            return {
                ...state,
                qrcodeUrl: action.qrcodeUrl,
            }
        }

        case S_DEVICE_UPDATED: {
            return {
                ...state,
                device: action.device,
                deviceGame: action.deviceGame,
                game: action.deviceGame,
            }
        }

        case S_GAME_UPDATED: {
            let game = state.game;
            if (!state.deviceGame) {
                game = null;
            } else {
                game = action.updateGame;
            }

            return {
                ...state,
                game: game,
            }
        }
        case S_ROLE_CREATED: {
            return {
                ...state,
                role: action.role,
            }
        }
        case S_ROLE_DELETED: {
            return {
                ...state,
                role: null,
            }
        }
        default:
            return state;
    }
}