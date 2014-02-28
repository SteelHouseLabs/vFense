define(
    ['jquery', 'underscore', 'backbone', 'crel', 'modals/panel', 'text!templates/modals/admin/uploader.html', 'jquery.ui.datepicker', 'jquery.iframe-transport', 'jquery.fileupload'],
    function ($, _, Backbone, crel, Panel, myTemplate) {
        'use strict';
        var exports = {
            OsCollection: Backbone.Collection.extend({
                baseUrl: 'api/v1/supported/operating_systems',
                url: function () {
                    return this.baseUrl;
                }
            }),
            View: Panel.View.extend({
                buttons: [
                    {
                        text: 'Cancel',
                        action: 'close',
                        position: 'right'
                    },
                    {
                        text: 'Upload',
                        action: 'confirm',
                        className: 'btn-primary',
                        position: 'right'
                    }
                ],
                span: '12',
                init: function () {

                    this.template = myTemplate;
                    this.file = {
                        id: '',
                        name: '',
                        size: ''
                    };
                    this.osCollection = new exports.OsCollection();
                    this.listenTo(this.osCollection, 'sync', this.renderContent);
                    this.osCollection.fetch();

                    return this;
                },
                renderContent: function () {
                    var template = _.template(this.template),
                        operatingSystems = this.osCollection.toJSON()[0],
                        data = {
                            operatingSystems: operatingSystems.data,
                            viewHelpers: {
                                getOptions: function (options) {
                                    var select = crel('select');
                                    if (options.length) {
                                        _.each(options, function (option) {
                                            var properties = {value: option};
                                            select.appendChild(crel('option', properties, option));
                                        });
                                    }
                                    return select.innerHTML;
                                }
                            }
                        };
                    this.setContentHTML(template(data));

                    this.setHeaderHTML(this.renderHeader());

                    this.afterRender();
                },
                renderHeader: function () {
                    return crel('h4', 'Third Party Package Uploader');
                },
                afterRender: function () {
                    var $el = this.$el,
                        $labels = $el.find('label'),
                        $fileInput = $el.find('input[name=pkg]'),
                        $fileButton = $fileInput.siblings('strong'),
                        $releaseDate = $el.find('input[name=release_date]'),
                        $fileTable = $el.find('table[data-id=fileTable]'),
                        that = this;
                    $releaseDate.datepicker();
                    $fileInput.fileupload({
                        url: 'upload/package',
                        add: function (e, data) {
                            $.get('/api/v1/apps/custom/upload/uuid', function (response) {
                                if (response.http_status === 200) {
                                    $fileTable.empty().css('color', 'black').append(
                                        crel('tr',
                                            crel('td', {style: 'width: 25%; word-wrap: break-word;'}, 'Name:'),
                                            crel('td', data.files[0].name)
                                        ),
                                        crel('tr',
                                            crel('td', 'Size:'),
                                            crel('td', Math.floor(data.files[0].size / 1024) + ' Kb')
                                        ),
                                        crel('tr',
                                            crel('td', 'Progress:'),
                                            crel('td', {class: 'row-fluid'},
                                                crel('div', {class: 'span10 progress progress-striped active noMargin'},
                                                    crel('div', {class: 'bar'})
                                                ),
                                                crel('span', {class: 'span2', 'data-name': 'percent'})
                                            )
                                        )
                                    );
                                    $fileButton.html('Change File');
                                    data.headers = {
                                        FileName: data.files[0].name,
                                        FileUuid: response.data.uuid
                                    };
                                    data.submit();
                                }
                            });
                        },
                        done: function (e, data) {
                            var $bar = $fileTable.find('.progress');
                            that.file = data.result.data[0];
                            $bar.removeClass('active').addClass('progress-success');
                            $fileTable.append(
                                crel('tr',
                                    crel('td', 'Hash:'),
                                    crel('td', {style: 'word-wrap: break-word;'}, data.result.data[0].md5)
                                ),
                                crel('tr',
                                    crel('td', 'Path:'),
                                    crel('td', {style: 'word-wrap: break-word;'}, data.result.data[0].file_path)
                                )
                            );
                        },
                        progressall: function (e, data) {
                            var progress = parseInt(data.loaded / data.total * 100, 10),
                                $bar = $fileTable.find('.bar'),
                                $percent = $fileTable.find('span[data-name=percent]');
                            $bar.css('width', progress + '%');
                            $percent.html(progress + '%');
                        }
                    });
                    $labels.show();
                },
                confirm: function () {
                    var url = '/api/v1/apps/custom/upload/data',
                        $form = this.$('form'),
                        $inputs = $form.find('input[type=text], select'),
                        $message = $form.find('span.help-online'),
                        invalid = false,
                        that = this,
                        params = {
                            id: this.file.uuid,
                            name: this.file.name,
                            size: this.file.size,
                            'md5_hash': this.file.md5
                        };
                    $inputs.each(function () {
                        if ((!this.value || this.value === '0') && this.name !== 'cli_options') {
                            $(this).parents('.control-group').addClass('error');
                            invalid = true;
                        } else {
                            $(this).parents('.control-group').removeClass('error');
                            params[this.name] = this.value;
                        }
                    });
                    if (!params.id) {
                        invalid = true;
                        $form.find('.table').css('color', '#b94a48');
                    }
                    if (invalid) {
                        $message.removeClass('alert-success alert-info').addClass('alert-error').html('Please fill the required fields.').show();
                        return false;
                    }
                    $.ajax({
                        url: url,
                        type: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify(params),
                        success: function (response) {
                            if (response.http_status === 200) {
                                that.close();
                            } else {
                                $message.removeClass('alert-success alert-info').addClass('alert-error').html(response.message);
                            }
                        }
                    });
                }
            })
        };
        return exports;
    }
);
