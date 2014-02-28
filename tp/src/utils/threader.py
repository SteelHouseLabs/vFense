import Queue
from time import sleep
from random import randint
import logging, logging.config
from threading import Thread

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')

class Worker(Thread):
    """Thread executing tasks from a given tasks queue"""
    def __init__(self, tasks, number_of_threads, log_name='rvlistener'):
        self.logger = logging.getLogger(log_name)
        Thread.__init__(self)
        self.tasks = tasks
        self.process_queue = Queue.Queue(number_of_threads)
        self.daemon = True
        self.run_forever = True
        self.start()

    
    def run(self):
        while self.run_forever:
            while not self.tasks.empty() and \
                    not self.process_queue.full():
                self.process_queue.put(self.tasks.get_nowait())
            while not self.process_queue.empty():
                func, args = self.process_queue.get_nowait()
                try:
                    func(*args)
                except Exception as e:
                    print e
                    self.logger.error(e)
                if not self.tasks.empty():
                    self.process_queue.put(self.tasks.get_nowait())
                self.process_queue.task_done()
            sleep(randint(1, 10))


class OperationQueue():

    def __init__(self, number_of_threads=10, log_name='rvlistener'):
        self.logger = logging.getLogger(log_name)
        self.number_of_threads = number_of_threads
        self.queue = Queue.Queue()
        Worker(self.queue, self.number_of_threads, log_name)
        self.op_in_progress = False

    def put(self, operation):
        """
        Attempts to add an item to the queue.
        @param operation: Item to be added.
        @return: True if item was successfully added, false otherwise.
        """
        result = False

        try:
            self.queue.put(operation)
            self.logger.debug("Adding operation to the queue. %s" % (operation[1]))
            result = True
        except Queue.Full as e:
            self.logger.critical("Queue is busy. Ignoring operation.", "error")
            result = False
        except Exception as e:
            self.logger.critical("Error adding operation to queue.", "error")
            result = False

        return result

    def get(self):
        """
        Attempts to get an operation from the queue if no operation is pending.
        @return: The operation if it was successfully retrieved, None otherwise.
        """
        item = None

        if not self.op_in_progress:

            try:
                item = self.queue.get_nowait()
                self.logger.debug("Retrieving operation from the queue. %s" % (item[1]))
                self.op_in_progress = True
            except Queue.Empty as e:
                self.logger.debug("Operations queue is empty.", "debug")
                item = None
            except Exception as e:
                self.logger.critical("Error accessing operation queue.", "error")
                item = None

        return item

    def size(self):
        self.qsize = self.queue.qsize()
        return self.qsize

    def done(self):
        """
        Indicates that an operation is done.
        @return: Nothing
        """

        try:
            self.queue.task_done()
            self.op_in_progress = False
        except Exception as e:
            self.logger.error("Error marking operation as done.", "error")
