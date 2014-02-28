if {[catch {package present Tcl 8.6.0}]} return
package ifneeded Tk 8.6.0 [list load [file join $dir .. libtk8.6.so] Tk]
