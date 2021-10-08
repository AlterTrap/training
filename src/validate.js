const moment = require("moment");

const checkLength = (val) => {
    // Check length in Username, Password and Password Comfirm
    if (val.length >= 6) {
        return true;
    } else {
        return false;
    }
}

const oneUpscalePass = (val) => {
    // Check if there is a uppscale letter in password
    if (val.search(/[A-Z]/) < 0) {
        return true;
    } else {
        return false;
    }
}

const checkNull = (val) => {
    return val.length === 0;
}

const futureDay = (val) => {
    var now = new Date();
    var convert = moment(val, 'DD/MM/YYYY').format("YYYY-MM-DD")
    var bdInput = new Date(convert)

    if ( bdInput > now ) {
        return true;
    } else {
        return false;
    }
}

const isNotDate = (val) => {
    return moment(val, "DD/MM/YYYY").isValid()
}

const checkRoleVal = (val) => {
    if(val > 1 || val < 0 ){
        return true;
    } else {
        return false;
    }
}

module.exports = {oneUpscalePass ,checkLength, checkNull, futureDay, isNotDate, checkRoleVal};
