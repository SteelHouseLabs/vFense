import sys
import time

# This is a list of exceptions we always want to raise and never retry, because they hide code errors or other really
# bad scenarios.
# See http://docs.python.org/library/exceptions.html
BUILT_IN_EXCEPTIONS = [ SystemExit, KeyboardInterrupt, GeneratorExit,
                        StopIteration,
                        BufferError, ArithmeticError, AssertionError, AttributeError, ImportError, LookupError,
                        MemoryError, NameError, ReferenceError, RuntimeError, SyntaxError, SystemError,
                        TypeError, ValueError ]

def _any_instance(obj, iterable):
    return any(( isinstance(obj, cls) for cls in iterable ))

class RetryStrategy(object):
    def on_error(self, exc_info, func, args, kwargs):
        """
        Returns True if the exception should be raised, False if not.
        Note that this method may also raise a completely different exception if it wishes, and it can also attach
        the original traceback since it's available in exc_info.
        """
        return True

    def on_success(self, func, args, kwargs):
        pass

class NeverRetryStrategy(RetryStrategy):
    """Basically never retry - always raise the exception."""
    def on_error(self, exc_info, func, args, kwargs):
        return True
NEVER_RETRY_STRATEGY = NeverRetryStrategy()

class AlwaysRetryStrategy(RetryStrategy):
    """A simple and aggressive retry strategy that always retries (be careful when using it!)."""
    def on_error(Self, exc_info, func, args, kwargs):
        return False
ALWAYS_RETRY_STRATEGY = AlwaysRetryStrategy()

class WaitAndRetryStrategy(RetryStrategy):
    """
    A simple retry strategy that allows the code to fail for 'max_retries', and between each try it sleeps for 'wait'
    period (seconds, can be fractions).
    """
    def __init__(self, max_retries, wait):
        super(WaitAndRetryStrategy, self).__init__()
        self.max_retries = max_retries
        self.retries_counter = 0
        self.wait = wait

    def on_error(self, exc_info, func, args, kwargs):
        self.retries_counter += 1
        if self.retries_counter >= self.max_retries:
            return True
        else:
            time.sleep(self.wait)
            return False

    def on_success(self, func, args, kwargs):
        self.retries_counter = 0

class BinaryExponentialDelayRetryStrategy(RetryStrategy):
    """
    Retry strategy that waits an increasing amount of time between each failure (specifically, twice as long as
    the previous amount).
    You can choose the starting delay, the maximum delay to wait (doesn't have to be 2^n * start_delay) and whether
    or not to fail if reached the maximum delay.
    """
    def __init__(self, delay_start, delay_limit, retry_on_delay_limit=True):
        super(BinaryExponentialDelayRetryStrategy, self).__init__()
        self.delay_start = delay_start
        self.delay_limit = delay_limit
        self.retry_on_delay_limit = retry_on_delay_limit
        self.current_delay = self.delay_start

    def on_error(self, exc_info, func, args, kwargs):
        if not self.retry_on_delay_limit and self.current_delay >= self.delay_limit:
            return True

        time.sleep(self.current_delay)
        self.current_delay = min(self.current_delay * 2, self.delay_limit)
        return False

    def on_success(self, func, args, kwargs):
        self.current_delay = self.delay_start

class AnyRetryStrategy(RetryStrategy):
    """
    A retry strategy that tries a list of retry strategies and raises an error if any of the strategies
    decided to raise an error.
    """
    def __init__(self, strategies):
        self.strategies = strategies

    def on_error(self, exc_info, func, args, kwargs):
        return any(( strategy.on_error(exc_info, func, args, kwargs) for strategy in self.strategies ))

    def on_success(self, func, args, kwargs):
        for strategy in self.strategies:
            strategy.on_success(func, args, kwargs)

