define(
    ['jquery', 'underscore', 'backbone', 'app', 'crel', 'modules/lists/list'],
    function ($, _, Backbone, app, crel, list) {
        'use strict';
        var exports = {
            Collection: app.createChild(list.Collection),
            View: app.createChild(list.View)
        };
        _.extend(exports.Collection.prototype, {
            baseUrl: '',
            _defaultParams: {
                offset: 0,
                count: 20
            },
            fetchPrevSet: function () {
                if (this.hasPrev()) {
                    this.params.offset = Math.max(
                        this.params.offset - this.params.count,
                        0 // Prevent going into negative offsets
                    );
                    this.fetch();
                }
            },
            fetchNextSet: function () {
                if (this.hasNext()) {
                    var offset = +this.params.offset;
                    var count = +this.params.count;
                    this.params.offset = offset + count;
                    this.fetch();
                }
            },
            hasPrev: function () {
                return this.params.offset > 0;
            },
            hasNext: function () {
                var offset = +this.params.offset;
                var count = +this.params.count;
                return (offset + count) < this.recordCount;
            }
        });
        _.extend(exports.View.prototype, {
            initialize: function (options) {
                // No super reference.
                // Super references cause infinite loops after a few inherits
                // Use the class that was subClassed above
                // In this case, list.View
                list.View.prototype.initialize.call(this, options);
                this.listenTo(this.collection, 'sync', function () {
                    this.togglePagerButtons();
                    this.showDynamicList();
                    this.setFooterContent('reset');
                });
                this.listenTo(this.collection, 'request', function () {
                    this.togglePagerButtons(true);
                    this.setFooterContent('fetch');
                });
                this.listenTo(this.collection, 'error', function () {
                    this.togglePagerButtons(true);
                    this.setFooterContent('error');
                });
            },
            events: {
                'click .disabled': 'stopEvent',
                'change select[name=dynamicList]': 'changeListOption',
                'click [data-action=list-pagePrev]': 'pagePrev',
                'click [data-action=list-pageNext]': 'pageNext'
            },
            changeListOption: function(event){
                var listCount;
                if($(event.target).val()==='All')
                {
                    this.collection.params.offset = 0;
                    listCount = this.collection.getRecordCount();
                }
                else
                {
                    listCount = $(event.target).val();
                }
                this.collection.params.count = listCount;
                this.collection.fetch();
            },
            layoutFooter: function ($left, $right) {
                    var paginationFragment = document.createDocumentFragment();
                    paginationFragment.appendChild(crel('button', {class: 'btn btn-mini disabled', 'data-action': 'list-pagePrev'}, 'Previous'));
                    paginationFragment.appendChild(crel('span', ' '));
                    paginationFragment.appendChild(crel('button', {class: 'btn btn-mini disabled', 'data-action': 'list-pageNext'}, 'Next'));
                    $right.append(paginationFragment);

                    return this;
                },
            showingString: 'Showing',
            recordString: 'records',
            beforeUpdateList: $.noop,
            afterUpdateList: $.noop,
            setFooterContent: function (event) {
                var that = this,
                    $el = this.$el,
                    $footer = $el.find('footer'),
                    col = this.collection,
                    models = col.models;

                if (event === 'reset') {
                    (function () {
                        var start = 1 + col.getParameter('offset'),
                            end = start + models.length - 1,
                            total = col.getRecordCount(),
                            out = [that.showingString, start, '-', end, 'of', total, that.recordString].join(' ').trim();

                        $footer.find('.pull-left').text(out);
                    }());
                } else {
                    $footer.find('.pull-left').html('&nbsp;');
                    $footer.find('.span4').html('&nbsp;');
                }
            },
            togglePagerButtons: function (forcedOff) {
                var $footer = this.$el.find('footer');
                // Issues with readability. Double negatives get confusing.
                // Way to improve? Perhaps full if/else statements (WETWET)?
                $footer.find('button[data-action=list-pageNext]').toggleClass('disabled', forcedOff || !this.collection.hasNext());
                $footer.find('button[data-action=list-pagePrev]').toggleClass('disabled', forcedOff || !this.collection.hasPrev());
                return this;
            },
            showDynamicList: function(){
                var $footer = this.$el.find('footer');
                var $selectList = $footer.find('.span4');
                $selectList.empty();
                var dynamicSelectFragment;
                if(this.collection.recordCount < 10)
                {
                    dynamicSelectFragment = document.createDocumentFragment();
                    dynamicSelectFragment.appendChild(crel('span', ' '));
                    if($('select[name=dynamicList]').length === 0)
                    {
                        $selectList.append(dynamicSelectFragment);
                    }
                }
                else if(this.collection.recordCount >= 10 && this.collection.recordCount< 20)
                {
                    dynamicSelectFragment = document.createDocumentFragment();
                    dynamicSelectFragment.appendChild(crel('small','Show'));
                    dynamicSelectFragment.appendChild(crel('span', ' '));
                    dynamicSelectFragment.appendChild(crel('select', {name: 'dynamicList', id: 'dynamicList'}, crel('option',{value: '10'},'10'), crel('option',{value: 'All'},'All')));
                    dynamicSelectFragment.appendChild(crel('span', ' '));
                    dynamicSelectFragment.appendChild(crel('small', 'records per page'));
                    if($('select[name=dynamicList]').length === 0)
                    {
                        $selectList.append(dynamicSelectFragment);
                    }
                }
                else if(this.collection.recordCount >= 20 && this.collection.recordCount< 50)
                {
                    dynamicSelectFragment = document.createDocumentFragment();
                    dynamicSelectFragment.appendChild(crel('small','Show'));
                    dynamicSelectFragment.appendChild(crel('span', ' '));
                    dynamicSelectFragment.appendChild(crel('select', {name: 'dynamicList', id: 'dynamicList'}, crel('option',{value: '10'},'10'), crel('option',{value: '20', selected: 'selected'},'20'), crel('option',{value: 'All'},'All')));
                    dynamicSelectFragment.appendChild(crel('span', ' '));
                    dynamicSelectFragment.appendChild(crel('small', 'records per page'));
                    if($('select[name=dynamicList]').length === 0)
                    {
                        $selectList.append(dynamicSelectFragment);
                    }
                }
                else if(this.collection.recordCount >= 50 && this.collection.recordCount< 75)
                {
                    dynamicSelectFragment = document.createDocumentFragment();
                    dynamicSelectFragment.appendChild(crel('small','Show'));
                    dynamicSelectFragment.appendChild(crel('span', ' '));
                    dynamicSelectFragment.appendChild(crel('select', {name: 'dynamicList', id: 'dynamicList'}, crel('option',{value: '10'},'10'), crel('option',{value: '20', selected: 'selected'},'20'), crel('option',{value: '50'},'50'), crel('option',{value: 'All'},'All')));
                    dynamicSelectFragment.appendChild(crel('span', ' '));
                    dynamicSelectFragment.appendChild(crel('small', 'records per page'));
                    if($('select[name=dynamicList]').length === 0)
                    {
                        $selectList.append(dynamicSelectFragment);
                    }
                }
                else if(this.collection.recordCount >= 75 && this.collection.recordCount< 100)
                {
                    dynamicSelectFragment = document.createDocumentFragment();
                    dynamicSelectFragment.appendChild(crel('small','Show'));
                    dynamicSelectFragment.appendChild(crel('span', ' '));
                    dynamicSelectFragment.appendChild(crel('select', {name: 'dynamicList', id: 'dynamicList'}, crel('option',{value: '10'},'10'), crel('option',{value: '20', selected: 'selected'},'20'), crel('option',{value: '50'},'50'), crel('option',{value: '75'},'75'), crel('option',{value: 'All'},'All')));
                    dynamicSelectFragment.appendChild(crel('span', ' '));
                    dynamicSelectFragment.appendChild(crel('small', 'records per page'));
                    if($('select[name=dynamicList]').length === 0)
                    {
                        $selectList.append(dynamicSelectFragment);
                    }
                }
                else if(this.collection.recordCount >= 100)
                {
                    dynamicSelectFragment = document.createDocumentFragment();
                    dynamicSelectFragment.appendChild(crel('small','Show'));
                    dynamicSelectFragment.appendChild(crel('span', ' '));
                    dynamicSelectFragment.appendChild(crel('select', {name: 'dynamicList', id: 'dynamicList'}, crel('option',{value: '10'},'10'), crel('option',{value: '20', selected: 'selected'},'20'), crel('option',{value: '50'},'50'), crel('option',{value: '75'},'75'), crel('option',{value: '100'},'100'), crel('option',{value: 'All'},'All')));
                    dynamicSelectFragment.appendChild(crel('span', ' '));
                    dynamicSelectFragment.appendChild(crel('small', 'records per page'));
                    if($('select[name=dynamicList]').length === 0)
                    {
                        $selectList.append(dynamicSelectFragment);
                    }
                }

                $selectList.find('select[name=dynamicList]').val(this.collection.params.count===this.collection.recordCount?'All':this.collection.params.count > this.collection.recordCount?'10':this.collection.params.count);
                return this;
            },
            pageNext: function () {
                this.collection.fetchNextSet();
                return this.updateNavigation();
            },
            pagePrev: function () {
                this.collection.fetchPrevSet();
                return this.updateNavigation();
            }
        });
        return exports;
    }
);