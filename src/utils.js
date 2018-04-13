
module.exports = {
    formatDate(dateTime) {
        let date = new Date(dateTime);
        let Y = date.getFullYear() + '-';
        let M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
        let D = (date.getDay() < 10 ? '0' + date.getDay() : date.getDay()) + ' ';
        // let D = (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + ' ';
        let h = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':';
        let m = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':';
        let s = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
        return Y + M + D + h + m + s;
    },


    formatShortDate(dateTime) {
        let date = new Date(dateTime);
        let M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
        let D = (date.getDay() < 10 ? '0' + date.getDay() : date.getDay()) + ' ';
        // let D = (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + ' ';
        let h = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':';
        let m = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
        return M + D + h + m;
    },

    formatCountdownFull(countdown) {
        let cd = countdown / 1000;

        let h = parseInt(cd / 3600);
        let m = parseInt(Math.round(cd % 3600) / 60);
        let s = parseInt(Math.round(cd % 3600) % 60);

        let sh = h == 0 ? '00' : h < 10 ? '0' + h : h;
        let sm = m == 0 ? '00' : m < 10 ? '0' + m : m;
        let ss = s == 0 ? '00' : s < 10 ? '0' + s : s;
        return sh + ":" + sm + ":" + ss;
    },

    formatCountdownMin(countdown) {
        let cd = countdown / 1000;
        let m = parseInt(cd / 60);
        let s = parseInt(Math.round(cd % 60));

        if (m < 100) {
            let sm = m == 0 ? '00' : m < 10 ? '0' + m : m;
            let ss = s == 0 ? '00' : s < 10 ? '0' + s : s;
            return sm + ":" + ss;
        } else {
            let sm = m;
            let ss = Math.round(s / 10);
            return sm + ":" + ss;
        }
    },

    formatCountdown(countdown) {
        let cd = countdown / 1000;
        let h = parseInt(cd / 3600);
        let m = parseInt(Math.round(cd % 3600) / 60);
        let s = parseInt(Math.round(cd % 3600) % 60);

        if (h > 0) {
            let sm = m == 0 ? '00' : m < 10 ? '0' + m : m;
            let ss = Math.round(s / 10);
            return h + ":" + sm + ":" + ss;
        } else {
            let sm = m == 0 ? '00' : m < 10 ? '0' + m : m;
            let ss = s == 0 ? '00' : s < 10 ? '0' + s : s;
            return sm + ":" + ss;
        }
    }

}