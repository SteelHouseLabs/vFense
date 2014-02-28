define(
    ['jquery', 'underscore', 'backbone', 'app', 'modals/panel', 'modals/delete', 'crel', 'modules/lists/pageable'],
    function ($, _, Backbone, app, Panel, DeletePanel, crel, Pager) {
        'use strict';
        var helpers = {},
            exports = {};
        _.extend(helpers, {
            sortStats: function (stats) {
                return _.sortBy(stats, function (stat) {
                    return stat.status;
                });
            },
            getSelectedCustomer: function (customer, current) {
                var selected = {};
                if (customer === current) {
                    selected.selected = 'selected';
                }
                return selected;
            }
        });
        _.extend(exports, {
            Collection: Pager.Collection.extend({
                baseUrl: 'api/v1/agents',
                _defaultParams: {
                    count: 20,
                    offset: 0,
                    query: ''
                }
            }),
            View: Pager.View.extend({
                initialize: function (options) {
                    var that = this,
                        user = app.user.toJSON();
                    Pager.View.prototype.initialize.call(this, options);
                    this.prevSearchType = 'query';
                    this.filterCollection = new Backbone.Collection();
                    this.listenTo(this.filterCollection, 'sync', this.fetchFilterSuccess);
                    this.listenTo(this.filterCollection, 'request', this.fetchFilterRequest);
                    this.listenTo(this.filterCollection, 'error', this.fetchFilterError);
                    this.customerModal = new Panel.View({
                        buttons: [
                            {
                                text: 'Cancel',
                                action: 'close',
                                position: 'right'
                            },
                            {
                                text: 'Update',
                                action: 'confirm',
                                className: 'btn-primary',
                                position: 'right'
                            }
                        ],
                        span: '6',
                        confirm: that.editCustomer,
                        parentView: that
                    });
                    this.customerModal.setHeaderHTML(crel('h4', 'Change Customer for Agents'));
                    this.customerModal.setContentHTML(this.customerPanelLayout(user.customers, user.current_customer.name));
                },
                events: function () {
                    return _.extend({}, _.result(Pager.View.prototype, 'events'), {
                        'change select[name=advancedSearch]'    : 'filterBySearch',
                        'change select[name=sort]'              : 'sortBy',
                        'change select[name=order]'             : 'orderBy',
                        'change select[name=filterKey]'         : 'filterKeyChange',
                        'change select[name=filterValue]'       : 'filterValueChange',
                        'keyup input[name=search]'              : 'debouncedSearch',
                        'click input[data-toggle=all]'          : 'selectAll',
                        'click #deleteAgents'                   : 'deleteAgents',
                        'click #switchCustomer'                 : 'switchCustomer'
                    });
                },
                debouncedSearch: _.debounce(function (event) {
                    var searchType = $(event.currentTarget).data('type');
                    if(this.prevSearchType !== searchType) {
                        delete this.collection.params[this.prevSearchType];
                        this.prevSearchType = searchType;
                    }
                    this.collection.params[searchType] = $(event.currentTarget).val();
                    this.collection.fetch();
                }, 300),
                filterBySearch: function (event) {
                    var $header = $('header');
                    var $search = $header.find('#searchString');
                    var $selectedElement = $(event.currentTarget).val();
                    if($selectedElement === 'ipAddress')
                    {
                        $search.empty();
                        $search.append(crel('div', {class: 'input-prepend noMargin'}, crel('span', {class: 'add-on'}, crel('i', {class: 'icon-search'})), crel('input', {class: 'input-small', type: 'text', name: 'search', 'data-type': 'ip', placeholder: 'Search By IP'})));
                    }
                    else if($selectedElement === 'macAddress')
                    {
                        $search.empty();
                        $search.append(crel('div', {class: 'input-prepend noMargin'}, crel('span', {class: 'add-on'}, crel('i', {class: 'icon-search'})), crel('input', {class: 'input-small', type: 'text', name: 'search', 'data-type': 'mac', placeholder: 'Search By MAC'})));
                    }
                    else
                    {
                        $search.empty();
                        $search.append(crel('div', {class: 'input-prepend noMargin'}, crel('span', {class: 'add-on'}, crel('i', {class: 'icon-search'})), crel('input', {class: 'input-small', type: 'text', name: 'search', 'data-type': 'query', placeholder: 'Search By Name'})));
                    }
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
                filterKeyChange: function (event) {
                    var $selectedValue = $(event.currentTarget).val();
                    if($selectedValue === 'os_code' || $selectedValue === 'os_string'){
                        this.filterCollection.url = '/api/v1/supported/operating_system?'+$selectedValue+'=true';
                    }
                    else if($selectedValue === 'production_level'){
                        this.filterCollection.url = '/api/v1/supported/production_levels';
                    }
                    else if($selectedValue === 'agent_status'){
                        var $header = this.$el.find('header');
                        var $filterValueSelect = $header.find('.pull-right select[name=filterValue]').empty();
                        var filterValueFragment = document.createDocumentFragment();
                        filterValueFragment.appendChild( crel('option',{value: 'up'}, 'Up'));
                        filterValueFragment.appendChild( crel('option',{value: 'down'}, 'Down'));
                        $filterValueSelect.append($(filterValueFragment)).removeAttr('disabled');
                        $filterValueSelect.trigger('change');
                        return this;
                    }
                    else {
                        this.$el.find('header .pull-right select[name=filterValue]').empty().attr('disabled','disabled');
                        delete this.collection.params.filter_key;
                        delete this.collection.params.filter_val;
                        this.collection.fetch();
                        return this;
                    }
                    this.filterCollection.fetch();
                    return this;
                },
                filterValueChange: function(event){
                    var filterKey = this.$('header select[name=filterKey]').val(),
                        filterValue = $(event.currentTarget).val();
                    this.collection.params.filter_key = filterKey === 'none' ? '' : filterKey;
                    this.collection.params.filter_val = filterValue;
                    this.collection.params.offset = 0;
                    this.collection.fetch();
                    return this;
                },
                layoutHeader: function ($left, $right) {
                    var advancedSearchFragment = document.createDocumentFragment();
                    advancedSearchFragment.appendChild(crel('small', 'Search By'));
                    advancedSearchFragment.appendChild(crel('span', ' '));
                    advancedSearchFragment.appendChild(crel('select', {name: 'advancedSearch'}, crel('option',{value: 'display_name'},'Display Name'), crel('option',{value: 'ipAddress'}, 'IP Address'), crel('option',{value: 'macAddress'}, 'MAC Address')));
                    advancedSearchFragment.appendChild(crel('span', ' '));
                    advancedSearchFragment.appendChild(crel('div', {id: 'searchString', style: 'display: inline'}, crel('div', {class: 'input-prepend noMargin'}, crel('span', {class: 'add-on'}, crel('i', {class: 'icon-search'})), crel('input', {class: 'input-small', type: 'text', name: 'search', 'data-type': 'query', placeholder: 'Search By Name'}))));
                    $left.append(advancedSearchFragment);


                    var sortFilterFragment = document.createDocumentFragment();
                    sortFilterFragment.appendChild(crel('small', 'Sort By'));
                    sortFilterFragment.appendChild(crel('span', ' '));
                    sortFilterFragment.appendChild(crel('select', {name: 'sort', style: 'width: auto'}, crel('option',{value: 'computer_name'},'Computer Name'), crel('option',{value: 'display_name'}, 'Display Name'), crel('option',{value: 'os_code'}, 'OS Code'), crel('option',{value: 'os_string'}, 'OS String'), crel('option',{value: 'agent_status'}, 'Agent Status')));
                    sortFilterFragment.appendChild(crel('span', ' '));
                    sortFilterFragment.appendChild(crel('select', {name: 'order'}, crel('option',{value: 'asc'},'Ascending'), crel('option',{value: 'desc'},'Descending')));
                    sortFilterFragment.appendChild(crel('span', ' '));
                    sortFilterFragment.appendChild(crel('small', 'Filter By'));
                    sortFilterFragment.appendChild(crel('span', ' '));
                    sortFilterFragment.appendChild(crel('select', {name: 'filterKey', style: 'width: auto'}, crel('option',{value: 'none'}, 'None'), crel('option',{value: 'os_code'}, 'OS Code'), crel('option',{value: 'os_string'},'OS String'), crel('option',{value: 'agent_status'}, 'Agent Status'), crel('option',{value: 'production_level'}, 'Production Level')));
                    sortFilterFragment.appendChild(crel('span', ' '));
                    sortFilterFragment.appendChild(crel('select', {name: 'filterValue', disabled: 'disabled'} ));
                    sortFilterFragment.appendChild(crel('span', ' '));

                    $right.append(sortFilterFragment);

                    return this;
                },
                fetchFilterSuccess: function(){
                    var $header = this.$el.find('header');
                    var $filterValueSelect = $header.find('.pull-right select[name=filterValue]').empty();
                    var filterValueFragment = document.createDocumentFragment();
                    var filterOptions = this.filterCollection.toJSON()[0].data;
                    _.each(filterOptions, function (option) {
                        filterValueFragment.appendChild(

                                crel('option', {value: option}, option)

                        );
                    });
                    $filterValueSelect.append($(filterValueFragment)).removeAttr('disabled');
                    $filterValueSelect.trigger('change');
                    return this;
                },
                fetchFilterRequest: function(){
                    var $header = this.$el.find('header');
                    var $filterValueSelect = $header.find('.pull-right select[name=filterValue]').empty();
                    $filterValueSelect.append(
                        crel('option', {value: ''}, 'Loading..')
                    ).attr('disabled','disabled');
                    return this;
                },
                fetchFilterError: function(){
                    var $header = this.$el.find('header');
                    var $filterValueSelect = $header.find('.pull-right select[name=filterValue]').empty();
                    $filterValueSelect.append(
                        crel('option', {value: ''}, 'Error..')
                    ).attr('disabled','disabled');
                    return this;
                },
                layoutLegend: function ($legend) {
                    $legend.append(
                        crel('span', {class: 'span1'}, 'Status'),
                        crel('strong', {class: 'span4'},
                            crel('input', {type: 'checkbox', 'data-toggle': 'all'}), ' Agent Name ',
                            crel('a', {href: '#', id: 'deleteAgents', title: 'Delete Agents'}, crel('i', {class: 'icon-trash'})), ' ',
                            crel('a', {href: '#', id: 'switchCustomer', title: 'Move agents to a different customer'}, crel('i', {class: 'icon-exchange'}))
                        ),
                        crel('span', {class: 'span2'}, 'Operating System'),
                        crel('span', {class: 'span2'}, 'OS Code'),
                        crel('span', {class: 'span1 need alignLeft'}, 'OS'),
                        crel('span', {class: 'span1 done alignLeft'}, 'Custom'),
                        crel('span', {class: 'span1 pend alignRight'}, 'Supported')
                    );
                    return this;
                },
                renderModel: function (item) {
                    if (_.has(item.attributes, 'http_status') && item.get('http_status') === 500) {
                        return crel('div',  {class: 'item linked clearfix'}, 'No Data.');
                    }
                    var fragment    = document.createDocumentFragment(),
                        id          = item.get('agent_id'),
                        osIcon      = this.printOsIcon(item.get('os_string')),
                        displayName = this.displayName(item),
                        status      = this.getStatus(item),
                        stats       = helpers.sortStats(item.get('basic_rv_stats'));
                    fragment.appendChild(
                        crel('div', {class: 'item row-fluid'},
                            crel('a', {href: '#nodes/' + id},
                                crel('span', {class: 'span1'},
                                    crel('i', {class: status.className, style:'color: ' + status.color})
                                ),
                                crel('span', {class: 'span4'},
                                    crel('input', {type: 'checkbox', name: 'agents', value: id}), ' ',
                                    crel('i', {class: osIcon}), ' ',
                                    crel('strong', displayName)
                                ),
                                crel('span', {class: 'span2'}, item.get('os_string')),
                                crel('span', {class: 'span2'}, item.get('os_code')),
                                crel('span', {class: 'span1 need'}, _.findWhere(stats, {name: 'OS'}).count),
                                crel('span', {class: 'span1 done'}, _.findWhere(stats, {name: 'Custom'}).count),
                                crel('span', {class: 'span1 pend alignRight'}, _.findWhere(stats, {name: 'Supported'}).count)
                            )
                        )
                    );
                    return fragment;
                },
                displayName: function (model) {
                    return model.get('display_name') ||
                        model.get('host_name') ||
                        model.get('computer_name');
                },
                getStatus: function (item) {
                    var reboot      = item.get('needs_reboot'),
                        agentStatus = item.get('agent_status'),
                        icon = {};
                    if (reboot === 'yes') {
                        icon.className = 'icon-warning-sign';
                        icon.color = 'orange';
                    } else if (agentStatus === 'up') {
                        icon.className = 'icon-ok';
                        icon.color = 'green';
                    } else {
                        icon.className = 'icon-warning-sign';
                        icon.color = 'red';
                    }
                    return icon;
                },
                printOsIcon: function (osname) {
                    var osClass = '';
                    if (osname.indexOf('CentOS') !== -1 || osname.indexOf('centos') !== -1) {
                        osClass = 'icon-lin-centos';
                    } else if (osname.indexOf('Ubuntu') !== -1 || osname.indexOf('ubuntu') !== -1) {
                        osClass = 'icon-lin-ubuntu';
                    } else if (osname.indexOf('Fedora') !== -1 || osname.indexOf('fedora') !== -1) {
                        osClass = 'icon-lin-fedora';
                    } else if (osname.indexOf('Debian') !== -1 || osname.indexOf('debian') !== -1) {
                        osClass = 'icon-lin-debian';
                    } else if (osname.indexOf('Red Hat') !== -1 || osname.indexOf('red hat') !== -1) {
                        osClass = 'icon-lin-redhat';
                    } else if (osname.indexOf('OS X') !== -1 || osname.indexOf('os x') !== -1) {
                        osClass = 'icon-os-apple';
                    } else if (osname.indexOf('Linux') !== -1 || osname.indexOf('linux') !== -1) {
                        osClass = 'icon-os-linux_1_';
                    } else if (osname.indexOf('Windows') !== -1 || osname.indexOf('windows') !== -1) {
                        osClass = 'icon-os-win-03';
                    } else {
                        osClass = 'icon-laptop';
                    }
                    return osClass;
                },
                selectAll: function (event) {
                    var checked = event.target.checked,
                        $checkboxes = this.$('input[name=agents]:not(:disabled)');
                    $checkboxes.prop('checked', checked);
                },
                getSelectedAgents: function () {
                    var $checkboxes = this.$('input[name=agents]:checked'),
                        agents = [];
                    $checkboxes.each(function () { agents.push(this.value); });
                    return agents;
                },
                deleteAgents: function (event) {
                    event.preventDefault();
                    var params = {
                            agent_ids: this.getSelectedAgents()
                        };
                    if (!params.agent_ids.length) {
                        app.notifyOSD.createNotification('!', 'Error', 'You must select at least one agent.');
                    } else {
                        if (!this.deleteModal) {
                            this.deleteModal = new DeletePanel.View({
                                url: 'api/v1/agents',
                                name: params.agent_ids.length + ' agents',
                                redirect: '#nodes',
                                data: params
                            });
                        }
                        this.deleteModal.open();
                    }
                    return this;
                },
                switchCustomer: function (event) {
                    event.preventDefault();
                    if (!this.getSelectedAgents().length) {
                        app.notifyOSD.createNotification('!', 'Error', 'You must select at least one agent.');
                    } else {
                        this.customerModal.open();
                    }
                },
                editCustomer: function () {
                     var $select = this.$('select'),
                        $message = $select.siblings('.help-online'),
                        url = '/api/v1/agents',
                        params = {customer_name: $select.val(), agent_ids: this.options.parentView.getSelectedAgents()},
                        that = this;
                    $message.removeClass('alert-error alert-success').addClass('alert-info').html('Submitting...');
                    $.ajax({
                        url: url,
                        type: 'PUT',
                        contentType: 'application/json',
                        data: JSON.stringify(params),
                        success: function (response) {
                            if (response.http_status === 200) {
                                $message.removeClass('alert-info alert-success alert-error').addClass('alert-error').html('');
                                that.cancel();
                                that.options.parentView.collection.fetch();
                            }
                        },
                        error: function (e) {
                            var error = JSON.parse(e.responseText);
                            $message.removeClass('alert-info alert-success').addClass('alert-error').html(error.message);
                        }
                    });
                },
                customerPanelLayout: function (customers, current) {
                    var select =  crel('select', {'required': 'required'});
                    _.each(customers, function (customer) {
                        select.appendChild(crel('option', helpers.getSelectedCustomer(customer.name, current), customer.name));
                    });
                    return crel('form', {id: 'changeCustomer', class: 'form-horizontal'},
                            crel('div', {class: 'control-group noMargin'},
                                crel('label', {class: 'control-label'}, 'Customer:'),
                                crel('div', {class: 'controls'},
                                    select, crel('br'),
                                    crel('div', {class: 'help-online', style: 'margin-top: 5px;', 'data-name': 'message'})
                                )
                            )
                    );
                }
            })
        });
        return exports;
    }
);

