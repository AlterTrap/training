const moment = require("moment");
const adminRole = require("../src/constant").adminRole;
const memberRole = require("../src/constant").memberRole;

const checkLength = (val) => {
    // Check length in Username, Password and Password Comfirm
    if (val.length >= 6) {
        return true;
    } else {
        return false;
    }
};

const oneUpscalePass = (val) => {
    // Check if there is a uppscale letter in password
    if (val.search(/[A-Z]/) < 0) {
        return true;
    } else {
        return false;
    }
};

const checkBlank = (val) => {
    return val.replace(/\s/g, '').length;
};

const checkNull = (val) => {
    return val.length === 0;
};

const futureDay = (val) => {
    var now = new Date();
    var convert = moment(val, "DD/MM/YYYY").format("YYYY-MM-DD");
    var bdInput = new Date(convert);

    if (bdInput > now) {
        return true;
    } else {
        return false;
    }
};

const isNotDate = (val) => {
    return moment(val, "DD/MM/YYYY").isValid();
};

const required = (val) => {
    if (val != null) {
        return true;
    } else {
        return false;
    }
};

const checkRoleVal = (val) => {
    if (val > adminRole || val < memberRole) {
        return true;
    } else {
        return false;
    }
};

module.exports = {
    oneUpscalePass,
    checkLength,
    checkNull,
    futureDay,
    isNotDate,
    checkRoleVal,
    required,
    checkBlank,
};
