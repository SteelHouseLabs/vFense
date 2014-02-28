require.config({
    paths: {
        // Create shortcuts
        // i.e. Use 'jquery' insteaad of typing out 'libs/jquery/jquery-1.8.1.min'

        // Application Directory Shortcuts
        // ---------------------------------------------------------------------

        'app'       : 'application/app',
        'main'      : 'application/main',
        'router'    : 'application/router',
        'modules'   : 'application/modules',
        'modals'    : 'application/modules/modals',
        'reports'   : 'application/reports',
        'templates' : 'application/templates',
        'utilities' : 'application/utilities',

        // Libraries
        // ---------------------------------------------------------------------

        // Temporary jquery override to load jquery-migrate until we are sure we are clear of deprecated jquery methods
        // See shim
        'jquery-core'     : 'libs/jquery/jquery',
        'jquery'          : 'libs/jquery-migrate/jquery-migrate',
        // ========

        'underscore'      : 'libs/underscore/underscore',
        'backbone'        : 'libs/backbone/backbone',
        'respond'         : 'libs/respond/respond.src',
        'd3'              : 'libs/d3/d3',
        'notifyosd'       : 'libs/notifyosd/notifyosd',
        'rangy'           : 'libs/rangy/rangy-core',
        'highcharts'      : 'libs/highcharts/highcharts.src',
        'highcharts-more' : 'libs/highcharts/highcharts-more.src',
        'highstocks'      : 'libs/highstocks/highstock',
        'crel'            : 'libs/crel/crel',
        'moment'          : 'libs/moment/moment',
        'livestamp'       : 'libs/livestamp/livestamp',
        'h5f'             : 'libs/h5f/h5f',

        // Require Plugins
        // ---------------------------------------------------------------------
        'text' : 'libs/require/plugins/text',
        'json' : 'libs/require/plugins/json',

        // Bootstrap
        // ---------------------------------------------------------------------
        'jquery.bootstrap'      : 'libs/bootstrap/bootstrap.min', // Load all modules (deprecated)
        'bootstrap-affix'       : 'libs/bootstrap/bootstrap-affix',
        'bootstrap-alert'       : 'libs/bootstrap/bootstrap-alert',
        'bootstrap-button'      : 'libs/bootstrap/bootstrap-button',
        'bootstrap-carousel'    : 'libs/bootstrap/bootstrap-carousel',
        'bootstrap-collapse'    : 'libs/bootstrap/bootstrap-collapse',
        'bootstrap-dropdown'    : 'libs/bootstrap/bootstrap-dropdown',
        'bootstrap-modal'       : 'libs/bootstrap/bootstrap-modal',
        'bootstrap-popover'     : 'libs/bootstrap/bootstrap-popover',
        'bootstrap-scrollspy'   : 'libs/bootstrap/bootstrap-scrollspy',
        'bootstrap-tab'         : 'libs/bootstrap/bootstrap-tab',
        'bootstrap-tooltip'     : 'libs/bootstrap/bootstrap-tooltip',
        'bootstrap-transition'  : 'libs/bootstrap/bootstrap-transition',
        'bootstrap-typeahead'   : 'libs/bootstrap/bootstrap-typeahead',

        // jQuery.ui Library
        // ---------------------------------------------------------------------
        'jquery.ui.core'        : 'libs/jquery-ui/dev/jquery.ui.core',
        'jquery.ui.widget'      : 'libs/jquery-ui/dev/jquery.ui.widget',
        'jquery.ui.mouse'       : 'libs/jquery-ui/dev/jquery.ui.mouse',
        'jquery.ui.position'    : 'libs/jquery-ui/dev/jquery.ui.position',
        'jquery.ui.draggable'   : 'libs/jquery-ui/dev/jquery.ui.draggable',
        'jquery.ui.droppable'   : 'libs/jquery-ui/dev/jquery.ui.droppable',
        'jquery.ui.resizable'   : 'libs/jquery-ui/dev/jquery.ui.resizable',
        'jquery.ui.selectable'  : 'libs/jquery-ui/dev/jquery.ui.selectable',
        'jquery.ui.sortable'    : 'libs/jquery-ui/dev/jquery.ui.sortable',
        'jquery.ui.accordion'   : 'libs/jquery-ui/dev/jquery.ui.accordion',
        'jquery.ui.autocomplete': 'libs/jquery-ui/dev/jquery.ui.autocomplete',
        'jquery.ui.button'      : 'libs/jquery-ui/dev/jquery.ui.button',
        'jquery.ui.datepicker'  : 'libs/jquery-ui/dev/jquery.ui.datepicker',
        'jquery.ui.dialog'      : 'libs/jquery-ui/dev/jquery.ui.dialog',
        'jquery.ui.menu'        : 'libs/jquery-ui/dev/jquery.ui.menu',
        'jquery.ui.progressbar' : 'libs/jquery-ui/dev/jquery.ui.progressbar',
        'jquery.ui.slider'      : 'libs/jquery-ui/dev/jquery.ui.slider',
        'jquery.ui.spinner'     : 'libs/jquery-ui/dev/jquery.ui.spinner',
        'jquery.ui.tabs'        : 'libs/jquery-ui/dev/jquery.ui.tabs',
        'jquery.ui.tooltip'     : 'libs/jquery-ui/dev/jquery.ui.tooltip',

        // jQuery.ui Plugins
        // ---------------------------------------------------------------------
        'jquery.ui.timepicker'  : 'libs/jquery-ui-timepicker/jquery-ui-timepicker-addon',
        'hallo'                 : 'libs/hallo/hallo',
        'select2'               : 'libs/select2/select2',
        'jquery.iframe-transport'     : 'libs/jquery-file-upload/js/jquery.iframe-transport',
        'jquery.fileupload'           : 'libs/jquery-file-upload/js/jquery.fileupload',
        'jquery.fileupload-ui'        : 'libs/jquery-file-upload/js/jquery.fileupload-ui',
        'jquery.fileupload-process'   : 'libs/jquery-file-upload/js/jquery.fileupload-process',
        'jquery.fileupload-resize'    : 'libs/jquery-file-upload/js/jquery.fileupload-resize',
        'jquery.fileupload-validate'  : 'libs/jquery-file-upload/js/jquery.fileupload-validate'
    },

    shim: {
        // Temporary jquery override to load jquery-migrate until we are sure we are clear of deprecated jquery methods
        // See paths
        'jquery'          : { exports: 'jquery', deps: ['jquery-core'] },
        // ========

        'underscore'      : { exports: '_' },
        'backbone'        : { exports: 'Backbone', deps: ['jquery', 'underscore'] },
        'd3'              : { exports: 'd3' },
        'notifyosd'       : { exports: 'NotifyOSD', deps: ['underscore', 'backbone'] },
        'rangy'           : {
            exports: 'rangy.getSelection',
            init: function() {
                'use strict';
                this.rangy.init();
                return this.rangy;
            }
        },
        'highcharts'      : { exports: 'Highcharts' },
        'highcharts-more' : { exports: 'Highcharts.seriesTypes.bubble', deps: ['highstocks'] },
        'highstocks'      : { exports: 'Highcharts' },
        'crel'            : { exports: 'crel' },
        'livestamp'       : { exports: '$.livestamp', deps: ['jquery', 'moment'] },

        // Bootstrap modules ----
        'jquery.bootstrap'      : { exports: 'jQuery', deps: ['jquery'] }, // Load all modules (deprecated)
        'bootstrap-affix'       : { exports: 'jQuery.fn.affix',           deps: ['jquery'] },
        'bootstrap-alert'       : { exports: 'jQuery.fn.alert',           deps: ['jquery'] },
        'bootstrap-button'      : { exports: 'jQuery.fn.button',          deps: ['jquery'] },
        'bootstrap-carousel'    : { exports: 'jQuery.fn.carousel',        deps: ['jquery'] },
        'bootstrap-collapse'    : { exports: 'jQuery.fn.collapse',        deps: ['jquery'] },
        'bootstrap-dropdown'    : { exports: 'jQuery.fn.dropdown',        deps: ['jquery'] },
        'bootstrap-modal'       : { exports: 'jQuery.fn.modal',           deps: ['jquery'] },
        'bootstrap-popover'     : { exports: 'jQuery.fn.popover',         deps: ['jquery', 'bootstrap-tooltip'] },
        'bootstrap-scrollspy'   : { exports: 'jQuery.fn.scrollspy',       deps: ['jquery'] },
        'bootstrap-tab'         : { exports: 'jQuery.fn.tab',             deps: ['jquery'] },
        'bootstrap-tooltip'     : { exports: 'jQuery.fn.tooltip',         deps: ['jquery'] },
        'bootstrap-transition'  : { exports: 'jQuery.support.transition', deps: ['jquery'] },
        'bootstrap-typeahead'   : { exports: 'jQuery.fn.typeahead',       deps: ['jquery'] },

        // jQuery.ui modules ----
        // UI Core
        'jquery.ui.core'        : {exports: 'jQuery.ui',       deps: ['jquery']},
        'jquery.ui.widget'      : {exports: 'jQuery.widget',   deps: ['jquery']},
        'jquery.ui.mouse'       : {exports: 'jQuery.ui.mouse', deps: ['jquery', 'jquery.ui.core', 'jquery.ui.widget']},
        'jquery.ui.position'    : {exports: 'jQuery.position', deps: ['jquery']},

        // Interactions
        'jquery.ui.draggable'   : {exports: 'jQuery.ui.draggable',  deps: ['jquery.ui.core', 'jquery.ui.widget', 'jquery.ui.mouse']},
        'jquery.ui.droppable'   : {exports: 'jQuery.ui.droppable',  deps: ['jquery.ui.core', 'jquery.ui.widget', 'jquery.ui.mouse', 'jquery.ui.draggable']},
        'jquery.ui.resizable'   : {exports: 'jQuery.ui.resizable',  deps: ['jquery.ui.core', 'jquery.ui.widget', 'jquery.ui.mouse']},
        'jquery.ui.selectable'  : {exports: 'jQuery.ui.selectable', deps: ['jquery.ui.core', 'jquery.ui.widget', 'jquery.ui.mouse']},
        'jquery.ui.sortable'    : {exports: 'jQuery.ui.sortable',   deps: ['jquery.ui.core', 'jquery.ui.widget', 'jquery.ui.mouse']},

        // Widgets
        'jquery.ui.accordion'   : {exports: 'jQuery.ui.accordion',    deps: ['jquery.ui.core', 'jquery.ui.widget']},
        'jquery.ui.autocomplete': {exports: 'jQuery.ui.autocomplete', deps: ['jquery.ui.core', 'jquery.ui.widget', 'jquery.ui.position', 'jquery.ui.menu']},
        'jquery.ui.button'      : {exports: 'jQuery.ui.button',       deps: ['jquery.ui.core', 'jquery.ui.widget']},
        'jquery.ui.datepicker'  : {exports: 'jQuery.ui.datepicker',   deps: ['jquery.ui.core']},
        'jquery.ui.dialog'      : {exports: 'jQuery.ui.dialog',       deps: ['jquery.ui.core', 'jquery.ui.widget', 'jquery.ui.mouse', 'jquery.ui.position', 'jquery.ui.draggable', 'jquery.ui.resizable', 'jquery.ui.button']},
        'jquery.ui.menu'        : {exports: 'jQuery.ui.menu',         deps: ['jquery.ui.core', 'jquery.ui.widget', 'jquery.ui.position']},
        'jquery.ui.progressbar' : {exports: 'jQuery.ui.progressbar',  deps: ['jquery.ui.core', 'jquery.ui.widget']},
        'jquery.ui.slider'      : {exports: 'jQuery.ui.slider',       deps: ['jquery.ui.core', 'jquery.ui.widget', 'jquery.ui.mouse']},
        'jquery.ui.spinner'     : {exports: 'jQuery.ui.spinner',      deps: ['jquery.ui.core', 'jquery.ui.widget', 'jquery.ui.button']},
        'jquery.ui.tabs'        : {exports: 'jQuery.ui.tabs',         deps: ['jquery.ui.core', 'jquery.ui.widget']},

        // Plugins
        'jquery.ui.timepicker'  : {exports: 'jQuery.ui.timepicker', deps: ['jquery.ui.core', 'jquery.ui.datepicker', 'jquery.ui.slider']},
        'hallo'                 : {exports: 'jQuery.IKS.hallo', deps: ['jquery', 'jquery.ui.widget', 'rangy']},
        'select2'               : {exports: 'Select2', deps: ['jquery']},
        'jquery.iframe-transport'     : {exports: 'jQuery.ajaxSettings.converters["iframe script"]', deps: ['jquery']},
        'jquery.fileupload'           : {exports: 'jQuery.blueimp.fileupload', deps: ['jquery.ui.widget']}
    },

    // Load Respond.js, bootstrap, and our main application file
    // Modernizr must be in the document head for proper operation in IE.
    deps: (function () {
        'use strict';
        if (typeof DEBUG === 'boolean' && DEBUG) {
            if (window.configStatus && window.configStatus.resolve) { window.configStatus.resolve(); }
            return undefined;
        } else {
            return ['respond', 'jquery.bootstrap', 'main'];
        }
    }())
});
