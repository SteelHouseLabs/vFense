define(
    ['jquery', 'underscore', 'backbone', 'app', 'text!templates/multi.html', 'modules/controller', 'modules/detail'],
    function ($, _, Backbone, app, myTemplate, controller, detail) {
        "use strict";
        var MultiPatch = {},
            form = {'node_id': null, 'install': []},
            formArray = [];
        MultiPatch.View = Backbone.View.extend({
            that: this,
            template: myTemplate,
            initialize: function () {},
            events: {
                'click .id': 'changeView',
                'click input:checkbox': 'addPatch',
                'click #submit': 'submit'
            },
            beforeRender: $.noop,
            onRender: $.noop,
            render: function () {
                if (this.beforeRender !== $.noop) { this.beforeRender(); }

                this.$el.html(_.template(this.template));
                this.controllerView = new controller.View({
                    el: this.$el.find('.controller')
                });

                this.detailView = new detail.View({
                    el: this.$el.find('.detail')
                });

                if (this.onRender !== $.noop) { this.onRender(); }
                return this;
            },
            changeView: function (event) {
                var $target = $(event.currentTarget),
                    id = $target.attr('id');

                // Prevent action if click on current
                if (!$target.hasClass('first')) {
                    detail.Collection = detail.Collection.extend({id: id, checked: formArray});

                    $target.addClass('first')
                        .siblings()
                        .removeClass('first');

                    this.detailView = new detail.View({
                        el: this.$el.find('.detail')
                    });
                }
            },
            addPatch: function (event) {
                var id = this.$el.find('.first').attr('id'),
                    found = false;
                formArray.map(function (node) {
                    if (id === node.node_id) {
                        if (event.target.checked) {
                            node.data.push(event.target.value);
                        } else {
                            var index = node.data.indexOf(event.target.value);
                            node.data.splice(index, 1);
                            if (node.data.length === 0) {
                                index = formArray.indexOf(node);
                                formArray.splice(index, 1);
                            }
                        }
                        found = true;
                    }
                });
                if (found === false) {
                    form = {'node_id': null, 'data': [], 'operation': 'install'};
                    form.node_id = id;
                    form.data.push(event.target.value);
                    formArray.push(form);
                }
                found = false;
            },
            submit: function () {
                var params = JSON.stringify(formArray);
                console.log(params);
                $.post("/submitForm", { params: params },
                    function (json) {
                        console.log(json);
                    });
            }
        });
        return MultiPatch;
    }
);
