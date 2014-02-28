import sys
import os
import struct
import re
from socket import socket, SOCK_DGRAM, SOCK_STREAM, AF_INET, SHUT_RDWR
from datetime import datetime
import logging
import logging.config
import ConfigParser
from time import sleep

class RvLogger():
    def __init__(self):
        self.CONFIG_DIR = '/opt/TopPatch/conf/'
        self.CONFIG_FILE = self.CONFIG_DIR+'logging.config'
        self.level = {
                 'CRITICAL': 'CRITICAL',
                 'ERROR': 'ERROR',
                 'WARN': 'WARN',
                 'INFO': 'INFO',
                 'DEBUG': 'DEBUG',
                 }
        self.numeric_levels = {
                '50': 'CRITICAL',
                '40': 'ERROR',
                '30': 'WARNING',
                '20': 'INFO',
                '10': 'DEBUG',
                '0': 'NOTSET'
                }
        self.rproto = {
                'UDP': 'handlers.socket.SOCK_DGRAM',
                'TCP': 'handlers.socket.SOCK_STREAM'
                }
        self.rproto_socket = {
                'UDP': SOCK_DGRAM,
                'TCP': SOCK_STREAM
                }
        self.proto_map = {
                '0': 'RAW',
                '1': 'TCP',
                '2': 'UDP'
                }
        self.results = None


    def get_logging_config(self):
        logging.config.fileConfig(self.CONFIG_FILE)
        logfiles = []
        syslog = {}
        level = None
        handler_list = logging._handlerList
        for handler in handler_list:
            handler = handler()
            if 'baseFilename' in dir(handler):
                logfiles.append(handler.baseFilename)
                level = self.numeric_levels[str(handler.level)]
            elif 'address' in dir(handler):
                syslog['loghost'] = handler.address[0]
                syslog['logport'] = handler.address[1]
                syslog['logproto'] = self.proto_map[str(handler.socktype)]
        if len(logfiles) > 0:
            self.results = {
                    'logfiles': logfiles,
                    'syslog': syslog,
                    'loglevel': level
                    }
        else:
            self.results = {
                    'pass': True,
                    'message': 'Logs do not exist'
                    }


    def create_config(self, loglevel='INFO', LOGDIR='/opt/TopPatch/var/log/',
            initialize=True, loghost=None, logport=None, logproto=None):
        try:
            self.loglevel = self.level[loglevel]
        except Exception as e:
            print 'incorrect level %s ' % (loglevel)
            print 'acceptable levels are %s' % (",".join(self.level.values()))
        if logproto and loghost and logport:
            try:
                self.logproto = self.rproto[logproto]
                self.socket_logproto = self.rproto_socket[logproto]
                self.logport = str(logport)
                self.loghost = loghost
            except Exception as e:
                print 'incorrect protocol %s ' % (logproto)
                print 'acceptable levels are %s' % (",".join(self.rproto.values()))
        self.Config = ConfigParser.ConfigParser()
        self.logdir = LOGDIR
        self.loggers = ['root', 'rvlistener', 'rvweb', 'rvapi', 'csrlistener']
        self.handlers = ['root', 'rvlist_file', 'rvweb_file', 'rvapi_file', 'csrlist_file']
        self.formatters = ['default'] 
        self.section_logger_name = 'loggers'
        self.section_handler_name = 'handlers'
        self.section_formatter_name = 'formatters'
        self.LISTENER_PORT = 9004
        self.LISTENER_HOST = 'localhost'
        self.syslog = None
        if loghost:
            self.syslog = 'syslog_'+loghost
            self.loggers.append(self.syslog)
            self.handlers.append(self.syslog)
        self.logger_handler = zip(self.loggers, self.handlers)
        now = datetime.today()
        self.now = '%s_%s_%s_%s_%s_%s' % \
                (now.year, now.month, now.day,
                    now.hour, now.minute, now.second)
        self.BACKUP_CONFIG_FILE = self.CONFIG_DIR + 'logging-%s.config' % (self.now) 
        if initialize:
            self._initialize_logger_config()
            

    def _initialize_logger_config(self):
        self.count = 0
        self._create_logger_list_section()
        self._create_handler_list_section()
        self._create_formatter_list_section()
        self._create_logger_settings()
        self._create_handler_settings()
        self._create_formatter_settings()
        if os.path.exists(self.CONFIG_FILE):
            os.rename(self.CONFIG_FILE, self.BACKUP_CONFIG_FILE)
        logfile = open(self.CONFIG_FILE, 'w')
        self.Config.write(logfile)
        logfile.close()
        self._start_listener()
        config = open(self.CONFIG_FILE, 'r').read()
        passed, message = self._send_config(config)
        self._shutdown_listener()
        self.results = {
                'pass': passed, 
                'message': message
                }

    def _create_logger_list_section(self, additionalloggers=[]):
        if len(additionalloggers) > 0:
            self.loggers = self.loggers + additionalloggers
        self.Config.add_section(self.section_logger_name)
        self.Config.set(self.section_logger_name, 'keys',
                ','.join(self.loggers))


    def _create_handler_list_section(self, additionalhandlers=[]):
        if len(additionalhandlers) > 0:
            self.handlers = self.handlers + additionalhandlers
        self.Config.add_section(self.section_handler_name)
        self.Config.set(self.section_handler_name, 'keys',
                ','.join(self.handlers))


    def _create_formatter_list_section(self, additionalformatters=[]):
        if len(additionalformatters) > 0:
            self.formatters = self.formatters + additionalformatters
        self.Config.add_section(self.section_formatter_name)
        self.Config.set(self.section_formatter_name, 'keys',
                ','.join(self.formatters))


    def _create_logger_settings(self):
        default_name = 'logger_'
        for name in self.logger_handler:
            app_name = default_name + name[0]
            handlers = [name[1]]
            self.Config.add_section(app_name)
            if self.syslog:
                handlers.append(self.syslog)
            self.Config.set(app_name, 'level', self.loglevel)
            self.Config.set(app_name, 'propagate', '0')
            self.Config.set(app_name, 'qualname', name[0])
            self.Config.set(app_name, 'handlers',
                    ','.join(handlers))


    def _create_handler_settings(self):
        default_name = 'handler_'
        for name in self.logger_handler:
            handler_name = default_name + name[1]
            self.Config.add_section(handler_name)
            if re.search(r'root', name[1]):
                self.Config.set(handler_name, 'class',
                        'StreamHandler')
                self.Config.set(handler_name, 'stream',
                        'sys.stdout')
                self.Config.set(handler_name, 'args',
                        '(sys.stdout,)')
            elif re.search(r'syslog', name[1]):
                args = '(("%s", %s,),%s, %s)' %\
                        (self.loghost, self.logport,
                                'handlers.SysLogHandler.LOG_USER',
                                self.logproto
                                )
                self.Config.set(handler_name, 'class',
                        'handlers.SysLogHandler')
                self.Config.set(handler_name, 'args',
                        args)
                self.Config.set(handler_name, 'facility', 'LOG_USER')
            else:
                logfile = '("'+ self.logdir + name[1] + '.log",)'
                self.Config.set(handler_name, 'class',
                        'handlers.TimedRotatingFileHandler')
                self.Config.set(handler_name, 'interval', 'midnight')
                self.Config.set(handler_name, 'backupCount', '5')
                self.Config.set(handler_name, 'args', logfile)
            self.Config.set(handler_name, 'level', self.loglevel)
            self.Config.set(handler_name, 'formatter',
                    ','.join(self.formatters))


    def _create_formatter_settings(self):
        default_name = 'formatter_'
        for name in self.formatters:
            app_name = default_name + name
            msg_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            self.Config.add_section(app_name)
            self.Config.set(app_name, 'format', msg_format)
            self.Config.set(app_name, 'datefmt', '%Y-%m-%d %H:%M:%S')


    def _start_listener(self):
        try:
            print "starting listener"
            self.listener = logging.config.listen(self.LISTENER_PORT)
            self.listener.start()
            print "listener started"
        except Exception as e:
            print e


    def _shutdown_listener(self):
        try:
            print "shutting down listener"
            logging.config.stopListening()
            #self.listener.join()
            print "listener is down"
        except Exception as e:
            print dir(e), e


    def _send_config(self, msg):
        sleep(1)
        sender = socket(AF_INET, SOCK_STREAM)
        passed = True
        message = None
        print "Im about to connect to the listener"
        try:
            print self.LISTENER_HOST, self.LISTENER_PORT
            sender.connect((self.LISTENER_HOST, self.LISTENER_PORT))
            print "I'm connected to the listener"
            passed = True
        except Exception as e:
            print e, "BOOM I CANT CONNECT"
            if self.count == 0:
                self.count = self.count + 1
                self._send_config(msg)
            passed = False
            message = e.message+' '+self.LISTENER_HOST+\
                    ' '+ str(self.LISTENER_PORT)
        if passed:
            print "I'm sending the new config file over"
            try:
                sender.send(struct.pack('>L', len(msg)))
                sender.send(msg)
                print "new config sent"
            except Exception as e:
                print e
            sender.shutdown(SHUT_RDWR)
            sender.close()
            passed = True
            message = 'new config sent'
        return(passed, message)

    def connect_to_loghost(self, loghost, logport, logproto):
        sender = socket(AF_INET, self.rproto_socket[logproto])
        sender.settimeout(1)
        connected = None
        try:
            sender.connect((loghost, int(logport)))
            sender.send("up")
            connected = True
        except Exception as e:
            connected = False
        return(connected)
