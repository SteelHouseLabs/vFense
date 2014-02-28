from datetime import date

from comparer.base import Comparer

c = Comparer()

apps = c.run(Comparer.NODE, date.today())