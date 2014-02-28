class ReflectionException(Exception):
    pass

class SignatureException(ReflectionException):
    pass

class MissingArguments(SignatureException):
    pass

class UnknownArguments(SignatureException):
    pass

class InvalidKeywordArgument(ReflectionException):
    pass


