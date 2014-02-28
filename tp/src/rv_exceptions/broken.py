#!/usr/bin/env python


class InvalidOperationType(Exception):
    def __init__(self, oper_type):
        self.oper_type = oper_type
        self.message = 'Invalid Operation Type %s' % (oper_type)

    def __str__(self):
        return(repr(self.rule))


class InvalidPluginName(Exception):
    def __init__(self, plugin):
        self.plugin = plugin
        self.message = 'Invalid Plugin Name %s' % (plugin)

    def __str__(self):
        return(repr(self.rule))


class NotificationRuleExists(Exception):
    def __init__(self, rule):
        self.rule = rule
        self.message = 'Notification Rule Exists %s' % (rule)

    def __str__(self):
        return(repr(self.rule))
