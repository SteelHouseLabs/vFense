vFense 0.7.0 Bumble Bee
==

HowTo Install vFense Server Application

Download the latest Release

1. tar -xzvf 0.7.0.tar.gz
2. mv vFense-0.70.0 /opt/TopPatch
3. cd /opt/TopPatch
4. source bin/activate_toppatch
5. python tp/src/scripts initialize_vFense.py --password=password_goes_here
6. wait a while ( Pulling down the latest CVE/NVD, and Ubuntu USN data )
7. sudo service nginx start
8. sudo service vFense start
