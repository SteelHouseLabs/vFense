NGINX_CONFIG_FILE = '/opt/TopPatch/conf/nginx/vFense.conf'
base_nginx_config = """server {
    listen         80;
    server_name    %(server_name)s localhost;
    rewrite        ^ https://$server_name$request_uri? permanent;
}

server {
    listen                      443;
    server_name                 _;
    ssl                         on;
    ssl_certificate             /opt/TopPatch/tp/data/ssl/%(server_crt)s;
    ssl_certificate_key         /opt/TopPatch/tp/data/ssl/%(server_key)s;

    ssl_session_timeout         5m;

    ssl_protocols               SSLv3 TLSv1;
    ssl_ciphers                 ALL:!ADH:!EXPORT56:RC4+RSA:+HIGH:+MEDIUM:+LOW:+SSLv3:+EXP;
    ssl_prefer_server_ciphers   on;
    client_max_body_size	    1G;
    client_body_buffer_size     100m;

    location /nginx_status {
        stub_status on;
        access_log   off;
        allow 192.168.0.0/16;
        allow 127.0.0.1;
        deny all;
    }

    location /upload/package {
        upload_store /opt/TopPatch/var/packages/tmp/;
        upload_store_access user:rw group:rw all:rw;
        upload_set_form_field $upload_field_name.name "$upload_file_name";
        upload_set_form_field $upload_field_name.content_type "$upload_content_type";
        upload_set_form_field $upload_field_name.path "$upload_tmp_path";
        upload_aggregate_form_field "$upload_field_name.md5" "$upload_file_md5";
        upload_aggregate_form_field "$upload_field_name.size" "$upload_file_size";
        upload_pass @after_upload;
        upload_pass_form_field "^id$";
        upload_pass_form_field ".*";
        upload_cleanup 400 404 499 500-505;
    }
      
    location @after_upload {
        proxy_pass              https://rvweb;
    } 

    location ^~ /api/ {
        proxy_pass              https://rvweb;
        proxy_set_header        Host $host;
        proxy_set_header        X-Real-IP $remote_addr;
        proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_intercept_errors  off;
        proxy_redirect          http:// https://; 
    }

    location ~ /ra/websockify/(.*)/([0-9]+) {                                                                                                             
        proxy_pass              http://$1:$2/websockify;                           
        proxy_read_timeout      2592000;                                           
        proxy_http_version      1.1;                                               
        proxy_set_header        Upgrade $http_upgrade;                             
        proxy_set_header        Connection "upgrade";                               
    } 

    location ~ /ra/(.*)/([0-9]+)/(.*$) {
        proxy_pass              http://$1:$2/$3;
        proxy_set_header        Host $host;
        proxy_set_header        X-Real-IP $remote_addr;
        proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_intercept_errors  off;
        proxy_redirect          http:// https://; 
	#echo 			"im in the location";
    }

    location  ^~ /ws/ {
        proxy_pass              https://rvweb;
        proxy_read_timeout      604800; # 7 days
        proxy_http_version      1.1;
        proxy_set_header        Upgrade $http_upgrade;
        proxy_set_header        Connection "upgrade";
        proxy_set_header        X-Real-IP $remote_addr;
        proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
        #proxy_send_timeout      300;
    }

    location ^~ /rvl/ {
        proxy_pass              https://rvlistener;
        proxy_set_header        Host $host;
        proxy_set_header        X-Real-IP $remote_addr;
        proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_intercept_errors  off;
        proxy_redirect          http:// https://;
    }

    location ~* \.(?:ico|css|js|gif|jpe?g|png)$ {
        root                    /opt/TopPatch/tp/wwwstatic;
        expires                 max;
        add_header              Pragma public;
        add_header              Cache-Control "public, must-revalidate, proxy-revalidate";
    }

    location ~ /var/packages {
        root                    /opt/TopPatch/var/packages;
        expires                 max;
        add_header              Pragma public;
        add_header              Cache-Control "public, must-revalidate, proxy-revalidate";
    }

    location  ^~ /# {
        proxy_pass              https://rvweb;
        proxy_set_header        Host $host;
        proxy_set_header        X-Real-IP $remote_addr;
        proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_redirect          http:// https://;
    }

    location  / {
        proxy_pass              https://rvweb;
        proxy_set_header        Host $host;
        proxy_set_header        X-Real-IP $remote_addr;
        proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_redirect          http:// https://;
    }

}"""

def nginx_config_builder(
        server_name='127.0.0.1',
        server_cert='server.crt',
        server_key='server.key',
        rvlistener_starting_port=9020,
        rvlistener_count=10,
        rvweb_starting_port=9060,
        rvweb_count=1):

    if rvlistener_count >= 41:
        rvlistener_count=40

    rvlistener_port = rvlistener_starting_port
    rvlistener_config = 'upstream rvlistener {\n'
    for i in range(rvlistener_count):
        rvlistener_config += '    server 127.0.0.1:%s;\n' % (rvlistener_port)
        rvlistener_port += 1

    rvlistener_config += '}\n\n'

    rvweb_port = rvweb_starting_port
    rvweb_config = 'upstream rvweb {\n'
    for i in range(rvweb_count):
        rvweb_config += '    server 127.0.0.1:%s;\n' % (rvweb_port)
        rvweb_port += 1

    rvweb_config += '}\n\n'
    replace_config = (
        base_nginx_config %
        {
            'server_name': server_name,
            'server_crt': server_cert,
            'server_key': server_key
        }
    )
    new_config = rvlistener_config + rvweb_config + replace_config
    CONFIG_FILE = open(NGINX_CONFIG_FILE, 'w', 0)
    CONFIG_FILE.write(new_config)
    CONFIG_FILE.close()

