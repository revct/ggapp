export const isRequired = (value:string):boolean => {
  if(typeof value !== 'string') {
    return false;
  }
  if(!value.replace(/\s/g, '').length) {
    return false;
  }
  return true;
}

export const isEmail = (value:string):boolean => {
  if (typeof value == 'string' && value.length < 1) return true;
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(value);
};

export const isMatch = (main:any, value:any):boolean => {
  return main === value;
}

export const isUsername = (value:string):boolean => {
  return /^[a-zA-Z0-9]+(([\-\_]+)?[a-zA-Z0-9]+)?$/.test(value);
}
