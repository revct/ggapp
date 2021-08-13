import HotelSoapRequest, {
  HotelResponseParser,
  HotelObjNav,
} from './HotelSoapRequest';
import Logger from 'utils/Logger';
import RoomsInfoApi from './RoomsInfo.api';
import {asyncGet} from 'utils/Async';
import {STORE_KEYS} from 'configs/async';
import {Hotel} from './Hotels.api';

type RoomRateValue = {
  occurence: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  changeIndicator: boolean;
  currencyCode: 'USD' | 'NGN';
  decimals: number;
  rate: number;
};

type RoomRate = {
  supressed: boolean;
  code: string;
  rates: Array<RoomRateValue>;
  total: number;
  planCode: string;
};

type RatePlan = {
  ratePlanCode: string;
  hold: boolean;
  mandatoryDeposit: boolean;
  suppressRate: boolean;
  ratePlanName: string;
  commissionCode: string;
  taxInclusive: boolean;
  rankRate: boolean;
  rateTypeIndicator: string;
};

export interface Room extends RoomRate {
  name: string;
  description?: string;
  facilities?: string;
  hotel?: string;
  images?: Array<string>;
  units: number;
  code: 'CLS' | 'CLU' | 'STS' | 'DLX' | 'DLS';
  id: 'CLS' | 'CLU' | 'STS' | 'DLX' | 'DLS';
  planCode: string;
}

const getPlan = (data: any): RatePlan => {
  const plan: RatePlan = HotelObjNav(data, [
    'soap:Envelope',
    'soap:Body',
    0,
    'AvailabilityResponse',
    0,
    'AvailResponseSegments',
    0,
    'a:AvailResponseSegment',
    0,
    'a:RoomStayList',
    0,
    'hc:RoomStay',
    0,
    'hc:RatePlans',
    0,
    'hc:RatePlan',
    0,
    '$',
  ]);
  return plan;
};

const getRates = (data: any): Array<RoomRate> => {
  const list: null | Array<any> = HotelObjNav(data, [
    'soap:Envelope',
    'soap:Body',
    0,
    'AvailabilityResponse',
    0,
    'AvailResponseSegments',
    0,
    'a:AvailResponseSegment',
    0,
    'a:RoomStayList',
    0,
    'hc:RoomStay',
    0,
    'hc:RoomRates',
    0,
    'hc:RoomRate',
  ]);
  return list
    ? list.map(
        (item: any): RoomRate => {
          let rates = HotelObjNav(item, ['hc:Rates']);
          rates = rates.map(
            (rate: any): RoomRateValue => ({
              occurence: HotelObjNav(rate, [
                'hc:Rate',
                0,
                '$',
                'rateOccurrence',
              ]),
              changeIndicator: /true/i.test(
                HotelObjNav(rate, ['hc:Rate', 0, '$', 'rateChangeIndicator']),
              ),
              currencyCode: HotelObjNav(rate, [
                'hc:Rate',
                0,
                'hc:Base',
                0,
                '$',
                'currencyCode',
              ]),
              decimals: Number(
                HotelObjNav(rate, [
                  'hc:Rate',
                  0,
                  'hc:Base',
                  0,
                  '$',
                  'decimals',
                ]),
              ),
              rate: Number(
                HotelObjNav(rate, ['hc:Rate', 0, 'hc:Base', 0, '_', 0]),
              ),
            }),
          );
          return {
            rates: rates,
            total: Number(HotelObjNav(item, ['hc:Total', 0, '_'])),
            code: item.$.roomTypeCode,
            planCode: item.$.ratePlanCode,
            supressed: /true/i.test(item.$.suppressRate),
          };
        },
      )
    : [];
};

const getList = (data: any): Array<Room> | undefined => {
  const rates = getRates(data);
  const plan = getPlan(data);
  const list: null | Array<any> = HotelObjNav(data, [
    'soap:Envelope',
    'soap:Body',
    0,
    'AvailabilityResponse',
    0,
    'AvailResponseSegments',
    0,
    'a:AvailResponseSegment',
    0,
    'a:RoomStayList',
    0,
    'hc:RoomStay',
    0,
    'hc:RoomTypes',
    0,
    'hc:RoomType',
  ]);
  return list
    ? list.map(
        (item: any, index: number): Room => {
          const roomRates = rates[index];
          return {
            ...roomRates,
            planCode: plan ? plan.ratePlanCode : '',
            code: item.$.roomTypeCode,
            id: item.$.roomTypeCode,
            units: Number(item.$.numberOfUnits),
            name: HotelObjNav(item, [
              'hc:RoomTypeDescription',
              0,
              'hc:Text',
              0,
            ]),
          };
        },
      )
    : [];
};

const getStatusFlag = (data: any): string | undefined => {
  const statusFlag = HotelObjNav(data, [
    'soap:Envelope',
    'soap:Body',
    0,
    'AvailabilityResponse',
    0,
    'Result',
    0,
    '$',
    'resultStatusFlag',
  ]);
  return statusFlag;
};

const getErrorCode = (data: any): string | undefined => {
  const result = HotelObjNav(data, [
    'soap:Envelope',
    'soap:Body',
    0,
    'AvailabilityResponse',
    0,
    'Result',
    0,
    'c:OperaErrorCode',
    0,
  ]);
  return result;
};
const getGDSError = (data: any): string | undefined => {
  const result = HotelObjNav(data, [
    'soap:Envelope',
    'soap:Body',
    0,
    'AvailabilityResponse',
    0,
    'Result',
    0,
    'hc:GDSError',
    0,
    '_',
  ]);
  return result;
};

