define(
    ['jquery', 'underscore', 'backbone', 'app', 'crel', 'modules/lists/pageable', 'modals/panel'],
    function ($, _, Backbone, app, crel, Pager, Panel) {
        'use strict';
        var $ok =  $(crel('i', {class: 'icon-ok', style: 'color: green'})),
            $warning = $(crel('i', {class: 'icon-warning-sign', style: 'color: orange'})),
            $error = $(crel('i', {class: 'icon-warning-sign', style: 'color: red'})),
            helpers = {}, Modal;
        _.extend(helpers, {
            sortStats: function (stats) {
                return _.sortBy(stats, function (stat) {
                    return stat.status;
                });
            }
        });
        Modal = Panel.View.extend({
            events: function () {
                return _.extend({}, _.result(Panel.View.prototype, 'events'), {
                    'submit form': 'submitTag'
                });
            },
            submitTag: function (event) {
                event.preventDefault();
                this.confirm();
            }
        });
        return {
            Collection: Pager.Collection.extend({
                baseUrl: 'api/v1/tags'
            }),
            View: Pager.View.extend({
                initialize: function (options) {
                    var that = this;
                    this.modal = new Modal({
                        buttons: [
                            {
                                text: 'Cancel',
                                action: 'close',
                                position: 'right'
                            },
                            {
                                text: 'Create Tag',
                                action: 'confirm',
                                className: 'btn-primary',
                                position: 'right'
                            }
                        ],
                        confirm: function () {
                            var modal = this,
                                $tagname = this.$el.find('#tagName'),
                                $message = $tagname.siblings(),
                                url = '/api/v1/tags',
                                params = {
                                    name: $tagname.val()
                                };
                            $message.removeClass('alert-error alert-success').addClass('alert-info').html('Submitting...');
                            if (params.name) {
                                $.ajax({
                                    url: url,
                                    type: 'POST',
                                    data: JSON.stringify(params),
                                    contentType: 'application/json',
                                    success: function (response) {
                                        if (response.http_status === 200) {
                                            that.collection.fetch();
                                            $message.removeClass('alert-info alert-success alert-error').addClass('alert-error').html('');
                                            $tagname.val('');
                                            modal.cancel();
                                        } else {
                                            $message.removeClass('alert-info alert-success').addClass('alert-error').html(json.message);
                                        }
                                    }
                                });
                            } else {
                                $message.removeClass('alert-info alert-success').addClass('alert-error').html('Field cannot be empty.');
                            }
                        }
                    });
                    this.modal.setHeaderHTML(this.createTagHeader());
                    this.modal.setContentHTML(this.createTagLayout());
                    Pager.View.prototype.initialize.call(this, options);
                },
                events: function () {
                    return _.extend({}, _.result(Pager.View.prototype, 'events'), {
                        'change select[name=sort]'              : 'sortBy',
                        'change select[name=order]'             : 'orderBy',
                        'change select[name=filter]'            : 'filterByStatus',
                        'keyup input[name=search]'              : 'debouncedSearch',
                        'click button[data-id=toggleCreateTag]' : 'toggleCreateTagPanel',
                        'click button[data-id=deleteTag]'       : 'deleteTag'
                    });
                },
                debouncedSearch: _.debounce(function (event) {
                    var query = $(event.currentTarget).val().trim();
                    this.searchBy(query);
                }, 300),
                searchBy: function (query) {
                    this.collection.params.query = query;
                    this.collection.params.offset = 0;
                    this.collection.fetch();
                },
                sortBy: function (event) {
                    this.collection.params.sort_by = $(event.currentTarget).val();
                    this.collection.params.offset = 0;
                    this.collection.fetch();
                },
                orderBy: function (event) {
                    this.collection.params.sort = $(event.currentTarget).val();
                    this.collection.params.offset = 0;
                    this.collection.fetch();
                },
                filterByStatus: function (event) {
                    this.collection.params.status = $(event.currentTarget).val();
                    this.collection.params.offset = 0;
                    this.collection.fetch();
                },
                toggleCreateTagPanel: function () {
                    this.modal.open();
                    this.modal.$('input').focus();
                },
                createTagHeader: function () {
                    return crel('h4', 'Create New Tag');
                },
                createTagLayout: function () {
                    return crel('form', {class: 'form-horizontal'},
                            crel('div', {class: 'control-group'},
                                crel('label', {class: 'control-label', 'for': 'tagName'}, 'Tag Name:'),
                                crel('div', {class: 'controls'},
                                    crel('input', {'id': 'tagName', type: 'text', required: 'required', class: 'input-medium'}), ' ',
                                    crel('span', {class: 'help-online', 'data-name': 'message'})
                                )
                            )
                    );
                },
                deleteTag: function (event) {
                    event.preventDefault();
                    var params,
                        $button = $(event.currentTarget),
                        tag = $button.data('tag'),
                        that = this;
                    params = {
                        id: tag
                    };
                    $.ajax({
                        url:'/api/v1/tags',
                        type: 'DELETE',
                        data: JSON.stringify(params),
                        contentType: 'application/json',
                        success: function (response) {
                            if (response.http_status === 200) {
                                that.collection.fetch();
                            } else {
                                app.notifyOSD.createNotification('!', 'Error', response.message);
                            }
                        }
                    });
                },
                layoutHeader: function ($left, $right) {
                    var searchFragment = document.createDocumentFragment();
                    searchFragment.appendChild(crel('div', {class: 'input-prepend noMargin span2'}, crel('span', {class: 'add-on'}, crel('i', {class: 'icon-search'})), crel('input', {class: 'input-small', type: 'text', name: 'search', placeholder: 'Search'})));
                    $left.append(searchFragment);

                    var sortFragment = document.createDocumentFragment();
                    sortFragment.appendChild(crel('small', 'Sort By'));
                    sortFragment.appendChild(crel('span', ' '));
                    sortFragment.appendChild(crel('select', {name: 'sort', style: 'width: auto'}, crel('option',{value: 'tag_name'},'Tag Name'), crel('option',{value: 'production_level'}, 'Production Level')));
                    sortFragment.appendChild(crel('span', ' '));
                    sortFragment.appendChild(crel('select', {name: 'order'}, crel('option',{value: 'asc'},'Ascending'), crel('option',{value: 'desc'},'Descending')));
                    sortFragment.appendChild(crel('span', ' '));
                    sortFragment.appendChild(crel('button', {'data-id': 'toggleCreateTag', class: 'btn btn-mini'}, 'Create Tag'));
                    $right.append(sortFragment);

                    return this;
                },
                layoutLegend: function ($legend) {
                    $legend = this.$el.find('.legend');
                    $legend.append(
                        crel('span', {class: 'span1'}, 'Status'),
                        crel('span', {class: 'span1 alignLeft'}, 'Remove'),
                        crel('span', {class: 'span2'},
                            crel('strong', 'Tag Name')),
                        crel('span', {class: 'span2'}, 'Customer'),
                        crel('span', {class: 'span2'}, 'Production Level'),
                        crel('span', {class: 'span1 need alignLeft'}, 'OS'),
                        crel('span', {class: 'span1 done alignLeft'}, 'Custom'),
                        crel('span', {class: 'span1 pend alignLeft'}, 'Supported'),
                        crel('span', {class: 'span1 pend alignRight'}, 'Agents')
                    );
                    return this;
                },
                renderModel: function (item) {
                    var $status, fragment = document.createDocumentFragment(),
                        tagID = item.get('tag_id'),
                        tagName = item.get('tag_name'),
                        customer = item.get('customer_name'),
                        productionLevel = item.get('production_level'),
                        stats = helpers.sortStats(item.get('basic_rv_stats')) || {},
                        agents = item.get('agents'),
                        reboot = item.get('reboots_pending'),
                        agents_down = item.get('agents_down');
                    if (reboot) {
                        $status = $warning.clone();
                    } else if (!agents_down) {
                        $status = $ok.clone();
                    } else {
                        $status = $error.clone();
                    }
                    fragment.appendChild(
                        crel('div', {class: 'item row-fluid'},
                            crel('a', {href: '#tags/' + tagID},
                                crel('span', {class: 'span1'}, $status[0]),
                                crel('span', {class: 'span1 alignLeft'},
                                    crel('button', {class: 'btn btn-link noPadding', 'data-id': 'deleteTag', 'data-tag': tagID},
                                        crel('i', {class: 'icon-remove', style: 'color: red', title: 'Delete Tag'}))),
                                crel('span', {class: 'span2'}, tagName),
                                crel('span', {class: 'span2'}, customer),
                                crel('span', {class: 'span2'}, productionLevel),
                                crel('span', {class: 'span1 need'}, _.findWhere(stats, {name: 'OS'}).count),
                                crel('span', {class: 'span1 done'}, _.findWhere(stats, {name: 'Custom'}).count),
                                crel('span', {class: 'span1 pend'}, _.findWhere(stats, {name: 'Supported'}).count),
                                crel('span', {class: 'span1 pend alignRight'}, (agents.length || 0))
                            )
                        )
                    );
                    return fragment;
                }
            })
        };
    }
);
