interface ComponentsInterface {
  [k: string]: string | number | null | undefined
}

export default class UrlHelper {
  /**
   * The url being used
   * @var String
   */
  URL: string | null = null;

  /**
  * List of fields added to the object
  */
  FIELDS: ComponentsInterface;

  constructor(url: string | null = null) {
    this.URL = JSON.parse(JSON.stringify(typeof url === 'string' ? url : ''));
    this.FIELDS = this.getComponents();
  }

  /**
   * Here we return all the query strings and
   * their respective values in an object from
   * window.location.search
   * @return object
   */
  getComponents = (): ComponentsInterface => {
    if (!this.URL) {
      return {};
    }
    // get query strings
    let queryString: Array<string> | string = this.URL.split('?');
    queryString = queryString[1] ? queryString[1] : '';

    // create empty components
    var components: { [k: string]: any } = {};

    // remove ? sign from query string
    queryString = queryString.replace('?', '');

    // return null if query string is empty
    if (queryString.length > 0) {
      // split query at & signs and convert to array
      queryString = queryString.split("&");

      // loop through url query
      for (var i = 0; i < queryString.length; i++) {
        let equlFirstPosition = queryString[i].indexOf('=');
        let comp = [
          queryString[i].substr(0, equlFirstPosition),
          queryString[i].substr((equlFirstPosition + 1), queryString[i].length - (equlFirstPosition + 1)),
        ];
        if (comp.length > 0 && comp[0].length > 0) {
          components[comp[0]] = typeof comp[1] != 'undefined'
            ? decodeURIComponent(comp[1]) : null;
        }
      }
    }
    // return found components
    return components;
  };

  /**
   * the get methog returs the value of a specific
   * query parameter
   * @param {string} name
   * @param {any} defaultVal
   * @return object
   */
  get = (name: string, defaultVal = null) => {
    // get value from fields
    let value = this.FIELDS[name];

    // get value from components if not in fields
    if (value === undefined) {
      return defaultVal;
    }

    // return value
    return value;
  }

  /**
   * the set methog adds a new field to the
   * parameters list
   * @param {string} name
   * @param {any} value
   * @return undefined
   */
  set = (name: string, value = null) => {
    // set fields
    this.FIELDS[name] = value;
  }

  /**
   * this returns only the specified query parameters
   * in an object
   * @param {array} names
   * @return object
   */
  only = (names: Array<string>) => {

    // set value
    var value: ComponentsInterface = {};

    // iterate through names
    for (var i = 0; i < names.length; i++) {
      value[names[i]] = typeof this.FIELDS[names[i]] != 'undefined' ? this.FIELDS[names[i]] : null;
    }

    // return value
    return value;
  };

  /**
   * this returns all query params except the
   * specified parameters in an object
   * @param {array} names
   * @return object
   */
  except = (names:Array<string>) => {

    // set value
    var value:ComponentsInterface = {};

    // iterate through names
    for (var i in this.FIELDS) {
      if (names.indexOf(i) !== -1) continue;
      value[i] = this.FIELDS[i];
    }

    // return value
    return value;
  };

  /**
   * this returns all query params in an object
   * @return object
   */
  all = () => {
    if(!this.FIELDS){
      this.FIELDS = this.getComponents();
    }
    // return value
    return this.FIELDS;
  };

  /**
   * this method returns the url used by the object
   * it may exclude url params depending on your configs.
   * @param {Boolean} withParams
   */
  getUrl = (withParams:boolean = true) => {
    if (!this.URL) {
      return null;
    }
    // split url string into an array
    let url = this.URL.split('?');

    // list of query params to add to url at the end of function
    let queryParams = [];

    // check if to add query params
    if (withParams) {
      // add query params
      for (var i in this.FIELDS) {
        queryParams.push(`${i}=${encodeURIComponent(this.FIELDS[i] || '')}`);
      }
    }

    // return url
    return `${url[0]}${queryParams ? '?' + queryParams.join('&') : ''}`
  };
}