export default async function AvailableRoomsApi(
  hotelId: string,
  checkinDate: string,
  checkoutDate: string,
  rooms: number = 1,
): Promise<{
  success: boolean;
  message?: string;
  data?: any;
}> {
  try {
    // get the persisted hotels.
    const hotels: {hotels: Array<Hotel>} | null = await asyncGet(
      STORE_KEYS.REMOTE_CONFIG.replace('{key}', 'hotels'),
    );
    // fails if hotels have not been fetched.
    if (!hotels) {
      throw new Error(
        'Unavailable at the moment, please relaunch app and try again.',
      );
    }
    // find the hotel based on the ID passed.
    const hotel = hotels.hotels.find(i => i.id === hotelId);
    if (!hotel) {
      throw new Error('Please select hotel and try again.');
    }
    // require available rooms service to be available for the selected hotel
    if (!hotel.services || !hotel.services.available_rooms) {
      throw new Error('Action unavailable for the selected hotel.');
    }

    const reqBody =
      '<AvailabilityRequest ' +
      'xmlns:a="http://webservices.micros.com/og/4.3/Availability/" ' +
      'xmlns:hc="http://webservices.micros.com/og/4.3/HotelCommon/" ' +
      'summaryOnly="true" xmlns="http://webservices.micros.com/ows/5.1/Availability.wsdl">' +
      '<a:AvailRequestSegment ' +
      'availReqType="Room" ' +
      'numberOfRooms="' +
      rooms +
      '" ' +
      'roomOccupancy="2" ' +
      'totalNumberOfGuests="2" ' +
      'numberOfChildren="0">' +
      '<a:StayDateRange>' +
      '<hc:StartDate>' +
      checkinDate +
      '</hc:StartDate>' +
      '<hc:EndDate>' +
      checkoutDate +
      '</hc:EndDate>' +
      '</a:StayDateRange>' +
      '<a:HotelSearchCriteria>' +
      '<a:Criterion>' +
      '<a:HotelRef chainCode="CHA" hotelCode="' +
      hotel.hotelCode +
      '"/>' +
      '</a:Criterion>' +
      '</a:HotelSearchCriteria>' +
      '</a:AvailRequestSegment>' +
      '</AvailabilityRequest>';
    // begin SOAP request
    const response = await HotelSoapRequest(
      hotel.services.available_rooms,
      'http://webservices.micros.com/ows/5.1/Availability.wsdl#Availability',
      reqBody,
    );
    // parse xml response to JS object
    const parsed = await HotelResponseParser(response);
    // fails if the response is not parseable
    if (!parsed) {
      throw new Error('Result is invalid.');
    }
    // get rooms information
    const roomsInfo = await RoomsInfoApi();
    // fail if rooms information is missing.
    if (!Array.isArray(roomsInfo.data)) {
      throw new Error(
        roomsInfo.message ||
          'Room information currently unavailable, please try again in a moment.',
      );
    }
    // get status flas to determine success and failure
    const statusFlag = getStatusFlag(parsed);
    // get list of rooms in the response
    const rawList = getList(parsed);
    // add room description and images
    const list = rawList
      ? rawList.map(item => {
          if (!roomsInfo.data) {
            return item;
          }
          const exists = roomsInfo.data.find(
            i => i.type === item.code && i.hotel === hotelId,
          );
          if (exists) {
            return {
              ...item,
              description: exists.description,
              facilities: exists.facilities,
              images: exists.images,
              hotel: exists.hotel,
            };
          }
          return null;
        })
      : [];
    // get possible error
    const gdsError = getGDSError(parsed);
    // ger error code
    const errorCode = getErrorCode(parsed);
    // check if no room is avaible
    if (/not_available/i.test(errorCode || '')) {
      return Promise.resolve({
        success: true,
        message: 'No available room found.',
        data: [],
      });
    }
    // check if error is system error
    if (gdsError && /sys/i.test(gdsError)) {
      Logger(new Error(gdsError));
      throw new Error('Service unavailable, please try again in a moment.');
    }
    // check if status of request is not successful
    if (!/success/i.test(statusFlag || '')) {
      throw new Error('Failed to get list of available rooms.');
    }
    // resolve with list of available rooms
    return Promise.resolve({
      success: true,
      message: 'Retrieved available rooms.',
      data: list.filter(i => !!i),
    });
  } catch (e) {
    Logger(e);
    let errorMessage = e.message;
    const data = await HotelResponseParser(
      typeof e === 'string' ? e : e.message,
    );
    if (data) {
      errorMessage =
        HotelObjNav(data, [
          'soap:Envelope',
          'soap:Body',
          0,
          'soap:Fault',
          0,
          'soap:Reason',
          0,
          'soap:Text',
          0,
          '_',
        ]) ||
        HotelObjNav(data, [
          'soap:Envelope',
          'soap:Body',
          0,
          'soap:Fault',
          0,
          'faultstring',
          0,
          '_',
        ]);
      if (!errorMessage) {
        errorMessage =
          'An error occured, our team of developers are already looking into this, please try again in a moment.';
      }
    }
    return Promise.resolve({
      success: false,
      message: errorMessage,
    });
  }
}
