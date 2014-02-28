import re
import os
import hashlib
from json import loads
from datetime import datetime
import time
from dateutil.tz import *

from netifaces import ifaddresses, interfaces
import logging
import logging.config

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')

twentyfour_hour = {
    '0': 0, '1': 13, '2': 14, '3': 15, '4': 16,
    '5': 17, '6': 18, '7': 19, '8': 20,
    '9': 21, '10': 22, '11': 23, '12': 0,
}

twentyfour_hour_reversed = {
    '13': 1, '14': 2, '15': 3, '16': 4,
    '17': 5, '18': 6, '19': 7, '20': 8,
    '21': 9, '22': 10, '23': 11
}


days_of_the_week = {
    '0': 'Sunday', '1': 'Monday',
    '2': 'Tuesday', '3': 'Wednesday',
    '4': 'Thursday', '5': 'Friday',
    '6': 'Saturday'
}

week_day = {
    'Monday': '0',
    'Tuesday': '1',
    'Wednesday': '2',
    'Thursday': '3',
    'Friday': '4',
    'Saturday': '5',
    'Sunday': '6'
}


GMT_BY_TIME = {
    '+10:30': 'LHST', '+3:30': 'IRST', '+12:45': 'CHAST',
    '+5:45': 'NPT', '+8:45': 'ACWST', '+9:30': 'ACST',
    '+8:00': 'ACIT', '+6:30': 'MMT', '+8:15': 'APO',
    '+12': 'WFT', '+13:45': 'CHADT', '+5:30': 'IST',
    '+11:30': 'NFT', '+13': 'TOT', '+4:30': 'IRDT',
    '+11': 'VUT', '+10': 'YAPT', '+14': 'LINT',
    '+3': 'SYST', '+2': 'WAST', '+1': 'WEST',
    '+7': 'WIB', '+6': 'YEKST', '+5': 'YEKT',
    '+4': 'SCT', '+9': 'YAKT', '+8': 'WITA'
}


def pick_valid_ip_address():
    local_interfaces = interfaces()
    valid_interfaces = ('eth', 'wlan')
    ip_address_to_use = None
    for iface in local_interfaces:
        if iface == 'lo':
            pass
        elif (re.search(valid_interfaces[0], iface)
                or re.search(valid_interfaces[1], iface)):
            try:
                ip = ifaddresses(iface)[2][0]['addr']
                if not re.search(r'^127', ip):
                    ip_address_to_use = ip
            except Exception as e:
                logger.exception(e)
    return(ip_address_to_use)


def verify_json_is_valid(data):
    verified = True
    json_data = None

    try:
        json_data = loads(data)

    except ValueError as e:
        verified = False

    return(verified, json_data)


def timestamp_verifier(tstamp):
    try:
        if isinstance(tstamp, str):
            if len(tstamp) > 0:
                tstamp = float(tstamp)
                datetime.fromtimestamp(tstamp)
            else:
                tstamp = 0.0
        elif isinstance(tstamp, unicode):
            if len(tstamp) > 0:
                tstamp = float(tstamp)
                datetime.fromtimestamp(tstamp)
            else:
                tstamp = 0.0
        elif isinstance(tstamp, float):
                datetime.fromtimestamp(tstamp)
        elif isinstance(tstamp, int):
                tstamp = float(tstamp)
                datetime.fromtimestamp(tstamp)
    except Exception as e:
        logger.exception(e)
        tstamp = 0.0

    return(tstamp)

def date_parser(unformatted_date, convert_to_timestamp=True):
    formatted_date = None
    if unformatted_date != "":
        if type(unformatted_date) == unicode:
            unformatted_date.encode('utf-8')

        try:
            splitted = re.split(r'-|/', unformatted_date)
            if len(splitted[0]) == 4:
                year = int(splitted[0])
                month = int(splitted[1])
                day = int(splitted[2])
                if convert_to_timestamp:
                    formatted_date = (
                        time.mktime(
                            datetime(year, month, day)
                            .timetuple()
                        )
                    )
                else:
                    formatted_date = datetime(year, month, day)

            elif len(splitted[2]) == 4:
                year = int(splitted[2])
                month = int(splitted[0])
                day = int(splitted[1])
                if convert_to_timestamp:
                    formatted_date = (
                        time.mktime(
                            datetime(year, month, day)
                            .timetuple()
                        )
                    )
                else:
                    formatted_date = datetime(year, month, day)

            else:
                logger.error('Unrecognized Date Format: %s' % (unformatted_date))
                if convert_to_timestamp:
                    formatted_date = timestamp_verifier(0.0)
                else:
                    formatted_date = datetime(1970, 1, 1)

        except Exception as e:
            pass 

    else:
        if convert_to_timestamp:
            formatted_date = timestamp_verifier(0.0)
        else:
            formatted_date = datetime(1970, 1, 1)

    return formatted_date


