import Logger from 'utils/Logger';
var parser = require('react-native-xml2js').parseString;

type Options = {
  envelope: {
    [k: string]: string;
  };
};

function getEvelopeAttr(attr: {[k: string]: string}): string {
  let res = '';
  for (let key in attr) {
    res += ' ' + key + '="' + attr[key] + '"';
  }
  return res;
}

export default function HotelSoapRequest(
  serviceUrl: string,
  soapAction: string,
  soapBody: string,
  options?: Options,
): Promise<string> {
  return new Promise((res, rej) => {
    const {envelope} = options || {};
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open('POST', serviceUrl, true);
    // build SOAP request
    var sr =
      '<?xml version="1.0" encoding="utf-8"?>' +
      '<soap:Envelope ' +
      'xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" ' +
      'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
      'xmlns:xsd="http://www.w3.org/2001/XMLSchema"' +
      (envelope ? getEvelopeAttr(envelope) : '') +
      '>' +
      '<soap:Header>' +
      '<OGHeader transactionID="0000001" timeStamp="2020-02-04T22:04:36.6368100+01:00" xmlns="http://webservices.micros.com/og/4.3/Core/">' +
      '<Origin entityID="OWS" systemType="WEB" />' +
      '<Destination entityID="CHA" systemType="PMS" />' +
      '</OGHeader>' +
      '</soap:Header>' +
      '<soap:Body>' +
      soapBody +
      '</soap:Body>' +
      '</soap:Envelope>';
    xmlhttp.onreadystatechange = () => {
      if (xmlhttp.readyState == 4) {
        if (xmlhttp.status == 200) {
          return res(xmlhttp.responseText);
        }
        return rej(new Error(xmlhttp.responseText));
      }
    };
    // Send the POST request
    xmlhttp.setRequestHeader('Content-Type', 'text/xml');
    xmlhttp.setRequestHeader('SoapAction', soapAction);
    xmlhttp.send(sr.trim());
  });
}

export const HotelResponseParser = (xml: string): Promise<any> => {
  return new Promise(res => {
    try {
      parser(xml, (e: Error | null, result: {} | null) => {
        if (e) {
          Logger(e);
          return res(null);
        }
        res(result);
      });
    } catch (e) {
      if (e) {
        Logger(e);
        return res(null);
      }
    }
  });
};

export const HotelObjNav = (obj: any, map: Array<string | number>) => {
  let res: any = null;
  for (let i = 0; i < map.length; i++) {
    res = res ? res[map[i]] : obj[map[i]];
    if (Array.isArray(res) || (res && res.constructor === Object)) {
      continue;
    }
    break;
  }
  return res;
}
