
module.exports = {
    formatDate(dateTime) {
        var date = new Date(dateTime);
        var Y = date.getFullYear() + '-';
        var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
        var D = (date.getDay() < 10 ? '0' + date.getDay() : date.getDay()) + ' ';
        var D = (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + ' ';
        var h = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':';
        var m = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':';
        var s = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
        return Y + M + D + h + m + s;
    },

    
    formatShortDate(dateTime) {
        var date = new Date(dateTime);
        var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
        var D = (date.getDay() < 10 ? '0' + date.getDay() : date.getDay()) + ' ';
        var D = (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + ' ';
        var h = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':';
        var m = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
        return M + D + h + m;
    },

    formatCountdown(countdown) {
        var cd = countdown / 1000;

        var h = parseInt(cd / 3600);
        var m = parseInt(Math.round(cd % 3600) / 60);
        var s = parseInt(Math.round(cd % 3600) % 60);

        var sh = h == 0 ? '00' : h < 10 ? '0' + h : h;
        var sm = m == 0 ? '00' : m < 10 ? '0' + m : m;
        var ss = s == 0 ? '00' : s < 10 ? '0' + s : s;
        return sh + ":" + sm + ":" + ss;
    }

    
}