def date_time_parser(schedule):
    if type(schedule) == unicode:
        schedule.encode('utf-8')

    try:
        am_pm = re.search(r'(AM|PM)', schedule, re.IGNORECASE).group()
        schedule = (
            re.sub(
                r'\s+(?i)AM|\s+(?i)PM', '',
                schedule, re.IGNORECASE
            )
        )

        am_pm = am_pm.upper()

    except Exception as e:
        am_pm = "AM"
        if len(schedule.split(" ")) == 1:
            if int(schedule.split(":")[0]) > 12:
                new_hour = (
                    twentyfour_hour_reversed[
                        str(
                            int(
                                schedule.split(":")[0]
                            )
                        )
                    ]
                )

                schedule = (
                    re.sub(
                        r'([0-9]+)(:[0-9]+)',
                        str(new_hour)+'\g<2>', schedule
                    )
                )

                am_pm = "PM"

        elif len(schedule.split(" ")) == 2:
            if int(schedule.split(" ")[1].split(":")[0]) > 12:
                new_hour = (
                    twentyfour_hour_reversed[
                        str(
                            int(
                                schedule.split(" ")[1]
                                .split(":")[0]
                            )
                        )
                    ]
                )

                schedule = (
                    re.sub(
                        r'([0-9]+)(:[0-9]+)',
                        str(new_hour)+'\g<2>', schedule
                    )
                )

                am_pm = "PM"

        am_pm = am_pm.upper()

    pformatted = (
        map(lambda x: int(x),
            re.split(r'\/|:|\s+', schedule)
            )
    )

    if len(pformatted) == 5 and am_pm:
        month, day, year, hour, minute = pformatted

        if am_pm == 'PM' and str(hour) in twentyfour_hour or \
                am_pm == 'AM' and str(hour) == '0':

            hour = twentyfour_hour[str(hour)]

        formatted_date = (
            datetime(
                year, month, day, int(hour), int(minute)
            )
        )

    elif len(pformatted) == 3:
        month, day, year = pformatted
        formatted_date = datetime(year, month, day)

    elif len(pformatted) == 2 and am_pm:
        hour, minute = pformatted

        if am_pm == 'PM' and str(hour) in twentyfour_hour or \
                am_pm == 'AM' and str(hour) == '0':
            hour = twentyfour_hour[str(hour)]

        formatted_date = time(hour, minute)

    return formatted_date


def return_bool(fake_bool):
    fake_bool = fake_bool.lower()
    real_bool = None

    if fake_bool == "true":
        real_bool = True

    elif fake_bool == "false":
        real_bool = False

    return real_bool


def get_expire_from_cert(cert):
    asn1_time = (
        re.search(
            r'([0-9]{4})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})',
            cert
        )
        .group(1, 2, 3, 4, 5, 6)
    )

    t = map(lambda x: int(x), asn1_time)
    return datetime(t[0], t[1], t[2], t[3], t[4], t[5])


def return_datetime(timestamp):
    stamp_length = len(timestamp)
    timestamp = int(timestamp)
    valid_timestamp = False

    if stamp_length == 13:
        timestamp = timestamp / 1000
        valid_timestamp = True

    elif stamp_length == 10:
        valid_timestamp = True

    if valid_timestamp:
        parsed_time = (
            datetime
            .fromtimestamp(
                timestamp
            )
            .strftime(
                '%m/%d/%Y %H:%M'
            )
        )
        return (parsed_time)

    else:
        return ("Invalid TimeStamp")


def return_days(days):
    if len(days) == 7:
        days_enabled = []
        days_not_enabled = []

        for day in range(len(days)):
            if days[day] == '1':
                days_enabled.append(days_of_the_week[str(day)])

            else:
                days_not_enabled.append(days_of_the_week[str(day)])

        return(days_enabled, days_not_enabled)


def return_utc(non_utc_time):
    utc_time = (
        non_utc_time
        .replace(
            tzinfo=tzlocal()
        )
        .astimezone(
            tzoffset(
                'GMT', 0
            )
        )
    )
    return utc_time


def return_modified_list(list_to_modify):
    for i in list_to_modify:
        i['date_modified'] = i['date_modified'].strftime('%m/%d/%Y %H:%M')
        i['date_created'] = i['date_created'].strftime('%m/%d/%Y %H:%M')

    return(list_to_modify)


def hash_verifier(orig_hash=None, file_path=None):
    completed = False
    msg = (
        'Failed to verify hash %s against file %s'
        % (orig_hash, file_path)
    )

    hashlibs = [hashlib.sha1, hashlib.sha256, hashlib.md5]

    if orig_hash and file_path:
        file_exists = os.path.exists(file_path)

        if file_exists:
            file_in_mem = open(file_path, 'rb').read()

            for hlib in hashlibs:
                lhash = hlib()
                lhash.update(file_in_mem)
                local_hash = lhash.hexdigest()

                if local_hash == orig_hash:
                    completed = True
                    msg = (
                        'Remote Hash %s verified against %s using hash type %s'
                        % (orig_hash, file_path.split('/')[-1], lhash.name)
                    )
                    break

        else:
            msg = 'File %s does not exists' % (file_path)

    return(
        {
            'pass': completed,
            'message': msg,
            'data': []
        }
    )
