import HotelSoapRequest, {
  HotelResponseParser,
  HotelObjNav,
} from './HotelSoapRequest';
import Logger from 'utils/Logger';
import {asyncGet} from 'utils/Async';
import {STORE_KEYS} from 'configs/async';
import {Hotel} from './Hotels.api';

export interface Reservation {}

export interface ReservationRoom {
  code: 'CLS' | 'CLU' | 'STS' | 'DLX' | 'DLS';
  planCode: string;
  units: number;
  arrival: string;
  departure: string;
}

export interface ReservationGuest {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

const getReservationID = (data: any): number | null => {
  const statusFlag = HotelObjNav(data, [
    'soap:Envelope',
    'soap:Body',
    0,
    'CreateBookingResponse',
    0,
    'HotelReservation',
    0,
    'r:UniqueIDList',
    0,
    'c:UniqueID',
    0,
    '_',
  ]);
  return statusFlag ? Number(statusFlag) : null;
};

const getStatusFlag = (data: any): string | undefined => {
  const statusFlag = HotelObjNav(data, [
    'soap:Envelope',
    'soap:Body',
    0,
    'CreateBookingResponse',
    0,
    'Result',
    0,
    '$',
    'resultStatusFlag',
  ]);
  return statusFlag;
};

const getGDSError = (data: any): string | undefined => {
  const result = HotelObjNav(data, [
    'soap:Envelope',
    'soap:Body',
    0,
    'CreateBookingResponse',
    0,
    'Result',
    0,
    'hc:GDSError',
    0,
    '_',
  ]);
  return result;
};

export default async function NewReservationApi(
  hotelId: string,
  guest: ReservationGuest,
  rooms: Array<ReservationRoom>,
): Promise<{
  success: boolean;
  message?: string;
  data?: number;
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
    if (!hotel.services || !hotel.services.create_reservation) {
      throw new Error('Action unavailable for the selected hotel.');
    }
    const reqBody =
      '<CreateBookingRequest xmlns="http://webservices.micros.com/ows/5.1/Reservation.wsdl">' +
      '<HotelReservation>' +
      '<r:RoomStays>' +
      rooms
        .map(
          (item): string =>
            '<hc:RoomStay>' +
            '<hc:RatePlans>' +
            '<hc:RatePlan ratePlanCode="' +
            item.planCode +
            '"/>' +
            '</hc:RatePlans>' +
            '<hc:RoomTypes>' +
            '<hc:RoomType roomTypeCode="' +
            item.code +
            '" numberOfUnits="' +
            item.units +
            '"/>' +
            '</hc:RoomTypes>' +
            '<hc:RoomRates>' +
            '<hc:RoomRate roomTypeCode="' +
            item.code +
            '" ratePlanCode="' +
            item.planCode +
            '"/>' +
            '</hc:RoomRates>' +
            '<hc:GuestCounts>' +
            '<hc:GuestCount ageQualifyingCode="ADULT" count="1" />' +
            '<hc:GuestCount ageQualifyingCode="CHILD" count="0" />' +
            '</hc:GuestCounts>' +
            '<hc:TimeSpan>' +
            '<hc:StartDate>' +
            item.arrival +
            '</hc:StartDate>' +
            '<hc:EndDate>' +
            item.departure +
            '</hc:EndDate>' +
            '</hc:TimeSpan>' +
            '<hc:Guarantee guaranteeType="NON" />' +
            '<hc:HotelReference chainCode="CHA" hotelCode="' +
            hotel.hotelCode +
            '" />' +
            '<hc:ResGuestRPHs>' +
            '<ResGuestRPH RPH="0" />' +
            '</hc:ResGuestRPHs>' +
            '<hc:Comments>' +
            '<hc:Comment guestViewable="false" commentOriginatorCode="CRO">' +
            '<hc:Text>Comment 1</hc:Text>' +
            '</hc:Comment>' +
            '<hc:Comment guestViewable="true">' +
            '<hc:Text>Comment 2</hc:Text>' +
            '</hc:Comment>' +
            '</hc:Comments>' +
            '</hc:RoomStay>',
        )
        .join('') +
      '</r:RoomStays>' +
      '<r:ResGuests>' +
      '<r:ResGuest>' +
      '<r:Profiles>' +
      '<n:Profile>' +
      '<n:Customer gender="MALE">' +
      '<n:PersonName>' +
      '<c:nameTitle></c:nameTitle>' +
      '<c:firstName>' +
      guest.firstName +
      '</c:firstName>' +
      '<c:lastName>' +
      guest.lastName +
      '</c:lastName>' +
      '</n:PersonName>' +
      '</n:Customer>' +
      '<n:Addresses>' +
      '<n:NameAddress>' +
      '<c:AddressLine>' +
      guest.address +
      '</c:AddressLine>' +
      '<c:cityName>' +
      guest.city +
      '</c:cityName>' +
      '<c:stateProv>' +
      guest.state +
      '</c:stateProv>' +
      '<c:countryCode>' +
      guest.country +
      '</c:countryCode>' +
      '<c:postalCode>' +
      guest.postalCode +
      '</c:postalCode>' +
      '</n:NameAddress>' +
      '</n:Addresses>' +
      '</n:Profile>' +
      '</r:Profiles>' +
      '</r:ResGuest>' +
      '</r:ResGuests>' +
      '</HotelReservation>' +
      '</CreateBookingRequest>';
    // begin SOAP request
    const response = await HotelSoapRequest(
      hotel.services.create_reservation,
      'http://webservices.micros.com/ows/5.1/Reservation.wsdl#CreateBooking',
      reqBody,
      {
        envelope: {
          'xmlns:r': 'http://webservices.micros.com/og/4.3/Reservation/',
          'xmlns:hc': 'http://webservices.micros.com/og/4.3/HotelCommon/',
          'xmlns:n': 'http://webservices.micros.com/og/4.3/Name/',
          'xmlns:c': 'http://webservices.micros.com/og/4.3/Common/'
        },
      },
    );
    // parse xml response to JS object
    let parsed = null;
    if (response) {
      parsed = await HotelResponseParser(response);
    }
    // fails if the response is not parseable
    if (!parsed) {
      throw new Error('Result is invalid.');
    }
    // get status flas to determine success and failure
    const statusFlag = getStatusFlag(parsed);
    // get possible error
    const gdsError = getGDSError(parsed);
    // check if error is system error
    if (gdsError && /sys/i.test(gdsError)) {
      throw new Error('Service unavailable, please try again in a moment.');
    }
    // check if status of request is not successful
    if (!/success/i.test(statusFlag || '')) {
      throw new Error('Failed to get list of available rooms.');
    }
    // get reservation OD from response
    const reservationId = getReservationID(parsed);
    if (typeof reservationId !== 'number') {
      throw new Error('Failed to create your reservation.');
    }
    // resolve with list of available rooms
    return Promise.resolve({
      success: true,
      message: 'Created new reservation.',
      data: reservationId,
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
