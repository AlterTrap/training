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
    if(val.length == 0){
        return true;
    }else{
        return false;
    }
}

module.exports = {oneUpscalePass ,checkLength, checkNull};