def retry_func(strategy):
    """
    Decorator to retry function execution based on the given retry strategy decision.
    Important note: this decorators delegates *all* exceptions to the strategy, including SyntaxError and other
    exceptions that may be raised by illegal Python code, therefore you should either handle these cases in the
    strategy or use the retry_func_except_for/retry_func_on functions and set raise_builtins to True.
    """
    if not isinstance(strategy, RetryStrategy):
        raise TypeError("strategy must be an instance of RetryStrategy")

    def wrap(func):
        def retry_func_wrapper(*args, **kwargs):
            while True:
                try:
                    result = func(*args, **kwargs)
                    strategy.on_success(func, args, kwargs)
                    return result
                except:
                    exc_info = sys.exc_info()
                    if strategy.on_error(exc_info, func, args, kwargs):
                        raise
        retry_func_wrapper.__wrapped__ = func
        return retry_func_wrapper
    return wrap

class InSetRetryStrategy(RetryStrategy):
    def __init__(self, exceptions, in_result):
        for e_type in exceptions:
            if not issubclass(e_type, BaseException):
                raise ValueError("{} is not a child of BaseException".format(e_type))

        self.exceptions = exceptions
        self.in_result = in_result

    def on_error(self, exc_info, func, args, kwargs):
        if _any_instance(exc_info[1], self.exceptions):
            return self.in_result
        return not self.in_result

    def on_success(self, func, args, kwargs):
        pass

def retry_func_except_for(except_for, raise_builtins=True):
    """
    Decorator that retries the function if the exception raised is _not_ in the list specified in 'except_for'.
    For convenience, 'except_for' may also be a single exception (e.g. retry_func_except_for(MyException)).
    In most scenarios, there's an implicit list of exceptions you probably also want to fail if raised and these
    are the 'BUILT_IN_EXCEPTIONS' - all the exceptions that may be raised because of an illegal Python code, bug,
    or extereme error conditions (e.g. MemoryError). To enable that we have by default raise_builtins=True.\
    See the list for more details.
    """
    if not isinstance(except_for, (list, tuple)):
        except_for = [ except_for ]
    if raise_builtins:
        except_for = list(except_for) + BUILT_IN_EXCEPTIONS
    return retry_func(InSetRetryStrategy(except_for, True))

def retry_func_on(on):
    """
    Decorator that retries the function only if the exception raised is in the list specified in 'on'.
    For convenience, 'on' may also be a single exception (e.g. retry_func_on(MyException)).
    """
    if not isinstance(on, (list, tuple)):
        on = [ on ]
    return retry_func(InSetRetryStrategy(on, False))

class Retryable(RetryStrategy):
    """
    Retryable defers error handling to an instance variable called retry_strategy. It also filters built-in
    exceptions by raising all the children of the exception list defined in 'default_retry_except_for'.
    """
    retry_strategy = NEVER_RETRY_STRATEGY
    default_retry_except_for = BUILT_IN_EXCEPTIONS

    def on_error(self, exc_info, func, args, kwargs):
        if _any_instance(exc_info[1], self.default_retry_except_for):
            return True
        return self.retry_strategy.on_error(exc_info, func, args, kwargs)

    def on_success(self, func, args, kwargs):
        self.retry_strategy.on_success(func, args, kwargs)

class RetryDelegateToSelf(RetryStrategy):
    """
    Assumes that the function is an instance method, hence the first argument is 'self'.
    Delegates the on_error/on_success calls to the object itself.
    """
    def on_error(self, exc_info, func, args, kwargs):
        return args[0].on_error(exc_info, func, args, kwargs)

    def on_success(self, func, args, kwargs):
        args[0].on_success(func, args, kwargs)
RETRY_DELEGATE_TO_SELF = RetryDelegateToSelf()

def retry_method(method):
    """
    Decorator for instance methods of a class that derives from Retryable. It defers error handling to the instance
    itself, by calling on_error and on_success on self.
    """
    return retry_func(RETRY_DELEGATE_TO_SELF)(method)
